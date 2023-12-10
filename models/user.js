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
  if (rows.length === 0) {
    throw new Error('帳號或密碼錯誤')
  }

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

export const getApplications = async (restaurantId) => {
  const { rows: applications } = await pool.query(
    `
    SELECT ur.id AS user_role_id, ur.user_id, u.name, u.email, 
      to_char(ur.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
    FROM user_role ur
    JOIN roles r ON ur.role_id = r.id
    JOIN users u ON ur.user_id = u.id
    WHERE r.name = $1 AND ur.status = 'pending'
    `,
    [`user_restaurantId_${restaurantId}`]
  )

  return applications
}

export const approveApplication = async (restaurantId, userRoleId) => {
  const { rows } = await pool.query(
    `
    UPDATE user_role
    SET status = 'active'
    WHERE id = $1
    RETURNING user_id
    `,
    [userRoleId]
  )
  await pool.query(
    `
    INSERT INTO user_restaurant (user_id, restaurant_id)
    VALUES ($1, $2)    
    `,
    [rows[0].user_id, restaurantId]
  )
}

export const rejectApplication = async (userRoleId) => {
  await pool.query(
    `
    UPDATE user_role
    SET status = 'rejected'
    WHERE id = $1
    `,
    [userRoleId]
  )
}
