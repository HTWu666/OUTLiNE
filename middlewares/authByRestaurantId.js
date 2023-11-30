import { userHasRestaurant } from '../models/restaurant.js'
import * as cache from '../utils/cache.js'

const authByRestaurantId = async (req, res, next) => {
  try {
    const { userId } = res.locals
    const { restaurantId } = req.params

    let restaurantIds = await cache.get(`user:${userId}:restaurantIds`)
    if (!restaurantIds) {
      restaurantIds = await userHasRestaurant(userId)
      await cache.set(`user:${userId}:restaurantIds`, JSON.stringify(restaurantIds))
    }

    const hasPermission = restaurantIds.includes(restaurantId)
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    next()
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(403).json({ errors: err.message })
    }
    res.status(403).json({ errors: 'authorization failed' })
  }
}

export default authByRestaurantId
