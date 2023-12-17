import { isUserHasRole } from '../models/role.js'

const authorize = (roleName) => async (req, res, next) => {
  try {
    const { userId } = res.locals
    const { restaurantId } = req.params
    const role = `${roleName}_restaurantId_${restaurantId}`
    if (await isUserHasRole(userId, role)) {
      next()
      return
    }
    res.status(403).json({ errors: 'authorization failed' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(403).json({ errors: err.message })
    }
    res.status(403).json({ errors: 'authorization failed' })
  }
}

export default authorize
