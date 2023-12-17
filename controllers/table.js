import moment from 'moment-timezone'
import * as tableModel from '../models/table.js'
import * as cache from '../utils/cache.js'

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
  if (!(typeof availableTime === 'string' || Array.isArray(availableTime))) {
    return { valid: false, error: 'Available time must be a string or an array' }
  }

  // verify data type
  if (typeof tableName !== 'string') {
    return { valid: false, error: 'Table name must be a string' }
  }
  if (typeof seatQty !== 'number') {
    return { valid: false, error: 'Seat quantity must be a number' }
  }

  if (seatQty <= 0) {
    return { valid: false, error: 'Seat quantity must be greater than 1' }
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

export const createTable = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const { tableName, seatQty, availableTime } = req.body
    const validation = validateCreateTable(contentType, tableName, seatQty)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const restaurantId = parseInt(req.params.restaurantId, 10)
    const keys = await cache.getKeys(`restaurant:${restaurantId}:availableDate:*`)
    if (keys) {
      await cache.deleteKeys(keys)
    }
    const timezone = 'Asia/Taipei'
    if (typeof availableTime === 'string' && availableTime.length > 0) {
      const utcAvailableTime = moment.tz(availableTime, 'HH:mm', timezone).utc().format('HH:mm:ss')
      await tableModel.createTable(restaurantId, tableName, seatQty, [utcAvailableTime])
    }

    if (Array.isArray(availableTime) && availableTime.length > 0) {
      const formattedAvailableTime = availableTime.map((time) => {
        const utcAvailableTime = moment.tz(time, 'HH:mm', timezone).utc().format('HH:mm')
        return utcAvailableTime
      })
      await tableModel.createTable(restaurantId, tableName, seatQty, formattedAvailableTime)
    }

    res.status(200).json({ message: 'done' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      if ((err.message = 'duplicate key value violates unique constraint "name_unique"')) {
        return res
          .status(400)
          .json({ error: '桌號重覆，請確認是否輸入正確。\n若要新增時間，請先將桌子刪除後重新建立' })
      }
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Create table failed' })
  }
}

export const getTables = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const results = await tableModel.getTables(restaurantId)
    const transformedData = {}
    results.forEach((item) => {
      const tableId = item.table_id
      const tableName = item.name.split('_')[1]
      const utcTime = item.available_time
      const date = new Date(`1970-01-01T${utcTime}Z`)
      date.setHours(date.getHours() + 8)
      const taipeiTime = date.toISOString().substr(11, 5)
      if (!Object.prototype.hasOwnProperty.call(transformedData, tableId)) {
        transformedData[tableId] = {
          id: tableId,
          tableName,
          seatQty: item.seat_qty,
          availableTime: [taipeiTime]
        }
      } else {
        transformedData[tableId].availableTime.push(taipeiTime)
      }
    })

    const data = Object.values(transformedData)
    data.sort((a, b) => {
      const getNumericPart = (str) => str.replace(/[^\d]/g, '')
      const getAlphabeticPart = (str) => str.replace(/[^a-zA-Z]/g, '')
      const compareAlphabetic = getAlphabeticPart(a.tableName).localeCompare(
        getAlphabeticPart(b.tableName)
      )
      return compareAlphabetic === 0
        ? parseInt(getNumericPart(a.tableName), 10) - parseInt(getNumericPart(b.tableName), 10)
        : compareAlphabetic
    })
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
    const { restaurantId, tableId } = req.params
    await tableModel.deleteTable(tableId)
    const keys = await cache.getKeys(`restaurant:${restaurantId}:availableDate:*`)
    if (keys) {
      await cache.deleteKeys(keys)
    }

    res.status(200).json({ message: 'Delete successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Delete table failed' })
  }
}
