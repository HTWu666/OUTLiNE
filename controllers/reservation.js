import moment from 'moment-timezone'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFile } from 'fs/promises'
import * as reservationModel from '../models/reservation.js'
import * as restaurantModel from '../models/restaurant.js'
import { getTable } from '../models/table.js'
import * as SQS from '../utils/SQS.js'
import * as cache from '../utils/cache.js'

const assignSeat = async (adult, child, restaurantId) => {
  const person = adult + child
  const rawSeatQty = await cache.get(`restaurant:${restaurantId}:seatQty`)
  let seatQty = JSON.parse(rawSeatQty)

  // if max seat qty is not in cache then get it from DB
  if (!seatQty) {
    const seats = await getTable(restaurantId)
    seatQty = []
    seats.forEach((seat) => {
      if (!seatQty.includes(seat.seat_qty)) {
        seatQty.push(seat.seat_qty)
      }
    })
    seatQty.sort((a, b) => a - b)
    await cache.set(`restaurant:${restaurantId}:seatQty`, JSON.stringify(seatQty))
  }

  // assign the appropriate seat qty
  let start = 0
  let end = seatQty.length - 1
  let requiredSeats = -1
  while (start <= end) {
    const mid = Math.floor((start + end) / 2)

    if (seatQty[mid] >= person) {
      requiredSeats = seatQty[mid]
      end = mid - 1
    } else {
      start = mid + 1
    }
  }

  if (requiredSeats === -1) {
    throw new Error('Exceed the limit of max person per reservation')
  }

  return requiredSeats
}

// for customer and business
export const createReservation = async (req, res) => {
  try {
    const { adult, child, diningDate, diningTime, name, gender, phone, email, purpose, note } =
      req.body
    const { restaurantId } = req.params
    const timezone = 'Asia/Taipei'
    const utcDiningTime = moment.tz(diningTime, 'HH:mm', timezone).utc().format('HH:mm:ss')

    // assign the seat
    const requiredSeats = await assignSeat(adult, child, restaurantId)

    // create reservation
    const filename = fileURLToPath(import.meta.url)
    const dirname = path.dirname(filename)
    const updateLockScript = await readFile(path.join(dirname, '../utils/updateLock.lua'), {
      encoding: 'utf8'
    })
    const stringifyAvailableSeat = await cache.executeLuaScript(
      updateLockScript,
      [
        `restaurant:${restaurantId}:availableDate:${diningDate}:availableTime:${utcDiningTime}:seatQty:${requiredSeats}`,
        `restaurant:${restaurantId}:availableDate:${diningDate}:lock`
      ],
      []
    )
    if (!stringifyAvailableSeat) {
      return res.status(200).json({ message: 'no available seats' })
    }

    // cache write back
    const availableSeat = JSON.parse(stringifyAvailableSeat)
    const writeBackData = {
      availableSeatId: availableSeat.id,
      restaurantId,
      adult,
      child,
      diningDate,
      diningTime: utcDiningTime,
      tableId: availableSeat.table_id,
      tableName: availableSeat.table_name,
      name,
      gender,
      phone,
      email,
      purpose,
      note
    }

    await SQS.sendMessage(process.env.CACHE_WRITE_BACK_QUEUE_URL, JSON.stringify(writeBackData))

    return res.status(200).json({ message: 'Making reservation successfully' })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Create reservation failed' })
  }
}

// for customer
export const cancelReservationByCustomer = async (req, res) => {
  try {
    const { upn } = req.query
    const { reservationId } = res.locals
    const reservationDetails = await reservationModel.cancelReservation(reservationId)
    const restaurantDetails = await restaurantModel.getRestaurant(reservationDetails.restaurant_id)
    const reservationDate = new Date(reservationDetails.dining_date)
    const year = reservationDate.getFullYear()
    const month = reservationDate.getMonth() + 1
    const day = reservationDate.getDate()
    const week = reservationDate.getDay()
    const days = ['(日)', '(一)', '(二)', '(三)', '(四)', '(五)', '(六)']
    const dayOfWeek = days[week]
    const utcDiningTime = reservationDetails.dining_time
    const diningTimeInTaipei = moment.utc(utcDiningTime, 'HH:mm:ss').tz('Asia/Taipei')
    const formattedTime = diningTimeInTaipei.format('HH:mm')

    res.status(200).render('./client/cancelReservation', {
      restaurantName: restaurantDetails.name,
      restaurantPhone: reservationDetails.phone,
      restaurantAddress: restaurantDetails.address,
      customerName: reservationDetails.name,
      gender: reservationDetails.gender,
      diningDate: `${year}年${month}月${day}日`,
      dayOfWeek,
      diningTime: formattedTime,
      adult: reservationDetails.adult,
      child: reservationDetails.child,
      link: `${process.env.DOMAIN}/api/reservation/click?upn=${upn}`
    })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get reservations failed' })
  }
}

// for business
export const getReservations = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { date } = req.query
    const reservations = await reservationModel.getReservations(restaurantId, date)
    const formattedReservations = reservations.map((item) => ({
      ...item,
      table_name: item.table_name.split('_')[1],
      dining_time: moment.utc(item.dining_time, 'HH:mm:ss').tz('Asia/Taipei').format('HH:mm')
    }))

    res.status(200).json({ data: formattedReservations })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get reservations failed' })
  }
}

// for business
export const cancelReservationByVendor = async (req, res) => {
  try {
    const { reservationId } = req.params
    await reservationModel.cancelReservation(reservationId)

    res.status(200).json({ message: 'Cancel reservation successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Cancel reservation failed' })
  }
}

// for business
export const confirmReservation = async (req, res) => {
  try {
    const { reservationId } = req.params
    const results = await reservationModel.confirmReservation(reservationId)
    if (!results.length) {
      throw new Error('Confirm reservation failed')
    }
    res.status(200).json({ message: 'Confirm reservation successfully' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Confirm reservations failed' })
  }
}
