/**
 * Dispatch Routes
 * API endpoints for dispatch operations
 */

import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import {
  getAllDispatchRecords,
  getDispatchRecordById,
  createDispatchRecord,
  updateDispatchRecord,
  recordPassengerDrop,
  issuePermit,
  processPayment,
  issueDepartureOrder,
  recordExit,
  updateEntryImage,
  updateDispatchStatus,
  depart,
  deleteDispatchRecord,
  cancelDispatchRecord,
} from './controllers/dispatch.controller.js'

const router = Router()

// Apply authentication to all routes
router.use(authenticate)

// GET routes - accessible to all authenticated users
router.get('/', getAllDispatchRecords)
router.get('/:id', getDispatchRecordById)

// Workflow endpoints - require admin or dispatcher role
router.post('/', authorize('admin', 'dispatcher'), createDispatchRecord)
router.put('/:id', authorize('admin', 'dispatcher'), updateDispatchRecord)
router.delete('/:id', authorize('admin'), deleteDispatchRecord)
router.post('/:id/cancel', authorize('admin', 'dispatcher'), cancelDispatchRecord)
router.post('/:id/passenger-drop', authorize('admin', 'dispatcher'), recordPassengerDrop)
router.post('/:id/permit', authorize('admin', 'dispatcher'), issuePermit)
router.post('/:id/payment', authorize('admin', 'dispatcher'), processPayment)
router.post('/:id/departure-order', authorize('admin', 'dispatcher'), issueDepartureOrder)
router.post('/:id/exit', authorize('admin', 'dispatcher'), recordExit)
router.patch('/:id/entry-image', authorize('admin', 'dispatcher'), updateEntryImage)

// Legacy deprecated endpoints - require admin or dispatcher role
router.put('/:id/status', authorize('admin', 'dispatcher'), updateDispatchStatus)
router.post('/:id/depart', authorize('admin', 'dispatcher'), depart)

export default router
