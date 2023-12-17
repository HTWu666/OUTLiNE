import moment from 'moment-timezone'
import * as ruleModel from '../models/rule.js'
import scheduleUpdateBookingDateJob from '../jobs/updateBookingDateJob.js'
import scheduleRemindForDiningJob from '../jobs/remindForDiningJob.js'
import scheduleDeleteExpiredBookingDateJob from '../jobs/deleteExpiredBookingDateJob.js'
import * as restaurantModel from '../models/restaurant.js'
import * as roleModel from '../models/role.js'
import { updateAutoScalingSchedule } from '../utils/autoScaling.js'

const validateCreateRestaurant = (name, address, phone) => {
  let missingField = ''
  if (!name) {
    missingField = 'Name'
  } else if (!address) {
    missingField = 'Address'
  } else if (!phone) {
    missingField = 'Phone'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  return { valid: true }
}

export const createRestaurant = async (req, res) => {
  try {
    const { userId } = res.locals
    const contentType = req.headers['content-type']
    const {
      name,
      address,
      phone,
      parking,
      payment,
      'kids-chair': kidChair,
      'vegetarian-option': vegetarian
    } = req.body
    const pictureUrl = `${req.file.filename}`

    // validate
    const validation = validateCreateRestaurant(
      name,
      address,
      phone,
      parking,
      payment,
      kidChair,
      vegetarian,
      pictureUrl
    )
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // create restaurant
    const restaurantId = await restaurantModel.createRestaurant(
      userId,
      name,
      address,
      phone,
      parking,
      payment,
      kidChair,
      vegetarian,
      pictureUrl
    )

    // initial setting of roles
    const userRoleId = await roleModel.initializeRole(userId, restaurantId)

    // initial setting of rules
    const maxPersonPerGroup = 8
    const minBookingDay = 1
    const maxBookingDay = 30
    const updateBookingTime = '18:32'
    const ruleId = await ruleModel.createRule(
      restaurantId,
      maxPersonPerGroup,
      minBookingDay,
      maxBookingDay,
      updateBookingTime
    )

    // set cron job for updating available seat
    await scheduleUpdateBookingDateJob(restaurantId, maxBookingDay, updateBookingTime)

    // set cron job for the dining reminder
    const diningReminderTimeInHHmm = '20:00'
    await scheduleRemindForDiningJob(restaurantId, diningReminderTimeInHHmm)

    // set cron job for deleting expired booking date
    const deleteExpiredBookingTime = '22:00'
    await scheduleDeleteExpiredBookingDateJob(restaurantId, deleteExpiredBookingTime)

    // set autoScaling schedule
    if (process.env.SERVER_STATUS === 'production') {
      const updateBookingTimeInUTC = moment
        .tz(updateBookingTime, 'HH:mm', 'Asia/Taipei')
        .utc()
        .format('HH:mm')
      const parts = updateBookingTimeInUTC.split(':')
      await updateAutoScalingSchedule(parts[0], parts[1])
    }

    res.status(200).json({ restaurantId, userRoleId, ruleId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Create restaurant failed' })
  }
}

export const joinRestaurant = async (req, res) => {
  try {
    const { userId } = res.locals
    const { restaurantId } = req.body
    const userRoleId = await roleModel.createRole(userId, restaurantId)

    res.status(200).json(userRoleId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Join restaurant failed' })
  }
}

export const deleteRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params
    await restaurantModel.deleteRestaurant(restaurantId)

    res.status(200).json({ message: 'Delete restaurant successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Delete restaurant failed' })
  }
}
