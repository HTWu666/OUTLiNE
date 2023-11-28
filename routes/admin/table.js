import express from 'express'
import { createTablePage, checkTablePage } from '../../controllers/admin/table.js'
import authenticateAdminPage from '../../middlewares/authenticateAdminPage.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/createTable',
  authenticateAdminPage,
  createTablePage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkTable',
  authenticateAdminPage,
  checkTablePage
)

export default router
