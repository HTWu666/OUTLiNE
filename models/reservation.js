import jwt from 'jsonwebtoken'
import pool from './databasePool.js'

export const createReservation = async (
  restaurantId,
  adult,
  child,
  requiredSeats,
  diningDate,
  diningTime,
  name,
  gender,
  phone,
  email,
  purpose,
  note
) => {
  console.log(restaurantId)
  console.log(requiredSeats)
  console.log(diningDate)
  console.log(diningTime)
  const connection = await pool.connect()
  try {
    // 取得可訂位的時間並 lock the row
    const { rows: availableSeat } = await connection.query(
      `
      SELECT id, table_id, table_name
      FROM available_seats
      WHERE restaurant_id = $1
        AND seat_qty = $2
        AND available_date = $3
        AND available_time = $4
        AND availability = TRUE
      FOR UPDATE
      LIMIT 1
      `,
      [restaurantId, requiredSeats, diningDate, diningTime]
    )
    console.log(availableSeat)
    if (!availableSeat[0]) {
      throw new Error('No available seat')
    }

    const tableId = availableSeat[0].table_id
    const tableName = availableSeat[0].table_name
    const { rows: reservation } = await connection.query(
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
    await connection.query(
      `
      UPDATE available_seats
      SET availability = FALSE
      WHERE id = $1
    `,
      [availableSeatId]
    )
    const reservationId = reservation[0].id
    const payload = { reservationId }
    const upn = jwt.sign(payload, process.env.JWT_KEY)
    await connection.query(
      `
      UPDATE reservations
      SET upn = $1
      WHERE id = $2
      `,
      [upn, reservationId]
    )
    await connection.query('COMMIT')

    return {
      restaurantId,
      reservationId,
      adult,
      child,
      diningDate,
      diningTime,
      name,
      gender,
      email,
      upn
    }
  } catch (err) {
    await connection.query('ROLLBACK')
    throw err
  } finally {
    connection.release()
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

  return rows[0]
}

export const cancelReservation = async (reservationId) => {
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')
    const { rows: reservationDetails } = await conn.query(
      `
      UPDATE reservations
      SET
        status = CASE
          WHEN dining_date <= CURRENT_DATE AND dining_time < NOW()::time THEN 'no_show'
          ELSE 'canceled'
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [reservationId]
    )

    await conn.query(
      `
      UPDATE available_seats
      SET availability = CASE
        WHEN available_date > CURRENT_DATE THEN TRUE
      END
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
    return reservationDetails[0]
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
    SET 
      status = 'seated',
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [reservationId]
  )

  return rows
}

export const createUpnForReservation = async (upn, reservationId, connection) => {
  await connection.query(
    `
    UPDATE reservations
    SET upn = $1
    WHERE id = $2
  `,
    [upn, reservationId]
  )
}
