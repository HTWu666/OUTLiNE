import express from 'express'
import { signinPage, memberPage } from '../../controllers/admin/user.js'
import authenticateAdminPage from '../../middlewares/authenticateAdminPage.js'

const router = express.Router()

router.get('/', signinPage)
router.get('/restaurant/:restaurantId(\\d+)/admin/member', authenticateAdminPage, memberPage)

export default router
