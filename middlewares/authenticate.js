import jwt from 'jsonwebtoken'
import util from 'util'
import pool from '../models/databasePool.js'
import * as cache from '../utils/cache.js'

const jwtVerify = util.promisify(jwt.verify)

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    let token
    if (authHeader) {
      token = authHeader.replace('Bearer ', '')
    } else {
      token = req.cookies ? req.cookies.jwtToken : null
    }
    if (!token) {
      return res.status(401).json({ error: 'No token' })
    }
    const decoded = await jwtVerify(token, process.env.JWT_KEY)
    const { userId } = decoded

    const { restaurantId } = req.params
    let restaurantIds = await cache.get(`user:${userId}:restaurantIds`)
    if (!restaurantIds) {
      const { rows } = await pool.query(
        `
        SELECT restaurant_id FROM user_restaurant
        WHERE user_id = $1
        `,
        [userId]
      )
      restaurantIds = rows.map((row) => row.restaurant_id)
      await cache.set(`user:${userId}:restaurantIds`, JSON.stringify(restaurantIds))
    }

    const hasPermission = restaurantIds.includes(restaurantId)
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    res.locals.userId = userId
    next()
  } catch (err) {
    console.error(err)

    if (err.name === 'TokenExpiredError') {
      res.status(403).json({ message: 'Invalid token' })
    } else if (err.name === 'JsonWebTokenError') {
      res.status(403).json({ message: 'Invalid token' })
    } else {
      res.status(500).json({ errors: 'authenticate failed' })
    }
  }
}

export default authenticate
