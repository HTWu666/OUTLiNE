import pool from './databasePool.js'
import * as tableModel from './table.js'

const createAvailableSeats = async (restaurantId) => {
  const tableData = await tableModel.getTables(restaurantId)
  const availableDate = new Date()
  console.log(tableData)
  console.log(availableDate)
  availableDate.setDate(availableDate.getDate() + 30)
  const values = tableData
    .map((row) => [
      restaurantId,
      row.table_id,
      row.name,
      row.seat_qty,
      availableDate,
      row.available_time
    ])
    .flat()
  console.log(values)
  const placeholders = tableData
    .map(
      (_, i) =>
        `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
    )
    .join(', ')

  console.log(placeholders)
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

createAvailableSeats(1)
console.log('Successfully updated the available reservation date')
