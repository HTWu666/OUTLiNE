import * as ruleModel from '../models/rule.js'
import scheduleUpdateBookingDateJob from '../jobs/updateBookingDateJob.js'
import pool from '../models/databasePool.js'
import {
  createAvailableSeatsForPeriod,
  deleteAvailableSeatsForPeriod
} from '../models/availableSeat.js'

export const getRule = async (req, res) => {
  try {
    const { restaurantId } = req.params
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
    const { maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTime } = req.body
    const { restaurantId } = req.params

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
