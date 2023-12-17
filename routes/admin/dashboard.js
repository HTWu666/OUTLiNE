import express from 'express'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'
import dashboardPage from '../../controllers/admin/dashboard.js'
import authorize from '../../middlewares/authorize.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/dashboard',
  authenticate,
  authByRestaurantId,
  authorize('admin'),
  dashboardPage
)

export default router
