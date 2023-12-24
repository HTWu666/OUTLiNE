import { Router } from 'express'
import { param, query } from 'express-validator'
import handleValidationResult from '../middlewares/validator.js'
import getAvailableSeats from '../controllers/availableSeat.js'

const router = Router()

router.get(
  '/v1/restaurant/:restaurantId(\\d+)/availableSeats',
  param('restaurantId').isInt({ min: 1 }),
  query('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  handleValidationResult,
  getAvailableSeats
)

export default router
