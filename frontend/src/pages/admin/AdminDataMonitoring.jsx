import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  FiRadio, FiClock, FiRefreshCw,
  FiActivity, FiDatabase, FiAlertCircle
} from 'react-icons/fi'
import api from '../../services/api'

// ─── Constants ────────────────────────────────────────────────────────────────
const PARAMS = [
  { key: 'nitrogen',    label: 'Nitrogen',    short: 'N',    color: '#3b82f6', unit: 'mg/kg' },
  { key: 'phosphorus',  label: 'Phosphorus',  short: 'P',    color: '#a855f7', unit: 'mg/kg' },
  { key: 'potassium',   label: 'Potassium',   short: 'K',    color: '#f97316', unit: 'mg/kg' },
  { key: 'temperature', label: 'Temperature', short: 'Temp', color: '#ef4444', unit: '°C'    },
  { key: 'humidity',    label: 'Humidity',    short: 'Hum',  color: '#06b6d4', unit: '%'     },
  { key: 'moisture',    label: 'Moisture',    short: 'Moist',color: '#10b981', unit: '%'     },
]

const DATE_FILTERS = [
  { label: 'Today',   value: 'today' },
  { label: '7 Days',  value: '7d'    },
  { label: '30 Days', value: '30d'   },
  { label: 'All',     value: 'all'   },
]

const fmt = (v) => v != null ? Number(v).toFixed(1) : 'N/A'

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit, paramLabel }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="text-slate-400 font-mono mb-1">{label}</p>
      <p className="font-black text-slate-900 text-sm">{payload[0].value} <span className="text-slate-400 font-normal">{unit}</span></p>
      <p className="text-slate-400 mt-0.5">{paramLabel}</p>
    </div>
  )
}

