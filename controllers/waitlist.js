import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import * as waitlistModel from '../models/waitlist.js'

export const resetNumber = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const waitlistId = await waitlistModel.resetNumber(restaurantId)

    res.status(200).json(waitlistId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Reset number card failed' })
  }
}

const validateWaittingInput = (
  contentType,
  restaurantId,
  adult,
  child,
  name,
  gender,
  phone,
  purpose,
  note
) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!adult) {
    missingField = 'Number of adult'
  } else if (!name) {
    missingField = 'Name'
  } else if (!gender) {
    missingField = 'Gender'
  } else if (!phone) {
    missingField = 'Phone'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  // verify data type
  if (typeof adult !== 'number') {
    return { valid: false, error: 'Number of adult must be a number' }
  }
  if (adult <= 0) {
    return { valid: false, error: 'Number of adult must be greater than 0' }
  }
  if (typeof child !== 'number') {
    return { valid: false, error: 'Number of child must be a number' }
  }
  if (child < 0) {
    return { valid: false, error: 'Number of child must be greater than 0' }
  }
  if (typeof restaurantId !== 'number') {
    return { valid: false, error: 'Restaurant Id query string must be a number' }
  }
  if (restaurantId <= 0) {
    return { valid: false, error: 'Number of restaurantId must be greater than 0' }
  }
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' }
  }
  if (name.length > 100) {
    return { valid: false, error: 'The length of name should be less than 100 characters' }
  }
  if (!['先生', '小姐', '其他'].includes(gender)) {
    return { valid: false, error: 'Gender must be 先生, 小姐, 其他' }
  }
  const phoneRegex = /^09\d{8}$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Phone format is wrong' }
  }
  if (typeof phone !== 'string') {
    return { valid: false, error: 'Phone must be a string' }
  }
  if (
    purpose &&
    !['生日', '家庭聚餐', '情人約會', '結婚紀念', '朋友聚餐', '商務聚餐'].includes(purpose)
  ) {
    return { valid: false, error: 'Purpose is wrong' }
  }
  if (note && typeof note !== 'string') {
    return { valid: false, error: 'Note must be a string' }
  }
  if (note.length > 500) {
    return { valid: false, error: 'The length of note should be less than 500 characters' }
  }
  return { valid: true }
}

export const createWaiting = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { adult, child, name, gender, phone, purpose, note } = req.body
    const validation = validateWaittingInput(
      contentType,
      restaurantId,
      adult,
      child,
      name,
      gender,
      phone,
      purpose,
      note
    )
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const { waitingId, number } = await waitlistModel.createWaiting(
      restaurantId,
      adult,
      child,
      name,
      gender,
      phone,
      purpose,
      note
    )

    const payload = { waitingId }
    const upn = jwt.sign(payload, process.env.JWT_KEY)
    const url = `${process.env.DOMAIN}/restaurant/${restaurantId}/waitlist?upn=${upn}`
    const qrCode = await QRCode.toDataURL(url)

    res.status(200).json({ data: { qrCode, url } })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Create waiting failed' })
  }
}

export const getCurrNumber = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const currentNumber = await waitlistModel.getCurrNumber(restaurantId)

    res.status(200).json({ data: { currentNumber } })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get current number failed' })
  }
}

export const callNumber = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const nextNumber = await waitlistModel.callNumber(restaurantId)
    if (!nextNumber) {
      return res.status(200).json({ message: 'No next number' })
    }
    const io = req.app.get('io')
    io.emit('numberCalled', nextNumber)

    res.status(200).json(nextNumber)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Call number failed' })
  }
}

export const cancelWaiting = async (req, res) => {
  try {
    const waitingId = parseInt(req.params.waitingId, 10)
    await waitlistModel.cancelWaiting(waitingId)

    res.status(200).json({ message: 'Cancel waiting Successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Call number failed' })
  }
}

export const getWaitlist = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const waitlist = await waitlistModel.getWaitlist(restaurantId)

    res.status(200).json({ data: waitlist })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get wait list failed' })
  }
}

export const confirm = async (req, res) => {
  try {
    const waitingId = parseInt(req.params.waitingId, 10)
    await waitlistModel.confirm(waitingId)

    res.status(200).json({ message: 'Confirm waiting successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get wait list failed' })
  }
}

export const cancelWaitingByBusiness = async (req, res) => {
  try {
    const waitingId = parseInt(req.params.waitingId, 10)
    await waitlistModel.cancelWaiting(waitingId)

    res.status(200).json({ message: 'Cancel waiting Successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get wait list failed' })
  }
}
