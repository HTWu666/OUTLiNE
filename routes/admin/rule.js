import express from 'express'
import rulePage from '../../controllers/admin/rule.js'
import authenticateAdminPage from '../../middlewares/authenticateAdminPage.js'

const router = express.Router()

router.get('/restaurant/:restaurantId(\\d+)/admin/rule', authenticateAdminPage, rulePage)

export default router
