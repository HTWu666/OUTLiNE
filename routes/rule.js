import express from 'express'
import authenticate from '../middlewares/authenticate'

const router = express.Router()

router.post('/rules', authenticate)
router.get('/rules', authenticate)
router.put('/rules', authenticate)
