import moment from 'moment-timezone'
import * as restaurantModel from '../../models/restaurant.js'
import * as ruleModel from '../../models/rule.js'
import * as reservationModel from '../../models/reservation.js'

export const reservationPage = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const restaurantDetails = await restaurantModel.getRestaurant(restaurantId)
    const ruleDetails = await ruleModel.getRule(restaurantId)

    res.status(200).render('./client/makeReservation', {
      layout: false,
      restaurantPic: `${process.env.AWS_CDN_URL}/${restaurantDetails.picture}`,
      restaurantName: restaurantDetails.name,
      restaurantPhone: restaurantDetails.phone,
      restaurantAddress: restaurantDetails.address,
      maxPersonPerGroup: ruleDetails.max_person_per_group,
      maxBookingDay: ruleDetails.max_booking_day
    })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get reservation page failed' })
  }
}

export const getReservation = async (req, res) => {
  try {
    const { upn } = req.query
    const { reservationId } = res.locals
    const reservationDetails = await reservationModel.getReservation(reservationId)
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

    res.status(200).render('./client/getReservation', {
      layout: false,
      restaurantName: restaurantDetails.name,
      restaurantPhone: restaurantDetails.phone,
      restaurantAddress: restaurantDetails.address,
      customerName: reservationDetails.name,
      gender: reservationDetails.gender,
      diningDate: `${year}年${month}月${day}日`,
      dayOfWeek,
      diningTime: formattedTime,
      adult: reservationDetails.adult,
      child: reservationDetails.child,
      status: reservationDetails.status,
      link: `${process.env.DOMAIN}/api/v1/reservation/click?upn=${upn}`
    })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get reservations failed' })
  }
}
