import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { mockGetSensorReadings, mockGetRecommendations } from '../../services/mockData'
import { SENSOR_THRESHOLDS, SENSOR_CONFIG, SENSOR_POLL_INTERVAL, ROUTES } from '../../utils/constants'

export default function FarmerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [readings, setReadings] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')

  const fetchReadings = async () => {
    try {
      const activeSensorId = user?.sensorIds?.[0] || 's001'
      const data = await mockGetSensorReadings(activeSensorId)
      setReadings(data)
      setRecommendations(mockGetRecommendations(data))
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err) {
      console.error('Error fetching sensor readings:', err)
    } finally {
      setLoading(false)
    }
  }

  // Poll for new readings
  useEffect(() => {
    fetchReadings()
    const interval = setInterval(fetchReadings, SENSOR_POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [user])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-sm text-emerald-600 animate-pulse font-medium">Syncing with field telemetry probe...</p>
      </div>
    )
  }

  // Helper to determine status level
  const getStatusLevel = (param, value) => {
    const limits = SENSOR_THRESHOLDS[param]
    if (!limits) return 'normal'

    if (param === 'ph') {
      if (value < limits.critical) return 'critical'
      if (value < limits.warning) return 'warning'
      return 'normal'
    }
    if (param === 'humidity') {
      if (value < limits.critical) return 'critical'
      if (value < limits.warning) return 'warning'
      return 'normal'
    }
    if (param === 'temperature') {
      if (value > limits.critical) return 'critical'
      if (value > limits.warning) return 'warning'
      return 'normal'
    }
    // NPK metrics
    if (value < limits.critical) return 'critical'
    if (value < limits.warning) return 'warning'
    return 'normal'
  }

  const getStatusBadge = (level) => {
    if (level === 'critical') return <span className="badge-red">Critical</span>
    if (level === 'warning') return <span className="badge-amber">Warning</span>
    return <span className="badge-green">Optimal</span>
  }

  return (
    <div className="page-container space-y-6">
      
      {/* ── Welcome & Status Summary ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hi, {user?.name || 'Farmer'} 👋
          </h1>
          <p className="text-slate-500 text-sm">
            Here is the soil condition for your field <strong className="text-emerald-700">{user?.fieldName || 'Hassan North Field'}</strong>.
          </p>
        </div>
        
        {/* Sync indicator */}
        <div className="self-start sm:self-auto flex items-center gap-2 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
          <span className="live-dot" />
          <span className="text-slate-600">Telemetry polled at: <strong className="text-emerald-700 font-mono">{lastUpdated}</strong></span>
        </div>
      </div>

      {/* ── Soil Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => {
          const val = readings?.[key] || 0
          const statusLevel = getStatusLevel(key, val)
          const thresholds = SENSOR_THRESHOLDS[key]
          
          // Calculate percentage position for visual gauge bar
          const percent = Math.min(100, Math.max(0, ((val - thresholds.min) / (thresholds.max - thresholds.min)) * 100))

          return (
            <div key={key} className="card flex flex-col justify-between space-y-4 hover:-translate-y-0.5">
              
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border border-slate-200 shadow-sm"
                    style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{cfg.label}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">IoT Probe Sensor</p>
                  </div>
                </div>
                {getStatusBadge(statusLevel)}
              </div>

              {/* Card Value */}
              <div>
                <p className="text-3xl font-extrabold tracking-tight" style={{ color: cfg.color }}>
                  {val.toFixed(1)} <span className="text-sm font-semibold text-slate-400">{cfg.unit}</span>
                </p>
              </div>

              {/* Gauge Progress Indicator */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${percent}%`, 
                      backgroundColor: statusLevel === 'critical' ? '#ef4444' : statusLevel === 'warning' ? '#f59e0b' : cfg.color
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-semibold font-mono">
                  <span>{thresholds.min} {cfg.unit}</span>
                  <span>{thresholds.max} {cfg.unit}</span>
                </div>
              </div>

            </div>
          )
        })}
      </div>

      {/* ── Recommendations & Actions Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Recommendations */}
        <div className="lg:col-span-2 card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3 flex items-center gap-2">
            <span>📢</span> AgriSense Diagnostic Action Tips
          </h2>

          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const getAlertClass = (type) => {
                if (type === 'danger') return 'alert-danger'
                if (type === 'warning') return 'alert-warning'
                return 'alert-success'
              }
              return (
                <div 
                  key={index} 
                  className={`${getAlertClass(rec.type)} flex items-start gap-3 p-4 rounded-xl border text-sm`}
                >
                  <span className="text-lg">
                    {rec.type === 'danger' ? '🚨' : rec.type === 'warning' ? '⚠️' : '✅'}
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-xs uppercase tracking-wider">
                      {rec.type === 'danger' ? 'CRITICAL ALERT' : rec.type === 'warning' ? 'ADVISORY WARNING' : 'OPTIMAL CONDITION'}
                    </p>
                    <p className="text-slate-600 text-sm mt-0.5 leading-relaxed font-normal">{rec.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right 1 Column: Quick Shortcuts */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3">Quick Utilities</h2>
          
          <div className="flex flex-col gap-3">
            {/* View charts */}
            <button
              onClick={() => navigate(ROUTES.FARMER_SENSORS)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-205 text-left transition-all group cursor-pointer"
            >
              <span className="text-2xl">📈</span>
              <div>
                <p className="text-sm font-semibold text-emerald-700">Historical Charts</p>
                <p className="text-xs text-slate-400 mt-0.5">Analyze NPK & Moisture trends</p>
              </div>
              <span className="ml-auto text-emerald-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Check weather */}
            <button
              onClick={() => navigate(ROUTES.FARMER_WEATHER)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-205 text-left transition-all group cursor-pointer"
            >
              <span className="text-2xl">🌤️</span>
              <div>
                <p className="text-sm font-semibold text-cyan-700">Weather Intelligence</p>
                <p className="text-xs text-slate-400 mt-0.5">View Afgoye local forecast</p>
              </div>
              <span className="ml-auto text-cyan-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* AI diagnosis */}
            <button
              onClick={() => navigate(ROUTES.FARMER_DIAGNOSIS)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-205 text-left transition-all group cursor-pointer"
            >
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm font-semibold text-purple-700">AI Crop Diagnosis</p>
                <p className="text-xs text-slate-400 mt-0.5">Scan crop leaves for disease</p>
              </div>
              <span className="ml-auto text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
