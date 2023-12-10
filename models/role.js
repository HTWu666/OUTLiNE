import pool from './databasePool.js'

export const isUserHasRole = async (userId, roleName) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT COUNT(role_id) as count FROM user_role
      LEFT JOIN roles
      ON user_role.role_id = roles.id
      WHERE user_id = $1 AND roles.name = $2 AND user_role.status = 'active'
      `,
      [userId, roleName]
    )
    if (!Array.isArray(rows)) {
      throw new Error('invalid rows')
    }

    return rows[0].count > 0
  } catch (err) {
    console.error(err)
    return false
  }
}

export const initializeRole = async (userId, restaurantId) => {
  const adminRole = `admin_restaurantId_${restaurantId}`
  const userRole = `user_restaurantId_${restaurantId}`
  const { rows: adminRoleId } = await pool.query(
    `
    INSERT INTO roles (name)
    VALUES ($1), ($2)
    RETURNING id
    `,
    [adminRole, userRole]
  )

  const { rows: userRoleId } = await pool.query(
    `
    INSERT INTO user_role (user_id, role_id, status)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
    [userId, adminRoleId[0].id, 'active']
  )

  return userRoleId[0].id
}

export const createRole = async (userId, restaurantId) => {
  const { rows: userRoleId } = await pool.query(
    `
    INSERT INTO user_role (user_id, role_id, status)
    SELECT $1, roles.id, $3 FROM roles
    WHERE roles.name = $2 AND NOT EXISTS (
      SELECT 1 FROM user_role
      WHERE user_id = $1 AND role_id = roles.id
    )
    RETURNING id
    `,
    [userId, `user_restaurantId_${restaurantId}`, 'pending']
  )
  if (userRoleId.length > 0) {
    return userRoleId[0].id
  }

  if (userRoleId.length === 0) {
    throw new Error('User role combination already exists or role not found')
  }

  const { rows: userRoleStatus } = await pool.query(
    `
    SELECT status FROM user_role
      JOIN roles ON user_role.role_id = roles.id
      WHERE user_id = $1 AND roles.name = $2
    `,
    [userId, `user_restaurantId_${restaurantId}`]
  )

  if (userRoleStatus.length > 0 && userRoleStatus[0].status === 'pending') {
    throw new Error('已經申請過了，請等待管理員審核您的申請！')
  }

  if (userRoleStatus.length > 0 && userRoleStatus[0].status === 'rejected') {
    throw new Error('很抱歉，您的申請已被駁回！')
  }
}

export const getRole = async (userId, restaurantId) => {
  const { rows } = await pool.query(
    `
    SELECT r.name
    FROM user_role ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1 AND r.name LIKE $2
    `,
    [userId, `%_restaurantId_${restaurantId}`]
  )

  if (rows.length === 0) {
    throw new Error('角色不存在')
  }

  const parts = rows[0].name.split('_')
  return parts[0]
}
