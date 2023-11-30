import express from 'express'
import { signinPage, memberPage } from '../../controllers/admin/user.js'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get('/', signinPage)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/member',
  authenticate,
  authByRestaurantId,
  memberPage
)

export default router
