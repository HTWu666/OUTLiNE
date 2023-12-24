import { Router } from 'express'
import { param } from 'express-validator'
import authenticate from '../../middlewares/authenticate.js'
import dashboardPage from '../../controllers/admin/dashboard.js'
import authorize from '../../middlewares/authorize.js'

const router = Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/dashboard',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  authorize(['admin']),
  dashboardPage
)

export default router
