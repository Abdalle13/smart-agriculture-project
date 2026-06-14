import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * Protect routes - verify JWT token
 */
export const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_agrisense_key_2026')

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user profile not found' })
      }

      if (!req.user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is pending activation by Admin' })
      }

      next()
    } catch (error) {
      console.error('JWT Token Verification Error:', error.message)
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' })
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, authorization header missing' })
  }
}

/**
 * Grant access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      })
    }
    next()
  }
}
