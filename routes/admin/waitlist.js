import express from 'express'
import { createWaitlistPage, checkWaitlistPage } from '../../controllers/admin/waitlist.js'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/createWaitlist',
  authenticate,
  authByRestaurantId,
  createWaitlistPage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkWaitlist',
  authenticate,
  authByRestaurantId,
  checkWaitlistPage
)

export default router
