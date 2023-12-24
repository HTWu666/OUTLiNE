import { Router } from 'express'
import { param, query } from 'express-validator'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import handleValidationResult from '../middlewares/validator.js'
import {
  getWeeklyFootTrafficByHour,
  getWeeklyFootTrafficDistribution
} from '../controllers/dashboard.js'

const router = Router()

router.get(
  '/v1/restaurant/:restaurantId(\\d+)/dashboard/getWeeklyFootTrafficByHour',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  query('lastDays').isInt({ min: 1 }),
  handleValidationResult,
  authorize(['admin']),
  getWeeklyFootTrafficByHour
)

router.get(
  '/v1/restaurant/:restaurantId(\\d+)/dashboard/getWeeklyFootTrafficDistribution',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  query('lastDays').isInt({ min: 1 }),
  handleValidationResult,
  authorize(['admin']),
  getWeeklyFootTrafficDistribution
)

export default router
