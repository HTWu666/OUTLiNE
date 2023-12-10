import pool from './databasePool.js'

export const createRestaurant = async (
  userId,
  name,
  address,
  phone,
  parking,
  payment,
  kidChair,
  vegetarian,
  picture
) => {
  const { rows: restaurant } = await pool.query(
    `
    INSERT INTO restaurants (name, address, phone, parking_lot, payment, kid_chair, vegetarian, picture)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [name, address, phone, parking, payment, kidChair, vegetarian, picture]
  )

  const { rows: userRestaurant } = await pool.query(
    `
    INSERT INTO user_restaurant (user_id, restaurant_id)
    VALUES ($1, $2)
    `,
    [userId, restaurant[0].id]
  )

  return restaurant[0].id
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

export const getRestaurant = async (restaurantId) => {
  const { rows } = await pool.query(
    `
      SELECT * FROM restaurants
      WHERE id = $1
    `,
    [restaurantId]
  )
  if (!rows[0]) {
    throw new Error('餐廳不存在')
  }
  return rows[0]
}

export const getRestaurantByUserId = async (userId) => {
  const { rows: restaurantIds } = await pool.query(
    `
    SELECT * FROM user_restaurant
    WHERE user_id = $1
    `,
    [userId]
  )

  if (restaurantIds.length === 0) {
    return null
  }

  const ids = restaurantIds.map((item) => item.restaurant_id)
  const params = ids.map((_, index) => `$${index + 1}`).join(', ')
  const { rows: restaurantDetails } = await pool.query(
    `
    SELECT * FROM restaurants
    WHERE id IN (${params})
    `,
    ids
  )

  return restaurantDetails
}

export const userHasRestaurant = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT restaurant_id FROM user_restaurant
    WHERE user_id = $1
    `,
    [userId]
  )

  const restaurantIds = rows.map((row) => row.restaurant_id)

  return restaurantIds
}