// ─── Sensor Logs ──────────────────────────────────────────────────────────────
function SensorLogsTab({ onTotalLoad }) {
  const [readings,    setReadings]    = useState([])
  const [nodes,       setNodes]       = useState([])
  const [dateRange,   setDateRange]   = useState('today')
  const [activeNode,  setActiveNode]  = useState('all')
  const [chartParam,  setChartParam]  = useState('nitrogen')
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setFetchError(false)
      const params = new URLSearchParams({ range: dateRange })
      if (activeNode !== 'all') params.set('sensorId', activeNode)

      const [rRes, sRes] = await Promise.all([
        api.get(`/sensors/readings/all?${params}`),
        api.get('/sensors'),
      ])

      setReadings(rRes.data.data || [])
      setNodes(sRes.data.data || [])
      setLastRefresh(new Date())
      if (onTotalLoad) onTotalLoad(rRes.data.total ?? 0)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [dateRange, activeNode, onTotalLoad])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
    const iv = setInterval(fetchData, 10000)
    return () => clearInterval(iv)
  }, [fetchData])

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading sensor readings…</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
        <FiAlertCircle className="w-4 h-4 shrink-0" />
        <span>Failed to load sensor data.</span>
        <button onClick={handleRefresh} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 cursor-pointer">
          <FiRefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    )
  }

  // Data is already server-filtered, just build chart & table
  const chartData = [...readings].reverse().map(r => ({
    time:  new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: r[chartParam] ?? 0,
  }))

  const latestRows  = readings.slice(0, 8)
  const activeParam = PARAMS.find(p => p.key === chartParam)
  const activeNodeName = nodes.find(n => n._id === activeNode)?.name

  const chartValues = readings.map(r => r[chartParam]).filter(v => v != null)
  const chartStats = chartValues.length ? {
    min: Math.min(...chartValues).toFixed(1),
    avg: (chartValues.reduce((a, b) => a + b, 0) / chartValues.length).toFixed(1),
    max: Math.max(...chartValues).toFixed(1),
  } : null

  return (
    <div className="space-y-5">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-4 sm:px-5 flex flex-wrap items-center gap-4 sm:gap-5 shadow-sm">

        {/* Node selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <FiRadio size={10} /> Field Node
          </span>
          <select
            value={activeNode}
            onChange={e => setActiveNode(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all min-w-[160px]"
          >
            <option value="all">All Nodes</option>
            {nodes.map(n => (
              <option key={n._id} value={n._id}>{n.name || n._id}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-10 bg-slate-100 hidden sm:block" />

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
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  dateRange === d.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: last refresh + refresh button */}
        <div className="ml-auto flex items-center gap-3">
          {lastRefresh && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-slate-500">
                {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 rounded-xl transition-all cursor-pointer"
          >
            <FiRefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Chart header */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
              style={{ backgroundColor: activeParam.color + '18', borderColor: activeParam.color + '40' }}>
              <FiActivity size={16} style={{ color: activeParam.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-800">{activeParam.label} Trend</p>
                {activeNodeName && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md">
                    {activeNodeName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-[11px] text-slate-400">{chartData.length} readings · {activeParam.unit}</p>
                {chartStats && (
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Min', val: chartStats.min },
                      { label: 'Avg', val: chartStats.avg },
                      { label: 'Max', val: chartStats.max },
                    ].map(s => (
                      <div key={s.label} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</span>
                        <span className="text-[11px] font-black font-mono" style={{ color: activeParam.color }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Param selector */}
          <div className="flex flex-wrap gap-1.5">
            {PARAMS.map(p => (
              <button
                key={p.key}
                onClick={() => setChartParam(p.key)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer"
                style={chartParam === p.key
                  ? { background: p.color, borderColor: p.color, color: '#fff' }
                  : { background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart body */}
        {chartData.length > 0 ? (
          <div className="px-4 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={activeParam.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={activeParam.color} stopOpacity={0}   />
                  </linearGradient>
                </defs>
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
                  width={40}
                />
                <Tooltip content={<ChartTooltip unit={activeParam.unit} paramLabel={activeParam.label} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeParam.color}
                  strokeWidth={2.5}
                  fill="url(#grad)"
                  dot={false}
                  activeDot={{ r: 5, fill: activeParam.color, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FiActivity size={22} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-600">No data for this period</p>
              <p className="text-xs mt-0.5">Try selecting a wider time range or a different node.</p>
            </div>
          </div>
        )}

        <div className="px-5 py-2.5 border-t border-slate-50 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-slate-400">Auto-refreshes every 10s</span>
        </div>
      </div>

      {/* ── Latest Readings Table ───────────────────────────────────────────── */}
      {latestRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <FiDatabase size={14} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-800">Latest Readings</p>
            <span className="text-xs text-slate-400 font-normal">({latestRows.length} most recent)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['Node', 'N (mg/kg)', 'P (mg/kg)', 'K (mg/kg)', 'Temp (°C)', 'Humidity (%)', 'Moisture (%)', 'Time'].map(h => (
                    <th key={h} className="py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {latestRows.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px]">
                        <FiRadio size={9} /> {r.sensorName || r.sensorId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold">{fmt(r.nitrogen)}</td>
                    <td className="py-3 px-4 font-mono text-pink-600 font-semibold">{fmt(r.phosphorus)}</td>
                    <td className="py-3 px-4 font-mono text-orange-500 font-semibold">{fmt(r.potassium)}</td>
                    <td className="py-3 px-4 font-mono text-red-500 font-semibold">{fmt(r.temperature)}</td>
                    <td className="py-3 px-4 font-mono text-cyan-600 font-semibold">{fmt(r.humidity)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">{fmt(r.moisture)}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDataMonitoring() {
  const [totalReadings, setTotalReadings] = useState(null)

  return (
    <div className="page-container space-y-7">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Data Monitoring</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Live IoT telemetry from all field nodes, Afgoye District
            {totalReadings != null && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                <FiDatabase size={10} /> {totalReadings.toLocaleString()} total readings
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">Live</span>
        </div>
      </div>

      <SensorLogsTab onTotalLoad={setTotalReadings} />

    </div>
  )
}
