import express from 'express'
import chooseRestaurantPage from '../../controllers/admin/restaurant.js'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get('/admin/chooseRestaurant', authenticate, authByRestaurantId, chooseRestaurantPage)

export default router
