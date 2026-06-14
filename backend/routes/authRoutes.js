import express from 'express'
import { loginUser, registerUser, getMe, getAllUsers, updateUserStatus, deleteUser } from '../controllers/authController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', loginUser)
router.post('/register', registerUser)
router.get('/me', protect, getMe)

// Admin User Management Routes
router.get('/users', protect, authorize('admin'), getAllUsers)
router.put('/users/:id/status', protect, authorize('admin'), updateUserStatus)
router.delete('/users/:id', protect, authorize('admin'), deleteUser)

export default router
