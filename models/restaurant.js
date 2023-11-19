import pool from './databasePool.js'

export const createRestaurant = async (name, address, phone) => {
  const { rows } = await pool.query(
    `
    INSERT INTO restaurants (name, address, phone)
    VALUES ($1, $2, $3) RETURNING id
    `,
    [name, address, phone]
  )

  return rows[0].id
}

export const findRestaurantByUserId = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM user_restaurant
    WHERE user_id = $1
    `,
    [userId]
  )

  return rows[0].restaurant_id
}

export const getRestaurant = async () => {}
