import pg from 'pg'
import dotenv from 'dotenv'
import amqp from 'amqplib'
import * as SQS from '../utils/SQS.js'

dotenv.config({ path: '../.env' })
const { Pool } = pg

const pool = new Pool({
  user: process.env.POSTGRE_USER,
  host: process.env.POSTGRE_HOST,
  database: process.env.POSTGRE_DATABASE,
  password: process.env.POSTGRE_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
})

const DELETE_EXPIRED_BOOKING_DATE_QUEUE_URL =
  'https://sqs.ap-southeast-2.amazonaws.com/179428986360/outline-delete-expired-booking-date-queue'

const deleteExpiredBookingDate = async (restaurantId) => {
  const today = new Date().toISOString().split('T')[0]

  await pool.query(
    `
    DELETE FROM available_seats
    WHERE restaurant_id = $1
      AND available_date < $2
    `,
    [restaurantId, today]
  )
}

const worker = async () => {
  try {
    console.log('[*] Waiting for messages in deleteExpiredBookingDate. To exit press CTRL+C')
    while (true) {
      const message = await SQS.receiveMessage(DELETE_EXPIRED_BOOKING_DATE_QUEUE_URL)
      if (message) {
        const restaurantId = message.Body
        await deleteExpiredBookingDate(restaurantId)
        console.log(`Delete expired booking date done for restaurantId: ${restaurantId}`)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

worker()
