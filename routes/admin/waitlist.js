import express from 'express'
import { createWaitlistPage, checkWaitlistPage } from '../../controllers/admin/waitlist.js'
import authenticateAdminPage from '../../middlewares/authenticateAdminPage.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/createWaitlist',
  authenticateAdminPage,
  createWaitlistPage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkWaitlist',
  authenticateAdminPage,
  checkWaitlistPage
)

export default router
