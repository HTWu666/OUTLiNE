import pool from './databasePool.js'

export const createTable = async (restaurantId, tableName, seatQty) => {
  const { rows } = await pool.query(
    `
    INSERT INTO tables (restaurant_id, name, seat_qty)
    VALUES ($1, $2, $3) RETURNING id
    `,
    [restaurantId, tableName, seatQty]
  )

  return rows[0].id
}

export const createAvailableTime = async (availableTimeData) => {
  const placeholders = availableTimeData
    .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
    .join(', ')
  const values = availableTimeData.flatMap((data) => [data.tableId, data.utcAvailableTime])

  const { rows } = await pool.query(
    `
      INSERT INTO table_available_time (table_id, available_time)
      VALUES ${placeholders}
      RETURNING id
    `,
    values
  )

  return rows[0].id
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

    await conn.query(
      `
      DELETE FROM table_available_time
      WHERE table_id = $1
      `,
      [tableId]
    )

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
