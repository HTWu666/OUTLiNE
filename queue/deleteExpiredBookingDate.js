import pg from 'pg'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import morganBody from 'morgan-body'
import expressLayouts from 'express-ejs-layouts'
import * as SQS from '../utils/SQS.js'

dotenv.config({ path: '../.env' })
const app = express()
const port = 3001

app.use(express.json())
app.set('view engine', 'ejs')
app.set('views', '../views')
app.use(expressLayouts)
app.set('layout', './layouts/global')

const log = fs.createWriteStream(`./logs/morganBody/deleteExpiredBookingDateMorganBody.log`, {
  flags: 'a'
})
morganBody(app, {
  noColors: true,
  stream: log
})

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

// const DELETE_EXPIRED_BOOKING_DATE_QUEUE_URL =
//   'https://sqs.ap-southeast-2.amazonaws.com/179428986360/outline-delete-expired-booking-date-queue'

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

// const worker = async () => {
//   try {
//     console.log('[*] Waiting for messages in deleteExpiredBookingDate. To exit press CTRL+C')
//     while (true) {
//       const message = await SQS.receiveMessage(DELETE_EXPIRED_BOOKING_DATE_QUEUE_URL)
//       if (message) {
//         const restaurantId = message.Body
//         await deleteExpiredBookingDate(restaurantId)
//         console.log(`Delete expired booking date done for restaurantId: ${restaurantId}`)
//       }
//     }
//   } catch (err) {
//     console.error(err)
//   }
// }

// worker()

app.post('/deleteExpiredBookingDate', async (req, res) => {
  try {
    const { restaurantId } = req.body
    await deleteExpiredBookingDate(restaurantId)

    res.status(200).json({ message: 'Successfully delete expired booking date' })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Delete expired booking date failed' })
  }
})

app.all('*', (req, res) => {
  res.status(404).render('./error/notFound', { layout: false })
})

app.use((err, req, res, next) => {
  console.error(err)
  if (err instanceof Error) {
    return res.status(500).json({ errors: err.message })
  }
  return res.status(500).send('Oops, unknown error')
})

app.listen(port, () => {
  console.log(`Delete expired booking date worker is listening on ${port}`)
})

const outputLogStream = fs.createWriteStream('./logs/console/deleteExpiredBookingDateConsole.log', {
  flags: 'a'
})

if (process.env.SERVER_STATUS === 'development') {
  const originalConsoleLog = console.log
  console.log = (...args) => {
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return 'Unstringifiable Object'
          }
        }
        return String(arg)
      })
      .join(' ')

    outputLogStream.write(`${message}\n`)
    originalConsoleLog(...args)
  }

  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args.join(' ')
    outputLogStream.write(`[ERROR] ${message}\n`)

    args.forEach((arg) => {
      if (arg instanceof Error) {
        outputLogStream.write(`[ERROR Stack Trace] ${arg.stack}\n`)
      }
    })

    originalConsoleError(...args)
  }
}
