import schedule from 'node-schedule'
import amqp from 'amqplib'
import * as cronJob from '../utils/jobManager.js'
import queue from '../constants/queueConstants.js'

const scheduleRemindForDiningJob = async (restaurantId, ruleHour, ruleMinute) => {
  cronJob.cancelJob(`remindForDining-${restaurantId}`)

  const rule = new schedule.RecurrenceRule()
  rule.hour = ruleHour
  rule.minute = ruleMinute
  rule.tz = 'Asia/Taipei'

  const jobName = `remindForDining-${restaurantId}`
  const remindForDiningJob = schedule.scheduleJob(rule, async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
    const channel = await connection.createChannel()
    const queueName = queue.REMIND_FOR_DINING
    await channel.assertQueue(queueName, { durable: true })
    const job = JSON.stringify(restaurantId)
    channel.sendToQueue(queueName, Buffer.from(job))
    console.log('Trigger worker to send reminder for reservation')
  })

  cronJob.setJob(jobName, remindForDiningJob)
}

export default scheduleRemindForDiningJob
