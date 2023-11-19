import express from 'express'
import { signUp, signIn } from '../controllers/user.js'

const router = express.Router()

router.post('/user/signup', signUp)
router.post('/user/signin', signIn)

export default router
