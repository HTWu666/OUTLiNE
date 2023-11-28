import schedule from 'node-schedule'
import amqp from 'amqplib'
import * as cronJob from '../utils/jobManager.js'
import queue from '../constants/queueConstants.js'

const scheduleUpdateBookingDateJob = async (restaurantId, maxBookingDay, ruleHour, ruleMinute) => {
  cronJob.cancelJob(`updateBookingDate-${restaurantId}`)

  const rule = new schedule.RecurrenceRule()
  rule.hour = ruleHour
  rule.minute = ruleMinute
  rule.tz = 'Asia/Taipei'

  const jobName = `updateBookingDate-${restaurantId}`
  const updateBookingDateJob = schedule.scheduleJob(rule, async () => {
    // 把 job 放入 queue 中, 觸發 worker 1 更新
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
    const channel = await connection.createChannel()
    const queueName = queue.UPDATE_AVAILABLE_RESERVATION_DATE_QUEUE
    await channel.assertQueue(queueName, { durable: true })
    const job = JSON.stringify({ restaurantId, maxBookingDay })
    channel.sendToQueue(queueName, Buffer.from(job))
    console.log('Trigger worker to update available reservation date')
  })

  cronJob.setJob(jobName, updateBookingDateJob)
}

export default scheduleUpdateBookingDateJob
