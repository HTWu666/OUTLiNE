import schedule from 'node-schedule'
import amqp from 'amqplib'
import * as ruleModel from '../models/rule.js'
import updateBookingTimeJob from '../utils/updateBookingDateJob.js'
import queue from '../constants/queueConstants.js'
import * as restaurantModel from '../models/restaurant.js'

// 只有 outline admin 可新增規則 (初始化), 業者只能更新規則
export const createRule = async (req, res) => {
  try {
    const { restaurantId } = req.query
    const { maxPersonPerGroup, minBookingDay, maxBookingDay, updateBookingTime } = req.body

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
    rule.hour = parts[0]
    rule.minute = parts[1]
    rule.tz = 'Asia/Taipei'
    updateBookingTimeJob.setJob(
      schedule.scheduleJob(rule, async () => {
        // 把 job 放入 queue 中, 觸發 worker 1 更新
        const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
        const channel = await connection.createChannel()
        const queueName = queue.UPDATE_AVAILABLE_RESERVATION_DATE_QUEUE
        await channel.assertQueue(queueName, { durable: true })
        const job = JSON.stringify({ restaurantId, maxBookingDay })
        channel.sendToQueue(queueName, Buffer.from(job))
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
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get rule failed' })
  }
}
