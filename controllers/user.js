import * as userModel from '../models/user.js'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import validator from 'validator'

const validateSignUp = (contentType, name, email, password) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!name) {
    missingField = 'Name'
  } else if (!email) {
    missingField = 'Email'
  } else if (!password) {
    missingField = 'Password'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' }
  }
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' }
  }
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' }
  }

  // Verify the email format
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  const isValidEmail = emailPattern.test(email)

  if (!isValidEmail) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Verify the password
  if (!validator.isLength(password, { min: 8 })) {
    return { valid: false, error: 'The password must be at lease 8 characters' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'The password must contain at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'The password must contain at least one lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'The password must contain at least one number' }
  }

  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
    return { valid: false, error: 'The password must contain at least one special character' }
  }

  return { valid: true }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  secure: true,
  sameSite: 'strict'
}

const createJWT = (userId) => {
  const payload = { id: userId }
  return jwt.sign(payload, process.env.JWT_KEY, { expiresIn: `${process.env.JWT_EXPIRATION_IN_SECOND}s` })
}

export const signUp = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { name, email, password } = req.body

    // validate
    const validation = validateSignUp(contentType, name, email, password)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const hashedPassword = await argon2.hash(password, {
      secret: Buffer.from(process.env.ARGON2_PEPPER)
    })

    // create user
    const userId = await userModel.createUser(name, email, hashedPassword)

    // create token
    const token = createJWT(userId)

    res
      .cookie('jwtToken', token, COOKIE_OPTIONS)
      .status(200)
      .json({
        data: {
          accessToken: token,
          accessExpired: process.env.JWT_EXPIRATION_IN_SECOND,
          user: {
            id: userId,
            name,
            email
          }
        }
      })
  } catch (err) {
    console.error(err)

    if (err instanceof Error) {
      if (err.message === 'duplicate key value violates unique constraint "unique_email"') {
        return res.status(400).json({ error: 'Email has been registered' })
      }

      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Sign up failed' })
  }
}

const validateSignIn = (contentType, email, password) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!email) {
    missingField = 'Email'
  } else if (!password) {
    missingField = 'Password'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  return { valid: true }
}

export const signIn = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { email, password } = req.body

    // validate
    const validation = validateSignIn(contentType, email, password)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // verify
    const user = await userModel.findUserByEmail(email)
    const isValidPassword = await argon2.verify(user.password, password, {
      secret: Buffer.from(process.env.ARGON2_PEPPER)
    })
    if (!user || !isValidPassword) {
      return res.status(403).json({ error: 'Invalid email or password' })
    }

    // create token
    const userId = user.id
    const token = createJWT(userId)

    res
      .cookie('jwtToken', token, COOKIE_OPTIONS)
      .status(200)
      .json({
        data: {
          accessToken: token,
          accessExpired: process.env.JWT_EXPIRATION_IN_SECOND,
          user: {
            id: userId,
            email
          }
        }
      })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Sign in failed' })
  }
}
