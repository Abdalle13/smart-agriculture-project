import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getAdminReportSummary,
  downloadAdminReportPDF,
  getFarmerReportSummary,
  downloadFarmerReportPDF,
} from '../controllers/reportController.js'

const router = express.Router()

// Admin
router.get('/admin',     protect, authorize('admin'), getAdminReportSummary)
router.get('/admin/pdf', protect, authorize('admin'), downloadAdminReportPDF)

// Farmer
router.get('/farmer',     protect, authorize('farmer'), getFarmerReportSummary)
router.get('/farmer/pdf', protect, authorize('farmer'), downloadFarmerReportPDF)

export default router
