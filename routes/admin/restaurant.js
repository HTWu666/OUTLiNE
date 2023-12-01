import express from 'express'
import chooseRestaurantPage from '../../controllers/admin/restaurant.js'
import authenticate from '../../middlewares/authenticate.js'

const router = express.Router()

router.get('/admin/chooseRestaurant', authenticate, chooseRestaurantPage)

export default router
