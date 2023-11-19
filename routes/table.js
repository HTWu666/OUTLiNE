import express from 'express'
import { createTable, getTables, deleteTable } from '../controllers/table.js'
import authenticate from '../middlewares/authenticate.js'

const router = express.Router()

router.post('/tables', authenticate, createTable)
router.get('/tables', authenticate, getTables)
router.delete('/tables/:id', authenticate, deleteTable)

export default router
