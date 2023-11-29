import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from '@aws-sdk/client-eventbridge'
import moment from 'moment-timezone'

const eventbridgeClient = new EventBridgeClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: process.env.AWS_REGION
})

const scheduleRemindForDiningJob = async (restaurantId, diningReminderTimeInHHmm) => {
  const timeInUTC = moment
    .tz(diningReminderTimeInHHmm, 'HH:mm', 'Asia/Taipei')
    .utc()
    .format('HH:mm')
  const diningReminderRuleParams = {
    Name: `diningReminderRuleForRestaurant-${restaurantId}`,
    ScheduleExpression: `cron(${timeInUTC.substring(3, 5)} ${timeInUTC.substring(0, 2)} * * ? *)`,
    State: 'ENABLED'
  }
  await eventbridgeClient.send(new PutRuleCommand(diningReminderRuleParams))

  const targetParams = {
    Rule: `diningReminderRuleForRestaurant-${restaurantId}`,
    Targets: [
      {
        Id: `restaurantId-${restaurantId}`,
        Arn: 'arn:aws:sqs:ap-southeast-2:179428986360:outline-dining-reminder-queue',
        Input: JSON.stringify(restaurantId)
      }
    ]
  }
  await eventbridgeClient.send(new PutTargetsCommand(targetParams))
}

export default scheduleRemindForDiningJob
