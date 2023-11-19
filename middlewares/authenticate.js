import jwt from 'jsonwebtoken'
import util from 'util'

const jwtVerify = util.promisify(jwt.verify)

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader == null) {
      return res.status(401).json({ errors: 'no token' })
    }

    const accessToken = authHeader.split(' ')[1]

    const decoded = await jwtVerify(accessToken, process.env.JWT_KEY)
    res.locals.userId = decoded.id
    next()
  } catch (err) {
    console.error(err)

    if (err.name === 'TokenExpiredError') {
      res.status(403).json({ message: 'Invalid token' })
    } else if (err.name === 'JsonWebTokenError') {
      res.status(403).json({ message: 'Invalid token' })
    } else {
      res.status(500).json({ errors: 'authenticate failed' })
    }
  }
}

export default authenticate
