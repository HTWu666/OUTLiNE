import moment from 'moment-timezone'
import * as reservationModel from '../models/reservation.js'
import * as restaurantModel from '../models/restaurant.js'
import * as ruleModel from '../models/rule.js'

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
  maxPersonPerReserve
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
  if (person > maxPersonPerReserve) {
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

export const createReservation = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { adult, child, diningDate, diningTime, name, gender, phone, email, purpose, note } =
      req.body
    const restaurantId = parseInt(req.params.id, 10)
    const results = await ruleModel.getRule(restaurantId)
    const maxPersonPerReserve = results[0].max_person_per_group
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
      maxPersonPerReserve
    )

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

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

    res.status(200).json(reservationId)
  } catch (err) {
    console.error(err)

    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }

    res.status(500).json({ error: 'Create reservation failed' })
  }
}

export const getReservations = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurantId = await restaurantModel.findRestaurantByUserId(userId)
    const { date } = req.query
    const reservations = await reservationModel.getReservations(restaurantId, date)

    res.status(200).json({ data: reservations })
  } catch (err) {
    console.error(err)

    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }

    res.status(500).json({ error: 'Get reservations failed' })
  }
}
