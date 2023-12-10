import jwt from 'jsonwebtoken'
import util from 'util'

const jwtVerify = util.promisify(jwt.verify)

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    let token
    if (authHeader) {
      token = authHeader.replace('Bearer ', '')
    } else {
      token = req.cookies ? req.cookies.jwtToken : null
    }
    if (!token) {
      return res.status(401).redirect('/')
    }
    const decoded = await jwtVerify(token, process.env.JWT_KEY)
    const { userId } = decoded
    res.locals.userId = userId
    next()
  } catch (err) {
    console.error(err)

    if (err.name === 'TokenExpiredError') {
      res.status(403).redirect('/')
    } else if (err.name === 'JsonWebTokenError') {
      res.status(403).redirect('/')
    } else {
      res.status(500).json({ errors: 'authenticate failed' })
    }
  }
}

export default authenticate
