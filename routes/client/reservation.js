import express from 'express'
import { reservationPage, getReservation } from '../../controllers/client/reservation.js'
import { parseUpnForReservation } from '../../middlewares/parseUpn.js'

const router = express.Router()

router.get('/reservation/:restaurantId(\\d+)', reservationPage)
router.get('/reservation/click', parseUpnForReservation, getReservation)

export default router
