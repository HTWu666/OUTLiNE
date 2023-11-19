import pool from './databasePool.js'

export const createUser = async (name, email, password) => {
  const { rows } = await pool.query(
    `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3) RETURNING id
        `,
    [name, email, password]
  )

  return rows[0].id
}

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email]
  )

  return rows[0]
}

export const findUserById = async (userId) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM users
    WHERE id = $1
    `,
    [userId]
  )

  return rows[0]
}
