import express from 'express'
import { getAvailableSeats } from '../controllers/availableSeat.js'

const router = express.Router()

router.get('/restaurant/:restaurantId(\\d+)/availableSeats', getAvailableSeats)

export default router
