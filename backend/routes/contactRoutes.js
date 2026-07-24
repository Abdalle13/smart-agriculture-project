import express from 'express'
import multer from 'multer'
import { protect, authorize } from '../middleware/auth.js'
import { contactLimiter } from '../middleware/rateLimiter.js'
import {
  createContact,
  getMyContacts,
  getAllContacts,
  updateContact,
  markContactsSeen,
} from '../controllers/contactController.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Farmer
router.post('/', protect, authorize('farmer'), contactLimiter, upload.single('image'), createContact)
router.get('/my',   protect, authorize('farmer'), getMyContacts)
router.patch('/mark-seen', protect, authorize('farmer'), markContactsSeen)

// Admin
router.get('/all',  protect, authorize('admin'), getAllContacts)
router.patch('/:id', protect, authorize('admin'), updateContact)

export default router
