import express from 'express'
import {
  signinPage,
  profilePage,
  signupPage,
  reviewApplicationPage
} from '../../controllers/admin/user.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'

const router = express.Router()

router.get('/', signinPage)
router.get('/signup', signupPage)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/profile',
  authenticate,
  authorize(['admin', 'user']),
  profilePage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/reviewApplication',
  authenticate,
  authorize(['admin']),
  reviewApplicationPage
)

export default router
