import moment from 'moment-timezone'
import * as availableSeatsModel from '../models/availableSeat.js'
import * as cache from '../utils/cache.js'

const getAvailableSeats = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { date } = req.query
    let availableSeats = await cache.scanAllMatches(
      `restaurant:${restaurantId}:availableDate:${date}*`,
      100
    )

    if (!availableSeats) {
      availableSeats = await availableSeatsModel.getAvailableSeats(restaurantId, date)
      await cache.lpush(`restaurant:${restaurantId}:availableDate:${date}`, 'yes')
      availableSeats.forEach(async (seat) => {
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

        await cache.lpush(
          `restaurant:${restaurantId}:availableDate:${date}:availableTime:${seat.available_time}:seatQty:${seat.seat_qty}`,
          JSON.stringify(value)
        )
      })

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

      return res.status(200).json({ data: transformedData })
    }

    const result = []
    const timeMap = {}
    for (const item of availableSeats) {
      const parts = item.split(':')
      if (parts.length === 10) {
        const available_time = moment
          .utc(`${parts[5]}:${parts[6]}:${parts[7]}`, 'HH:mm:ss')
          .tz('Asia/Taipei')
          .format('HH:mm')

        const max_person = parseInt(parts[9])

        if (!timeMap[max_person]) {
          timeMap[max_person] = []
        }

        timeMap[max_person].push(available_time)
      }
    }

    for (const max_person in timeMap) {
      if (timeMap.hasOwnProperty(max_person)) {
        result.push({ max_person: parseInt(max_person), available_time: timeMap[max_person] })
      }
    }

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
