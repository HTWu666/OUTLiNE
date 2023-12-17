import express from 'express'
import chatBot from '../controllers/customerService.js'

const router = express.Router()

router.post('/restaurant/:restaurantId(\\d+)/customerService', chatBot)

export default router
