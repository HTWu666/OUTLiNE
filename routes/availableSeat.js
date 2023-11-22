import express from 'express'
import { getAvailableSeats } from '../controllers/availableSeat.js'

const router = express.Router()

router.get('/availableSeats', getAvailableSeats)

export default router
