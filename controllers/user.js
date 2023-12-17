import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import * as userModel from '../models/user.js'
import * as restaurantModel from '../models/restaurant.js'
import * as roleModel from '../models/role.js'

const validateSignUp = (contentType, name, email, password) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!name) {
    missingField = 'Name'
  }
  if (!email) {
    missingField = 'Email'
  }
  if (!password) {
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

  if (!validator.isLength(name, { max: 100 })) {
    return { valid: false, error: 'Name must be less than 100 characters' }
  }

  const allowedCharactersRegex = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/
  // Verify the email format
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  const isValidEmail = emailPattern.test(email)
  const isEmailContainChinese = allowedCharactersRegex.test(email)
  if (!isValidEmail || !isEmailContainChinese) {
    return { valid: false, error: 'Invalid email format' }
  }
  if (!validator.isLength(email, { max: 320 })) {
    return { valid: false, error: 'Email must be less than 320 characters' }
  }

  // Verify the password
  if (!validator.isLength(password, { min: 8, max: 500 })) {
    return {
      valid: false,
      error: 'The password must be at least 8 characters and less than 500 characters'
    }
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
  if (!allowedCharactersRegex.test(password)) {
    return { valid: false, error: 'Invalid password' }
  }
  return { valid: true }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  secure: true,
  sameSite: 'strict',
  expires: new Date(Date.now() + parseInt(`${process.env.JWT_EXPIRATION_IN_SECOND}`, 10) * 1000)
}

const createJWT = (userId) => {
  const payload = { userId }
  return jwt.sign(payload, process.env.JWT_KEY, {
    expiresIn: `${process.env.JWT_EXPIRATION_IN_SECOND}s`
  })
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
    const token = createJWT(userId)

    res
      .cookie('jwtToken', token, COOKIE_OPTIONS)
      .status(200)
      .json({
        data: {
          access_token: token,
          access_expired: process.env.JWT_EXPIRATION_IN_SECOND,
          user: {
            id: userId,
            email
          }
        }
      })
  } catch (err) {
    console.error(err)

    if (err instanceof Error) {
      if (err.message === 'duplicate key value violates unique constraint "unique_email"') {
        return res.status(400).json({ error: '信箱已註冊過' })
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
  }
  if (!password) {
    missingField = 'Password'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' }
  }
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' }
  }
  const allowedCharactersRegex = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/
  // Verify the email format
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  const isValidEmail = emailPattern.test(email)
  const isEmailContainChinese = allowedCharactersRegex.test(email)

  if (!isValidEmail || !isEmailContainChinese) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Verify the password
  if (!validator.isLength(password, { min: 8 })) {
    return { valid: false, error: 'The password must be at least 8 characters' }
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
  if (!allowedCharactersRegex.test(password)) {
    return { valid: false, error: 'Invalid password' }
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
          access_token: token,
          access_expired: process.env.JWT_EXPIRATION_IN_SECOND,
          user: {
            id: userId,
            email
          }
        }
      })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Sign in failed' })
  }
}

export const signOut = async (req, res) => {
  try {
    res
      .cookie('jwtToken', '', { maxAge: 0, httpOnly: true, path: '/' })
      .status(200)
      .json({ message: '登出成功' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Sign out failed' })
  }
}

export const profile = async (req, res) => {
  try {
    const { userId } = res.locals
    const { restaurantId } = req.params
    const userInfo = await userModel.findUserById(userId)
    const restaurantInfo = await restaurantModel.getRestaurant(restaurantId)
    const role = await roleModel.getRole(userId, restaurantId)

    res.status(200).json({
      data: {
        userName: userInfo.name,
        email: userInfo.email,
        restaurantId,
        restaurantName: restaurantInfo.name,
        role
      }
    })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Sign out failed' })
  }
}

export const getApplications = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const applications = await userModel.getApplications(restaurantId)
    res.status(200).json({ data: applications })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Sign out failed' })
  }
}

export const approveApplication = async (req, res) => {
  try {
    const { restaurantId, userRoleId } = req.params
    await userModel.approveApplication(restaurantId, userRoleId)
    res.status(200).json({ message: 'Approve application successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Sign out failed' })
  }
}

export const rejectApplication = async (req, res) => {
  try {
    const { userRoleId } = req.params
    await userModel.rejectApplication(userRoleId)
    res.status(200).json({ message: 'Reject application successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Sign out failed' })
  }
}
