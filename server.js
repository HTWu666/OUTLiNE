import express from 'express'
import dotenv from 'dotenv'
// import swaggerAutogen from 'swagger-autogen'
import cookieParser from 'cookie-parser'
import fs from 'fs'
import morganBody from 'morgan-body'
import swaggerUi from 'swagger-ui-express'
// import swaggerDocument from './swagger.json' assert { 'type': 'json' }
import expressLayouts from 'express-ejs-layouts'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import userRouter from './routes/user.js'
import restaurantRouter from './routes/restaurant.js'
import tableRouter from './routes/table.js'
import reservationRouter from './routes/reservation.js'
import ruleRouter from './routes/rule.js'
import availableSeatRouter from './routes/availableSeat.js'
import reservationPageRouter from './routes/client/reservation.js'
import checkReservationPageRouter from './routes/admin/reservation.js'
import userPageRouter from './routes/admin/user.js'
import customerServiceRouter from './routes/customerService.js'
import waitlistRouter from './routes/waitlist.js'
import waitlistPageRouter from './routes/admin/waitlist.js'
import waitlistNumberPageRouter from './routes/client/waitlist.js'
import adminRestaurantPageRouter from './routes/admin/restaurant.js'
import rulePageRouter from './routes/admin/rule.js'
import tablePageRouter from './routes/admin/table.js'
import dashboardRouter from './routes/dashboard.js'
import dashboardPageRouter from './routes/admin/dashboard.js'
import rateLimiter from './middlewares/rateLimiter.js'
import { errorHandler } from './utils/errorHandler.js'

dotenv.config()
const app = express()

// SocketIO
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.DOMAIN,
    methods: ['GET', 'POST']
  }
})

// Redis adapter
const pubClient = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: () => process.env.REDIS_RECONNECTION_PERIOD
  //tls: {}
})
const subClient = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: () => process.env.REDIS_RECONNECTION_PERIOD
  //tls: {}
})
io.adapter(createAdapter(pubClient, subClient))
app.set('io', io)

app.use(express.json()) // parse json
app.use(express.urlencoded({ extended: false })) // parse urlencoded
app.use(cookieParser()) // parse cookie
app.set('view engine', 'ejs')
app.set('views', './views')
app.use(expressLayouts)
app.set('layout', './layouts/global')
app.use(express.static('public'))
app.use(express.static('uploads'))

// swagger
// const outputFile = './swagger.json'
// const endpointsFiles = ['./server.js']
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const log = fs.createWriteStream('./logs/morganBody/morganBody.log', {
  flags: 'a'
})
morganBody(app, {
  noColors: true,
  stream: log
})

app.use('/api', rateLimiter, [
  userRouter,
  restaurantRouter,
  tableRouter,
  reservationRouter,
  ruleRouter,
  availableSeatRouter,
  customerServiceRouter,
  waitlistRouter,
  dashboardRouter
])

app.use('/', rateLimiter, [
  reservationPageRouter,
  checkReservationPageRouter,
  userPageRouter,
  waitlistPageRouter,
  waitlistNumberPageRouter,
  adminRestaurantPageRouter,
  rulePageRouter,
  tablePageRouter,
  dashboardPageRouter
])

app.all('*', (req, res) => {
  res.status(404).render('./error/notFound')
})

// Global error handler
app.use(errorHandler)

server.listen(process.env.PORT, () => {
  console.log(`Server is listening on ${process.env.PORT}`)
})

// logger
const outputLogStream = fs.createWriteStream('./logs/console/console.log', {
  flags: 'a'
})

if (process.env.SERVER_STATUS === 'development') {
  const originalConsoleLog = console.log
  console.log = (...args) => {
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return 'Unstringifiable Object'
          }
        }
        return String(arg)
      })
      .join(' ')

    outputLogStream.write(`${message}\n`)
    originalConsoleLog(...args)
  }

  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args.join(' ')
    outputLogStream.write(`[ERROR] ${message}\n`)

    args.forEach((arg) => {
      if (arg instanceof Error) {
        outputLogStream.write(`[ERROR Stack Trace] ${arg.stack}\n`)
      }
    })

    originalConsoleError(...args)
  }
}

// swaggerAutogen(outputFile, endpointsFiles)
