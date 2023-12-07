import moment from 'moment-timezone'
import * as availableSeatsModel from '../models/availableSeat.js'
import * as cache from '../utils/cache.js'

const getAvailableSeats = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { date } = req.query
    console.time('scan all matches')
    let availableSeats = await cache.scanAllMatches(
      `restaurant:${restaurantId}:availableDate:${date}*`,
      100
    )
    console.timeEnd('scan all matches')

    console.time('lock the key')
    if (!availableSeats) {
      // lock
      const isLockSet = await cache.setnx(
        `restaurant:${restaurantId}:availableDate:${date}:lock`,
        'lock'
      )
      while (!availableSeats && isLockSet === 0) {
        availableSeats = await cache.scanAllMatches(
          `restaurant:${restaurantId}:availableDate:${date}*`,
          100
        )
      }
    }
    console.timeEnd('lock the key')
    console.time('summarize data after DB')
    if (!availableSeats) {
      availableSeats = await availableSeatsModel.getAvailableSeats(restaurantId, date)
      const cachePromises = availableSeats.map((seat) => {
        const value = {
          id: seat.id,
          restaurant_id: seat.restaurant_id,
          table_id: seat.table_id,
          table_name: seat.table_name,
          seat_qty: seat.seat_qty,
          available_date: seat.available_date,
          available_time: seat.available_time,
          availability: seat.availability,
          created_at: seat.created_at
        }

        return cache.lpush(
          `restaurant:${restaurantId}:availableDate:${date}:availableTime:${seat.available_time}:seatQty:${seat.seat_qty}`,
          JSON.stringify(value)
        )
      })
      await Promise.all(cachePromises)
      const transformedData = availableSeats.reduce((acc, seat) => {
        const existing = acc.find((entry) => entry.max_person === seat.seat_qty)
        const convertedTime = moment
          .utc(seat.available_time, 'HH:mm:ss')
          .tz('Asia/Taipei')
          .format('HH:mm')

        if (existing) {
          if (!existing.available_time.includes(convertedTime)) {
            existing.available_time.push(convertedTime)
            existing.available_time.sort()
          }
        } else {
          acc.push({
            max_person: seat.seat_qty,
            available_time: [convertedTime]
          })
        }

        return acc
      }, [])
      transformedData.sort((a, b) => a.max_person - b.max_person)
      console.timeEnd('summarize data after DB')
      return res.status(200).json({ data: transformedData })
    }
    console.time('summarize data for cache')
    const seatsMap = new Map()
    for (const item of availableSeats) {
      const parts = item.split(':')
      if (parts.length === 10) {
        const available_time = moment
          .utc(`${parts[5]}:${parts[6]}:${parts[7]}`, 'HH:mm:ss')
          .tz('Asia/Taipei')
          .format('HH:mm')
        const max_person = parseInt(parts[9])

        const times = seatsMap.get(max_person) || new Set()
        times.add(available_time)
        seatsMap.set(max_person, times)
      }
    }

    const result = Array.from(seatsMap, ([max_person, available_times]) => ({
      max_person,
      available_time: Array.from(available_times).sort()
    })).sort((a, b) => a.max_person - b.max_person)
    console.timeEnd('summarize data for cache')
    res.status(200).json({ data: result })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get available seats failed' })
  }
}

export default getAvailableSeats
