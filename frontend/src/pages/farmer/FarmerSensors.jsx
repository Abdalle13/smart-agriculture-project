import { useState, useEffect } from 'react'
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts'
import { mockGetSensorHistory } from '../../services/mockData'
import { SENSOR_CONFIG, SENSOR_THRESHOLDS } from '../../utils/constants'

// Custom tooltip renderer for Recharts
const CustomTooltip = ({ active, payload, label, activeColor, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-slate-200 p-3.5 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold mt-1" style={{ color: activeColor }}>
          {payload[0].value.toFixed(1)} <span className="text-xs text-slate-400 font-normal">{unit}</span>
        </p>
      </div>
    )
  }
  return null
}

export default function FarmerSensors() {
  const [activeParam, setActiveParam] = useState('nitrogen')
  const [timeFilter, setTimeFilter] = useState(12) // hours
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const data = await mockGetSensorHistory(activeParam, timeFilter)
      setHistoryData(data)
    } catch (err) {
      console.error('Error fetching sensor history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [activeParam, timeFilter])

  // CSV Exporter
  const handleExportCSV = () => {
    const config = SENSOR_CONFIG[activeParam]
    const unit = config?.unit || ''
    
    // Header
    const csvRows = [['Report: AgriSense Telemetry Export'], ['Parameter', config.label], ['Time Period', `Last ${timeFilter} Hours`], [''], ['Timestamp', 'Value', 'Unit']]
    
    // Rows
    historyData.forEach(row => {
      csvRows.push([row.time, row.value, unit])
    })

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `agrisense_${activeParam}_last_${timeFilter}h.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currentConfig = SENSOR_CONFIG[activeParam] || { color: '#059669', label: 'Telemetry', unit: '' }
  const currentThresholds = SENSOR_THRESHOLDS[activeParam] || { min: 0, max: 100 }

  return (
    <div className="page-container space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Soil Telemetry Analytics</h1>
          <p className="text-slate-500 text-sm">Analyze and export historical soil chemistry and condition logs</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading || historyData.length === 0}
          className="btn-primary self-start sm:self-auto py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 Export CSV Log
        </button>
      </div>

      {/* ── Parameter Selection Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => {
          const isActive = activeParam === key
          return (
            <button
              key={key}
              onClick={() => setActiveParam(key)}
              className={`
                p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-24
                ${isActive 
                  ? 'bg-emerald-50 border-emerald-500/40 shadow-sm' 
                  : 'bg-white border-slate-200 hover:border-slate-350'}
              `}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              <span className={`text-xs font-semibold mt-2 truncate ${isActive ? 'text-emerald-800' : 'text-slate-500'}`}>
                {cfg.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Chart Section ── */}
      <div className="card space-y-6">
        
        {/* Chart controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span style={{ color: currentConfig.color }}>●</span> {currentConfig.label} Telemetry History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Showing last {timeFilter} hours graph</p>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl self-start sm:self-auto">
            {[
              { label: '12 Hours', value: 12 },
              { label: '24 Hours', value: 24 },
              { label: '7 Days', value: 168 }
            ].map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeFilter(tf.value)}
                className={`
                  text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer
                  ${timeFilter === tf.value 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-emerald-700'}
                `}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* The Chart */}
        <div className="w-full h-80 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-700 border-t-emerald-400 rounded-full animate-spin" />
              <p className="text-xs text-emerald-650 font-medium">Fetching history nodes...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[
                    Math.max(0, currentThresholds.min - 10), 
                    currentThresholds.max + 10
                  ]}
                />
                <Tooltip 
                  content={
                    <CustomTooltip 
                      activeColor={currentConfig.color} 
                      unit={currentConfig.unit} 
                    />
                  } 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={currentConfig.color} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

    </div>
  )
}
