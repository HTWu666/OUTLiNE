import { Router } from 'express'
import { param, header, body } from 'express-validator'
import {
  signUp,
  signIn,
  signOut,
  profile,
  getApplications,
  approveApplication,
  rejectApplication
} from '../controllers/user.js'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'

const router = Router()

router.post(
  '/v1/user/signup',
  header('Content-Type').equals('application/json'),
  body('name').trim().notEmpty().isString().isLength({ max: 100 }),
  body('email').trim().isEmail().normalizeEmail().isLength({ max: 320 }),
  body('password')
    .trim()
    .notEmpty()
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 8, max: 500 })
    .withMessage('Password must be between 8 and 500 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/)
    .withMessage('Password must contain at least one special character'),
  signUp
)

router.post(
  '/v1/user/signin',
  body('contentType').equals('application/json'),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').exists().notEmpty(),
  signIn
)

router.post('/v1/user/signout', signOut)

router.get(
  '/v1/user/restaurant/:restaurantId(\\d+)/profile',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  profile
)

router.get(
  '/v1/user/application/restaurant/:restaurantId(\\d+)',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  authorize(['admin']),
  getApplications
)

router.put(
  '/v1/user/application/restaurant/:restaurantId(\\d+)/:userRoleId(\\d+)/approve',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('userRoleId').isInt({ min: 1 }),
  authorize(['admin']),
  approveApplication
)

router.put(
  '/v1/user/application/restaurant/:restaurantId(\\d+)/:userRoleId(\\d+)/reject',
  authenticate,
  param('restaurantId').isInt({ min: 1 }),
  param('userRoleId').isInt({ min: 1 }),
  authorize(['admin']),
  rejectApplication
)

export default router
