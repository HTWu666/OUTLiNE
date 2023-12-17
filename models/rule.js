import moment from 'moment-timezone'
import pool from './databasePool.js'

export const createRule = async (
  restaurantId,
  maxPersonPerGroup,
  minBookingDay,
  maxBookingDay,
  updateBookingTime
) => {
  const updateBookingTimeInUTC = moment
    .tz(updateBookingTime, 'HH:mm', 'Asia/Taipei')
    .utc()
    .format('HH:mm')
  const { rows } = await pool.query(
    `
    INSERT INTO rules (
      restaurant_id,
      max_person_per_group,
      min_booking_day,
      max_booking_day,
      update_booking_time
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [restaurantId, maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTimeInUTC]
  )

  return rows[0].id
}

export const getRule = async (restaurantId) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM rules
    WHERE restaurant_id = $1
    `,
    [restaurantId]
  )

  const rule = rows[0]
  rule.update_booking_time = moment
    .utc(rule.update_booking_time, 'HH:mm')
    .tz('Asia/Taipei')
    .format('HH:mm')

  return rule
}

export const updateRule = async (
  restaurantId,
  maxPersonPerGroup,
  minBookingDay,
  maxBookingDay,
  updateBookingTime,
  connection
) => {
  const updates = []
  const values = []

  if (maxPersonPerGroup !== undefined) {
    updates.push('max_person_per_group = $1')
    values.push(maxPersonPerGroup)
  }

  if (minBookingDay !== undefined) {
    updates.push(`min_booking_day = $${updates.length + 1}`)
    values.push(minBookingDay)
  }

  if (maxBookingDay !== undefined) {
    updates.push(`max_booking_day = $${updates.length + 1}`)
    values.push(maxBookingDay)
  }

  if (updateBookingTime !== undefined) {
    const updateBookingTimeInUTC = moment
      .tz(updateBookingTime, 'HH:mm', 'Asia/Taipei')
      .utc()
      .format('HH:mm')
    updates.push(`update_booking_time = $${updates.length + 1}`)
    values.push(updateBookingTimeInUTC)
  }

  if (updates.length === 0) {
    throw new Error('No fields to update')
  }

  values.push(restaurantId)
  await connection.query(
    `
        UPDATE rules
        SET ${updates.join(', ')}
        WHERE restaurant_id = $${updates.length + 1}
      `,
    values
  )
}
