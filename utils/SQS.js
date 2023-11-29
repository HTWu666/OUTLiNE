import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs'
import dotenv from 'dotenv'

dotenv.config()

const sqsClint = new SQSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: 'ap-southeast-2'
})

export const sendMessage = async (queueUrl, messageBody) => {
  const params = {
    QueueUrl: queueUrl,
    MessageBody: messageBody
  }

  try {
    const data = await sqsClint.send(new SendMessageCommand(params))
    console.log(`Success, message sent. Message ID: d${data.MessageId}`)
    return data
  } catch (err) {
    console.error(err.stack)
    throw err
  }
}

export const receiveMessage = async (queueUrl) => {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10
  }

  try {
    const data = await sqsClint.send(new ReceiveMessageCommand(params))
    if (data.Messages && data.Messages.length > 0) {
      return data.Messages[0]
    }
    return null
  } catch (err) {
    console.error(err.stack)
    throw err
  }
}
