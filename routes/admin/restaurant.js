import express from 'express'
import chooseRestaurantPage from '../../controllers/admin/restaurant.js'
import authenticateAdminPage from '../../middlewares/authenticateAdminPage.js'

const router = express.Router()

router.get('/admin/chooseRestaurant', authenticateAdminPage, chooseRestaurantPage)

export default router
