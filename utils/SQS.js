import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand
} from '@aws-sdk/client-sqs'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })
console.log(process.env.AWS_ACCESS_KEY)
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
    WaitTimeSeconds: 20
  }

  try {
    const data = await sqsClint.send(new ReceiveMessageCommand(params))
    if (data.Messages && data.Messages.length > 0) {
      const message = data.Messages[0]
      const receiptHandle = message.ReceiptHandle
      const deleteMessageParams = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      }
      await sqsClint.send(new DeleteMessageCommand(deleteMessageParams))
      return message
    }
    return null
  } catch (err) {
    console.error(err.stack)
    throw err
  }
}
