import { useState, useEffect, useRef } from 'react'
import { SENSOR_THRESHOLDS } from '../../utils/constants'

export default function AdminSystem() {
  // Config state
  const [thresholds, setThresholds] = useState(SENSOR_THRESHOLDS)
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', time: '13:50:02', text: 'AgriSense API Gateway initializing...' },
    { id: 2, type: 'db', time: '13:50:04', text: 'Mongoose database connector attempting bridge...' },
    { id: 3, type: 'db', time: '13:50:05', text: '📡 MongoDB Connected successfully to mongodb://localhost:27017/agrisense' },
    { id: 4, type: 'info', time: '13:50:06', text: 'Express server listening on default PORT 5000' },
    { id: 5, type: 'ai', time: '13:50:10', text: 'FastAPI microservice ping failed. Gateway fell back to client-side mocked crop analyzer weights.' },
    { id: 6, type: 'weather', time: '13:50:11', text: 'OpenWeatherMap interface registered. Coordinate grid: Afgoye (2.13, 45.12)' },
  ])

  const logBoxRef = useRef(null)

  // Auto-scroll logs
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
    }
  }, [logs])

  // Microservices status mock
  const services = [
    { name: 'NodeJS Express API', port: 5000, status: 'operational', type: 'Gateway API' },
    { name: 'MongoDB Database', port: 27017, status: 'operational', type: 'Mongoose ODM' },
    { name: 'FastAPI Crop ML', port: 8000, status: 'fallback', type: 'Python CNN' },
    { name: 'OpenWeather API', port: 80, status: 'operational', type: 'Forecast Intelligence' },
  ]

  // Add random logs to make it feel alive
  useEffect(() => {
    const logInterval = setInterval(() => {
      const logTypes = ['info', 'db', 'sensor', 'ai']
      const texts = [
        'LoRaWAN telemetry node synchronized successfully.',
        'Incoming database transaction: updated user settings for u002.',
        'Sensor probe s001 reported nitrogen reading: 120.4 mg/kg.',
        'OpenWeatherMap response: 200 OK. Recalculated evapotranspiration metrics.',
        'Sensor s003 reported battery warning state. Voltage: 3.12V.',
        'Simulated Leaf Blight CNN classification call processed in 220ms.'
      ]
      
      const newLog = {
        id: Date.now(),
        type: logTypes[Math.floor(Math.random() * logTypes.length)],
        time: new Date().toLocaleTimeString([], { hour12: false }),
        text: texts[Math.floor(Math.random() * texts.length)]
      }
      setLogs(prev => [...prev, newLog].slice(-25)) // limit logs size
    }, 8000)

    return () => clearInterval(logInterval)
  }, [])

  const handleThresholdChange = (param, key, value) => {
    setThresholds(prev => ({
      ...prev,
      [param]: {
        ...prev[param],
        [key]: parseFloat(value)
      }
    }))
  }

  const getStatusBadge = (status) => {
    if (status === 'operational') return <span className="badge-green">Operational</span>
    if (status === 'fallback') return <span className="badge-amber">Offline / Fallback</span>
    return <span className="badge-red">Service Down</span>
  }

  return (
    <div className="page-container space-y-6">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration & Diagnostics</h1>
        <p className="text-slate-500 text-sm">Review monorepo health, configure critical chemical thresholds, and view console logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Config sliders */}
        <div className="lg:col-span-2 card space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h2 className="section-title">Telemetry Alert Limits</h2>
            <button 
              onClick={() => alert('Configuration saved to application constants!')}
              className="btn-primary py-1.5 text-xs"
            >
              Save Configuration
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(thresholds).map(([param, cfg]) => (
              <div key={param} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700 capitalize">{param} Thresholds</span>
                  <span className="text-xs text-slate-400 font-mono">Unit: {cfg.unit}</span>
                </div>

                {/* Warning Input */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600 font-semibold">Warning Bound</span>
                    <span className="font-mono text-slate-700 font-bold">{cfg.warning} {cfg.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={param === 'ph' ? 0.1 : 1}
                    value={cfg.warning}
                    onChange={(e) => handleThresholdChange(param, 'warning', e.target.value)}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Critical Input */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600 font-semibold">Critical Bound</span>
                    <span className="font-mono text-slate-700 font-bold">{cfg.critical} {cfg.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={param === 'ph' ? 0.1 : 1}
                    value={cfg.critical}
                    onChange={(e) => handleThresholdChange(param, 'critical', e.target.value)}
                    className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Microservice Gateway Checker */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3">Gateway Services</h2>
          
          <div className="space-y-3">
            {services.map((srv, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">{srv.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Port {srv.port} · {srv.type}</p>
                </div>
                {getStatusBadge(srv.status)}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Real-Time Scrolling Console Logs ── */}
      <div className="card space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <span className="live-dot bg-purple-500 animate-pulse" /> System Diagnostics Console Log
          </h2>
          <span className="text-[10px] text-slate-400 font-mono uppercase">WebSocket Port: 5000</span>
        </div>

        {/* Console Container */}
        <div 
          ref={logBoxRef}
          className="h-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-2 select-text"
        >
          {logs.map((log) => {
            const getColor = (type) => {
              if (type === 'db') return 'text-cyan-400'
              if (type === 'ai') return 'text-purple-400'
              if (type === 'sensor') return 'text-amber-400'
              return 'text-emerald-400'
            };

            return (
              <div key={log.id} className="flex gap-4 hover:bg-slate-800/50 py-0.5 transition-colors">
                <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                <span className={`${getColor(log.type)} uppercase shrink-0 font-bold select-none`}>
                  {log.type.padEnd(6, ' ')}:
                </span>
                <span className="text-slate-300 break-all">{log.text}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
