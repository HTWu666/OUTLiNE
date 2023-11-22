import moment from 'moment-timezone'
import * as tableModel from '../models/table.js'
import * as restaurantModel from '../models/restaurant.js'
import cache from '../utils/cache.js'

const validateCreateTable = (contentType, tableName, seatQty, availableTime) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!tableName) {
    missingField = 'Table name'
  } else if (!seatQty) {
    missingField = 'Seat quantity'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  // verify data type
  if (typeof tableName !== 'string') {
    return { valid: false, error: 'Table name must be a string' }
  }
  if (typeof seatQty !== 'number') {
    return { valid: false, error: 'Seat quantity must be a number' }
  }

  return { valid: true }
}

export const createTable = async (req, res) => {
  try {
    const { userId } = res.locals
    const contentType = req.headers['content-type']
    const { tableName, seatQty, availableTime } = req.body
    const validation = validateCreateTable(contentType, tableName, seatQty)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // get restaurantId by userId
    let restaurantId
    const restaurantIdCacheKey = `restaurantId:${userId}`
    if (cache.status === 'ready') {
      const cachedRestaurantId = await cache.get(restaurantIdCacheKey)

      if (cachedRestaurantId) {
        restaurantId = cachedRestaurantId
      }
    }

    if (!restaurantId) {
      restaurantId = await restaurantModel.findRestaurantByUserId(userId)
      if (cache.status === 'ready') {
        await cache.set(restaurantIdCacheKey, restaurantId)
      }
    }

    const tableId = await tableModel.createTable(restaurantId, tableName, seatQty)
    const timezone = 'Asia/Taipei'
    if (typeof availableTime === 'string' && availableTime.length > 0) {
      const utcAvailableTime = moment.tz(availableTime, 'HH:mm', timezone).utc().format('HH:mm:ss')
      await tableModel.createAvailableTime([
        {
          tableId,
          utcAvailableTime
        }
      ])
    }

    if (Array.isArray(availableTime) && availableTime.length > 0) {
      const formattedAvailableTime = availableTime.map((time) => {
        const utcAvailableTime = moment.tz(time, 'HH:mm', timezone).utc().format('HH:mm')
        return { tableId, utcAvailableTime }
      })

      await tableModel.createAvailableTime(formattedAvailableTime)
    }

    res.status(200).json(tableId)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Create table failed' })
  }
}

const validateCreateAvailableTime = (contentType, tableId, availableTime) => {
  if (contentType !== 'application/json') {
    return { valid: false, error: 'Wrong content type' }
  }

  let missingField = ''
  if (!tableId) {
    missingField = 'Table Id'
  } else if (!availableTime) {
    missingField = 'Table available time'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  // verify data type
  if (typeof tableId !== 'number') {
    return { valid: false, error: 'Table id must be a number' }
  }
  if (!(typeof availableTime === 'string' || Array.isArray(availableTime))) {
    return { valid: false, error: 'Available time must be a string or an array' }
  }

  const availableTimeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (typeof availableTime === 'string') {
    if (!availableTimeRegex.test(availableTime)) {
      return { valid: false, error: 'Available time must be in the form of hh:mm' }
    }
  } else {
    availableTime.forEach((time) => {
      if (!availableTimeRegex.test(time)) {
        return { valid: false, error: 'Available time must be in the form of hh:mm' }
      }
    })
  }

  return { valid: true }
}

export const createAvailableTime = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { tableId, availableTime } = req.body
    const validation = validateCreateAvailableTime(contentType, tableId, availableTime)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    let availableTimeId
    const timezone = 'Asia/Taipei'
    if (typeof availableTime === 'string' && availableTime.length > 0) {
      const utcAvailableTime = moment.tz(availableTime, 'HH:mm', timezone).utc().format('HH:mm:ss')
      availableTimeId = await tableModel.createAvailableTime([
        {
          tableId,
          utcAvailableTime
        }
      ])
    }

    if (Array.isArray(availableTime) && availableTime.length > 0) {
      const formattedAvailableTime = availableTime.map((time) => {
        const utcAvailableTime = moment.tz(time, 'HH:mm', timezone).utc().format('HH:mm')
        return { tableId, utcAvailableTime }
      })

      availableTimeId = await tableModel.createAvailableTime(formattedAvailableTime)
    }

    res.status(200).json(availableTimeId)
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Create available time failed' })
  }
}

export const getTables = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurantId = await restaurantModel.findRestaurantByUserId(userId)
    const results = await tableModel.getTables(restaurantId)

    const transformedData = {}
    results.forEach((item) => {
      const tableId = item.table_id
      const utcTime = item.available_time
      const date = new Date(`1970-01-01T${utcTime}Z`)
      date.setHours(date.getHours() + 8)
      const taipeiTime = date.toISOString().substr(11, 5)
      if (!Object.prototype.hasOwnProperty.call(transformedData, tableId)) {
        transformedData[tableId] = {
          id: tableId,
          tableName: item.name,
          seatQty: item.seat_qty,
          availableTime: [taipeiTime]
        }
      } else {
        transformedData[tableId].availableTime.push(taipeiTime)
      }
    })

    const data = Object.values(transformedData)
    data.forEach((table) => {
      table.availableTime.sort()
    })

    res.status(200).json({ data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get tables failed' })
  }
}

export const deleteTable = async (req, res) => {
  try {
    const tableId = req.params.id
    const { time } = req.query

    if (time) {
      const timezone = 'Asia/Taipei'
      const utcTime = moment.tz(time, 'HH:mm', timezone).utc().format('HH:mm:ss')
      await tableModel.deleteAvailableTime(tableId, utcTime)
    } else {
      await tableModel.deleteTable(tableId)
    }

    res.status(200).json({ message: 'Delete successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Delete table failed' })
  }
}
