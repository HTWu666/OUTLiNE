import express from 'express'
import waitlistNumberPage from '../../controllers/client/waitlist.js'
import { parseUpnForWaitlist } from '../../middlewares/parseUpn.js'

const router = express.Router()

router.get('/restaurant/:restaurantId(\\d+)/waitlist', parseUpnForWaitlist, waitlistNumberPage)

export default router
