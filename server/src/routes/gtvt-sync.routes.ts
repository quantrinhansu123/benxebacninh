import { Router } from 'express'
import { getGtvtLastSync, syncGtvtRoutesSchedules } from '../controllers/gtvt-sync.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)
router.use(authorize('admin'))

router.post('/sync-routes-schedules', syncGtvtRoutesSchedules)
router.get('/last-sync', getGtvtLastSync)

export default router

