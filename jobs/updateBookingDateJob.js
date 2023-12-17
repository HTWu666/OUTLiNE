import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from '@aws-sdk/client-eventbridge'
import moment from 'moment-timezone'

const eventbridgeClient = new EventBridgeClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: process.env.AWS_REGION
})

const scheduleUpdateBookingDateJob = async (
  restaurantId,
  maxBookingDay,
  updateBookingTimeInHHmm
) => {
  const timeInUTC = moment.tz(updateBookingTimeInHHmm, 'HH:mm', 'Asia/Taipei').utc().format('HH:mm')
  const updateBookingDateRuleParams = {
    Name: `updateBookingDateRuleForRestaurant-${restaurantId}`,
    ScheduleExpression: `cron(${timeInUTC.substring(3, 5)} ${timeInUTC.substring(0, 2)} * * ? *)`,
    State: 'ENABLED'
  }
  await eventbridgeClient.send(new PutRuleCommand(updateBookingDateRuleParams))

  const targetParams = {
    Rule: `updateBookingDateRuleForRestaurant-${restaurantId}`,
    Targets: [
      {
        Id: `restaurantId-${restaurantId}`,
        Arn: 'arn:aws:lambda:ap-southeast-2:179428986360:function:updateAvailableReservationDate',
        Input: JSON.stringify({
          restaurantId,
          maxBookingDay
        })
      }
    ]
  }
  await eventbridgeClient.send(new PutTargetsCommand(targetParams))
}

export default scheduleUpdateBookingDateJob
