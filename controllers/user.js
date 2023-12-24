import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import * as userModel from '../models/user.js'
import * as restaurantModel from '../models/restaurant.js'
import * as roleModel from '../models/role.js'

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
    const { name, email, password } = req.body
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
        return res.status(400).json({ errors: '信箱已註冊過' })
      }

      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Sign up failed' })
  }
}

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body

    // verify
    const user = await userModel.findUserByEmail(email)
    const isValidPassword = await argon2.verify(user.password, password, {
      secret: Buffer.from(process.env.ARGON2_PEPPER)
    })
    if (!user || !isValidPassword) {
      return res.status(403).json({ errors: 'Invalid email or password' })
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Sign in failed' })
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Sign out failed' })
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Sign out failed' })
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Sign out failed' })
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Sign out failed' })
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Sign out failed' })
  }
}
