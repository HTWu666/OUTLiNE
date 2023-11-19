import express from 'express'
import { createRestaurant } from '../controllers/restaurant.js'
import authenticate from '../middlewares/authenticate.js'

const router = express.Router()

router.post('/restaurant', authenticate, createRestaurant)

export default router
