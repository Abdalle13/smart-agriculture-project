import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with that email address.' })
    }

    if (!user.isApproved) {
      return res.status(403).json({ success: false, message: 'Your account is pending administrator approval. Please contact your admin.' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' })
    }

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      fieldName: user.fieldName,
      location: user.location,
      sensorIds: user.sensorIds,
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
 * @desc    Register a new farmer access request (public — pending approval)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { name, email, password, fieldName, location } = req.body

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' })
    }
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already registered' })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'farmer',
      fieldName,
      location,
      sensorIds: [],
      isApproved: false,
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
    const users = await User.find({}).sort({ createdAt: -1 })
    res.json({ success: true, users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Toggle user active status (Admin only) — cannot self-deactivate
 * @route   PUT /api/auth/users/:id/status
 * @access  Private/Admin
 */
export const updateUserStatus = async (req, res) => {
  try {
    // ── Self-protection guard ──────────────────────────────────────────────────
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own account status.',
      })
    }

    const existing = await User.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: !existing.isApproved },
      { new: true, runValidators: false }
    )

    res.json({ success: true, user: updatedUser })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update user profile (Admin only) — cannot self-delete, cannot edit own role
 * @route   PUT /api/auth/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req, res) => {
  try {
    const { name, email, fieldName, location, role, sensorIds, password } = req.body
    const isSelf = req.params.id === req.user._id.toString()

    // Admins cannot change their own role
    if (isSelf && role && role !== req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role.',
      })
    }

    const existing = await User.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Check email uniqueness if changing it
    if (email && email !== existing.email) {
      const emailTaken = await User.findOne({ email })
      if (emailTaken) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another account.' })
      }
    }

    // Build update object
    const updateFields = {}
    if (name)      updateFields.name      = name
    if (email)     updateFields.email     = email
    if (fieldName !== undefined) updateFields.fieldName = fieldName
    if (location !== undefined) updateFields.location  = location
    if (role)      updateFields.role      = role
    if (sensorIds) updateFields.sensorIds = sensorIds

    // Handle password change separately — needs hashing
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10)
      updateFields.password = await bcrypt.hash(password, salt)
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: false }
    )

    res.json({ success: true, user: updatedUser })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Admin creates a user directly (active immediately)
 * @route   POST /api/auth/users
 * @access  Private/Admin
 */
export const createUser = async (req, res) => {
  const { name, email, password, role, fieldName, location, sensorIds } = req.body

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'farmer',
      fieldName: fieldName || '',
      location: location || 'Afgoye, Somalia',
      sensorIds: sensorIds || [],
      isApproved: true,
    })

    res.status(201).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Delete user (Admin only) — cannot delete self or other admins
 * @route   DELETE /api/auth/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    // ── Self-protection guard ──────────────────────────────────────────────────
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account.',
      })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted.' })
    }

    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'User removed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
