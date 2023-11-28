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

export const createAvailableSeatsForPeriod = async (restaurantId, startDate, endDate) => {
  const dateArray = []
  let currentDate = new Date(startDate)
  const formattedEndDate = new Date(endDate)

  while (currentDate <= formattedEndDate) {
    dateArray.push(new Date(currentDate))
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
  }

  dateArray.forEach(async (date) => {
    const formattedDate = date.toISOString().split('T')[0]
    await createAvailableSeats(restaurantId, formattedDate)
  })

  console.log('Create available seats done')
}

const deleteAvailableSeats = async (restaurantId, deletedDate) => {
  await pool.query(
    `
        DELETE FROM available_seats
        WHERE restaurant_id = $1
            AND available_date = $2
    `,
    [restaurantId, deletedDate]
  )
}

export const deleteAvailableSeatsForPeriod = async (restaurantId, startDate, endDate) => {
  const dateArray = []
  let currentDate = new Date(startDate)
  const formattedEndDate = new Date(endDate)

  while (currentDate <= formattedEndDate) {
    dateArray.push(new Date(currentDate))
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
  }

  dateArray.forEach(async (date) => {
    const formattedDate = date.toISOString().split('T')[0]
    await deleteAvailableSeats(restaurantId, formattedDate)
  })

  console.log('Delete available seats done')
}
