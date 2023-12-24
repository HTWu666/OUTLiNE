import moment from 'moment-timezone'
import * as restaurantModel from '../../models/restaurant.js'
import * as ruleModel from '../../models/rule.js'
import * as reservationModel from '../../models/reservation.js'

const createRestaurantPage = async (req, res) => {
  try {
    res.status(200).render('./superuser/createRestaurant', { layout: false })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get create restaurant page failed' })
  }
}

export default createRestaurantPage
