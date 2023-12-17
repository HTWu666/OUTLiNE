import express from 'express'
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

const router = express.Router()

router.post('/restaurant/:restaurantId(\\d+)/waitlist/resetNumber', authenticate, resetNumber)
router.post('/restaurant/:restaurantId(\\d+)/waitlist', authenticate, createWaiting)
router.delete(
  '/restaurant/:restaurantId(\\d+)/waitlist/:waitingId(\\d+)',
  authenticate,
  cancelWaitingByBusiness
)
router.delete('/waitlist/:waitingId(\\d+)', cancelWaiting)
router.put('/restaurant/:restaurantId(\\d+)/waitlist', authenticate, callNumber)
router.get('/restaurant/:restaurantId(\\d+)/waitlist/currentNumber', getCurrNumber)
router.get('/restaurant/:restaurantId(\\d+)/waitlist', authenticate, getWaitlist)
router.put('/restaurant/:restaurantId(\\d+)/waitlist/:waitingId(\\d+)', authenticate, confirm)

export default router
