import schedule from 'node-schedule'
import amqp from 'amqplib'
import * as cronJob from '../utils/jobManager.js'
import queue from '../constants/queueConstants.js'

const scheduleDeleteExpiredBookingDateJob = async (restaurantId, ruleHour, ruleMinute) => {
  cronJob.cancelJob(`deleteExpiredBookingDateJob-${restaurantId}`)

  const rule = new schedule.RecurrenceRule()
  rule.hour = ruleHour
  rule.minute = ruleMinute
  rule.tz = 'Asia/Taipei'

  const jobName = `deleteExpiredBookingDateJob-${restaurantId}`
  const deleteExpiredBookingDateJob = schedule.scheduleJob(rule, async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
    const channel = await connection.createChannel()
    const queueName = queue.DELETE_EXPIRED_BOOKING_DATE_QUEUE
    await channel.assertQueue(queueName, { durable: true })
    const job = JSON.stringify(restaurantId)
    channel.sendToQueue(queueName, Buffer.from(job))
    console.log('Trigger worker to delete expired booking date')
  })

  cronJob.setJob(jobName, deleteExpiredBookingDateJob)
}

export default scheduleDeleteExpiredBookingDateJob
