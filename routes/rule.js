import { Router } from 'express'
import { param, header, body } from 'express-validator'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import { createRule, getRule, updateRule } from '../controllers/rule.js'

const router = Router()

const validateRuleInput = [
  param('restaurantId').isInt({ min: 1 }),
  header('Content-Type').equals('application/json'),
  body('maxPersonPerGroup')
    .isInt({ min: 1 })
    .withMessage('Max person per group must be a positive integer'),
  body('minBookingDay').isInt({ min: 1 }).withMessage('Min booking day must be a positive integer'),
  body('maxBookingDay').isInt({ min: 1 }).withMessage('Max booking day must be a positive integer'),
  body('updateBookingTime')
    .matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Update booking time must be in the form of HH:MM')
]

router.post(
  '/v1/restaurant/:restaurantId(\\d+)/rules',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  authorize(['admin']),
  ...validateRuleInput,
  createRule
)

router.get(
  '/v1/restaurant/:restaurantId(\\d+)/rules',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  getRule
)

router.put(
  '/v1/restaurant/:restaurantId(\\d+)/rules',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  authorize(['admin']),
  ...validateRuleInput,
  updateRule
)

export default router
