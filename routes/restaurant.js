import express from 'express'
import { createRestaurant, joinRestaurant } from '../controllers/restaurant.js'
import authenticate from '../middlewares/authenticate.js'
import imgUpload from '../middlewares/multer.js'

const router = express.Router()

router.post('/restaurant', authenticate, imgUpload, createRestaurant)
router.post('/restaurant/join', authenticate, joinRestaurant)

export default router
