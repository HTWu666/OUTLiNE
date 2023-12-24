import * as ruleModel from '../models/rule.js'
import scheduleUpdateBookingDateJob from '../jobs/updateBookingDateJob.js'
import pool from '../models/databasePool.js'
import * as adjustAvailableSeats from '../utils/adjustAvailableSeats.js'
import scheduleRemindForDiningJob from '../jobs/remindForDiningJob.js'
import scheduleDeleteExpiredBookingDateJob from '../jobs/deleteExpiredBookingDateJob.js'
import {
  createAvailableSeatsForPeriod,
  deleteAvailableSeatsForPeriod
} from '../models/availableSeat.js'

const validateRuleInput = (
  contentType,
  restaurantId,
  maxPersonPerGroup,
  minBookingDay,
  maxBookingDay,
  updateBookingTime
) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!restaurantId) {
    missingField = 'Restaurant Id as a query string'
  } else if (!maxPersonPerGroup) {
    missingField = 'Max person per group'
  } else if (!minBookingDay) {
    missingField = 'Min booking day'
  } else if (!maxBookingDay) {
    missingField = 'Max booking day'
  } else if (!updateBookingTime) {
    missingField = 'Update booking time'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  // verify data type
  if (typeof restaurantId !== 'number') {
    return { valid: false, error: 'Restaurant Id must be a number' }
  }
  if (typeof maxPersonPerGroup !== 'number') {
    return { valid: false, error: 'Max person per group must be a number' }
  }
  if (typeof minBookingDay !== 'number') {
    return { valid: false, error: 'Min booking day must be a number' }
  }
  if (typeof maxBookingDay !== 'number') {
    return { valid: false, error: 'Max booking day must be a number' }
  }

  // verify number
  if (restaurantId <= 0 || maxPersonPerGroup <= 0 || minBookingDay <= 0 || maxBookingDay <= 0) {
    return { valid: false, error: 'Number should be greater than 0' }
  }

  const updateBookingTimeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (!updateBookingTimeRegex.test(updateBookingTime)) {
    return { valid: false, error: 'Update booking time must be in the form of HH:MM' }
  }

  return { valid: true }
}

export const createRule = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTime } = req.body
    const validation = validateRuleInput(
      contentType,
      restaurantId,
      maxPersonPerGroup,
      minBookingDay,
      maxBookingDay,
      updateBookingTime
    )
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.error })
    }

    // create rule
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
    const deleteExpiredBookingTime = '18:24'
    await scheduleDeleteExpiredBookingDateJob(restaurantId, deleteExpiredBookingTime)

    res.status(200).json(ruleId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Create rule failed' })
  }
}

export const getRule = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const rule = await ruleModel.getRule(restaurantId)

    res.status(200).json({ data: rule })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get rule failed' })
  }
}

export const updateRule = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTime } = req.body
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const validation = validateRuleInput(
      contentType,
      restaurantId,
      maxPersonPerGroup,
      minBookingDay,
      maxBookingDay,
      updateBookingTime
    )
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.error })
    }

    const connection = await pool.connect()
    try {
      const oldRule = await ruleModel.getRule(restaurantId)
      await ruleModel.updateRule(
        restaurantId,
        maxPersonPerGroup,
        minBookingDay,
        maxBookingDay,
        updateBookingTime,
        connection
      )
      const newRule = await ruleModel.getRule(restaurantId)

      // 調大最大可訂位天數, 新增可訂位時間, call adjustAvailableSeats.create
      if (newRule.max_booking_day - oldRule.max_booking_day > 0) {
        const startDateObj = new Date()
        startDateObj.setDate(startDateObj.getDate() + oldRule.max_booking_day + 1)
        const startDate = startDateObj.toISOString().split('T')[0]

        const endDateObj = new Date()
        endDateObj.setDate(endDateObj.getDate() + newRule.max_booking_day)
        const endDate = endDateObj.toISOString().split('T')[0]

        createAvailableSeatsForPeriod(restaurantId, startDate, endDate)
      }

      // 調小最大可訂位天數, 刪除可訂位時間, call adjustAvailableSeats.delete
      if (newRule.max_booking_day - oldRule.max_booking_day < 0) {
        const startDateObj = new Date()
        startDateObj.setDate(startDateObj.getDate() + newRule.max_booking_day + 1)
        const startDate = startDateObj.toISOString().split('T')[0]

        const endDateObj = new Date()
        endDateObj.setDate(endDateObj.getDate() + oldRule.max_booking_day)
        const endDate = endDateObj.toISOString().split('T')[0]

        deleteAvailableSeatsForPeriod(restaurantId, startDate, endDate)
      }
      // 調大最小可訂位天數, 刪除可訂位時間, call adjustAvailableSeats.delete
      if (newRule.min_booking_day - oldRule.min_booking_day > 0) {
        const startDateObj = new Date()
        startDateObj.setDate(startDateObj.getDate() + oldRule.min_booking_day)
        const startDate = startDateObj.toISOString().split('T')[0]

        const endDateObj = new Date()
        endDateObj.setDate(endDateObj.getDate() + newRule.min_booking_day - 1)
        const endDate = endDateObj.toISOString().split('T')[0]

        deleteAvailableSeatsForPeriod(restaurantId, startDate, endDate)
      }

      // 調小最小可訂位天數, 新增可訂位時間, call adjustAvailableSeats.create
      if (newRule.min_booking_day - oldRule.min_booking_day < 0) {
        const startDateObj = new Date()
        startDateObj.setDate(startDateObj.getDate() + newRule.min_booking_day)
        const startDate = startDateObj.toISOString().split('T')[0]

        const endDateObj = new Date()
        endDateObj.setDate(endDateObj.getDate() + oldRule.min_booking_day - 1)
        const endDate = endDateObj.toISOString().split('T')[0]

        createAvailableSeatsForPeriod(restaurantId, startDate, endDate)
      }

      await scheduleUpdateBookingDateJob(restaurantId, maxBookingDay, updateBookingTime)

      await connection.query('COMMIT')

      res.status(200).json({ message: 'Update rule successfully' })
    } catch (err) {
      await connection.query('ROLLBACK')
      throw err
    } finally {
      connection.release()
    }
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get rule failed' })
  }
}
