import * as restaurantModel from '../../models/restaurant.js'

const chooseRestaurantPage = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurants = await restaurantModel.getRestaurantByUserId(userId)

    res.status(200).render('./admin/chooseRestaurant', { layout: false, restaurants })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}

export default chooseRestaurantPage
