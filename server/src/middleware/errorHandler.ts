import { Request, Response, NextFunction } from 'express'
import { AppError } from '../shared/errors/app-error.js'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err)

  // Handle AppError and its subclasses (ValidationError, NotFoundError, etc.)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON())
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.message })
  }

  return res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  })
}

