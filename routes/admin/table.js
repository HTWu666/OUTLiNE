import { Router } from 'express'
import { param } from 'express-validator'
import { createTablePage, checkTablePage } from '../../controllers/admin/table.js'
import authenticate from '../../middlewares/authenticate.js'

const router = Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/createTable',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  createTablePage
)

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkTable',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  checkTablePage
)

export default router
