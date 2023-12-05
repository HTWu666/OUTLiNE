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
      cursor = reply[0] // 更新 cursor
      const keys = reply[1]
      for (const key of keys) {
        matches.push(key)
      }
    } while (cursor !== '0')

    if (matches.length === 0) {
      return null
    }

    return matches

    // do {
    //   const reply = await cache.scan(cursor, 'MATCH', pattern, 'COUNT', count)
    //   cursor = reply[0] // 更新 cursor
    //   const keys = reply[1]
    //   const promises = []
    //   console.log(keys)
    //   for (const key of keys) {
    //     promises.push(
    //       (async () => {
    //         const details = await cache.lrange(key, 0, -1) // 获取列表的所有元素
    //         if (details[0] !== 'yes') {
    //           for (const detail of details) {
    //             try {
    //               const detailObject = JSON.parse(detail) // 尝试解析 JSON 字符串
    //               matches.push(detailObject) // 将解析后的对象添加到 matches 数组
    //             } catch (error) {
    //               console.error(`Error parsing JSON for key ${key}:`, error)
    //               // 处理解析错误，如跳过当前项或记录错误
    //             }
    //           }
    //         } else {
    //           matches.push('yes')
    //         }
    //       })()
    //     )
    //   }
    //   await Promise.all(promises) // 并发处理
    // } while (cursor !== '0')

    // if (matches.length === 0) {
    //   return null
    // }
    // return matches
  } catch (err) {
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
    return null
  }
}

export const lpush = async (key, value) => {
  try {
    const result = await cache.lpush(key, value)
    return result
  } catch (err) {
    return null
  }
}

export const rpop = async (key) => {
  try {
    const result = await cache.rpop(key)
    return result
  } catch (err) {
    return null
  }
}
