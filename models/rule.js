import pool from './databasePool.js'

export const createRule = async (
  restaurantId,
  maxPersonPerGroup,
  minBookingDay,
  maxBookingDay,
  updateBookingTime
) => {
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
    [restaurantId, maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTime]
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

  return rows[0]
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
    updates.push(`update_booking_time = $${updates.length + 1}`)
    values.push(updateBookingTime)
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
