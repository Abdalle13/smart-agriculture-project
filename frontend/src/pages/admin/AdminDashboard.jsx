import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockGetSystemStats, mockGetAllSensors } from '../../services/mockData'
import { ROUTES } from '../../utils/constants'

// Icons (inline SVG)
const UsersIcon = () => (
  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const SensorIcon = () => (
  <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const DiagnosisIcon = () => (
  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const statsData = await mockGetSystemStats()
      const sensorData = await mockGetAllSensors()
      setStats(statsData)
      setSensors(sensorData)
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-emerald-600 animate-pulse">Loading dashboard telemetry...</p>
      </div>
    )
  }

  // Activity Feed Mock
  const recentActivities = [
    { id: 1, type: 'sensor', message: 'Probe Sensor C reported Critical Battery level (18%)', time: '10 mins ago', level: 'warning' },
    { id: 2, type: 'diagnosis', message: 'Farmer Abukar Hassan diagnostic scan: detected Crop Leaf Blight (91%)', time: '1 hr ago', level: 'info' },
    { id: 3, type: 'user', message: 'Fadumo Warsame registered a new plot: Warsame South Field', time: '3 hrs ago', level: 'success' },
    { id: 4, type: 'sensor', message: 'IoT Sensor D in East Sector went offline (battery dead)', time: '1 day ago', level: 'danger' },
  ]

  return (
    <div className="page-container space-y-6">
      
      {/* ── Heading & Sync Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 text-sm">Real-time statistics & infrastructure overview for Afgoye District</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary self-start sm:self-auto py-2"
        >
          🔄 Refresh Telemetry
        </button>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="dashboard-grid">
        {/* Total Farmers */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Registered Farmers</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <UsersIcon />
            </div>
          </div>
          <p className="sensor-value text-slate-900">{stats?.totalFarmers || 0}</p>
          <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <span>●</span> {stats?.activeFarmers || 0} active accounts
          </span>
        </div>

        {/* Total Sensors */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">IoT Sensor Probes</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center">
              <SensorIcon />
            </div>
          </div>
          <p className="sensor-value text-cyan-700">{stats?.totalSensors || 0}</p>
          <div className="text-[10px] text-slate-500 flex gap-2 font-medium mt-1">
            <span className="text-emerald-600">● {stats?.onlineSensors} Online</span>
            <span className="text-amber-600">● {stats?.warningSensors} Warning</span>
          </div>
        </div>

        {/* Diagnoses Today */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Crop Diagnoses</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
              <DiagnosisIcon />
            </div>
          </div>
          <p className="sensor-value text-purple-700">{stats?.diagnosesToday || 0}</p>
          <span className="text-xs text-slate-500 font-medium">Scans performed in the last 24 hours</span>
        </div>

        {/* System Health */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">System Gateway</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <AlertIcon />
            </div>
          </div>
          <p className="sensor-value text-amber-700">{stats?.systemHealth || 'Operational'}</p>
          <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <span>✔</span> Node.js & Mongoose API connected
          </span>
        </div>
      </div>

      {/* ── Main Dashboard Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Sensor Health List */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="section-title">IoT Telemetry Node Health</h2>
            <button
              onClick={() => navigate(ROUTES.ADMIN_SENSORS)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              Manage Probes →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Probe Name</th>
                  <th className="py-3 px-2">Assigned Field</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Battery</th>
                  <th className="py-3 px-2 text-right">Last Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sensors.map((sensor) => {
                  const getStatusBadge = (status) => {
                    if (status === 'online') return <span className="badge-green">Online</span>
                    if (status === 'warning') return <span className="badge-amber">Low Battery</span>
                    return <span className="badge-red">Offline</span>
                  }
                  
                  const getBatteryColor = (bat) => {
                    if (bat > 50) return 'text-emerald-600'
                    if (bat > 20) return 'text-amber-600'
                    return 'text-red-600'
                  }

                  return (
                    <tr key={sensor._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-semibold text-slate-800">{sensor.name}</td>
                      <td className="py-3 px-2 text-slate-500">{sensor.location}</td>
                      <td className="py-3 px-2">{getStatusBadge(sensor.status)}</td>
                      <td className={`py-3 px-2 font-mono font-bold ${getBatteryColor(sensor.battery)}`}>
                        {sensor.battery}%
                      </td>
                      <td className="py-3 px-2 text-right text-xs text-slate-400 font-mono">
                        {new Date(sensor.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Recent logs / quick actions */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="card space-y-4">
            <h2 className="section-title border-b border-slate-100 pb-3">Quick Controls</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-sm font-medium transition-all group"
              >
                <span className="text-slate-700">Approve Farm Access Requests</span>
                <span className="text-emerald-600 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button
                onClick={() => navigate(ROUTES.ADMIN_SENSORS)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-sm font-medium transition-all group"
              >
                <span className="text-cyan-700">Deploy New Probe Sensor</span>
                <span className="text-cyan-600 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button
                onClick={() => navigate(ROUTES.ADMIN_SYSTEM)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-sm font-medium transition-all group"
              >
                <span className="text-purple-700">Check Server Logs & Gateways</span>
                <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="card space-y-4">
            <h2 className="section-title border-b border-slate-100 pb-3">District Activity Feed</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {recentActivities.map((act) => {
                const getDot = (level) => {
                  if (level === 'success') return 'bg-emerald-500'
                  if (level === 'warning') return 'bg-amber-500'
                  if (level === 'danger') return 'bg-red-500'
                  return 'bg-blue-500'
                }
                return (
                  <div key={act.id} className="flex gap-3 text-xs leading-normal">
                    <span className={`w-1.5 h-1.5 rounded-full ${getDot(act.level)} shrink-0 mt-1.5`} />
                    <div className="space-y-0.5">
                      <p className="text-slate-700">{act.message}</p>
                      <p className="text-slate-400 font-mono">{act.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
