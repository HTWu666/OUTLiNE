import express from 'express'
import signinPage from '../../controllers/admin/signin.js'

const router = express.Router()

router.get('/signin', signinPage)

export default router
