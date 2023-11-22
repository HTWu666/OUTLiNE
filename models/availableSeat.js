import pool from './databasePool.js'
import * as tableModel from './table.js'

// 完全靠 worker 新增可訂位的座位
// const createAvailableSeats = async (restaurantId) => {
//   const tableData = await tableModel.getTables(restaurantId)
//   const availableDate = new Date()

//   availableDate.setDate(availableDate.getDate() + 30)
//   const values = tableData
//     .map((row) => [
//       restaurantId,
//       row.table_id,
//       row.name,
//       row.seat_qty,
//       availableDate,
//       row.available_time
//     ])
//     .flat()

//   const placeholders = tableData
//     .map(
//       (_, i) =>
//         `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
//     )
//     .join(', ')

//   const { rows: availableSeatIds } = await pool.query(
//     `
//     INSERT INTO available_seats (
//         restaurant_id,
//         table_id,
//         table_name,
//         seat_qty,
//         available_date,
//         available_time
//     ) VALUES ${placeholders}
//     `,
//     values
//   )

//   return availableSeatIds
// }

//
export const getAvailableSeats = async (restaurantId, date) => {
  const { rows } = await pool.query(
    `
    SELECT *,
      to_char(available_date, 'YYYY-MM-DD') AS available_date
    FROM available_seats
    WHERE restaurant_id = $1
      AND available_date = $2
      AND availability = TRUE
    `,
    [restaurantId, date]
  )

  return rows
}

export const updateAvailableSeats = async (availableSeatId) => {}
