import { Router } from 'express'
import { body, query, param, header } from 'express-validator'
import {
  getReservations,
  cancelReservationByCustomer,
  cancelReservationByVendor,
  confirmReservation,
  createReservation
} from '../controllers/reservation.js'
import authenticate from '../middlewares/authenticate.js'
import handleValidationResult from '../middlewares/validator.js'
import parseUpn from '../middlewares/parseUpn.js'

const router = Router()

router.post(
  '/v1/restaurant/:restaurantId(\\d+)/reservation',
  param('restaurantId').isInt(),
  header('Content-Type').equals('application/json'),
  body('adult').notEmpty().isInt({ min: 1 }),
  body('child').notEmpty().isInt({ min: 0 }),
  body('diningDate').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('diningTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('name').notEmpty().isString().isLength({ max: 100 }),
  body('gender').isIn(['先生', '小姐', '其他']),
  body('phone').matches(/^09\d{8}$/),
  body('email').isEmail().isLength({ max: 320 }),
  body('purpose')
    .optional()
    .isIn(['', '生日', '家庭聚餐', '情人約會', '結婚紀念', '朋友聚餐', '商務聚餐']),
  body('note').optional().isString().isLength({ max: 500 }),
  handleValidationResult,
  createReservation
)

router.get(
  '/v1/restaurant/:restaurantId(\\d+)/reservation',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  query('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  handleValidationResult,
  getReservations
)

router.put(
  '/v1/restaurant/:restaurantId(\\d+)/reservation/:reservationId(\\d+)',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('reservationId').isInt({ min: 1 }),
  handleValidationResult,
  confirmReservation
)

router.delete(
  '/v1/restaurant/:restaurantId(\\d+)/reservation/:reservationId(\\d+)',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('reservationId').isInt({ min: 1 }),
  handleValidationResult,
  cancelReservationByVendor
)

// for customer to cancel
router.delete('/v1/reservation/click', parseUpn('reservation'), cancelReservationByCustomer)

export default router
