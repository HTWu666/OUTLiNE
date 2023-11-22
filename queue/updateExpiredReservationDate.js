import pg from 'pg'
import dotenv from 'dotenv'
import amqp from 'amqplib'
import queue from '../constants/queueConstants.js'
import updateExpiredBookingDateJob from '../utils/updateExpiredBookingDateJob.js'

dotenv.config()
const { Pool } = pg

const pool = new Pool({
  user: process.env.POSTGRE_USER,
  host: process.env.POSTGRE_HOST,
  database: process.env.POSTGRE_DATABASE,
  password: process.env.POSTGRE_PASSWORD
})

const updateExpiredReservationDate = async () => {
  await pool.query(
    `
    UPDATE available_seats
    SET availability = FALSE
    WHERE available_date
    `
  )
}

// 將過期的可訂位時間 availability 更新為 false
const worker = async () => {}

worker()
