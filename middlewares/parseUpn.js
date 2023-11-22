import jwt from 'jsonwebtoken'
import util from 'util'

const jwtVerify = util.promisify(jwt.verify)

const parseUpn = async (req, res, next) => {
  try {
    const { upn } = req.query
    if (!upn) {
      return res.status(400).json({ errors: 'no upn' })
    }

    const decoded = await jwtVerify(upn, process.env.JWT_KEY)
    res.locals.reservationId = decoded.reservationId
    next()
  } catch (err) {
    console.error(err)

    if (err.name === 'TokenExpiredError') {
      res.status(403).json({ message: 'Invalid token' })
    } else if (err.name === 'JsonWebTokenError') {
      res.status(403).json({ message: 'Invalid token' })
    } else {
      res.status(500).json({ errors: 'Parse upn failed' })
    }
  }
}

export default parseUpn
