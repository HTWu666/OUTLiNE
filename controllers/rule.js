import schedule from 'node-schedule'
import amqp from 'amqplib'
import * as ruleModel from '../models/rule.js'
import * as updateBookingDateJob from '../utils/updateBookingDateJob.js'
import queue from '../constants/queueConstants.js'
import * as restaurantModel from '../models/restaurant.js'

const validateCreateRule = (
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

  const updateBookingTimeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (!updateBookingTimeRegex.test(updateBookingTime)) {
    return { valid: false, error: 'Update booking time must be in the form of HH:MM' }
  }

  return { valid: true }
}

// 只有 outline admin 可新增規則 (初始化), 業者只能更新規則
export const createRule = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const restaurantId = parseInt(req.query.restaurantId, 10)
    const { maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTime } = req.body
    const validation = validateCreateRule(
      contentType,
      restaurantId,
      maxPersonPerGroup,
      minBookingDay,
      maxBookingDay,
      updateBookingTime
    )
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // create rule
    const ruleId = await ruleModel.createRule(
      restaurantId,
      maxPersonPerGroup,
      minBookingDay,
      maxBookingDay,
      updateBookingTime
    )
    const parts = updateBookingTime.split(':')

    // 設定 cron job, 叫 worker 更新可訂位的日期
    const rule = new schedule.RecurrenceRule()
    const [hour, minute] = parts
    rule.hour = parseInt(hour, 10)
    rule.minute = parseInt(minute, 10)
    rule.tz = 'Asia/Taipei'

    updateBookingDateJob.setJob(
      schedule.scheduleJob(rule, async () => {
        // 把 job 放入 queue 中, 觸發 worker 1 更新
        const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
        const channel = await connection.createChannel()
        const queueName = queue.UPDATE_AVAILABLE_RESERVATION_DATE_QUEUE
        await channel.assertQueue(queueName, { durable: true })
        const job = JSON.stringify({ restaurantId, maxBookingDay })
        channel.sendToQueue(queueName, Buffer.from(job))
        console.log('Trigger worker to update available reservation date')
      })
    )

    res.status(200).json(ruleId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Create rule failed' })
  }
}

export const getRule = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurantId = await restaurantModel.findRestaurantByUserId(userId)
    const rule = await ruleModel.getRule(restaurantId)

    res.status(200).json({ data: rule })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get rule failed' })
  }
}

const validateUpdateRule = (
  contentType,
  maxPersonPerGroup,
  minBookingDay,
  maxBookingDay,
  updateBookingTime
) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  // verify data type
  if (maxPersonPerGroup && typeof maxPersonPerGroup !== 'number') {
    return { valid: false, error: 'Max person per group must be a number' }
  }
  if (minBookingDay && typeof minBookingDay !== 'number') {
    return { valid: false, error: 'Min booking day must be a number' }
  }
  if (maxBookingDay && typeof maxBookingDay !== 'number') {
    return { valid: false, error: 'Max booking day must be a number' }
  }

  const updateBookingTimeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (updateBookingTime && !updateBookingTimeRegex.test(updateBookingTime)) {
    return { valid: false, error: 'Update booking time must be in the form of HH:MM' }
  }

  return { valid: true }
}

export const updateRule = async (req, res) => {
  try {
    const { userId } = res.locals
    const contentType = req.headers['content-type']
    const { maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTime } = req.body
    const validation = validateUpdateRule(
      contentType,
      maxPersonPerGroup,
      minBookingDay,
      maxBookingDay,
      updateBookingTime
    )
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }
    const restaurantId = await restaurantModel.findRestaurantByUserId(userId)
    const rule = await ruleModel.updateRule(
      restaurantId,
      maxPersonPerGroup,
      minBookingDay,
      maxBookingDay,
      updateBookingTime
    )

    res.status(200).json(rule)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get rule failed' })
  }
}
