import pg from 'pg'
import dotenv from 'dotenv'
import amqp from 'amqplib'

dotenv.config({ path: '../.env' })
const { Pool } = pg

const pool = new Pool({
  user: process.env.POSTGRE_USER,
  host: process.env.POSTGRE_HOST,
  database: process.env.POSTGRE_DATABASE,
  password: process.env.POSTGRE_PASSWORD
})

const DELETE_EXPIRED_BOOKING_DATE_QUEUE = 'deleteExpiredBookingDateQueue'

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
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
    const channel = await connection.createChannel()
    const queueName = DELETE_EXPIRED_BOOKING_DATE_QUEUE

    console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queueName)

    await channel.consume(
      queueName,
      async (job) => {
        if (job !== null) {
          const restaurantId = JSON.parse(job.content.toString())
          channel.ack(job)
          deleteExpiredBookingDate(restaurantId)
          console.log('Delete expired booking date done')
          console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queueName)
        }
      },
      { noAck: false }
    )
  } catch (err) {
    console.error(err)
  }
}

worker()
