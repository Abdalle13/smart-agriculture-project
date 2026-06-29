import express from 'express'
import {
  loginUser,
  registerUser,
  getMe,
  getAllUsers,
  updateUserStatus,
  updateUser,
  createUser,
  deleteUser
} from '../controllers/authController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

//Public Routes
router.post('/login', loginUser)
router.post('/register', registerUser)

//Protected Routes
router.get('/me', protect, getMe)

//Admin User Management
router.get('/users',             protect, authorize('admin'), getAllUsers)
router.post('/users',            protect, authorize('admin'), createUser)
router.put('/users/:id',         protect, authorize('admin'), updateUser)
router.put('/users/:id/status',  protect, authorize('admin'), updateUserStatus)
router.delete('/users/:id',      protect, authorize('admin'), deleteUser)

export default router
