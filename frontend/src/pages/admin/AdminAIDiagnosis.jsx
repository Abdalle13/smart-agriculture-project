import { useState, useEffect, useCallback } from 'react'
import {
  FiCpu, FiClock, FiAlertCircle, FiRefreshCw, FiUsers,
  FiShield, FiCalendar, FiCheckCircle, FiAlertTriangle, FiX, FiImage, FiUser
} from 'react-icons/fi'
import api from '../../services/api'

const getSeverityBadge = (sev) => {
  if (sev === 'High')    return <span className="badge-red">High Risk</span>
  if (sev === 'Medium')  return <span className="badge-amber">Medium Risk</span>
  if (sev === 'Low')     return <span className="badge-blue">Low Risk</span>
  if (sev === 'Unknown') return <span className="badge-gray">Unrecognized</span>
  return <span className="badge-green">Healthy Crop</span>
}

const getSeverityColor = (sev) => {
  if (sev === 'High')    return { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-500',     title: 'text-red-800'     }
  if (sev === 'Medium')  return { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-500',   title: 'text-amber-800'   }
  if (sev === 'Unknown') return { bg: 'bg-slate-50',   border: 'border-slate-200',   icon: 'text-slate-400',   title: 'text-slate-700'   }
  return                        { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', title: 'text-emerald-800' }
}

// Filter out old Gemini error strings that may be stored in DB
const isValidAdvisory = (text) => {
  if (!text || typeof text !== 'string') return false
  const errorPhrases = ['cilad ayaa', 'fadlan xiriir', 'gemini api', 'lama soo saari']
  const lower = text.toLowerCase()
  return !errorPhrases.some(p => lower.includes(p))
}

const DATE_FILTERS = [
  { label: 'Today',   value: 'today' },
  { label: '7 Days',  value: '7d'    },
  { label: '30 Days', value: '30d'   },
  { label: 'All',     value: 'all'   },
]

// Detail Modal
function DetailModal({ log, onClose }) {
  const colors = getSeverityColor(log.severity)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Scan Detail</h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1"><FiUser size={10} /> {log.farmerId?.name || 'N/A'}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><FiCalendar size={10} /> {new Date(log.createdAt).toLocaleDateString()} · {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {log.imageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ aspectRatio: '4/3' }}>
              <img src={log.imageUrl} alt="Scan" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
              <FiImage className="w-10 h-10 text-slate-300" />
            </div>
          )}

          <div className={`p-4 ${colors.bg} border ${colors.border} rounded-2xl`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detected Condition</p>
              {getSeverityBadge(log.severity)}
            </div>
            <p className="text-xl font-extrabold text-slate-800 leading-snug">{log.disease}</p>
            {log.severity !== 'Unknown' && log.confidence > 0 && (
              <p className="text-xs text-slate-500 mt-1">{(log.confidence * 100).toFixed(0)}% confidence · {log.modelUsed}</p>
            )}
          </div>

          {isValidAdvisory(log.treatment) && (
            <div className={`p-4 ${colors.bg} border ${colors.border} rounded-2xl`}>
              <div className="flex items-center gap-2 mb-2">
                {log.severity === 'None'
                  ? <FiCheckCircle className={`w-4 h-4 shrink-0 ${colors.icon}`} />
                  : <FiAlertTriangle className={`w-4 h-4 shrink-0 ${colors.icon}`} />
                }
                <p className={`text-xs font-bold uppercase tracking-wider ${colors.title}`}>
                  {log.severity === 'Unknown' ? 'Xaaladda Sawirka' : log.severity === 'None' ? 'Xaaladda Geedka' : 'Daaweynta Cudurka'}
                </p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{log.treatment}</p>
            </div>
          )}

          {isValidAdvisory(log.prevention) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <FiShield className="w-4 h-4 shrink-0 text-blue-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  {log.severity === 'Unknown' ? 'Sida Sawir Fiican Loo Qaado' : log.severity === 'None' ? 'Xaaladda Wanaagsan u Sii Wad' : 'Ka Hortaga Cudurka'}
                </p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{log.prevention}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Page
export default function AdminAIDiagnosis() {
  const [records,        setRecords]        = useState([])
  const [farmers,        setFarmers]        = useState([])
  const [stats,          setStats]          = useState({ total: 0, today: 0 })
  const [loading,        setLoading]        = useState(true)
  const [fetchError,     setFetchError]     = useState(false)
  const [selectedFarmer, setSelectedFarmer] = useState('all')
  const [dateRange,      setDateRange]      = useState('today')
  const [selectedLog,    setSelectedLog]    = useState(null)

  useEffect(() => {
    api.get('/auth/users')
      .then(res => setFarmers((res.data.users || []).filter(u => u.role === 'farmer' && u.isApproved)))
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const params = new URLSearchParams({ range: dateRange })
      if (selectedFarmer !== 'all') params.set('farmerId', selectedFarmer)
      const [histRes, statsRes] = await Promise.all([
        api.get(`/diagnosis/all?${params}`),
        api.get('/diagnosis/stats'),
      ])
      setRecords(histRes.data.data)
      setStats(statsRes.data.data)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedFarmer, dateRange])

  useEffect(() => { fetchData() }, [fetchData])

  const highCount    = records.filter(r => r.severity === 'High').length

  return (
    <div className="page-container space-y-6">

      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Diagnosis</h1>
          <p className="text-slate-400 text-sm mt-0.5">Crop disease detection results from farmer field scans</p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Diagnoses', value: stats.total,       Icon: FiCpu,         iconBg: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600', valColor: 'text-emerald-700' },
          { label: 'Today',           value: stats.today,       Icon: FiClock,        iconBg: 'bg-blue-50 border-blue-200',       iconColor: 'text-blue-500',    valColor: 'text-blue-700'    },
          { label: 'High Risk',       value: highCount,         Icon: FiAlertCircle,  iconBg: 'bg-red-50 border-red-200',         iconColor: 'text-red-500',     valColor: 'text-red-700'     },
          { label: 'Farmers',         value: farmers.length,    Icon: FiUsers,        iconBg: 'bg-slate-100 border-slate-200',    iconColor: 'text-slate-500',   valColor: 'text-slate-800'   },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center ${s.iconBg} ${s.iconColor} shrink-0`}>
              <s.Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl sm:text-2xl font-black ${s.valColor}`}>{s.value ?? '—'}</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border bg-red-50 border-red-200 text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <FiAlertCircle size={15} className="shrink-0 text-red-500" />
            <span className="font-semibold">Failed to load diagnosis history. Check server connection.</span>
          </div>
          <button onClick={fetchData} className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* ── Card Container with Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Farmer select */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FiUsers size={10} /> Farmer
              </span>
              <select
                value={selectedFarmer}
                onChange={e => setSelectedFarmer(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all min-w-[170px]"
              >
                <option value="all">All Farmers</option>
                {farmers.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-8 bg-slate-200 hidden sm:block" />

            {/* Date range */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <FiClock size={10} /> Time Range
              </span>
              <div className="flex gap-1.5">
                {DATE_FILTERS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDateRange(d.value)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      dateRange === d.value
                        ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-semibold">
            {records.length} {records.length === 1 ? 'record' : 'records'} found
          </div>
        </div>

        {/* ── Table Content ── */}
        <div className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <div className="w-9 h-9 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-sm">Loading diagnosis records…</p>
            </div>
          ) : records.length === 0 && !fetchError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <FiCpu size={26} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No diagnoses found</p>
              <p className="text-xs max-w-xs">No farmer scans found for this time range or filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Image</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Farmer</th>
                    <th className="py-3.5 px-4">Diagnosis</th>
                    <th className="py-3.5 px-4">Confidence</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((log) => (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        {log.imageUrl ? (
                          <img
                            src={log.imageUrl}
                            alt="Scan"
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <FiImage className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                        <p className="font-semibold text-slate-700">{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-slate-400 text-[11px]">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 text-xs">{log.farmerId?.name || 'N/A'}</p>
                        <p className="text-slate-400 text-[11px] font-mono">{log.farmerId?.email}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 text-sm">{log.disease}</td>
                      <td className="py-3 px-4 font-black font-mono text-emerald-700">
                        {log.severity !== 'Unknown' && log.confidence > 0 ? `${(log.confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td className="py-3 px-4">{getSeverityBadge(log.severity)}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs whitespace-nowrap">{log.modelUsed || 'CNN (MobileNetV2)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
