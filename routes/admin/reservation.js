import { Router } from 'express'
import { param } from 'express-validator'
import { checkReservationPage, makeReservationPage } from '../../controllers/admin/reservation.js'
import authenticate from '../../middlewares/authenticate.js'

const router = Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkReservation',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  checkReservationPage
)

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/makeReservation',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  makeReservationPage
)

export default router
