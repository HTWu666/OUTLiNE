import express from 'express'
import reservationPage from '../../controllers/client/reservation.js'

const router = express.Router()

router.get('/reservation/:id(\\d+)', reservationPage)

export default router
