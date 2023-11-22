import pool from './databasePool.js'

export const createReservation = async (
  restaurantId,
  adult,
  child,
  diningDate,
  diningTime,
  name,
  gender,
  phone,
  email,
  purpose,
  note
) => {
  const person = adult + child

  // 取得最小所需座位數
  const { rows } = await pool.query(
    `
    SELECT MIN (seat_qty) AS min_seat_qty
    FROM tables
    WHERE seat_qty >= $1
    `,
    [person]
  )

  const requiredSeats = rows[0].min_seat_qty
  if (!requiredSeats) {
    const err = new Error('Exceed the limit of max person per reservation')
    err.status = 400
    throw err
  }

  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')

    // 取得可訂位的時間並 lock the row
    const { rows: availableSeat } = await conn.query(
      `
        SELECT id, table_id, table_name
        FROM available_seats
        WHERE restaurant_id = $1
          AND seat_qty = $2
          AND available_date = $3
          AND available_time = $4
          AND availability = TRUE
        FOR UPDATE
      `,
      [restaurantId, requiredSeats, diningDate, diningTime]
    )

    if (!availableSeat[0]) {
      const err = new Error('No available seat')
      err.status = 400
      throw err
    }

    const tableId = availableSeat[0].table_id
    const tableName = availableSeat[0].table_name
    const { rows: reservation } = await conn.query(
      `
        INSERT INTO reservations (
          restaurant_id,
          adult,
          child,
          dining_date,
          dining_time,
          table_id,
          table_name,
          name,
          gender,
          phone,
          email,
          purpose,
          note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `,
      [
        restaurantId,
        adult,
        child,
        diningDate,
        diningTime,
        tableId,
        tableName,
        name,
        gender,
        phone,
        email,
        purpose,
        note
      ]
    )

    const availableSeatId = availableSeat[0].id
    await conn.query(
      `
        UPDATE available_seats
        SET availability = FALSE
        WHERE id = $1
      `,
      [availableSeatId]
    )

    await conn.query('COMMIT')
    return reservation[0].id
  } catch (err) {
    await conn.query('ROLLBACK')
    throw err
  } finally {
    conn.release()
  }
}

export const getReservations = async (restaurantId, diningDate) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM reservations
    WHERE restaurant_id = $1
      AND dining_date = $2
      AND status IN ('not_seated', 'notified', 'reserved')
    `,
    [restaurantId, diningDate]
  )

  return rows
}

export const getReservation = async (reservationId) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM reservations
    WHERE id = $1
    `,
    [reservationId]
  )

  return rows
}

export const cancelReservation = async (reservationId) => {
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')
    const { rows: reservationDetails } = await conn.query(
      `
      UPDATE reservations
      SET status = 'canceled'
      WHERE id = $1
      RETURNING *
      `,
      [reservationId]
    )

    await conn.query(
      `
      UPDATE available_seats
      SET availability = 'TRUE'
      WHERE table_id = $1
        AND available_date = $2
        AND available_time = $3
      `,
      [
        reservationDetails[0].table_id,
        reservationDetails[0].dining_date,
        reservationDetails[0].dining_time
      ]
    )

    await conn.query('COMMIT')
  } catch (err) {
    await conn.query('ROLLBACK')
    throw err
  } finally {
    conn.release()
  }
}

export const confirmReservation = async (reservationId) => {
  const { rows } = await pool.query(
    `
    UPDATE reservations
    SET status = 'seated'
    WHERE id = $1
    RETURNING *
    `,
    [reservationId]
  )

  return rows
}
