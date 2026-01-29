/**
 * Driver Routes
 * API endpoints for driver operations
 */

import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from './controllers/driver.controller.js'

const router = Router()

// Apply authentication to all routes
router.use(authenticate)

// Driver CRUD
// GET operations - accessible to all authenticated users
router.get('/', getAllDrivers)
router.get('/:id', getDriverById)

// Write operations - require admin role
router.post('/', authorize('admin'), createDriver)
router.put('/:id', authorize('admin'), updateDriver)
router.delete('/:id', authorize('admin'), deleteDriver)

export default router
