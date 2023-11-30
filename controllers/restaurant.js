import * as restaurantModel from '../models/restaurant.js'

const validateCreateRestaurant = (name, address, phone) => {
  let missingField = ''
  if (!name) {
    missingField = 'Name'
  } else if (!address) {
    missingField = 'Address'
  } else if (!phone) {
    missingField = 'Phone'
  }
  if (missingField) {
    return { valid: false, error: `${missingField} is required` }
  }

  return { valid: true }
}

export const createRestaurant = async (req, res) => {
  try {
    const contentType = req.headers['content-type']
    const {
      name,
      address,
      phone,
      parking,
      payment,
      'kids-chair': kidChair,
      'vegetarian-option': vegetarian
    } = req.body
    const pictureUrl = `${req.file.filename}`
    await restaurantModel
    // validate
    const validation = validateCreateRestaurant(
      name,
      address,
      phone,
      parking,
      payment,
      kidChair,
      vegetarian,
      pictureUrl
    )
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    // create restaurant
    const restaurantId = await restaurantModel.createRestaurant(
      name,
      address,
      phone,
      parking,
      payment,
      kidChair,
      vegetarian,
      pictureUrl
    )

    res.status(200).json(restaurantId)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Create restaurant failed' })
  }
}

export const getRestaurant = async (req, res) => {}
