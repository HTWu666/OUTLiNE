import * as dashboardModel from '../models/dashboard.js'

export const getWeeklyFootTrafficByHour = async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { lastDays } = req.query
    const data = await dashboardModel.getWeeklyFootTrafficByHour(restaurantId, lastDays)

    res.status(200).json({ data })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get weekly foot trafic by hour data failed' })
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
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get weekly foot trafic distribution data failed' })
  }
}
