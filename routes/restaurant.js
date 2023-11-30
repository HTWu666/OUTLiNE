import express from 'express'
import { createRestaurant } from '../controllers/restaurant.js'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import imgUpload from '../middlewares/multer.js'

const router = express.Router()

router.post('/restaurant', authenticate, authorize('admin'), imgUpload, createRestaurant)

export default router
