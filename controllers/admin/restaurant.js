import * as restaurantModel from '../../models/restaurant.js'

export const chooseRestaurantPage = async (req, res) => {
  try {
    const { userId } = res.locals
    const restaurants = await restaurantModel.getRestaurantByUserId(userId)
    if (!restaurants) {
      return res.status(200).render('./admin/joinRestaurant', {
        layout: false,
        message: '您尚未有權限管理任何餐廳，請先選擇加入現有的餐廳或是建立新的餐廳'
      })
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
