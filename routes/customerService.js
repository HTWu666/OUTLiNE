import { Router } from 'express'
import { param } from 'express-validator'
import handleValidationResult from '../middlewares/validator.js'
import chatBot from '../controllers/customerService.js'

const router = Router()

router.post(
  '/v1/restaurant/:restaurantId(\\d+)/customerService',
  param('restaurantId').isInt({ min: 1 }),
  handleValidationResult,
  chatBot
)

export default router
