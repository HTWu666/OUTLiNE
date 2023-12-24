import { validationResult } from 'express-validator'

const handleValidationResult = (req, res, next) => {
  const errorFormatter = ({ path }) => `Invalid ${path}`
  const result = validationResult(req).formatWith(errorFormatter)

  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() })
  }

  next()
}

export default handleValidationResult
