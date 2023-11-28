import express from 'express'
import { signUp, signIn, signOut } from '../controllers/user.js'

const router = express.Router()

router.post('/user/signup', signUp)
router.post('/user/signin', signIn)
router.post('/user/signout', signOut)

export default router
