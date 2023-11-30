import express from 'express'
import { createTablePage, checkTablePage } from '../../controllers/admin/table.js'
import authenticate from '../../middlewares/authenticate.js'
import authByRestaurantId from '../../middlewares/authByRestaurantId.js'

const router = express.Router()

router.get(
  '/restaurant/:restaurantId(\\d+)/admin/createTable',
  authenticate,
  authByRestaurantId,
  createTablePage
)
router.get(
  '/restaurant/:restaurantId(\\d+)/admin/checkTable',
  authenticate,
  authByRestaurantId,
  checkTablePage
)

export default router
