import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ROUTES, ROLES } from './utils/constants'

// Lazy page imports (code-split per route)
import LoginPage       from './pages/auth/LoginPage'
import RegisterPage    from './pages/auth/RegisterPage'

import AdminLayout            from './layouts/AdminLayout'
import AdminOverview          from './pages/admin/AdminOverview'
import AdminFarmerManagement  from './pages/admin/AdminFarmerManagement'
import AdminFieldNodes        from './pages/admin/AdminFieldNodes'
import AdminDataMonitoring    from './pages/admin/AdminDataMonitoring'
import AdminAIDiagnosis       from './pages/admin/AdminAIDiagnosis'

import FarmerLayout           from './layouts/FarmerLayout'
import FarmerDashboard        from './pages/farmer/FarmerDashboard'
import FarmerSensors          from './pages/farmer/FarmerSensors'
import FarmerWeather          from './pages/farmer/FarmerWeather'
import FarmerDiagnosis        from './pages/farmer/FarmerDiagnosis'
import FarmerDiagnosisHistory from './pages/farmer/FarmerDiagnosisHistory'

// Loading Spinner
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-700 border-t-primary-400 rounded-full animate-spin" />
      <p className="text-primary-400 text-sm font-medium animate-pulse">Loading AgriSense...</p>
    </div>
  )
}

// Protected Route Guard
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />
  if (requiredRole && user?.role !== requiredRole) {
    // Wrong role, redirect to their own home
    return <Navigate to={
      user?.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.FARMER_DASHBOARD
    } replace />
  }
  return children
}

// Public Route Guard (redirect if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (isAuthenticated) {
    return <Navigate to={
      user?.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.FARMER_DASHBOARD
    } replace />
  }
  return children
}

// Router
function AppRouter() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* Auth routes (public only) */}
      <Route path={ROUTES.LOGIN}           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path={ROUTES.REGISTER}        element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={ROLES.ADMIN}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
        <Route path="dashboard"    element={<AdminOverview />} />
        <Route path="users"        element={<AdminFarmerManagement />} />
        <Route path="sensors"      element={<AdminFieldNodes />} />
        <Route path="data-monitor" element={<AdminDataMonitoring />} />
        <Route path="ai-diagnosis" element={<AdminAIDiagnosis />} />
      </Route>

      {/* Farmer routes */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute requiredRole={ROLES.FARMER}>
            <FarmerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.FARMER_DASHBOARD} replace />} />
        <Route path="dashboard"         element={<FarmerDashboard />} />
        <Route path="sensors"           element={<FarmerSensors />} />
        <Route path="weather"           element={<FarmerWeather />} />
        <Route path="diagnosis"         element={<FarmerDiagnosis />} />
        <Route path="diagnosis/history" element={<FarmerDiagnosisHistory />} />
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}

// App Root
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  )
}
