import express from 'express'
import multer from 'multer'
import { protect, authorize } from '../middleware/auth.js'
import {
  createDiagnosis,
  getMyDiagnoses,
  getAllDiagnoses,
  getDiagnosisStats,
} from '../controllers/diagnosisController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Farmer
router.post('/',        protect, authorize('farmer'), upload.single('image'), createDiagnosis)
router.get('/my',       protect, authorize('farmer'), getMyDiagnoses)

// Admin
router.get('/stats',    protect, authorize('admin'),  getDiagnosisStats)
router.get('/all',      protect, authorize('admin'),  getAllDiagnoses)

export default router
