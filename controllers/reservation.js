import moment from 'moment-timezone'
import jwt from 'jsonwebtoken'
import * as reservationModel from '../models/reservation.js'
import * as restaurantModel from '../models/restaurant.js'
import * as ruleModel from '../models/rule.js'
import pool from '../models/databasePool.js'
import * as SQS from '../utils/SQS.js'

const validateCreateReservation = (
  contentType,
  adult,
  child,
  diningDate,
  diningTime,
  name,
  gender,
  phone,
  email,
  purpose,
  note,
  restaurantId
) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!adult) {
    missingField = 'Number of adult'
  } else if (!diningDate) {
    missingField = 'Dining date'
  } else if (!diningTime) {
    missingField = 'Dining time'
  } else if (!name) {
    missingField = 'Name'
  } else if (!gender) {
    missingField = 'Gender'
  } else if (!phone) {
    missingField = 'Phone'
  } else if (!email) {
    missingField = 'Email'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  // verify data type
  if (typeof adult !== 'number') {
    return { valid: false, error: 'Number of adult must be a number' }
  }
  if (typeof child !== 'number') {
    return { valid: false, error: 'Number of child must be a number' }
  }
  if (typeof restaurantId !== 'number') {
    return { valid: false, error: 'Restaurant Id query string must be a number' }
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(diningDate)) {
    return { valid: false, error: 'Dining date must be a date' }
  }
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!regex.test(diningTime)) {
    return { valid: false, error: 'Dining time must be in the form of hh:mm' }
  }
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' }
  }
  if (!['先生', '小姐', '其他'].includes(gender)) {
    return { valid: false, error: 'Gender must be 先生, 小姐, 其他' }
  }
  const phoneRegex = /^09\d{8}$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: '電話號碼格式錯誤' }
  }
  if (typeof phone !== 'string') {
    return { valid: false, error: 'Phone must be a string' }
  }
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  if (!emailPattern.test(email)) {
    return { valid: false, error: '信箱格式錯誤' }
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

  return { valid: true }
}

const NOTIFY_MAKING_RESERVATION_SUCCESSFULLY_SQS_QUEUE_URL =
  'https://sqs.ap-southeast-2.amazonaws.com/179428986360/outline-notify-making-reservation-success-queue'

// for customer and business
export const createReservation = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { adult, child, diningDate, diningTime, name, gender, phone, email, purpose, note } =
      req.body
    const restaurantId = parseInt(req.params.restaurantId, 10)

    // validate
    const validation = validateCreateReservation(
      contentType,
      adult,
      child,
      diningDate,
      diningTime,
      name,
      gender,
      phone,
      email,
      purpose,
      note,
      restaurantId
    )

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // create reservation
    const timezone = 'Asia/Taipei'
    const utcDiningTime = moment.tz(diningTime, 'HH:mm', timezone).utc().format('HH:mm:ss')
    let reservationId
    let upn
    const connection = await pool.connect()
    try {
      await connection.query('BEGIN')
      reservationId = await reservationModel.createReservation(
        restaurantId,
        adult,
        child,
        diningDate,
        utcDiningTime,
        name,
        gender,
        phone,
        email,
        purpose,
        note,
        connection
      )

      // create token (reservationId), 返回訂位資訊的頁面再根據 reservationId 去撈資料
      const payload = { reservationId }
      upn = jwt.sign(payload, process.env.JWT_KEY)
      await reservationModel.createUpnForReservation(upn, reservationId, connection)

      await connection.query('COMMIT')
    } catch (err) {
      await connection.query('ROLLBACK')
      throw err
    } finally {
      connection.release()
    }

    const message = {
      restaurantId,
      reservationId,
      adult,
      child,
      diningDate,
      utcDiningTime,
      name,
      gender,
      email,
      upn
    }
    await SQS.sendMessage(
      NOTIFY_MAKING_RESERVATION_SUCCESSFULLY_SQS_QUEUE_URL,
      JSON.stringify(message)
    )

    res.status(200).json(reservationId)
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Create reservation failed' })
  }
}

// for customer
export const cancelReservationByCustomer = async (req, res) => {
  try {
    const { upn } = req.query
    const { reservationId } = res.locals
    const reservationDetails = await reservationModel.cancelReservation(reservationId)
    const restaurantDetails = await restaurantModel.getRestaurant(reservationDetails.restaurant_id)
    const reservationDate = new Date(reservationDetails.dining_date)
    const year = reservationDate.getFullYear()
    const month = reservationDate.getMonth() + 1
    const day = reservationDate.getDate()
    const week = reservationDate.getDay()
    const days = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)']
    const dayOfWeek = days[week]
    const utcDiningTime = reservationDetails.dining_time
    const diningTimeInTaipei = moment.utc(utcDiningTime, 'HH:mm:ss').tz('Asia/Taipei')
    const formattedTime = diningTimeInTaipei.format('HH:mm')

    res.status(200).render('./client/cancelReservation', {
      restaurantName: restaurantDetails.name,
      restaurantPhone: reservationDetails.phone,
      restaurantAddress: restaurantDetails.address,
      customerName: reservationDetails.name,
      gender: reservationDetails.gender,
      diningDate: `${year}年${month}月${day}日`,
      dayOfWeek,
      diningTime: formattedTime,
      adult: reservationDetails.adult,
      child: reservationDetails.child,
      link: `${process.env.DOMAIN}/api/reservation/click?upn=${upn}`
    })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservations failed' })
  }
}

// for business
export const getReservations = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { date } = req.query
    const reservations = await reservationModel.getReservations(restaurantId, date)
    const formattedReservations = reservations.map((item) => ({
      ...item,
      dining_time: moment.utc(item.dining_time, 'HH:mm:ss').tz('Asia/Taipei').format('HH:mm')
    }))

    res.status(200).json({ data: formattedReservations })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservations failed' })
  }
}

// for business
export const cancelReservationByVendor = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.reservationId, 10)
    await reservationModel.cancelReservation(reservationId)

    res.status(200).json({ message: 'Cancel reservation successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Cancel reservation failed' })
  }
}

// for business
export const confirmReservation = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.reservationId, 10)
    const results = await reservationModel.confirmReservation(reservationId)
    if (results.length === 0) {
      throw new Error('Confirm reservation failed')
    }
    res.status(200).json({ message: 'Confirm reservation successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Confirm reservations failed' })
  }
}
