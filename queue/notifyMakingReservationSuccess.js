import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import ejs from 'ejs'
import moment from 'moment-timezone'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import * as SQS from '../utils/SQS.js'

dotenv.config({ path: '../.env' })

const { Pool } = pg
const pool = new Pool({
  user: process.env.POSTGRE_USER,
  host: process.env.POSTGRE_HOST,
  database: process.env.POSTGRE_DATABASE,
  password: process.env.POSTGRE_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

const sendMakingReservationSuccessfullyMail = async (
  restaurantId,
  adult,
  child,
  diningDate,
  utcDiningTime,
  name,
  gender,
  email,
  upn
) => {
  const reservationDate = new Date(diningDate)
  const month = reservationDate.getMonth() + 1
  const day = reservationDate.getDate()
  const week = reservationDate.getDay()
  const days = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)']
  const dayOfWeek = days[week]
  const diningTimeInTaipei = moment.utc(utcDiningTime, 'HH:mm:ss').tz('Asia/Taipei')
  const formattedTime = diningTimeInTaipei.format('HH:mm')
  const person = adult + child
  const { rows: restaurantDetails } = await pool.query(
    `
    SELECT * FROM restaurants
    WHERE id = $1
    `,
    [restaurantId]
  )

  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const emailTemplatePath = path.join(dirname, '../views/email/makingReservationSuccessMail.html')
  const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8')
  const emailContent = ejs.render(emailTemplate, {
    restaurantName: restaurantDetails[0].name,
    customerName: name,
    gender,
    diningDate: `${month}月${day}日`,
    dayOfWeek,
    diningTime: formattedTime,
    adult,
    child,
    link: `${process.env.DOMAIN}/reservation/click?upn=${upn}`
  })

  const mailOptions = {
    from: process.env.MAILGUN_SENDMAIL_FROM,
    to: email,
    subject: `您在 ${restaurantDetails[0].name} 預訂 ${month}月${day}日${dayOfWeek} ${formattedTime} ${person}人`,
    html: emailContent
  }

  const info = await transporter.sendMail(mailOptions)
  console.log({ info })
}

const NOTIFY_MAKING_RESERVATION_SUCCESSFULLY_SQS_QUEUE_URL =
  'https://sqs.ap-southeast-2.amazonaws.com/179428986360/outline-notify-making-reservation-success-queue'

// 寄成功訂位通知信
const worker = async () => {
  try {
    console.log(
      '[*] Waiting for messages in notifyMakingReservationSuccessQueue. To exit press CTRL+C'
    )

    while (true) {
      const message = await SQS.receiveMessage(NOTIFY_MAKING_RESERVATION_SUCCESSFULLY_SQS_QUEUE_URL)
      if (message) {
        const {
          restaurantId,
          reservationId,
          adult,
          child,
          diningDate,
          diningTime,
          name,
          gender,
          email,
          upn
        } = JSON.parse(message.Body)
        await sendMakingReservationSuccessfullyMail(
          restaurantId,
          adult,
          child,
          diningDate,
          diningTime,
          name,
          gender,
          email,
          upn
        )
        console.log(
          `Successfully send the successfully making reservation mail for reservation Id: ${reservationId}`
        )
      }
    }
  } catch (err) {
    console.error(err)
  }
}

worker()
