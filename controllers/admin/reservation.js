import * as ruleModel from '../../models/rule.js'

export const checkReservationPage = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const ruleDetails = await ruleModel.getRule(restaurantId)

    res.status(200).render('./admin/checkReservation', {
      layout: 'layouts/bookingManagement',
      maxBookingDay: ruleDetails.max_booking_day
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}

export const makeReservationPage = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const ruleDetails = await ruleModel.getRule(restaurantId)

    res.status(200).render('./admin/makeReservation', {
      layout: 'layouts/bookingManagement',
      maxPersonPerGroup: ruleDetails.max_person_per_group,
      maxBookingDay: ruleDetails.max_booking_day
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}
