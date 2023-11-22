import moment from 'moment-timezone'
import amqp from 'amqplib'
import path from 'path'
import fs from 'fs'
import ejs from 'ejs'
import { fileURLToPath } from 'url'
import * as reservationModel from '../models/reservation.js'
import * as restaurantModel from '../models/restaurant.js'
import * as ruleModel from '../models/rule.js'
import queue from '../constants/queueConstants.js'

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
  restaurantId,
  maxPersonPerGroup
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

  const person = adult + child
  if (person > maxPersonPerGroup) {
    return { valid: false, error: 'Exceed the limit of max person per reservation' }
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
  if (typeof phone !== 'string') {
    return { valid: false, error: 'Phone must be a string' }
  }
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  if (!['生日', '家庭聚餐', '情人約會', '結婚紀念', '朋友聚餐', '商務聚餐'].includes(purpose)) {
    return { valid: false, error: 'Purpose is wrong' }
  }

  if (note && typeof note !== 'string') {
    return { valid: false, error: 'Note must be a string' }
  }

  return { valid: true }
}

// for customer
export const createReservationByCustomer = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { adult, child, diningDate, diningTime, name, gender, phone, email, purpose, note } =
      req.body

    const restaurantId = parseInt(req.params.id, 10)
    const results = await ruleModel.getRule(restaurantId)
    const maxPersonPerGroup = results[0].max_person_per_group

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
      restaurantId,
      maxPersonPerGroup
    )
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // create reservation
    const timezone = 'Asia/Taipei'
    const utcDiningTime = moment.tz(diningTime, 'HH:mm', timezone).utc().format('HH:mm:ss')
    const reservationId = await reservationModel.createReservation(
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
      note
    )

    // 預約成功時, 將訂位成功的信件丟給 worker 寄
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
    const channel = await connection.createChannel()
    const queueName = queue.NOTIFY_MAKING_RESERVATION_SUCCESSFULLY_QUEUE
    await channel.assertQueue(queueName, { durable: true })
    const job = JSON.stringify(reservationId) // woker 根據 reservation Id 到資料庫撈資料寄信
    channel.sendToQueue(queueName, Buffer.from(job))

    res.status(200).json(reservationId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Create reservation failed' })
  }
}

// for customer
export const getReservation = async (req, res) => {
  try {
    const { upn } = req.query
    const { reservationId } = res.locals
    const reservationDetails = await reservationModel.getReservation(reservationId)
    const restaurantDetails = await restaurantModel.getRestaurant(
      reservationDetails[0].restaurant_id
    )
    const reservationDate = new Date(reservationDetails[0].dining_date)
    const year = reservationDate.getFullYear()
    const month = reservationDate.getMonth() + 1
    const day = reservationDate.getDate()
    const week = reservationDate.getDay()
    const days = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)']
    const dayOfWeek = days[week]
    const utcDiningTime = reservationDetails[0].dining_time
    const diningTimeInTaipei = moment.utc(utcDiningTime, 'HH:mm:ss').tz('Asia/Taipei')
    const formattedTime = diningTimeInTaipei.format('HH:mm')
    const reservationStatus = reservationDetails[0].status

    if (reservationStatus === 'canceled') {
      return res.status(200).render('./client/cancelReservation', {
        restaurantName: restaurantDetails[0].name,
        restaurantPhone: reservationDetails[0].phone,
        restaurantAddress: restaurantDetails[0].address,
        customerName: reservationDetails[0].name,
        gender: reservationDetails[0].gender,
        diningDate: `${year}年${month}月${day}日`,
        dayOfWeek,
        diningTime: formattedTime,
        adult: reservationDetails[0].adult,
        child: reservationDetails[0].child,
        link: `${process.env.DOMAIN}/api/reservation?upn=${upn}`
      })
    }

    res.status(200).render('./client/getReservation', {
      restaurantName: restaurantDetails[0].name,
      restaurantPhone: restaurantDetails[0].phone,
      restaurantAddress: restaurantDetails[0].address,
      customerName: reservationDetails[0].name,
      gender: reservationDetails[0].gender,
      diningDate: `${year}年${month}月${day}日`,
      dayOfWeek,
      diningTime: formattedTime,
      adult: reservationDetails[0].adult,
      child: reservationDetails[0].child,
      link: `${process.env.DOMAIN}/api/reservation?upn=${upn}`
    })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservations failed' })
  }
}

