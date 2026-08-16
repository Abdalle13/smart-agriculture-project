import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES, APP_NAME } from '../utils/constants'
import {
  FiGrid, FiUsers, FiRadio, FiBarChart2, FiZap, FiMessageSquare,
  FiLogOut, FiMenu, FiX, FiShield, FiBell, FiFileText
} from 'react-icons/fi'
import logo from '../assets/logo.svg'
import api from '../services/api'

const adminNavItems = [
  { path: ROUTES.ADMIN_DASHBOARD,    label: 'Overview',            Icon: FiGrid      },
  { path: ROUTES.ADMIN_USERS,        label: 'Farmer Management',   Icon: FiUsers     },
  { path: ROUTES.ADMIN_SENSORS,      label: 'Field Node Management', Icon: FiRadio     },
  { path: ROUTES.ADMIN_DATA_MONITOR, label: 'Data Monitoring',     Icon: FiBarChart2 },
  { path: ROUTES.ADMIN_AI_DIAGNOSIS, label: 'Diagnosis',        Icon: FiZap       },
  { path: ROUTES.ADMIN_SUPPORT,      label: 'Support Messages',    Icon: FiMessageSquare },
  { path: ROUTES.ADMIN_REPORTS,      label: 'Reports',             Icon: FiFileText  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSupportCount, setOpenSupportCount] = useState(0)

  useEffect(() => {
    api.get('/contact/all?status=Open')
      .then(res => setOpenSupportCount(res.data.data?.length || 0))
      .catch(() => {})
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  const getPageTitle = () => {
    const matched = adminNavItems.find(item => item.path === location.pathname)
    return matched ? matched.label : 'Administrator Panel'
  }

  const getInitials = (name) => {
    if (!name) return 'SA'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 overflow-hidden">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 p-6 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-sm
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        <div className="space-y-8">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="AgriSense" className="w-10 h-10 rounded-xl shadow-sm" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">{APP_NAME}</h1>
              <span className="text-[10px] text-emerald-600 font-semibold tracking-wider uppercase">System Admin</span>
            </div>
            <button
              className="lg:hidden ml-auto p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => setMobileOpen(false)}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Control center badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Control Center</p>
            <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
              Afgoye District
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <FiShield className="w-3 h-3 text-emerald-500 shrink-0" />
              Full system access
            </p>
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5">
            {adminNavItems.map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{label}</span>
                {path === ROUTES.ADMIN_SUPPORT && openSupportCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {openSupportCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User card + logout */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold font-mono text-sm">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Super Admin'}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> System Admin
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <FiLogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top header */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-30 shadow-sm">

          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">{getPageTitle()}</h2>
          </div>

          {/* Support notifications */}
          <button
            onClick={() => navigate(ROUTES.ADMIN_SUPPORT)}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all cursor-pointer"
          >
            <FiBell className="w-5 h-5" />
            {openSupportCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {openSupportCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
