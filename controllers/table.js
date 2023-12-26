import moment from 'moment-timezone'
import pkg from 'pg'
import * as tableModel from '../models/table.js'
import * as cache from '../utils/cache.js'
import * as ruleModel from '../models/rule.js'
import { ValidationError } from '../utils/errorHandler.js'

const { DatabaseError } = pkg

export const createTable = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { tableName, seatQty, availableTime } = req.body
    const { max_person_per_group: maxPersonPerGroup } = await ruleModel.getRule(restaurantId)
    if (seatQty > maxPersonPerGroup) {
      throw new ValidationError(`invalid seat quantity`)
    }

    const keys = await cache.getKeys(`restaurant:${restaurantId}:availableDate:*`)
    if (keys) {
      await cache.deleteKeys(keys)
    }
    const timezone = 'Asia/Taipei'
    const availableTimes = Array.isArray(availableTime) ? availableTime : [availableTime]
    const formattedAvailableTimes = availableTimes
      .filter((time) => time && typeof time === 'string')
      .map((time) => moment.tz(time, 'HH:mm', timezone).utc().format('HH:mm:ss'))

    if (formattedAvailableTimes.length > 0) {
      await tableModel.createTable(restaurantId, tableName, seatQty, formattedAvailableTimes)
    }

    res.status(200).json({ message: 'Create table successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof DatabaseError) {
      if (err.message === 'duplicate key value violates unique constraint "name_unique"') {
        return res.status(400).json({
          errors: '您已新增過一樣的桌號。\n若要新增時間，請先將桌子刪除後重新建立'
        })
      }
      return res.status(400).json({ errors: err.message })
    }
    if (err instanceof ValidationError) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Create table failed' })
  }
}

export const getTables = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const results = await tableModel.getTables(restaurantId)
    const transformedData = {}

    results.forEach((item) => {
      const tableId = item.table_id
      const tableName = item.name.split('_')[1]
      const taipeiTime = moment
        .utc(item.available_time, 'HH:mm:ss')
        .tz('Asia/Taipei')
        .format('HH:mm')
      if (!transformedData[tableId]) {
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
    data.sort((a, b) => a.tableName.localeCompare(b.tableName))
    data.forEach((table) => {
      table.availableTime.sort()
    })

    res.status(200).json({ data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ errors: 'Get tables failed' })
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
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Delete table failed' })
  }
}
