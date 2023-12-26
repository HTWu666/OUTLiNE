import { Router } from 'express'
import { param, header, body } from 'express-validator'
import { createTable, getTables, deleteTable } from '../controllers/table.js'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'

const router = Router()

const validateAvailableTime = body('availableTime').custom((value) => {
  const availableTimeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (Array.isArray(value)) {
    value.forEach((time) => {
      if (!availableTimeRegex.test(time)) {
        throw new Error('Each available time must be in the form of hh:mm')
      }
    })
  } else if (typeof value === 'string' && !availableTimeRegex.test(value)) {
    throw new Error('Available time must be in the form of hh:mm')
  }
  return true
})

// Custom validator for seatQty and maxPersonPerGroup
const validateSeatQty = body().custom((value, { req }) => {
  const { seatQty, maxPersonPerGroup } = req.body
  if (seatQty > maxPersonPerGroup) {
    throw new Error('Seat quantity should be less than the max person per group set in the rule')
  }
  return true
})

// Custom validator for availableTime type
const validateAvailableTimeType = body('availableTime').custom((value) => {
  if (!(typeof value === 'string' || Array.isArray(value))) {
    throw new Error('Available time must be a string or an array')
  }
  return true
})

router.post(
  '/v1/restaurant/:restaurantId(\\d+)/tables',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  authorize(['admin']),
  header('Content-Type').equals('application/json'),
  body('tableName').notEmpty().isString().isLength({ max: 4 }),
  body('seatQty').notEmpty().isInt({ min: 1 }),
  validateAvailableTime,
  validateSeatQty,
  validateAvailableTimeType,
  createTable
)

router.get('/v1/restaurant/:restaurantId(\\d+)/tables', authenticate, getTables)

router.delete(
  '/v1/restaurant/:restaurantId(\\d+)/tables/:tableId(\\d+)',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('tableId').isInt({ min: 1 }),
  authorize(['admin']),
  deleteTable
)

export default router
