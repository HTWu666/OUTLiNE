import * as dashboardModel from '../models/dashboard.js'

export const getWeeklyFootTrafficByHour = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { lastDays } = req.query
    if (lastDays <= 0) {
      return res.status(400).json({ errors: 'Past days should be a positive number' })
    }
    const data = await dashboardModel.getWeeklyFootTrafficByHour(restaurantId, lastDays)

    res.status(200).json({ data })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get weekly foot trafic by hour data failed' })
  }
}

export const getWeeklyFootTrafficDistribution = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { lastDays } = req.query
    const data = await dashboardModel.getWeeklyFootTrafficDistribution(restaurantId, lastDays)

    res.status(200).json({ data })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ errors: err.message })
    }
    res.status(500).json({ errors: 'Get weekly foot trafic distribution data failed' })
  }
}
