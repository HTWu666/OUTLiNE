import * as restaurantModel from '../../models/restaurant.js'
import * as waitlistModel from '../../models/waitlist.js'

const waitlistNumberPage = async (req, res) => {
  try {
    const { waitingId } = res.locals
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const restaurantDetails = await restaurantModel.getRestaurant(restaurantId)
    const waitingDetails = await waitlistModel.getWaiting(waitingId)

    res.status(200).render('./client/waitlistNumber', {
      layout: false,
      restaurantId,
      restaurantName: restaurantDetails.name,
      restaurantAddress: restaurantDetails.address,
      restaurantPhone: restaurantDetails.phone,
      waitingId,
      number: waitingDetails.number,
      name: waitingDetails.name,
      adult: waitingDetails.adult,
      child: waitingDetails.child,
      status: waitingDetails.status
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get waitlist number page failed' })
  }
}

export default waitlistNumberPage
