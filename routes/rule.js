import express from 'express'
import authenticate from '../middlewares/authenticate.js'
import { createRule, getRule, updateRule } from '../controllers/rule.js'

const router = express.Router()

router.post('/restaurant/:restaurantId(\\d+)/rules', authenticate, createRule)
router.get('/restaurant/:restaurantId(\\d+)/rules', authenticate, getRule)
router.put('/restaurant/:restaurantId(\\d+)/rules', authenticate, updateRule)

export default router
