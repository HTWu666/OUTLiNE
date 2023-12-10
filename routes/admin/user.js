import express from 'express'
import {
  signinPage,
  profilePage,
  signupPage,
  reviewApplicationPage
} from '../../controllers/admin/user.js'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get('/', signinPage)
router.get('/signup', signupPage)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/profile',
  authenticate,
  authByRestaurantId,
  profilePage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/reviewApplication',
  authenticate,
  authByRestaurantId,
  reviewApplicationPage
)

export default router
