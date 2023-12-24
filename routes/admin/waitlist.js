import { Router } from 'express'
import { param } from 'express-validator'
import { createWaitlistPage, checkWaitlistPage } from '../../controllers/admin/waitlist.js'
import authenticate from '../../middlewares/authenticate.js'

const router = Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/createWaitlist',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  createWaitlistPage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkWaitlist',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  checkWaitlistPage
)

export default router
