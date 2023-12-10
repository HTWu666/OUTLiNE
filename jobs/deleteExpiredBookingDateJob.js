import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from '@aws-sdk/client-eventbridge'
import moment from 'moment-timezone'

const eventbridgeClient = new EventBridgeClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: process.env.AWS_REGION
})

const scheduleDeleteExpiredBookingDateJob = async (restaurantId, deleteTimeInHHmm) => {
  const timeInUTC = moment.tz(deleteTimeInHHmm, 'HH:mm', 'Asia/Taipei').utc().format('HH:mm')
  const deleteExpiredBookingDateRuleParams = {
    Name: `deleteExpiredBookingRuleForRestaurant-${restaurantId}`,
    ScheduleExpression: `cron(${timeInUTC.substring(3, 5)} ${timeInUTC.substring(0, 2)} * * ? *)`,
    State: 'ENABLED'
  }
  await eventbridgeClient.send(new PutRuleCommand(deleteExpiredBookingDateRuleParams))
  const targetParams = {
    Rule: `deleteExpiredBookingRuleForRestaurant-${restaurantId}`,
    Targets: [
      {
        Id: `restaurantId-${restaurantId}`,
        Arn: 'arn:aws:lambda:ap-southeast-2:179428986360:function:deleteExpiredBookingDate',
        Input: JSON.stringify({ restaurantId })
      }
    ]
  }
  await eventbridgeClient.send(new PutTargetsCommand(targetParams))
}

export default scheduleDeleteExpiredBookingDateJob
