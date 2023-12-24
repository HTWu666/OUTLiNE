import { Router } from 'express'
import { param } from 'express-validator'
import { reservationPage, getReservation } from '../../controllers/client/reservation.js'
import parseUpn from '../../middlewares/parseUpn.js'

const router = Router()

router.get(
  '/reservation/:restaurantId(\\d+)',
  param('restauranId').isInt({ min: 1 }),
  reservationPage
)
router.get('/reservation/click', parseUpn('reservation'), getReservation)

export default router
