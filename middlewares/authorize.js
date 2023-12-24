import { isUserHasRole } from '../models/role.js'

const authorize = (roleNames) => async (req, res, next) => {
  try {
    const { userId } = res.locals
    const { restaurantId } = req.params

    let authorized = false
    const role = roleNames.map((roleName) => `${roleName}_restaurantId_${restaurantId}`)

    if (await isUserHasRole(userId, role)) {
      authorized = true
    }

    if (authorized) {
      next()
      return
    }
    res.status(403).json({ errors: 'You have no permission' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(403).json({ errors: err.message })
    }
    res.status(403).json({ errors: 'Authorization failed' })
  }
}

export default authorize
