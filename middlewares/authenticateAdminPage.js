import jwt from 'jsonwebtoken'
import util from 'util'
import dotenv from 'dotenv'

dotenv.config()
const jwtVerify = util.promisify(jwt.verify)

const authenticateAdminPage = async (req, res, next) => {
  try {
    const accessToken = req.cookies.jwtToken
    if (accessToken == null) {
      return res.status(302).redirect('/')
    }

    const decoded = await jwtVerify(accessToken, process.env.JWT_KEY)
    res.locals.userId = decoded.userId
    res.locals.restaurantId = decoded.restaurantId

    next()
  } catch (err) {
    console.error(err)
    res.status(302).redirect('/')
  }
}

export default authenticateAdminPage
