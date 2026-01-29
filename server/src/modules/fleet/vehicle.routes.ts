/**
 * Vehicle Routes
 * API endpoints for vehicle operations
 */

import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleDocumentAuditLogs,
  getAllDocumentAuditLogs,
} from './controllers/vehicle.controller.js'

const router = Router()

// Apply authentication to all routes
router.use(authenticate)

// Vehicle CRUD
// GET operations - accessible to all authenticated users
router.get('/', getAllVehicles)
router.get('/document-audit-logs/all', getAllDocumentAuditLogs)
router.get('/:id/document-audit-logs', getVehicleDocumentAuditLogs)
router.get('/:id', getVehicleById)

// Write operations - require admin role
router.post('/', authorize('admin'), createVehicle)
router.put('/:id', authorize('admin'), updateVehicle)
router.delete('/:id', authorize('admin'), deleteVehicle)

export default router
