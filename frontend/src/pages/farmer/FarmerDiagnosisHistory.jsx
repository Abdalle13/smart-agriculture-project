import { useState, useEffect, useCallback } from 'react'
import {
  FiCpu, FiClock, FiAlertCircle, FiRefreshCw, FiFile,
  FiInfo, FiShield, FiCalendar
} from 'react-icons/fi'
import api from '../../services/api'

const getSeverityBadge = (sev) => {
  if (sev === 'High')    return <span className="badge-red">High Risk</span>
  if (sev === 'Medium')  return <span className="badge-amber">Medium Risk</span>
  if (sev === 'Low')     return <span className="badge-blue">Low Risk</span>
  if (sev === 'Unknown') return <span className="badge-gray">Unrecognized</span>
  return <span className="badge-green">Healthy Crop</span>
}

const DATE_FILTERS = [
  { label: 'Today',   value: 'today' },
  { label: '7 Days',  value: '7d'    },
  { label: '30 Days', value: '30d'   },
  { label: 'All',     value: 'all'   },
]

const SEVERITY_FILTERS = ['all', 'High', 'Medium', 'Low']

// ─── Detail Modal ───────────────────────────────────────────────────────────
function DetailModal({ log, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="text-sm font-bold text-slate-800">Scan Detail</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 text-lg cursor-pointer transition-colors">×</button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {log.imageUrl ? (
            <img src={log.imageUrl} alt={log.fileName} className="w-full h-48 object-cover rounded-2xl border border-slate-200" />
          ) : (
            <div className="w-full h-48 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center">
              <FiFile className="w-8 h-8 text-slate-400" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xl font-extrabold text-slate-800">{log.disease}</p>
            {getSeverityBadge(log.severity)}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <FiCalendar size={11} />
              {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="font-bold font-mono text-emerald-700">{(log.confidence * 100).toFixed(0)}% confidence</span>
          </div>

          {log.treatment && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-200 flex items-center justify-center shrink-0">
                  <FiInfo className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <p className="text-sm font-bold text-emerald-800 tracking-tight">Treatment Advisory</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-8">{log.treatment}</p>
            </div>
          )}

          {log.prevention && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-200 flex items-center justify-center shrink-0">
                  <FiShield className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <p className="text-sm font-bold text-blue-800 tracking-tight">Prevention</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-8">{log.prevention}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FarmerDiagnosisHistory() {
  const [history,    setHistory]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [dateRange,      setDateRange]      = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const { data } = await api.get(`/diagnosis/my?range=${dateRange}`)
      setHistory(data.data || [])
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const filteredHistory = severityFilter === 'all'
    ? history
    : history.filter(log => log.severity === severityFilter)

  const highCount = history.filter(log => log.severity === 'High').length
  const healthyCount = history.filter(log => log.severity === 'None').length

  return (
    <div className="page-container space-y-6">

      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scan History</h1>
          <p className="text-slate-500 text-sm">All your past crop disease scans in one place</p>
        </div>
        <button
          onClick={fetchHistory}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Total',   value: history.length, Icon: FiCpu,   iconBg: 'bg-slate-100 border-slate-200', iconColor: 'text-slate-500', valColor: 'text-slate-800' },
          { label: 'High',    value: highCount,       Icon: FiAlertCircle, iconBg: 'bg-red-50 border-red-200', iconColor: 'text-red-500', valColor: 'text-red-700' },
          { label: 'Healthy', value: healthyCount,    Icon: FiShield, iconBg: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600', valColor: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className="min-w-0 bg-white border border-slate-200 rounded-2xl px-2.5 py-3 sm:px-5 sm:py-4 flex items-center gap-1.5 sm:gap-4 shadow-sm">
            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border flex items-center justify-center ${s.iconBg} ${s.iconColor} shrink-0`}>
              <s.Icon size={13} className="sm:hidden" />
              <s.Icon size={15} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className={`text-lg sm:text-2xl font-black ${s.valColor}`}>{s.value}</p>
              <p className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide sm:tracking-wider mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Card ── */}
      <div className="card space-y-0 p-0 overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-end gap-4 bg-slate-50/50">
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

          <div className="w-px h-8 bg-slate-200 hidden sm:block self-end mb-0.5" />

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiAlertCircle size={10} /> Severity
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SEVERITY_FILTERS.map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                    severityFilter === sev
                      ? 'bg-emerald-600 text-white border border-emerald-600'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-9 h-9 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-sm">Loading scan history…</p>
            </div>
          ) : fetchError ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              Failed to load scan history.
              <button onClick={fetchHistory} className="ml-auto text-xs font-semibold text-red-700 hover:underline cursor-pointer">Retry</button>
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No scans yet. Upload or photograph a leaf to get started.</p>
          ) : filteredHistory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No scans match this filter.</p>
          ) : (
            <>
              {/* Mobile: stacked cards */}
              <div className="sm:hidden space-y-4">
                {filteredHistory.map((log) => (
                  <button
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full text-left rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-300 transition-colors"
                  >
                    {log.imageUrl ? (
                      <img src={log.imageUrl} alt={log.fileName} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-slate-100 flex items-center justify-center">
                        <FiFile className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800 text-base truncate">{log.disease}</p>
                        {getSeverityBadge(log.severity)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="font-bold font-mono text-emerald-700 text-sm">{(log.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Image</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Diagnosis</th>
                      <th className="py-3 px-2">Confidence</th>
                      <th className="py-3 px-2">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((log) => (
                      <tr
                        key={log._id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-2">
                          {log.imageUrl ? (
                            <img src={log.imageUrl} alt={log.fileName} className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
                              <FiFile className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-500 font-mono text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-2 font-semibold text-slate-800">{log.disease}</td>
                        <td className="py-3 px-2 font-bold font-mono text-emerald-700">{(log.confidence * 100).toFixed(0)}%</td>
                        <td className="py-3 px-2">{getSeverityBadge(log.severity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
