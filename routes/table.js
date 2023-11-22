import express from 'express'
import { createTable, getTables, deleteTable, createAvailableTime } from '../controllers/table.js'
import authenticate from '../middlewares/authenticate.js'

const router = express.Router()

router.post('/tables', authenticate, createTable)
router.get('/tables', authenticate, getTables)
router.delete('/tables/:id(\\d+)', authenticate, deleteTable)
router.post('/table/availableTime', authenticate, createAvailableTime)

export default router
