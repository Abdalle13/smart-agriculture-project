import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { mockLogin } from '../services/mockData'
import { STORAGE_KEYS, ROLES, ROUTES } from '../utils/constants'

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)  // true on first mount while restoring session
  const [error,   setError]   = useState(null)

  // ── Restore session from localStorage on app load ──────────────────────────
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const storedUser  = localStorage.getItem(STORAGE_KEYS.USER)
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null)
    setLoading(true)
    try {
      // Real API Integration
      const { data: res } = await api.post('/auth/login', { email, password })
      const newToken = res.token
      const newUser = res.user

      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
      localStorage.setItem(STORAGE_KEYS.USER,  JSON.stringify(newUser))

      setToken(newToken)
      setUser(newUser)
      return newUser  // caller can use role for redirect
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    setToken(null)
    setUser(null)
  }, [])

  // ── Role helpers ───────────────────────────────────────────────────────────
  const isAdmin  = user?.role === ROLES.ADMIN
  const isFarmer = user?.role === ROLES.FARMER
  const isAuthenticated = !!token && !!user

  // ── Default route after login by role ─────────────────────────────────────
  const getHomeRoute = useCallback(() => {
    if (!user) return ROUTES.LOGIN
    return user.role === ROLES.ADMIN
      ? ROUTES.ADMIN_DASHBOARD
      : ROUTES.FARMER_DASHBOARD
  }, [user])

  const value = {
    user,
    token,
    loading,
    error,
    setError,
    isAuthenticated,
    isAdmin,
    isFarmer,
    login,
    logout,
    getHomeRoute,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default AuthContext
