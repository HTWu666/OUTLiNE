import express from 'express'
import authenticate from '../middlewares/authenticate.js'
import { createRule, getRule } from '../controllers/rule.js'

const router = express.Router()

router.post('/rules', authenticate, createRule)
router.get('/rules', authenticate, getRule)
router.put('/rules', authenticate)

export default router
