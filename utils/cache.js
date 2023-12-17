import { Redis } from 'ioredis'

export const cache = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: () => process.env.REDIS_RECONNECTION_PERIOD
  // tls: {}
})

export const get = async (key) => {
  try {
    const value = await cache.get(key)
    return value
  } catch (err) {
    console.error(err)
    return null
  }
}

export const set = async (key, value) => {
  try {
    const result = await cache.set(key, value)
    return result
  } catch (err) {
    console.error(err)
    return null
  }
}

export const del = async (key) => {
  try {
    const result = await cache.del(key)
    return result
  } catch (err) {
    console.error(err)
    return null
  }
}

export const hset = async (key, field, value) => {
  try {
    const result = await cache.hset(key, field, value)
    return result
  } catch (err) {
    console.error(err)
    return null
  }
}

export const scanAllMatches = async (pattern, count) => {
  try {
    let cursor = '0'
    const matches = []

    do {
      const reply = await cache.scan(cursor, 'MATCH', pattern, 'COUNT', count)
      console.log(reply)
      cursor = reply[0]
      const keys = reply[1]
      for (const key of keys) {
        matches.push(key)
      }
    } while (cursor !== '0')

    if (matches.length === 0) {
      return null
    }

    return matches
  } catch (err) {
    console.error(err)
    return null
  }
}

export const findOneMatch = async (pattern, count) => {
  try {
    let cursor = '0'

    do {
      const reply = await cache.scan(cursor, 'MATCH', pattern, 'COUNT', count)
      cursor = reply[0]
      const keys = reply[1]

      if (keys.length > 0) {
        const key = keys[0]
        const object = await cache.hgetall(key)
        return { key, object }
      }
    } while (cursor !== '0')

    return { key: null, object: null }
  } catch (err) {
    console.error(err)
    return { key: null, object: null }
  }
}

export const lrange = async (key, startIndex, endIndex) => {
  try {
    const result = await cache.lrange(key, startIndex, endIndex)
    if (result.length === 0) {
      return null
    }
    return result
  } catch (err) {
    console.error(err)
    return null
  }
}

export const lpush = async (key, value) => {
  try {
    const result = await cache.lpush(key, value)
    return result
  } catch (err) {
    console.error(err)
    return null
  }
}

export const rpop = async (key) => {
  try {
    const result = await cache.rpop(key)
    return result
  } catch (err) {
    console.error(err)
    return null
  }
}

export const setnx = async (key, value) => {
  try {
    const lockSet = await cache.setnx(key, value)
    if (lockSet) {
      return 1
    }
    return 0
  } catch (err) {
    console.error(err)
    return null
  }
}

export const exists = async (key) => {
  try {
    const isExist = await cache.exists(key)
    return isExist
  } catch (err) {
    console.error(err)
    return null
  }
}

export const executeLuaScript = async (luaScript, keys, args) => {
  try {
    const result = await cache.eval(luaScript, keys.length, ...keys, ...args)
    return result
  } catch (err) {
    console.error(err)
    return null
  }
}

export const getKeys = async (pattern) => {
  try {
    const results = await cache.keys(pattern)

    if (results.length > 0) {
      return results
    }
    return null
  } catch (err) {
    console.error(err)
    return null
  }
}

export const deleteKeys = async (keys) => {
  try {
    if (keys && keys.length > 0) {
      const result = await cache.del(...keys)
      return result
    }
    return null
  } catch (err) {
    console.error(err)
    return null
  }
}
