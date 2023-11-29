import { LexRuntimeV2Client, RecognizeTextCommand } from '@aws-sdk/client-lex-runtime-v2'
import { v4 as uuidv4 } from 'uuid'

// 需要加上 restaurantId 的資訊給 lex
const chatBot = async (req, res) => {
  try {
    const { userInput } = req.body
    const client = new LexRuntimeV2Client({
      region: 'ap-southeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
      }
    })
    const sessionId = uuidv4()
    const sessionAttributes = {
      restaurantId: req.params.restaurantId
    }
    const params = {
      botId: 'EUMJUSI4PU',
      botAliasId: 'TSTALIASID',
      localeId: 'zh_CN',
      sessionId,
      text: userInput,
      sessionState: {
        sessionAttributes
      }
    }

    const command = new RecognizeTextCommand(params)
    const response = await client.send(command)

    res.status(200).json({ message: response.messages[0].content })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Chat bot failed' })
  }
}

export default chatBot
