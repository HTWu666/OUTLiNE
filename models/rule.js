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

  return rows
}

// 待測試
export const updateRule = async (
  restaurantId,
  maxPersonPerReserve,
  reservationStartDay,
  reservationEndDay,
  updateReservatoinTime
) => {
  const updates = []
  const values = []

  if (maxPersonPerReserve !== undefined) {
    updates.push('max_person_per_reserve = $1')
    values.push(maxPersonPerReserve)
  }

  if (reservationStartDay !== undefined) {
    updates.push(`reservation_start_day = $${updates.length + 1}`)
    values.push(reservationStartDay)
  }

  if (reservationEndDay !== undefined) {
    updates.push(`reservation_end_day = $${updates.length + 1}`)
    values.push(reservationEndDay)
  }

  if (updateReservatoinTime !== undefined) {
    updates.push(`update_reservation_time = $${updates.length + 1}`)
    values.push(updateReservatoinTime)
  }

  // 確保有值需要更新
  if (updates.length === 0) {
    throw new Error('No fields to update')
  }

  // 完成 SQL 語句
  const queryString = `
    UPDATE rules
    SET ${updates.join(', ')}
    WHERE restaurant_id = $${updates.length + 1};
  `
  values.push(restaurantId)

  // 執行更新操作

  const res = await pool.query(queryString, values)
  return res
}
