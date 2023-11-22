import * as restaurantModel from '../../models/restaurant.js'
import * as ruleModel from '../../models/rule.js'

const reservationPage = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id, 10)
    const restaurantDetails = await restaurantModel.getRestaurant(restaurantId)
    const ruleDetails = await ruleModel.getRule(restaurantId)

    res.status(200).render('./client/makeReservation', {
      layout: false,
      restaurantName: restaurantDetails[0].name,
      restaurantPhone: restaurantDetails[0].phone,
      restaurantAddress: restaurantDetails[0].address,
      maxPersonPerGroup: ruleDetails[0].max_person_per_group,
      maxBookingDay: ruleDetails[0].max_booking_day
    })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}

export default reservationPage
