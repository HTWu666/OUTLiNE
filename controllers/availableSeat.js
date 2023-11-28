import moment from 'moment-timezone'
import * as availableModel from '../models/availableSeat.js'

export const getAvailableSeats = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { date } = req.query
    const availableSeats = await availableModel.getAvailableSeats(restaurantId, date)
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

    res.status(200).json({ data: transformedData })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get available seats failed' })
  }
}

export const updateAvailableSeats = async (req, res) => {}
