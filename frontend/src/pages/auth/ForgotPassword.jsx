import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    
    // Simulate network request to send password reset email
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white w-full max-w-md p-8 sm:p-10 rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.08)] flex flex-col space-y-6">
        
        {/* ── Premium Logo Header ── */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl scale-110" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 to-transparent" />
              <span className="text-4xl relative z-10">🌾</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AgriSense</h1>
          <p className="text-xs font-medium text-slate-400 tracking-widest uppercase mt-1">
            Account Recovery
          </p>
        </div>

        <div className="border-t border-slate-100" />

        {!success ? (
          <>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Forgot your password?</h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Enter your email address below and we'll send you a secure link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agrisense.io"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200 text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending link...
                  </>
                ) : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4 animate-fade-in py-2">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
            <p className="text-sm text-slate-500 leading-relaxed px-2">
              We've sent password reset instructions to <span className="font-semibold text-slate-700">{email}</span>.
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link to={ROUTES.LOGIN} className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  )
}
