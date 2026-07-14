import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiUsers, FiUserCheck, FiRadio,
  FiRefreshCw, FiChevronRight, FiCheckCircle,
  FiPlus, FiActivity, FiMapPin, FiUser, FiClock, FiCpu
} from 'react-icons/fi'
import api from '../../services/api'
import { ROUTES } from '../../utils/constants'

const fmt = (v) => (v != null ? Number(v).toFixed(1) : '—')


function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ─── Farm Card ────────────────────────────────────────────────────────────────
function FarmCard({ farmer, node, latestReading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Top accent */}
      <div className="h-1 w-full bg-emerald-500" />

      <div className="p-4 space-y-3">
        {/* Farmer info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">
            {farmer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{farmer.name}</p>
            {farmer.fieldName && (
              <p className="text-[11px] text-slate-400 truncate">{farmer.fieldName}</p>
            )}
          </div>
          {!node && <span className="ml-auto text-[10px] text-slate-300 italic shrink-0">No node</span>}
        </div>

        {/* Location */}
        {farmer.location && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <FiMapPin size={10} className="shrink-0" />
            <span className="truncate">{farmer.location}</span>
          </div>
        )}

        {/* Node badge */}
        {node && (
          <div className="flex items-center gap-1.5">
            <FiRadio size={10} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-600">{node.name}</span>
            <span className="text-[10px] text-slate-300 font-mono">{node._id}</span>
          </div>
        )}

        {/* Latest reading mini row */}
        {latestReading ? (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
            {[
              { label: 'N',     val: latestReading.nitrogen,    color: 'text-blue-600'   },
              { label: 'Temp',  val: latestReading.temperature, color: 'text-red-500'    },
              { label: 'Moist', val: latestReading.moisture,    color: 'text-emerald-600'},
            ].map(p => (
              <div key={p.label} className="text-center bg-slate-50 rounded-xl py-1.5">
                <p className={`text-xs font-black font-mono ${p.color}`}>{fmt(p.val)}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">{p.label}</p>
              </div>
            ))}
          </div>
        ) : node ? (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-300 italic text-center">No readings yet</p>
          </div>
        ) : null}

        {/* Last seen */}
        {latestReading && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-end">
            <FiClock size={9} />
            <span>{timeAgo(latestReading.timestamp)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ label, sub, Icon, iconBg, iconColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm text-left transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${iconBg} ${iconColor} shrink-0`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700">{label}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <FiChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const navigate = useNavigate()
  const [farmers,    setFarmers]    = useState([])
  const [nodes,      setNodes]      = useState([])
  const [readings,   setReadings]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [pending,    setPending]    = useState(0)
  const [fetchError, setFetchError] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const [sRes, uRes, rRes] = await Promise.all([
        api.get('/sensors'),
        api.get('/auth/users'),
        api.get('/sensors/readings/all'),
      ])

      const allNodes    = sRes.data.data  || []
      const allUsers    = uRes.data.users  || []
      const allReadings = rRes.data.data   || []

      const farmerList = allUsers.filter(u => u.role === 'farmer')
      const active     = farmerList.filter(u => u.isApproved).length
      const pend       = farmerList.filter(u => !u.isApproved).length

      setPending(pend)
      setFarmers(farmerList)
      setNodes(allNodes)
      setReadings(allReadings)
      setStats({
        totalFarmers:  farmerList.length,
        activeFarmers: active,
        totalNodes:    allNodes.length,
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // For each farmer, find their node + latest reading
  const farmCards = farmers.map(f => {
    const sensorId = (f.sensorIds || [])[0]
    const node     = nodes.find(n => n._id === sensorId) || null
    const reading  = node
      ? readings.find(r => r.sensorId === node._id) || null
      : null
    return { farmer: f, node, latestReading: reading }
  })

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

      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Farmers',  value: stats?.totalFarmers,  Icon: FiUsers,     iconBg: 'bg-slate-100 border-slate-200',    iconColor: 'text-slate-500',   valColor: 'text-slate-800'   },
          { label: 'Active',   value: stats?.activeFarmers, Icon: FiUserCheck, iconBg: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600', valColor: 'text-emerald-700' },
          { label: 'Nodes',    value: stats?.totalNodes,    Icon: FiRadio,     iconBg: 'bg-blue-50 border-blue-200',       iconColor: 'text-blue-500',    valColor: 'text-blue-700'    },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-2 sm:gap-4 shadow-sm">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center ${s.iconBg} ${s.iconColor} shrink-0`}>
              <s.Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl sm:text-2xl font-black ${s.valColor}`}>{s.value ?? '—'}</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Farms Overview */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Farms Overview</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All registered farmers and their field nodes</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Manage <FiChevronRight size={12} />
            </button>
          </div>

          {farmCards.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <FiUser size={22} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">No farmers registered yet</p>
                <p className="text-xs mt-1">Add farmers from the Farmer Management page.</p>
              </div>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {farmCards.map(({ farmer, node, latestReading }) => (
                <FarmCard
                  key={farmer._id}
                  farmer={farmer}
                  node={node}
                  latestReading={latestReading}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">

          {/* Pending banner */}
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

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-800">Quick Actions</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Common admin shortcuts</p>
            </div>
            <div className="p-4 space-y-2">
              <QuickAction
                label="Farmer Management"
                sub="Manage accounts and approvals"
                Icon={FiCheckCircle}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600 border-emerald-200"
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
              />
              <QuickAction
                label="Register New Node"
                sub="Add a new IoT field probe"
                Icon={FiPlus}
                iconBg="bg-blue-50"
                iconColor="text-blue-600 border-blue-200"
                onClick={() => navigate(ROUTES.ADMIN_SENSORS)}
              />
              <QuickAction
                label="Data Monitoring"
                sub="View live telemetry logs"
                Icon={FiActivity}
                iconBg="bg-blue-50"
                iconColor="text-blue-600 border-blue-200"
                onClick={() => navigate(ROUTES.ADMIN_DATA_MONITOR)}
              />
              <QuickAction
                label="AI Diagnosis"
                sub="Crop disease detection results"
                Icon={FiCpu}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600 border-emerald-200"
                onClick={() => navigate(ROUTES.ADMIN_AI_DIAGNOSIS)}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
