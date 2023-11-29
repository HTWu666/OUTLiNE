import pg from 'pg'
import dotenv from 'dotenv'
import amqp from 'amqplib'
import fs from 'fs'
import ejs from 'ejs'
import moment from 'moment-timezone'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

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
  host: process.env.MAILGUN_HOST,
  port: 587,
  auth: {
    user: process.env.MAILGUN_AUTH_USER,
    pass: process.env.MAILGUN_AUTH_PASS
  }
})

const REMIND_FOR_DINING = 'remindForDining'

const sendReminderForDiningMail = async (restaurantId) => {
  // 只要是明天用餐的就要寄信
  const today = new Date()
  today.setDate(today.getDate() + 1)
  const tomorrow = today.toISOString().split('T')[0]

  const { rows: reservations } = await pool.query(
    `
    SELECT * FROM reservations
    WHERE restaurant_id = $1
        AND dining_date = $2
        AND status != 'canceled'
    `,
    [restaurantId, tomorrow]
  )

  const { rows: restaurantDetails } = await pool.query(
    `
    SELECT * FROM restaurants
    WHERE id = $1
    `,
    [restaurantId]
  )

  reservations.forEach(async (reservation) => {
    const reservationDate = new Date(reservation.dining_date)
    const month = reservationDate.getMonth() + 1
    const day = reservationDate.getDate()
    const week = reservationDate.getDay()
    const days = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)']
    const dayOfWeek = days[week]
    const utcDiningTime = reservation.dining_time
    const diningTimeInTaipei = moment.utc(utcDiningTime, 'HH:mm:ss').tz('Asia/Taipei')
    const formattedTime = diningTimeInTaipei.format('HH:mm')
    const person = parseInt(reservation.adult, 10) + parseInt(reservation.child, 10)
    const { upn } = reservation

    const dirname = path.dirname(fileURLToPath(import.meta.url))
    const emailTemplatePath = path.join(dirname, '../views/email/reminderForDining.html')
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8')
    const emailContent = ejs.render(emailTemplate, {
      restaurantName: restaurantDetails.name,
      customerName: reservation.name,
      gender: reservation.gender,
      diningDate: `${month}月${day}日`,
      dayOfWeek,
      diningTime: formattedTime,
      adult: reservation.adult,
      child: reservation.child,
      link: `${process.env.DOMAIN}/api/reservation?upn=${upn}`
    })

    const info = await transporter.sendMail({
      from: process.env.MAILGUN_SENDMAIL_FROM,
      to: reservation.email,
      subject: `提醒您明天在 ${restaurantDetails.name} ${formattedTime} ${person}人 用餐`,
      html: emailContent
    })
    console.log({ info })
  })
}

// 寄成功訂位通知信
const worker = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER)
    const channel = await connection.createChannel()
    const queueName = REMIND_FOR_DINING

    console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queueName)

    await channel.consume(
      queueName,
      async (job) => {
        if (job !== null) {
          const reservationId = JSON.parse(job.content.toString())
          console.log(reservationId)
          channel.ack(job)
          sendReminderForDiningMail(reservationId)

          console.log(
            'Successfully send the reminder for reservation for restaurant Id: ',
            reservationId
          )
          console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queueName)
        }
      },
      { noAck: false }
    )
  } catch (err) {
    console.error(err)
  }
}

worker()
