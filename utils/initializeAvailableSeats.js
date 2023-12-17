import pool from '../models/databasePool.js'
import * as tableModel from '../models/table.js'

const createAvailableSeats = async (restaurantId, updatedDate) => {
  const tableData = await tableModel.getTables(restaurantId)

  const values = tableData
    .map((row) => [
      restaurantId,
      row.table_id,
      row.name,
      row.seat_qty,
      updatedDate,
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

const initializeAvailableSeats = async (restaurantId) => {
  const { rows } = await pool.query(
    `
      SELECT min_booking_day, max_booking_day
      FROM rules
      WHERE restaurant_id = $1
    `,
    [restaurantId]
  )

  const minBookingDay = rows[0].min_booking_day
  const maxBookingDay = rows[0].max_booking_day
  for (let i = minBookingDay; i < maxBookingDay; i++) {
    const availableDate = new Date()
    availableDate.setDate(availableDate.getDate() + i)
    createAvailableSeats(restaurantId, availableDate)
  }

  console.log('Initialize available seats done')
}

const restaurantId = parseInt(process.argv.slice(2)[0], 10)
initializeAvailableSeats(restaurantId)
