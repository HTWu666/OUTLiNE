import pool from './databasePool.js'

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

export const deleteAvailableSeats = async () => {}
