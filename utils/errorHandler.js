export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.message = message
    this.name = 'ValidationError'
  }
}

export const errorHandler = (err, req, res, next) => {
  console.error(err)
  if (err instanceof ValidationError) {
    return res.status(400).json({ errors: err.message })
  }
  if (err instanceof Error) {
    return res.status(500).json({ errors: err.message })
  }
  res.status(500).send('Oops, unknown error')
}
