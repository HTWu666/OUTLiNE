import express from 'express'
import { createReservation, getReservations } from '../controllers/reservation.js'
import authenticate from '../middlewares/authenticate.js'

const router = express.Router()

router.post('/reservation/restaurant/:id', createReservation) // 前端從 url 取得餐廳 id, 再回傳
router.get('/reservation', authenticate, getReservations)
router.put('/reservation/:id')

export default router
