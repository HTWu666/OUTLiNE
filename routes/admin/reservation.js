import express from 'express'
import { checkReservationPage, makeReservationPage } from '../../controllers/admin/reservation.js'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkReservation',
  authenticate,
  authByRestaurantId,
  checkReservationPage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/makeReservation',
  authenticate,
  authByRestaurantId,
  makeReservationPage
)

export default router
