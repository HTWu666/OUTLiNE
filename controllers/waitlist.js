import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import * as waitlistModel from '../models/waitlist.js'

export const resetNumber = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const waitlistId = await waitlistModel.resetNumber(restaurantId)

    res.status(200).json(waitlistId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Reset number card failed' })
  }
}

export const createWaiting = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { adult, child, name, gender, phone, purpose, note } = req.body
    const { waitingId } = await waitlistModel.createWaiting(
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Create waiting failed' })
  }
}

export const getCurrNumber = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const currentNumber = await waitlistModel.getCurrNumber(restaurantId)

    res.status(200).json({ data: { currentNumber } })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get current number failed' })
  }
}

export const callNumber = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const nextNumber = await waitlistModel.callNumber(restaurantId)
    if (!nextNumber) {
      return res.status(200).json({ message: 'No next number' })
    }
    const io = req.app.get('io')
    io.to(`restaurant-${restaurantId}`).emit(`numberCalled`, nextNumber)

    res.status(200).json({ data: nextNumber })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Call number failed' })
  }
}

export const cancelWaiting = async (req, res) => {
  try {
    const { waitingId } = req.params
    await waitlistModel.cancelWaiting(waitingId)

    res.status(200).json({ message: 'Cancel waiting Successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Call number failed' })
  }
}

export const getWaitlist = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const waitlist = await waitlistModel.getWaitlist(restaurantId)

    res.status(200).json({ data: waitlist })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get wait list failed' })
  }
}

export const confirm = async (req, res) => {
  try {
    const { waitingId } = req.params
    await waitlistModel.confirm(waitingId)

    res.status(200).json({ message: 'Confirm waiting successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get wait list failed' })
  }
}

export const cancelWaitingByBusiness = async (req, res) => {
  try {
    const { waitingId } = req.params
    await waitlistModel.cancelWaiting(waitingId)

    res.status(200).json({ message: 'Cancel waiting Successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get wait list failed' })
  }
}
