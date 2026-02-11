import { Router } from 'express'
import { getOperationNotices } from '../controllers/operation-notice.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)
router.get('/', getOperationNotices)

export default router
