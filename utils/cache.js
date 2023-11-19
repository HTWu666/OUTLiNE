import { Redis } from 'ioredis'

const cache = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: () => process.env.REDIS_RECONNECTION_PERIOD,
  tls: {}
})

export default cache
