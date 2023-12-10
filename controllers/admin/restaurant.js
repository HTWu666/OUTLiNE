import * as restaurantModel from '../../models/restaurant.js'

export const chooseRestaurantPage = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurants = await restaurantModel.getRestaurantByUserId(userId)
    if (!restaurants) {
      return res.status(200).render('./admin/joinRestaurant', { layout: false })
    }

    res.status(200).render('./admin/chooseRestaurant', { layout: false, restaurants })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}

export const joinRestaurantPage = async (req, res) => {
  try {
    res.status(200).render('./admin/joinRestaurant', { layout: false })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}

export const createRestaurantPage = async (req, res) => {
  try {
    res.status(200).render('./admin/createRestaurant', { layout: false })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}
