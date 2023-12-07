import moment from 'moment-timezone'
import * as availableSeatsModel from '../models/availableSeat.js'
import * as cache from '../utils/cache.js'

const getAvailableSeats = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { date } = req.query
    console.time('get tag cache')
    let availableSeats = await cache.lrange(
      `restaurant:${restaurantId}:availableDate:${date}`,
      0,
      -1
    )
    console.timeEnd('get tag cache')
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
    console.time('all DB')
    if (!availableSeats) {
      console.time('get data from DB')
      availableSeats = await availableSeatsModel.getAvailableSeats(restaurantId, date)
      console.timeEnd('get data from DB')
      console.time('put data into cache')
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

      console.timeEnd('put data into cache')
      console.time('summarize data for DB')
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

      console.timeEnd('summarize data for DB')
      console.timeEnd('all DB')
      return res.status(200).json({ data: transformedData })
    }
    console.time('check key exist')
    const getAvailableSeatsPromises = availableSeats.map((availableSeatInfo) => {
      return cache.exists(`restaurant:${restaurantId}:availableDate:${date}:${availableSeatInfo}`)
    })
    const results = await Promise.all(getAvailableSeatsPromises)
    console.timeEnd('check key exist')
    console.time('summarize data for cache')
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
