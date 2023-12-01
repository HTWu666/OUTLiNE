import pool from './databasePool.js'
import * as cache from '../utils/cache.js'

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
  note,
  connection
) => {
  const person = adult + child
  const rawSeatQty = await cache.get(`restaurant:${restaurantId}:seatQty`)
  let seatQty = JSON.parse(rawSeatQty)
  if (!seatQty) {
    const { rows: seats } = await pool.query(
      `
      SELECT seat_qty FROM tables
      WHERE restaurant_id = $1
      `,
      [restaurantId]
    )

    seatQty = []
    seats.forEach((seat) => {
      if (!seatQty.includes(seat.seat_qty)) {
        seatQty.push(seat.seat_qty)
      }
    })
    seatQty.sort((a, b) => a - b)
    await cache.set(`restaurant:${restaurantId}:seatQty`, JSON.stringify(seatQty))
  }

  let start = 0
  let end = seatQty.length - 1
  let requiredSeats = -1

  while (start <= end) {
    const mid = Math.floor((start + end) / 2)

    if (seatQty[mid] >= person) {
      requiredSeats = seatQty[mid]
      end = mid - 1
    } else {
      start = mid + 1
    }
  }
  if (requiredSeats === -1) {
    const err = new Error('Exceed the limit of max person per reservation')
    err.status = 400
    throw err
  }

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

  return reservation[0].id
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
      SET status = CASE
        WHEN dining_date <= CURRENT_DATE AND dining_time < NOW()::time THEN 'no_show'
        ELSE 'canceled'
      END
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
    SET status = 'seated'
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
