import pool from './databasePool.js'

export const resetNumber = async (restaurantId) => {
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')
    const { rows: waitlist } = await conn.query(
      `
    SELECT * FROM waitlist
    WHERE restaurant_id = $1
      AND status = 'waiting'
    `,
      [restaurantId]
    )

    if (waitlist[0]) {
      const err = new Error(
        '目前無法重置號碼牌。還有客人正在等待候位。請在所有候位客人都已被安排座位後再嘗試重置。'
      )
      throw err
    }

    await conn.query(
      `
      UPDATE waitlist_number
      SET status = FALSE,
        updated_at = NOW()
      WHERE restaurant_id = $1
        AND status = TRUE
      `,
      [restaurantId]
    )

    const { rows } = await conn.query(
      `
        INSERT INTO waitlist_number (restaurant_id)
        VALUES ($1)
        RETURNING id
        `,
      [restaurantId]
    )

    await conn.query('COMMIT')
    return rows[0].id
  } catch (err) {
    await conn.query('ROLLBACK')
    throw err
  } finally {
    conn.release()
  }
}

export const getNumber = async (restaurantId) => {
  const { rows } = await pool.query(
    `
        SELECT * FROM waitlist_number
        WHERE restaurant_id = $1
            AND status = TRUE
    `,
    [restaurantId]
  )

  return rows[0].id
}

export const createWaiting = async (restaurantId, adult, child, name, gender, phone, note) => {
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')

    // 取得當前候位組數
    const { rows: waitlistNumber } = await conn.query(
      `
        SELECT * FROM waitlist_number
        WHERE restaurant_id = $1
            AND status = TRUE
        FOR UPDATE
    `,
      [restaurantId]
    )

    // 候位組數 + 1 並更新 waitlist_number
    const number = parseInt(waitlistNumber[0].total_waiting_number, 10) + 1
    await conn.query(
      `
        UPDATE waitlist_number
        SET total_waiting_number = $1
        WHERE restaurant_id = $2
            AND status = TRUE
        `,
      [number, restaurantId]
    )

    // 新增候位資料
    const { rows: waitlist } = await conn.query(
      `
        INSERT INTO waitlist (restaurant_id, number, adult, child, name, gender, phone, note)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    `,
      [restaurantId, number, adult, child, name, gender, phone, note]
    )

    await conn.query('COMMIT')
    return { waitingId: waitlist[0].id, number }
  } catch (err) {
    await conn.query('ROLLBACK')
    throw err
  } finally {
    conn.release()
  }
}

export const callNumber = async (restaurantId) => {
  const conn = await pool.connect()
  try {
    await conn.query('BEGIN')
    const { rows: waitlist } = await conn.query(
      `
      SELECT * FROM waitlist
      WHERE restaurant_id = $1
        AND status = 'waiting'
      LIMIT 2
      `,
      [restaurantId]
    )
    if (!waitlist[0]) {
      return null
    }
    let currentNumber = waitlist[0].number
    const { rows: previousNumber } = await conn.query(
      `
      SELECT current_number FROM waitlist_number
      WHERE restaurant_id = $1
        AND status = TRUE
      FOR UPDATE
      `,
      [restaurantId]
    )

    if (currentNumber === previousNumber[0].current_number) {
      currentNumber = waitlist[1].number
    }

    await conn.query(
      `
      UPDATE waitlist_number
      SET current_number = $1
      WHERE restaurant_id = $2
        AND status = TRUE
      RETURNING current_number
    `,
      [currentNumber, restaurantId]
    )

    await conn.query(
      `
      UPDATE waitlist
      SET status = 'no_show'
      WHERE restaurant_id = $1
        AND number < $2
        AND status = 'waiting'
      `,
      [restaurantId, currentNumber]
    )

    await conn.query('COMMIT')
    return currentNumber
  } catch (err) {
    await conn.query('ROLLBACK')
    throw err
  } finally {
    conn.release()
  }
}

export const getCurrNumber = async (restaurantId) => {
  const { rows } = await pool.query(
    `
    SELECT current_number
    FROM waitlist_number
    WHERE restaurant_id = $1
      AND status = TRUE
    `,
    [restaurantId]
  )

  return rows[0].current_number
}

export const getWaiting = async (waitingId) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM waitlist
    WHERE id = $1
    `,
    [waitingId]
  )

  return rows[0]
}

export const cancelWaiting = async (waitingId) => {
  await pool.query(
    `
    UPDATE waitlist
    SET status = 'canceled'
    WHERE id = $1
    `,
    [waitingId]
  )
}

export const getWaitlist = async (restaurantId) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM waitlist
    WHERE restaurant_id = $1
      AND status = 'waiting'
    `,
    [restaurantId]
  )

  return rows
}

export const confirm = async (waitingId) => {
  await pool.query(
    `
    UPDATE waitlist
    SET status = 'seated'
    WHERE id = $1
    `,
    [waitingId]
  )
}