// for customer
export const cancelReservationByCustomer = async (req, res) => {
  try {
    const { upn } = req.query
    const { reservationId } = res.locals
    const reservationDetails = await reservationModel.cancelReservation(reservationId)
    const restaurantDetails = await restaurantModel.getRestaurant(
      reservationDetails[0].restaurant_id
    )
    const reservationDate = new Date(reservationDetails[0].dining_date)
    const year = reservationDate.getFullYear()
    const month = reservationDate.getMonth() + 1
    const day = reservationDate.getDate()
    const week = reservationDate.getDay()
    const days = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)']
    const dayOfWeek = days[week]
    const utcDiningTime = reservationDetails[0].dining_time
    const diningTimeInTaipei = moment.utc(utcDiningTime, 'HH:mm:ss').tz('Asia/Taipei')
    const formattedTime = diningTimeInTaipei.format('HH:mm')

    res.status(200).render('./client/cancelReservation', {
      restaurantName: restaurantDetails[0].name,
      restaurantPhone: reservationDetails[0].phone,
      restaurantAddress: restaurantDetails[0].address,
      customerName: reservationDetails[0].name,
      gender: reservationDetails[0].gender,
      diningDate: `${year}年${month}月${day}日`,
      dayOfWeek,
      diningTime: formattedTime,
      adult: reservationDetails[0].adult,
      child: reservationDetails[0].child,
      link: `${process.env.DOMAIN}/api/reservation?upn=${upn}`
    })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservations failed' })
  }
}

// for business
export const createReservationByVendor = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurantId = parseInt(await restaurantModel.findRestaurantByUserId(userId), 10)
    const contentType = req.headers['content-type']
    const { adult, child, diningDate, diningTime, name, gender, phone, email, purpose, note } =
      req.body
    const results = await ruleModel.getRule(restaurantId)
    const maxPersonPerGroup = results[0].max_person_per_group

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
      restaurantId,
      maxPersonPerGroup
    )
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // create reservation
    const timezone = 'Asia/Taipei'
    const utcDiningTime = moment.tz(diningTime, 'HH:mm', timezone).utc().format('HH:mm:ss')
    const reservationId = await reservationModel.createReservation(
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
      note
    )

    // 預約成功時, 將訂位成功的信件丟給 worker 寄
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
    const channel = await connection.createChannel()
    const queueName = queue.NOTIFY_MAKING_RESERVATION_SUCCESSFULLY_QUEUE
    await channel.assertQueue(queueName, { durable: true })
    const job = JSON.stringify(reservationId) // woker 根據 reservation Id 到資料庫撈資料寄信
    channel.sendToQueue(queueName, Buffer.from(job))

    res.status(200).json(reservationId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservations failed' })
  }
}

// for business
export const getReservations = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurantId = await restaurantModel.findRestaurantByUserId(userId)
    const { date } = req.query
    const reservations = await reservationModel.getReservations(restaurantId, date)
    const formattedReservations = reservations.map((item) => ({
      ...item,
      dining_time: moment.utc(item.dining_time, 'HH:mm:ss').tz('Asia/Taipei').format('HH:mm')
    }))

    res.status(200).json({ data: formattedReservations })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservations failed' })
  }
}

export const cancelReservationByVendor = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10)
    await reservationModel.cancelReservation(reservationId)

    res.status(200).json({ message: 'Cancel reservation successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Cancel reservation failed' })
  }
}

export const confirmReservation = async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id, 10)
    const results = await reservationModel.confirmReservation(reservationId)
    if (results.length === 0) {
      throw new Error('Confirm reservation failed')
    }
    res.status(200).json({ message: 'Confirm reservation successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Confirm reservations failed' })
  }
}
