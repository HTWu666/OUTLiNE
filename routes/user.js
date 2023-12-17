import express from 'express'
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

const router = express.Router()

router.post('/user/signup', signUp)
router.post('/user/signin', signIn)
router.post('/user/signout', signOut)
router.get('/user/restaurant/:restaurantId(\\d+)/profile', authenticate, profile)
router.get(
  '/user/application/restaurant/:restaurantId(\\d+)',
  authenticate,
  authorize('admin'),
  getApplications
)
router.put(
  '/user/application/restaurant/:restaurantId(\\d+)/:userRoleId(\\d+)/approve',
  authenticate,
  authorize('admin'),
  approveApplication
)
router.put(
  '/user/application/restaurant/:restaurantId(\\d+)/:userRoleId(\\d+)/reject',
  authenticate,
  authorize('admin'),
  rejectApplication
)

export default router
