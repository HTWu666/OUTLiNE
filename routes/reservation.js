import express from 'express'
import {
  createReservationByCustomer,
  createReservationByVendor,
  getReservations,
  getReservation,
  cancelReservationByCustomer,
  cancelReservationByVendor,
  confirmReservation
} from '../controllers/reservation.js'
import authenticate from '../middlewares/authenticate.js'
import parseUpn from '../middlewares/parseUpn.js'

const router = express.Router()

// for business
router.post('/reservation', authenticate, createReservationByVendor)
router.get('/reservation', authenticate, getReservations)
router.put('/reservation/:id(\\d+)', authenticate, confirmReservation)
router.delete('/reservation/:id(\\d+)', authenticate, cancelReservationByVendor)

// for customer
router.get('/reservation/click', parseUpn, getReservation)
router.post('/reservation/restaurant/:id', createReservationByCustomer) // 前端從 url 取得餐廳 id, 再回傳
router.delete('/reservation/click', parseUpn, cancelReservationByCustomer)

export default router
