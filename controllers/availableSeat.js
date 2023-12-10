import moment from 'moment-timezone'
import * as availableSeatsModel from '../models/availableSeat.js'
import * as cache from '../utils/cache.js'

const getAvailableSeats = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { date } = req.query
    let availableSeats = await cache.lrange(
      `restaurant:${restaurantId}:availableDate:${date}`,
      0,
      -1
    )

    if (!availableSeats) {
      const lockValue = await cache.get(`restaurant:${restaurantId}:availableDate:${date}:lock`)
      if (!lockValue) {
        const isLockSet = await cache.setnx(
          `restaurant:${restaurantId}:availableDate:${date}:lock`,
          'lock'
        )
        while (!availableSeats && isLockSet === 0) {
          availableSeats = await cache.lrange(
            `restaurant:${restaurantId}:availableDate:${date}`,
            0,
            -1
          )
        }
      } else if (lockValue === 'noData') {
        return res.status(200).json({ data: [] })
      } else {
        while (!availableSeats) {
          availableSeats = await cache.lrange(
            `restaurant:${restaurantId}:availableDate:${date}`,
            0,
            -1
          )
        }
      }
    }

    if (!availableSeats) {
      availableSeats = await availableSeatsModel.getAvailableSeats(restaurantId, date)
      if (availableSeats.length === 0) {
        await cache.set(`restaurant:${restaurantId}:availableDate:${date}:lock`, 'noData')
        return res.status(200).json({ data: availableSeats })
      }

      const cachePromises = []
      const bookingInfoMap = {}
      availableSeats.forEach((seat) => {
        cachePromises.push(
          cache.lpush(
            `restaurant:${restaurantId}:availableDate:${date}:availableTime:${seat.available_time}:seatQty:${seat.seat_qty}`,
            JSON.stringify(seat)
          )
        )
        const bookingKey = `availableTime:${seat.available_time}:seatQty:${seat.seat_qty}`
        bookingInfoMap[bookingKey] = true
      })

      Object.keys(bookingInfoMap).forEach((bookingKey) => {
        cachePromises.push(
          cache.lpush(`restaurant:${restaurantId}:availableDate:${date}`, bookingKey)
        )
      })
      await Promise.all(cachePromises)

      const bookingMap = {}
      availableSeats.forEach((seat) => {
        if (!bookingMap[seat.seat_qty]) {
          bookingMap[seat.seat_qty] = new Set()
        }

        const convertedTime = moment
          .utc(seat.available_time, 'HH:mm:ss')
          .tz('Asia/Taipei')
          .format('HH:mm')
        bookingMap[seat.seat_qty].add(convertedTime)
      })

      const transformedData = Object.entries(bookingMap).map(([max_person, availableTimes]) => ({
        max_person: parseInt(max_person, 10),
        available_time: Array.from(availableTimes).sort()
      }))
      transformedData.sort((a, b) => a.max_person - b.max_person)
      return res.status(200).json({ data: transformedData })
    }

    const getAvailableSeatsPromises = availableSeats.map((availableSeatInfo) => {
      return cache.exists(`restaurant:${restaurantId}:availableDate:${date}:${availableSeatInfo}`)
    })
    const results = await Promise.all(getAvailableSeatsPromises)
    const dataTransformedSet = new Set()
    const seatsMap = new Map()
    availableSeats.forEach((item, index) => {
      if (results[index] === 1) {
        const parts = item.split(':')
        const time = moment
          .utc(`${parts[1]}:${parts[2]}:${parts[3]}`, 'HH:mm:ss')
          .tz('Asia/Taipei')
          .format('HH:mm')
        const seatQty = parseInt(parts[5], 10)
        const times = seatsMap.get(seatQty) || new Set()
        times.add(time)
        seatsMap.set(seatQty, times)
      }
    })

    const result = Array.from(seatsMap, ([max_person, available_times]) => ({
      max_person,
      available_time: Array.from(available_times).sort()
    })).sort((a, b) => a.max_person - b.max_person)

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
