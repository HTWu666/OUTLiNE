import express from 'express'
import rulePage from '../../controllers/admin/rule.js'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get('/restaurant/:restaurantId(\\d+)/admin/rule', authenticate, authByRestaurantId, rulePage)

export default router
