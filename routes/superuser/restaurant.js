import express from 'express'
import createRestaurantPage from '../../controllers/superuser/restaurant.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'

const router = express.Router()

router.get('/superuser/restaurant', authenticate, authorize('admin'), createRestaurantPage)

export default router
