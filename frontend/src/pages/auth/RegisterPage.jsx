import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiInfo } from 'react-icons/fi'
import api from '../../services/api'
import { ROUTES } from '../../utils/constants'
import logo from '../../assets/logo.svg'

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

export default function RegisterPage() {
  const navigate = useNavigate()

  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldName,       setFieldName]       = useState('')
  const [location,        setLocation]        = useState('Afgoye, Somalia')
  const [showPass,        setShowPass]        = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [isSuccess,       setIsSuccess]       = useState(false)
  const [error,           setError]           = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !email || !password || !confirmPassword || !fieldName.trim() || !location.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password, fieldName, location })
      setIsSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-4 px-4 sm:px-6 lg:px-8
      bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:22px_22px]">

      <div className="w-full max-w-md">

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.10)] overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-emerald-500" />

          <div className="p-8 sm:p-10 flex flex-col space-y-6">

            {isSuccess ? (
              /* ── Success State ── */
              <div className="flex flex-col items-center text-center space-y-5 py-4">
                <div className="relative mb-2">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl scale-125" />
                  <img src={logo} alt="AgriSense" className="relative w-20 h-20 rounded-2xl shadow-lg shadow-emerald-500/25" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Request Submitted!</h2>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Your access request has been sent to the administrator for verification.
                  </p>
                </div>
                <div className="w-full flex items-start gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 text-sm text-left">
                  <FiInfo className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                  <span>Account activations are typically processed within 24 hours. You will be notified once approved.</span>
                </div>
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all text-sm cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>

            ) : (
              <>
                {/* ── Logo Header ── */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl scale-125" />
                    <img src={logo} alt="AgriSense" className="relative w-20 h-20 rounded-2xl shadow-lg shadow-emerald-500/25" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AgriSense</h1>
                </div>

                {/* ── Divider ── */}
                <div className="border-t border-slate-100" />

                {/* ── Heading ── */}
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Request access</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Register your farm details to start monitoring</p>
                </div>

                {/* ── Error Alert ── */}
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm">
                    <span className="font-bold shrink-0 mt-0.5">!</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4" id="register-form">

                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(null) }}
                      placeholder="e.g., Fadumo Warsame"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null) }}
                      placeholder="john.doe@gmail.com"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm outline-none"
                    />
                  </div>

                  {/* Password + Confirm: side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPass ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(null) }}
                          placeholder="Min. 6 chars"
                          disabled={loading}
                          className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm outline-none pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          <EyeIcon open={showPass} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Confirm
                      </label>
                      <input
                        id="confirm-password"
                        type={showPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm outline-none"
                      />
                    </div>
                  </div>

                  {/* Field / Plot Name */}
                  <div>
                    <label htmlFor="field-name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Field / Plot Name
                    </label>
                    <input
                      id="field-name"
                      type="text"
                      required
                      value={fieldName}
                      onChange={(e) => { setFieldName(e.target.value); setError(null) }}
                      placeholder="e.g., Warsame South Field"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm outline-none"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      required
                      value={location}
                      onChange={(e) => { setLocation(e.target.value); setError(null) }}
                      placeholder="Afgoye, Somalia"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm outline-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    id="register-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : 'Submit Access Request'}
                  </button>
                </form>

                {/* ── Footer ── */}
                <div className="text-center space-y-2 pt-1">
                  <p className="text-sm text-slate-500">
                    Already have access?{' '}
                    <Link to={ROUTES.LOGIN} className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      Sign In here
                    </Link>
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
