import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { io } from 'socket.io-client'
import { getSoilRecommendations } from '../../utils/recommendationEngine'
import { SENSOR_THRESHOLDS, SENSOR_CONFIG, ROUTES } from '../../utils/constants'
import {
  FiZap, FiBarChart2, FiCloud, FiCpu, FiChevronRight,
  FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export default function FarmerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [readings, setReadings] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState('')

  // Load latest reading once on mount
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setError(null)
        const activeSensorId = user?.sensorIds?.[0] || 's001'
        const { data: res } = await api.get(`/sensors/${activeSensorId}/latest`)
        if (res.data) {
          setReadings(res.data)
          setRecommendations(getSoilRecommendations(res.data))
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not reach the sensor probe. Check your connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [user])

  // Real-time updates via Socket.io
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    socket.on('newReading', (data) => {
      setReadings(data)
      setRecommendations(getSoilRecommendations(data))
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setError(null)
    })

    return () => socket.disconnect()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-sm text-emerald-600 animate-pulse font-medium">Syncing with field telemetry probe...</p>
      </div>
    )
  }

  const getStatusLevel = (param, value) => {
    const limits = SENSOR_THRESHOLDS[param]
    if (!limits) return 'normal'
    if (param === 'moisture' || param === 'humidity') {
      if (value < limits.critical) return 'critical'
      if (value < limits.warning) return 'warning'
      return 'normal'
    }
    if (param === 'temperature') {
      if (value > limits.critical) return 'critical'
      if (value > limits.warning) return 'warning'
      return 'normal'
    }
    if (value < limits.critical) return 'critical'
    if (value < limits.warning) return 'warning'
    return 'normal'
  }

  const getStatusBadge = (level) => {
    if (level === 'critical') return <span className="badge-red">Critical</span>
    if (level === 'warning')  return <span className="badge-amber">Warning</span>
    return <span className="badge-green">Optimal</span>
  }

  const getRecIcon = (type) => {
    if (type === 'danger')  return <FiAlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
    if (type === 'warning') return <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
    return <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
  }

  const getAlertClass = (type) => {
    if (type === 'danger')  return 'alert-danger'
    if (type === 'warning') return 'alert-warning'
    return 'alert-success'
  }

  return (
    <div className="page-container space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hi, {user?.name || 'Farmer'}
          </h1>
          <p className="text-slate-500 text-sm">
            Soil condition for field{' '}
            <strong className="text-emerald-700">{user?.fieldName || 'Hassan North Field'}</strong>.
          </p>
        </div>

        <div className="self-start sm:self-auto flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs">
          <span className="live-dot" />
          {lastUpdated
            ? <span className="text-slate-600">Last sync: <strong className="text-emerald-700 font-mono">{lastUpdated}</strong></span>
            : <span className="text-slate-400 italic">Waiting for ESP32 data…</span>
          }
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Soil Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Object.entries(SENSOR_CONFIG).map(([key, cfg]) => {
          const val = readings?.[key] ?? 0
          const statusLevel = getStatusLevel(key, val)
          const thresholds = SENSOR_THRESHOLDS[key]
          const percent = Math.min(100, Math.max(0, ((val - thresholds.min) / (thresholds.max - thresholds.min)) * 100))

          return (
            <div key={key} className="card flex flex-col justify-between space-y-4 hover:-translate-y-0.5">

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

              <div>
                <p className="text-3xl font-extrabold tracking-tight" style={{ color: cfg.color }}>
                  {val.toFixed(1)} <span className="text-sm font-semibold text-slate-400">{cfg.unit}</span>
                </p>
              </div>

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

      {/* ── Recommendations + Quick Utilities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3 flex items-center gap-2">
            <FiZap className="w-4 h-4 text-emerald-500" /> Intelligent Agronomic Advisory
          </h2>

          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`${getAlertClass(rec.type)} flex items-start gap-3 p-4 rounded-xl border text-sm`}
              >
                {getRecIcon(rec.type)}
                <div className="space-y-0.5">
                  <p className="font-semibold text-xs uppercase tracking-wider">
                    {rec.type === 'danger' ? 'Critical Alert' : rec.type === 'warning' ? 'Advisory Warning' : 'Optimal Condition'}
                  </p>
                  <p className="text-slate-600 text-sm mt-0.5 leading-relaxed font-normal">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3">Quick Utilities</h2>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(ROUTES.FARMER_SENSORS)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <FiBarChart2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-700">Historical Charts</p>
                <p className="text-xs text-slate-400 mt-0.5">Analyze NPK and Moisture trends</p>
              </div>
              <FiChevronRight className="ml-auto text-slate-400 group-hover:translate-x-1 group-hover:text-blue-500 transition-all w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={() => navigate(ROUTES.FARMER_WEATHER)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center shrink-0">
                <FiCloud className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-cyan-700">Weather Intelligence</p>
                <p className="text-xs text-slate-400 mt-0.5">View Afgoye local forecast</p>
              </div>
              <FiChevronRight className="ml-auto text-slate-400 group-hover:translate-x-1 group-hover:text-cyan-500 transition-all w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={() => navigate(ROUTES.FARMER_DIAGNOSIS)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <FiCpu className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-700">AI Crop Diagnosis</p>
                <p className="text-xs text-slate-400 mt-0.5">Scan crop leaves for disease</p>
              </div>
              <FiChevronRight className="ml-auto text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
