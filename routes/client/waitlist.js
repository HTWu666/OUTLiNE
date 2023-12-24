import { Router } from 'express'
import { param } from 'express-validator'
import waitlistNumberPage from '../../controllers/client/waitlist.js'
import parseUpn from '../../middlewares/parseUpn.js'

const router = Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/waitlist',
  param('restaurantId').isInt({ min: 1 }),
  parseUpn('waitlist'),
  waitlistNumberPage
)

export default router
