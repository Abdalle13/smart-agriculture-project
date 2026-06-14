import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES, ROLES } from '../../utils/constants'

// Eye toggle icon (inline SVG)
const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, setError } = useAuth()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [rememberMe,  setRememberMe]  = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setFormLoading(true)
    try {
      const user = await login(email, password)
      navigate(
        user.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD : ROUTES.FARMER_DASHBOARD,
        { replace: true }
      )
    } catch {
      // error is set inside AuthContext
    } finally {
      setFormLoading(false)
    }
  }

  const isSubmitting = loading || formLoading

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">

      <div className="bg-white w-full max-w-md p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.08)] flex flex-col space-y-6">

        {/* ── Premium Logo Header ── */}
        <div className="flex flex-col items-center text-center">
          {/* Outer glow ring */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl scale-110" />
            {/* Logo tile — gradient square */}
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              {/* Inner shine */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 to-transparent" />
              <span className="text-4xl relative z-10">🌾</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AgriSense</h1>
          <p className="text-xs font-medium text-slate-400 tracking-widest uppercase mt-1">
            Smart Agriculture · Afgoye District
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-slate-100" />

        {/* ── Welcome heading ── */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-0.5">Sign in to your AgriSense account</p>
        </div>

        {/* ── Error alert ── */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 text-sm animate-fade-in">
            <span className="text-lg leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-5" id="login-form">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="you@agrisense.io"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-sm outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Password
              </label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                id="forgot-password"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-sm outline-none pr-12"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors p-1"
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-3">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-emerald-600"
            />
            <label htmlFor="remember-me" className="text-sm text-slate-600 cursor-pointer select-none">
              Remember me for 30 days
            </label>
          </div>

          {/* Sign In button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200 text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* ── Footer ── */}
        <div className="text-center space-y-2 pt-1">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Sign Up here
            </Link>
          </p>
          <p className="text-xs text-slate-400 font-mono">
            AgriSense v1.0 · Afgoye District Agriculture Programme
          </p>
        </div>

      </div>
    </div>
  )
}
