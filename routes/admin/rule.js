import { Router } from 'express'
import { param } from 'express-validator'
import rulePage from '../../controllers/admin/rule.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'

const router = Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/rule',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  authorize(['admin']),
  rulePage
)

export default router
