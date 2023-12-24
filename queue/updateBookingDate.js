import pg from 'pg'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import morganBody from 'morgan-body'
import expressLayouts from 'express-ejs-layouts'

dotenv.config()
const app = express()
const port = 3001

app.use(express.json())
app.set('view engine', 'ejs')
app.set('views', '../views')
app.use(expressLayouts)
app.set('layout', './layouts/global')

const log = fs.createWriteStream(`./logs/morganBody/updateBookingDateMorganBody.log`, {
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

const getTables = async (restaurantId) => {
  const { rows } = await pool.query(
    `
        SELECT
          tables.id AS table_id,
          tables.name,
          tables.seat_qty,
          table_available_time.available_time
        FROM tables
        INNER JOIN table_available_time
        ON tables.id = table_available_time.table_id
        WHERE tables.restaurant_id = $1
      `,
    [restaurantId]
  )
  return rows
}

const createAvailableSeats = async (restaurantId, maxBookingDay) => {
  const updatedDate = new Date()
  updatedDate.setDate(updatedDate.getDate() + maxBookingDay)
  const year = updatedDate.getFullYear()
  const month = updatedDate.getMonth() + 1
  const day = updatedDate.getDate()
  const formattedDate = `${year}-${month}-${day}`
  const tableData = await getTables(restaurantId)

  const values = tableData
    .map((row) => [
      restaurantId,
      row.table_id,
      row.name,
      row.seat_qty,
      formattedDate,
      row.available_time
    ])
    .flat()

  const placeholders = tableData
    .map(
      (_, i) =>
        `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
    )
    .join(', ')

  const { rows: availableSeatIds } = await pool.query(
    `
      INSERT INTO available_seats (
          restaurant_id,
          table_id,
          table_name,
          seat_qty,
          available_date,
          available_time
      ) VALUES ${placeholders}
      `,
    values
  )

  return availableSeatIds
}

app.post('/api/updateAvailableReservationDate', async (req, res) => {
  try {
    const { restaurantId, maxBookingDay } = req.body
    await createAvailableSeats(restaurantId, maxBookingDay)
    console.log(`Successfully update available booking date for restaurantId: ${restaurantId}`)
    res.status(200).json({ message: 'Successfully update available reservation date' })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Update available reservation date failed' })
  }
})

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

app.post('/api/deleteExpiredBookingDate', async (req, res) => {
  try {
    const { restaurantId } = req.body
    await deleteExpiredBookingDate(restaurantId)

    res.status(200).json({ message: 'Successfully delete expired booking date' })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Delete expired booking date failed' })
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

const outputLogStream = fs.createWriteStream('./logs/console/updateBookingDateConsole.log', {
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
