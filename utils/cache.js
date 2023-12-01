import { Redis } from 'ioredis'

export const cache = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST,

  retryStrategy: () => process.env.REDIS_RECONNECTION_PERIOD,
  tls: {}
})

export const get = async (key) => {
  try {
    const value = await cache.get(key)
    return value
  } catch (err) {
    return null
  }
}

export const set = async (key, value) => {
  try {
    const result = await cache.set(key, value)
    return result
  } catch (err) {
    return null
  }
}

export const del = async (key) => {
  try {
    const result = await cache.del(key)
    return result
  } catch (err) {
    return null
  }
}

export const sadd = async (key, value) => {
  try {
    const result = await cache.sadd(key, value)
    return result
  } catch (er) {
    return null
  }
}

export const smembers = async (key) => {
  try {
    const result = await cache.smembers(key)
    return result
  } catch (err) {
    return null
  }
}
