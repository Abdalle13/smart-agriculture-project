import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUsers, FiUserCheck, FiRadio,
  FiRefreshCw, FiChevronRight, FiActivity, FiCpu, FiTrendingUp
} from 'react-icons/fi'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'
import api from '../../services/api'
import { ROUTES } from '../../utils/constants'

const SEVERITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#3b82f6', None: '#10b981', Unknown: '#94a3b8' }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const navigate = useNavigate()
  const [readings,   setReadings]   = useState([])
  const [farmers,    setFarmers]    = useState([])
  const [diagnoses,  setDiagnoses]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [pending,    setPending]    = useState(0)
  const [fetchError, setFetchError] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const [sRes, uRes, rRes, dRes] = await Promise.all([
        api.get('/sensors'),
        api.get('/auth/users'),
        api.get('/sensors/readings/all'),
        api.get('/diagnosis/all?range=30d'),
      ])

      const allNodes     = sRes.data.data  || []
      const allUsers     = uRes.data.users  || []
      const allReadings  = rRes.data.data   || []
      const allDiagnoses = dRes.data.data   || []

      const farmerList = allUsers.filter(u => u.role === 'farmer')
      const active     = farmerList.filter(u => u.isApproved).length
      const pend       = farmerList.filter(u => !u.isApproved).length

      setPending(pend)
      setFarmers(farmerList)
      setReadings(allReadings)
      setDiagnoses(allDiagnoses)
      setStats({
        totalFarmers:   farmerList.length,
        activeFarmers:  active,
        totalNodes:     allNodes.length,
        totalDiagnoses: allDiagnoses.length,
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Combined telemetry trend across all field nodes (readings arrive newest-first, capped at 500)
  const sensorChartData = [...readings]
    .slice(0, 30)
    .reverse()
    .map(r => ({
      time:        new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      nitrogen:    r.nitrogen,
      phosphorus:  r.phosphorus,
      potassium:   r.potassium,
      temperature: r.temperature,
      moisture:    r.moisture,
    }))

  // Cumulative farmer growth over time (from each farmer's registration date)
  const farmerGrowthData = (() => {
    if (farmers.length === 0) return []
    const sorted = [...farmers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    const byDay = {}
    sorted.forEach(f => {
      const day = new Date(f.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      byDay[day] = (byDay[day] || 0) + 1
    })
    let cumulative = 0
    return Object.entries(byDay).map(([day, count]) => {
      cumulative += count
      return { day, farmers: cumulative }
    })
  })()

  // Diagnosis breakdown by severity (last 30 days)
  const diagnosisSeverityData = ['High', 'Medium', 'Low', 'None', 'Unknown'].map(severity => ({
    severity,
    count: diagnoses.filter(d => d.severity === severity).length,
  }))

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading system overview…</p>
      </div>
    )
  }

  return (
    <div className="page-container space-y-7">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">Overview of all registered farmers, field nodes, and live sensor activity</p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Fetch error banner ──────────────────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <FiActivity size={15} className="shrink-0 text-red-500" />
            <span className="font-semibold">Failed to load dashboard data. Check server connection.</span>
          </div>
          <button onClick={fetchData} className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* ── Pending approvals banner ──────────────────────────────────────────── */}
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <FiUserCheck size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">{pending} Pending Approval{pending > 1 ? 's' : ''}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Farmers awaiting account access</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.ADMIN_USERS)}
            className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Review
          </button>
        </div>
      )}

      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Farmers',   value: stats?.totalFarmers,   Icon: FiUsers,     iconBg: 'bg-slate-100 border-slate-200',    iconColor: 'text-slate-500',   valColor: 'text-slate-800'   },
          { label: 'Active',    value: stats?.activeFarmers,  Icon: FiUserCheck, iconBg: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600', valColor: 'text-emerald-700' },
          { label: 'Nodes',     value: stats?.totalNodes,     Icon: FiRadio,     iconBg: 'bg-blue-50 border-blue-200',       iconColor: 'text-blue-500',    valColor: 'text-blue-700'    },
          { label: 'Diagnoses', value: stats?.totalDiagnoses, Icon: FiCpu,       iconBg: 'bg-violet-50 border-violet-200',   iconColor: 'text-violet-600',  valColor: 'text-violet-700'  },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-2 sm:gap-4 shadow-sm">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center ${s.iconBg} ${s.iconColor} shrink-0`}>
              <s.Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl sm:text-2xl font-black ${s.valColor}`}>{s.value ?? 'N/A'}</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Farmer Growth */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FiTrendingUp size={14} className="text-emerald-500" /> Farmer Growth
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cumulative registered farmers over time</p>
          </div>
          {farmerGrowthData.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-2 text-slate-400">
              <FiUsers size={22} />
              <p className="text-sm font-bold text-slate-600">No farmers yet</p>
            </div>
          ) : (
            <div className="px-4 pt-4 pb-2">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={farmerGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="farmers" name="Farmers" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Diagnosis Severity */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FiCpu size={14} className="text-emerald-500" /> AI Diagnosis Activity
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Scans by severity, last 30 days</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.ADMIN_AI_DIAGNOSIS)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              Details <FiChevronRight size={12} />
            </button>
          </div>
          {diagnoses.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-2 text-slate-400">
              <FiCpu size={22} />
              <p className="text-sm font-bold text-slate-600">No diagnoses yet</p>
            </div>
          ) : (
            <div className="px-4 pt-4 pb-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={diagnosisSeverityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="severity" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="count" name="Scans" radius={[6, 6, 0, 0]}>
                    {diagnosisSeverityData.map(d => (
                      <Cell key={d.severity} fill={SEVERITY_COLORS[d.severity]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Sensor Telemetry Trend ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Sensor Telemetry Trend</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Live N/P/K, temperature &amp; moisture across all field nodes</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.ADMIN_DATA_MONITOR)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            Full History <FiChevronRight size={12} />
          </button>
        </div>

        {sensorChartData.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FiActivity size={22} />
            </div>
            <p className="text-sm font-bold text-slate-600">No sensor readings yet</p>
          </div>
        ) : (
          <div className="px-4 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={sensorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                  tickLine={false} axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                  tickLine={false} axisLine={false}
                  width={36}
                />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                <Line type="monotone" dataKey="nitrogen"    name="N"     stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="phosphorus"  name="P"     stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="potassium"   name="K"     stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="temperature" name="Temp"  stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="moisture"    name="Moist" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  )
}
