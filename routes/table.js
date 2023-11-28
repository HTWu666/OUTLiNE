import express from 'express'
import { createTable, getTables, deleteTable, createAvailableTime } from '../controllers/table.js'
import authenticate from '../middlewares/authenticate.js'

const router = express.Router()

router.post('/restaurant/:restaurantId(\\d+)/tables', authenticate, createTable)
router.get('/restaurant/:restaurantId(\\d+)/tables', authenticate, getTables)
router.delete('/restaurant/:restaurantId(\\d+)/tables/:tableId(\\d+)', authenticate, deleteTable)
router.post(
  '/restaurant/:restaurantId(\\d+)/table/availableTime',
  authenticate,
  createAvailableTime
)

export default router
