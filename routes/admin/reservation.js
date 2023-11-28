import express from 'express'
import { checkReservationPage, makeReservationPage } from '../../controllers/admin/reservation.js'
import authenticateAdminPage from '../../middlewares/authenticateAdminPage.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkReservation',
  authenticateAdminPage,
  checkReservationPage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/makeReservation',
  authenticateAdminPage,
  makeReservationPage
)

export default router
