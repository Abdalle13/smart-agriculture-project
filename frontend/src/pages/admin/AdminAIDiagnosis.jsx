import { useState, useEffect, useCallback } from 'react'
import {
  FiCpu, FiClock, FiFile, FiAlertCircle,
  FiRefreshCw, FiUsers
} from 'react-icons/fi'
import api from '../../services/api'

const getSeverityBadge = (sev) => {
  if (sev === 'High')    return <span className="badge-red">High Risk</span>
  if (sev === 'Medium')  return <span className="badge-amber">Medium Risk</span>
  if (sev === 'Low')     return <span className="badge-blue">Low Risk</span>
  if (sev === 'Unknown') return <span className="badge-gray">Unrecognized</span>
  return <span className="badge-green">None</span>
}

const DATE_FILTERS = [
  { label: 'Today',   value: 'today' },
  { label: '7 Days',  value: '7d'    },
  { label: '30 Days', value: '30d'   },
  { label: 'All',     value: 'all'   },
]

export default function AdminAIDiagnosis() {
  const [records,    setRecords]    = useState([])
  const [farmers,    setFarmers]    = useState([])
  const [stats,      setStats]      = useState({ total: 0, today: 0 })
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [selectedFarmer, setSelectedFarmer] = useState('all')
  const [dateRange,      setDateRange]      = useState('today')

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

  const selectedFarmerName = farmers.find(f => f._id === selectedFarmer)?.name

  return (
    <div className="page-container space-y-7">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Diagnosis</h1>
          <p className="text-slate-400 text-sm mt-0.5">Crop disease detection results from farmer field scans</p>
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
            <FiAlertCircle size={15} className="shrink-0 text-red-500" />
            <span className="font-semibold">Failed to load diagnosis history. Check server connection.</span>
          </div>
          <button onClick={fetchData} className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Total Diagnoses', value: stats.total,
            Icon: FiCpu,
            iconBg: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600',
            valColor: 'text-emerald-700',
          },
          {
            label: 'Today',           value: stats.today,
            Icon: FiClock,
            iconBg: 'bg-blue-50 border-blue-200',       iconColor: 'text-blue-500',
            valColor: 'text-blue-700',
          },
          {
            label: 'Farmers',         value: farmers.length,
            Icon: FiUsers,
            iconBg: 'bg-slate-100 border-slate-200',    iconColor: 'text-slate-500',
            valColor: 'text-slate-800',
          },
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

      {/* ── Main Card ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-800">Crop Health Scanning History</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedFarmer === 'all' ? 'All farmers' : selectedFarmerName}
              {' · '}
              {DATE_FILTERS.find(d => d.value === dateRange)?.label}
            </p>
          </div>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-end gap-4 bg-slate-50/50">

          {/* Farmer filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiUsers size={10} /> Farmer
            </span>
            <select
              value={selectedFarmer}
              onChange={e => setSelectedFarmer(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all min-w-[180px] shadow-sm"
            >
              <option value="all">All Farmers</option>
              {farmers.map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block self-end mb-0.5" />

          {/* Date range */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiClock size={10} /> Time Range
            </span>
            <div className="flex gap-1.5">
              {DATE_FILTERS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDateRange(d.value)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                    dateRange === d.value
                      ? 'bg-emerald-600 text-white border border-emerald-600'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-9 h-9 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-sm">Loading diagnosis records…</p>
            </div>
          ) : records.length === 0 && !fetchError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <FiCpu size={26} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-600">No diagnoses found</p>
                <p className="text-xs mt-1 max-w-xs">
                  {selectedFarmer !== 'all'
                    ? `No scans from ${selectedFarmerName} for this period.`
                    : 'No farmer scans found for this time range.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Image</th>
                    <th className="py-3 px-2">Date / Time</th>
                    <th className="py-3 px-2">Farmer</th>
                    <th className="py-3 px-2">AI Diagnosis</th>
                    <th className="py-3 px-2">Confidence</th>
                    <th className="py-3 px-2">Severity</th>
                    <th className="py-3 px-2">Model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2">
                        {log.imageUrl ? (
                          <img
                            src={log.imageUrl}
                            alt={log.fileName}
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                            <FiFile className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-mono text-xs whitespace-nowrap">
                        <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-semibold text-slate-800 text-xs">{log.farmerId?.name || '—'}</p>
                        <p className="text-slate-400 text-[10px] font-mono">{log.farmerId?.email}</p>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-800">{log.disease}</td>
                      <td className="py-3 px-2 font-black font-mono text-emerald-700">
                        {(log.confidence * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-2">{getSeverityBadge(log.severity)}</td>
                      <td className="py-3 px-2 text-slate-400 font-mono text-xs">{log.modelUsed}</td>
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
