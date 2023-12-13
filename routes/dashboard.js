import express from 'express'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import {
  getWeeklyFootTrafficByHour,
  getWeeklyFootTrafficDistribution
} from '../controllers/dashboard.js'
import authByRestaurantId from '../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/dashboard/getWeeklyFootTrafficByHour',
  authenticate,
  authByRestaurantId,
  authorize('admin'),
  getWeeklyFootTrafficByHour
)
router.get(
  '/restaurant/:restaurantId(\\d+)/dashboard/getWeeklyFootTrafficDistribution',
  authenticate,
  authByRestaurantId,
  authorize('admin'),
  getWeeklyFootTrafficDistribution
)

export default router
