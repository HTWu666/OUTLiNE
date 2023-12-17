import express from 'express'
import {
  chooseRestaurantPage,
  joinRestaurantPage,
  createRestaurantPage
} from '../../controllers/admin/restaurant.js'
import authenticate from '../../middlewares/authenticate.js'

const router = express.Router()

router.get('/admin/chooseRestaurant', authenticate, chooseRestaurantPage)
router.get('/joinRestaurant', authenticate, joinRestaurantPage)
router.get('/createRestaurant', authenticate, createRestaurantPage)

export default router
