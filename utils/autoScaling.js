import dotenv from 'dotenv'
import {
  AutoScalingClient,
  DescribeScheduledActionsCommand,
  PutScheduledUpdateGroupActionCommand,
  DeleteScheduledActionCommand
} from '@aws-sdk/client-auto-scaling'

dotenv.config()

const autoScalingClient = new AutoScalingClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: process.env.AWS_REGION
})

const getScheduledAction = async (scheduledUTCHour, scheduledUTCMinute) => {
  const command = new DescribeScheduledActionsCommand({
    AutoScalingGroupName: process.env.AWS_ASG_NAME,
    ScheduledActionName: `scaleup-action-${scheduledUTCHour}-${scheduledUTCMinute}`
  })

  try {
    const response = await autoScalingClient.send(command)
    console.log(222)
    console.log(response)
    const matchedAction = response.ScheduledUpdateGroupActions[0]
    console.log(matchedAction)
    return matchedAction ?? null
  } catch (err) {
    console.error(err)
    throw err
  }
}

const scheduleAutoScaling = async (
  scaleUpUTCHour,
  scaleUpUTCMinute,
  desiredCapacity,
  increaseCapacity
) => {
  const scaleUpTime = new Date()
  scaleUpTime.setUTCHours(scaleUpUTCHour, scaleUpUTCMinute, 0, 0)
  const warmUpTime = new Date(scaleUpTime)
  warmUpTime.setUTCMinutes(warmUpTime.getUTCMinutes() - 5)
  const scaleDownTime = new Date(scaleUpTime)
  scaleDownTime.setUTCMinutes(scaleDownTime.getUTCMinutes() + 5)

  const scaleUpParams = {
    AutoScalingGroupName: process.env.AWS_ASG_NAME,
    ScheduledActionName: `scaleup-action-${scaleUpTime.getUTCHours()}-${scaleUpTime.getUTCMinutes()}`,
    Recurrence: `${warmUpTime.getUTCMinutes()} ${warmUpTime.getUTCHours()} * * *`,
    DesiredCapacity: desiredCapacity + increaseCapacity
  }

  const scaleDownParams = {
    AutoScalingGroupName: process.env.AWS_ASG_NAME,
    ScheduledActionName: `scaledown-action-${scaleUpTime.getUTCHours()}-${scaleUpTime.getUTCMinutes()}`,
    Recurrence: `${scaleDownTime.getUTCMinutes()} ${scaleDownTime.getUTCHours()} * * *`,
    DesiredCapacity: 1
  }

  const commandUp = new PutScheduledUpdateGroupActionCommand(scaleUpParams)
  const commandDown = new PutScheduledUpdateGroupActionCommand(scaleDownParams)

  try {
    const responseUp = await autoScalingClient.send(commandUp)
    console.log('Scale Up Scheduled Successfully', responseUp)

    const responseDown = await autoScalingClient.send(commandDown)
    console.log('Scale Down Scheduled Successfully', responseDown)
  } catch (error) {
    console.error('Error scheduling auto scaling', error)
  }
}

export const updateAutoScalingSchedule = async (scaleUpUTCHour, scaleUpUTCMinute) => {
  try {
    const action = await getScheduledAction(scaleUpUTCHour, scaleUpUTCMinute)
    if (action) {
      await scheduleAutoScaling(scaleUpUTCHour, scaleUpUTCMinute, action.DesiredCapacity, 1)
    } else {
      await scheduleAutoScaling(scaleUpUTCHour, scaleUpUTCMinute, 1, 0)
    }
  } catch (err) {
    console.error(err)
    throw err
  }
}

export const deleteAutoScalingSchedule = async (scaleUpUTCHour, scaleUpUTCMinute) => {
  try {
    const scaleUpTime = new Date()
    scaleUpTime.setUTCHours(scaleUpUTCHour, scaleUpUTCMinute, 0, 0)
    const command = new DeleteScheduledActionCommand({
      AutoScalingGroupName: process.env.AWS_ASG_NAME,
      ScheduledActionName: `scaleup-action-${scaleUpTime.getUTCHours()}-${scaleUpTime.getUTCMinutes()}`
    })
    const response = await autoScalingClient.send(command)
    console.log('Scheduled Action Deleted Successfully', response)
  } catch (err) {
    console.error(err)
    throw err
  }
}

// action = {
//   "AutoScalingGroupName": "example-auto-scaling-group",
//   "ScheduledActionName": "example-scheduled-action",
//   "Recurrence": "30 8 * * *",
//   "MinSize": 1,
//   "MaxSize": 3,
//   "DesiredCapacity": 2,
//   "StartTime": "2023-01-01T08:30:00Z",
//   "EndTime": "2023-01-01T09:30:00Z"
// }
