import { Router } from 'express'
import { param, header, body } from 'express-validator'
import {
  resetNumber,
  createWaiting,
  callNumber,
  getCurrNumber,
  cancelWaiting,
  getWaitlist,
  confirm,
  cancelWaitingByBusiness
} from '../controllers/waitlist.js'
import authenticate from '../middlewares/authenticate.js'

const router = Router()

router.post(
  '/v1/restaurant/:restaurantId(\\d+)/waitlist/resetNumber',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  resetNumber
)

router.post(
  '/v1/restaurant/:restaurantId(\\d+)/waitlist',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  header('Content-Type').equals('application/json'),
  body('adult').isInt({ min: 1 }),
  body('child').optional().isInt({ min: 0 }),
  body('name').notEmpty().isString().isLength({ max: 100 }),
  body('gender').isIn(['先生', '小姐', '其他']),
  body('phone')
    .isString()
    .matches(/^09\d{8}$/),
  body('purpose')
    .optional()
    .isIn(['', '生日', '家庭聚餐', '情人約會', '結婚紀念', '朋友聚餐', '商務聚餐']),
  body('note').optional().isString().isLength({ max: 500 }),
  createWaiting
)

router.delete(
  '/v1/restaurant/:restaurantId(\\d+)/waitlist/:waitingId(\\d+)',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('waitingId').isInt({ min: 1 }),
  cancelWaitingByBusiness
)

router.delete('/v1/waitlist/:waitingId(\\d+)', param('waitingId').isInt({ min: 1 }), cancelWaiting)

router.put(
  '/v1/restaurant/:restaurantId(\\d+)/waitlist',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('waitingId').isInt({ min: 1 }),
  callNumber
)

router.get(
  '/v1/restaurant/:restaurantId(\\d+)/waitlist/currentNumber',
  param('restaurantId').isInt({ min: 1 }),
  getCurrNumber
)

router.get(
  '/v1/restaurant/:restaurantId(\\d+)/waitlist',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  getWaitlist
)

router.put(
  '/v1/restaurant/:restaurantId(\\d+)/waitlist/:waitingId(\\d+)',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('waitingId').isInt({ min: 1 }),
  confirm
)

export default router
