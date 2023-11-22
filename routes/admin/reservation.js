import express from 'express'
import checkReservationPage from '../../controllers/admin/reservation.js'

const router = express.Router()

router.get('/checkReservation', checkReservationPage)

export default router
