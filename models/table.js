import pool from './databasePool.js'

export const createTable = async (restaurantId, tableName, seatQty, availableTimeData) => {
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')

    const transfferedTableName = `${restaurantId}_${tableName}`

    // Insert table
    const { rows: tableId } = await conn.query(
      `
      INSERT INTO tables (restaurant_id, name, seat_qty)
      VALUES ($1, $2, $3) RETURNING id
      `,
      [restaurantId, transfferedTableName, seatQty]
    )

    const placeholders = availableTimeData
      .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
      .join(', ')

    const values = availableTimeData.flatMap((data) => [tableId[0].id, data])

    await conn.query(
      `
      INSERT INTO table_available_time (table_id, available_time)
      VALUES ${placeholders}
      RETURNING id
      `,
      values
    )

    const { rows: ruleData } = await conn.query(
      `
      SELECT min_booking_day, max_booking_day
      FROM rules
      WHERE restaurant_id = $1
      `,
      [restaurantId]
    )

    const minBookingDay = ruleData[0].min_booking_day
    const maxBookingDay = ruleData[0].max_booking_day
    const availableSeatsQueries = []
    for (let i = minBookingDay; i <= maxBookingDay; i++) {
      availableTimeData.forEach((item) => {
        availableSeatsQueries.push(
          conn.query(
            `
            INSERT INTO available_seats (restaurant_id, table_id, table_name, seat_qty, available_date, available_time)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [
              restaurantId,
              tableId[0].id,
              tableName,
              seatQty,
              new Date(new Date().setDate(new Date().getDate() + i)),
              item
            ]
          )
        )
      })
    }

    await Promise.all(availableSeatsQueries)

    await conn.query('COMMIT')
  } catch (err) {
    await conn.query('ROLLBACK')
    throw err
  } finally {
    conn.release()
  }
}

export const getTable = async (restaurantId) => {
  const { rows } = await pool.query(
    `
      SELECT * FROM tables
      WHERE restaurant_id = $1
    `,
    [restaurantId]
  )

  return rows
}

export const getAvailableTime = async (tableIds) => {
  const placeholders = tableIds.map((_, index) => `$${index + 1}`).join(', ')
  const { rows } = await pool.query(
    `
      SELECT table_id, available_time FROM table_available_time
      WHERE table_id IN (${placeholders})
    `,
    tableIds
  )

  return rows
}

export const getTables = async (restaurantId) => {
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

export const deleteTable = async (tableId) => {
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')

    // Delete associated records in available_seats table
    await conn.query(
      `
      DELETE FROM available_seats
      WHERE table_id = $1
      `,
      [tableId]
    )

    // Delete record from table_available_time table
    await conn.query(
      `
      DELETE FROM table_available_time
      WHERE table_id = $1
      `,
      [tableId]
    )

    // Delete record from tables table
    await conn.query(
      `
      DELETE FROM tables
      WHERE id = $1
      `,
      [tableId]
    )

    await conn.query('COMMIT')
  } catch (err) {
    await conn.query('ROLLBACK')
    throw err
  } finally {
    conn.release()
  }
}

export const deleteAvailableTime = async (tableId, time) => {
  await pool.query(
    `
    DELETE FROM table_available_time
    WHERE table_id = $1 AND available_time = $2
    `,
    [tableId, time]
  )
}
