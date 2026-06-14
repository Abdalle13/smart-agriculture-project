import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES, APP_NAME } from '../utils/constants'

// Icons (inline SVG)
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const WeatherIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
)

const ScanIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h2a2 2 0 002-2v-2M18 8V6a2 2 0 00-2-2h-2M8 4H6a2 2 0 00-2 2v2m0 10v2a2 2 0 002 2h2" />
  </svg>
)


const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const farmerNavItems = [
  { path: ROUTES.FARMER_DASHBOARD, label: 'Field Dashboard',    icon: HomeIcon    },
  { path: ROUTES.FARMER_SENSORS,   label: 'Soil Probe Sensors', icon: ChartIcon   },
  { path: ROUTES.FARMER_WEATHER,   label: 'Weather Analytics',  icon: WeatherIcon },
  { path: ROUTES.FARMER_DIAGNOSIS, label: 'Crop Disease Scan',  icon: ScanIcon    },
]

export default function FarmerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const getPageTitle = () => {
    const matched = farmerNavItems.find(item => item.path === location.pathname)
    return matched ? matched.label : 'Farmer Dashboard'
  }

  const getInitials = (name) => {
    if (!name) return 'F'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 overflow-hidden">
      
      {/* ── Mobile Sidebar Drawer Backdrop ── */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar Navigation ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 p-6 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-sm
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="space-y-8">
          {/* Logo Mark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-sm border border-emerald-700/20">
              <span className="text-xl">🌾</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient-green leading-none">{APP_NAME}</h1>
              <span className="text-[10px] text-emerald-600 font-semibold tracking-wider uppercase">Farming Portal</span>
            </div>
            
            {/* Close Mobile Sidebar button */}
            <button 
              className="lg:hidden ml-auto p-1 text-slate-400 hover:text-slate-700"
              onClick={() => setMobileOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Location / Field Overview Badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Active Field</p>
            <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
              {user?.fieldName || 'My Field'}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <span>📍</span> {user?.location || 'Afgoye, Somalia'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {farmerNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold font-mono">
              {getInitials(user?.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">{user?.name || 'Farmer'}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Active Farmer
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogoutIcon />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-30 shadow-sm">
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
            >
              <MenuIcon />
            </button>
            <h2 className="text-lg font-bold text-slate-800">{getPageTitle()}</h2>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-4">
            {/* Quick alert notifications bar */}
            <div className="hidden md:flex items-center gap-3 text-xs bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 font-medium">Monitoring active plot telemetry</span>
            </div>

            {/* Notification bell */}
            <div className="relative p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Conditional Dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
