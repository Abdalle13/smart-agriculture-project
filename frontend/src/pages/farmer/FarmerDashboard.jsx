import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { io } from 'socket.io-client'
import { SENSOR_THRESHOLDS, SENSOR_CONFIG, ROUTES } from '../../utils/constants'
import {
  FiZap, FiBarChart2, FiCloud, FiCpu, FiChevronRight,
  FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export default function FarmerDashboard() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [readings,     setReadings]     = useState(null)
  const [advisory,     setAdvisory]     = useState([])
  const [advLoading,   setAdvLoading]   = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [lastUpdated,  setLastUpdated]  = useState('')
  const [now,          setNow]          = useState(() => Date.now())
  const hasFetchedAdvisory = useRef(false)

  // Tick every 15s so the staleness check below re-evaluates even without new readings
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  // Pick up a sensor an admin assigned after this session started
  useEffect(() => { refreshUser() }, [refreshUser])

  // ── Fetch soil advisory (array of alert cards)
  const fetchSoilAdvisory = useCallback(async (data) => {
    if (!data) return
    setAdvLoading(true)
    try {
      const { data: res } = await api.post('/advise/soil', {
        nitrogen:    data.nitrogen,
        phosphorus:  data.phosphorus,
        potassium:   data.potassium,
        temperature: data.temperature,
        humidity:    data.humidity,
        moisture:    data.moisture,
      })
      if (res.success && Array.isArray(res.advisory)) {
        setAdvisory(res.advisory)
      }
    } catch {
      setAdvisory([])
    } finally {
      setAdvLoading(false)
    }
  }, [])

  // Load latest reading once on mount
  useEffect(() => {
    const activeSensorId = user?.sensorIds?.[0]
    if (!activeSensorId) {
      setLoading(false)
      return
    }
    const fetchLatest = async () => {
      try {
        setError(null)
        const { data: res } = await api.get(`/sensors/${activeSensorId}/latest`)
        if (res.data) {
          setReadings(res.data)
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
          // Fetch soil advisory once on first load
          if (!hasFetchedAdvisory.current) {
            hasFetchedAdvisory.current = true
            fetchSoilAdvisory(res.data)
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not reach the sensor probe. Check your connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchLatest()
  }, [user, fetchSoilAdvisory])

  // Real-time updates via Socket.io
  useEffect(() => {
    const sensorId = user?.sensorIds?.[0]
    if (!sensorId) return

    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    socket.on('connect', () => {
      socket.emit('joinSensor', sensorId)
    })

    socket.on('newReading', (data) => {
      setReadings(data)
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setError(null)
      setLoading(false)
      // Auto-update agronomic advisory when new telemetry arrives from ESP32
      fetchSoilAdvisory(data)
    })

    return () => socket.disconnect()
  }, [user, fetchSoilAdvisory])

  // 🔄 Automatic sync: Whenever soil telemetry changes from ESP32, automatically re-evaluate advice!
  useEffect(() => {
    if (readings) {
      fetchSoilAdvisory(readings)
    }
  }, [
    readings?.nitrogen,
    readings?.phosphorus,
    readings?.potassium,
    readings?.moisture,
    readings?.temperature,
    readings?.humidity,
    readings?.timestamp,
    fetchSoilAdvisory
  ])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-sm text-emerald-600 animate-pulse font-medium">Syncing with field telemetry probe...</p>
      </div>
    )
  }

  const hasSensor = !!user?.sensorIds?.length
  const hasData   = !!readings

  // 5-minute freshness check — if last reading is older than 5 mins, treat sensor as offline
  const STALE_MS = 5 * 60 * 1000
  const isStale = hasData && readings?.timestamp
    ? (now - new Date(readings.timestamp).getTime()) > STALE_MS
    : false

  const getStatusLevel = (param, value) => {
    if (isStale) return 'offline'
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
    if (level === 'offline')  return <span className="badge-slate">Offline</span>
    if (level === 'critical') return <span className="badge-red">Critical</span>
    if (level === 'warning')  return <span className="badge-amber">Warning</span>
    return <span className="badge-green">Optimal</span>
  }

  const getAlertClass = (type) => {
    if (type === 'danger')  return 'bg-red-50 border-red-200 text-red-800'
    if (type === 'warning') return 'bg-amber-50 border-amber-200 text-amber-800'
    if (type === 'info')    return 'bg-blue-50 border-blue-200 text-blue-800'
    return 'bg-emerald-50 border-emerald-200 text-emerald-800'
  }

  const getAlertIcon = (type) => {
    if (type === 'danger')  return <FiAlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
    if (type === 'warning') return <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
    return <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
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

        <div className={`self-start sm:self-auto flex items-center gap-2 border px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs ${
          isStale
            ? 'bg-red-50 border-red-200'
            : 'bg-slate-100 border-slate-200'
        }`}>
          <span className={isStale ? 'w-2 h-2 rounded-full bg-red-500 shrink-0' : 'live-dot'} />
          {isStale
            ? <span className="text-red-600 font-semibold">Sensor offline. No data for 5+ min</span>
            : lastUpdated
              ? <span className="text-slate-600">Last sync: <strong className="text-emerald-700 font-mono">{lastUpdated}</strong></span>
              : <span className="text-slate-400 italic">Waiting for ESP32 data…</span>
          }
        </div>
      </div>

      {/* ── No sensor assigned banner ── */}
      {!hasSensor && (
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 text-sm">
          <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-semibold">No field node assigned to your account</p>
              <p className="text-amber-600 text-xs mt-0.5 font-normal">Contact your administrator to assign an IoT sensor probe to your farm.</p>
            </div>
            <Link
              to={ROUTES.FARMER_CONTACT}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3.5 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
            >
              Contact Support &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* ── Sensor offline banner (stale data) ── */}
      {hasSensor && hasData && isStale && (
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-800 text-sm">
          <FiAlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Sensor Offline. No Data Received</p>
            <p className="text-red-600 text-xs mt-0.5 font-normal">Your ESP32 field probe has not sent any readings in the last 5 minutes. All values are reset to 0. Check device power and WiFi connection.</p>
          </div>
        </div>
      )}

      {/* ── Sensor assigned but no reading received yet ── */}
      {hasSensor && !hasData && !error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 text-sm">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <div>
            <p className="font-semibold">Sensor connected, waiting for its first reading</p>
            <p className="text-blue-600 text-xs mt-0.5 font-normal">Your field probe is registered, but hasn't sent any telemetry yet. Data will appear here automatically once it starts reporting.</p>
          </div>
        </div>
      )}

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
          // Show 0 when sensor is offline/stale
          const val = isStale ? 0 : (readings?.[key] ?? 0)
          const statusLevel = getStatusLevel(key, val)
          const thresholds = SENSOR_THRESHOLDS[key]
          const percent = isStale ? 0 : Math.min(100, Math.max(0, ((val - thresholds.min) / (thresholds.max - thresholds.min)) * 100))

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

          {isStale ? (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-sm">
              <FiAlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-0.5">
                <p className="font-semibold text-xs uppercase tracking-wider text-red-700">Sensor Offline</p>
                <p className="text-slate-600 text-sm mt-0.5 leading-relaxed font-normal">
                  Advisory is unavailable while the sensor is offline. Reconnect your ESP32 field probe to resume monitoring.
                </p>
              </div>
            </div>
          ) : hasData ? (
            advLoading ? (
              <div className="flex flex-col items-center justify-center w-full gap-2 py-6">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Syncing advisory...</p>
              </div>
            ) : advisory.length > 0 ? (
              <div className="space-y-3">
                {advisory.map((item, index) => (
                  <div
                    key={index}
                    className={`${getAlertClass(item.type)} flex items-start gap-3 p-3.5 rounded-xl border text-xs`}
                  >
                    {getAlertIcon(item.type)}
                    <div className="space-y-0.5">
                      <p className="font-bold uppercase tracking-wider text-[11px]">{item.title}</p>
                      <p className="text-slate-600 leading-relaxed font-normal">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center w-full py-6">
                Advisory will appear once your field probe sends its first reading.
              </p>
            )
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">
              No advisory yet. This appears once your field probe sends its first reading.
            </p>
          )}
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
                <p className="text-sm font-semibold text-emerald-700">Crop Diagnosis</p>
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
