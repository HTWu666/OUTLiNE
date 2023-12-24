import { Router } from 'express'
import { param } from 'express-validator'
import { createRestaurant, joinRestaurant } from '../controllers/restaurant.js'
import authenticate from '../middlewares/authenticate.js'
import imgUpload from '../middlewares/multer.js'

const router = Router()

router.post('/v1/restaurant', authenticate, imgUpload, createRestaurant)
router.post(
  '/v1/restaurant/join',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  joinRestaurant
)

export default router
