import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_agrisense_key_2026', {
    expiresIn: '30d',
  })
}

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    // Check for user email (include password field explicitly)
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is pending administrator approval' })
    }

    // Check password
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Prepare safe user object
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      fieldName: user.fieldName,
      location: user.location,
      sensorIds: user.sensorIds,
      isActive: user.isActive,
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: safeUser,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Register a new user access request
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { name, email, password, fieldName, location } = req.body

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already registered' })
    }

    // Create new farmer user (needs admin approval before active)
    const user = await User.create({
      name,
      email,
      password,
      role: 'farmer',
      fieldName,
      location,
      sensorIds: [], // Admins deploy sensors later
      isActive: false, // Inactive by default for RBAC approval
    })

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Registration request received. Pending admin approval.',
      })
    } else {
      res.status(400).json({ success: false, message: 'Invalid user registration parameters' })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
    res.json({ success: true, users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update user active status (Admin only)
 * @route   PUT /api/auth/users/:id/status
 * @access  Private/Admin
 */
export const updateUserStatus = async (req, res) => {
  try {
    // First fetch to get the current isActive value
    const existing = await User.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Use findByIdAndUpdate to bypass pre-save hook & password validation
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !existing.isActive },
      { new: true, runValidators: false }
    )

    res.json({ success: true, user: updatedUser })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/auth/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin users' })
    }
    // Use findByIdAndDelete to avoid triggering save hooks
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'User removed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
