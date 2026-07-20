import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { getWeatherAdvisory } from '../../utils/recommendationEngine'
import { FiAlertTriangle, FiAlertOctagon, FiCheckCircle, FiInfo, FiRefreshCw } from 'react-icons/fi'
import {
  WiThunderstorm, WiSprinkle, WiRain, WiSnow, WiFog,
  WiDaySunny, WiDayCloudy, WiCloud, WiCloudy, WiNa,
} from 'react-icons/wi'

const WEATHER_ICONS = {
  'thunderstorm':   WiThunderstorm,
  'drizzle':        WiSprinkle,
  'rain':           WiRain,
  'snow':           WiSnow,
  'fog':            WiFog,
  'clear':          WiDaySunny,
  'partly-cloudy':  WiDayCloudy,
  'cloudy':         WiCloud,
  'overcast':       WiCloudy,
  'unknown':        WiNa,
}

const WEATHER_COLORS = {
  'thunderstorm':   'text-indigo-600',
  'drizzle':        'text-sky-400',
  'rain':           'text-blue-500',
  'snow':           'text-cyan-400',
  'fog':            'text-slate-400',
  'clear':          'text-amber-500',
  'partly-cloudy':  'text-amber-400',
  'cloudy':         'text-slate-400',
  'overcast':       'text-slate-500',
  'unknown':        'text-slate-300',
}

function WeatherIcon({ code, className }) {
  const Icon  = WEATHER_ICONS[code] || WiNa
  const color = WEATHER_COLORS[code] || 'text-slate-400'
  return <Icon className={`${className} ${color}`} />
}


export default function FarmerWeather() {
  const { user, refreshUser } = useAuth()
  const [weather,     setWeather]     = useState(null)
  const [soilReading, setSoilReading] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [apiError,    setApiError]    = useState(null)

  const [refreshTick, setRefreshTick] = useState(0)

  const handleRefresh = () => setRefreshTick(t => t + 1)

  // Pick up a sensor an admin assigned after this session started
  useEffect(() => { refreshUser() }, [refreshUser])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setApiError(null)
      const sensorId = user?.sensorIds?.[0]

      const calls = [api.get('/weather')]
      if (sensorId) calls.push(api.get(`/sensors/${sensorId}/latest`))

      const [weatherResult, sensorResult] = await Promise.allSettled(calls)

      if (weatherResult.status === 'fulfilled') {
        const res = weatherResult.value.data
        if (res.success) setWeather(res.data)
        else setApiError(res.message || 'Unknown error occurred')
      } else {
        setApiError('Could not reach weather service.')
      }

      if (sensorResult?.status === 'fulfilled') {
        const res = sensorResult.value.data
        if (res.success && res.data) setSoilReading(res.data)
      }

      setLoading(false)
    }

    fetchData()
    const timer = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [user, refreshTick])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-sm text-emerald-600 animate-pulse font-medium">
          Fetching live Afgoye weather data...
        </p>
      </div>
    )
  }

  // ── Error state (no weather data at all) ──────────────────────────────────
  if (!weather) {
    return (
      <div className="page-container">
        <div className="alert-warning flex items-start gap-3 border border-amber-200 p-5 rounded-xl">
          <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">Weather Service Unavailable</p>
            <p className="text-sm mt-1 text-slate-600">{apiError || 'Unable to load weather data.'}</p>
            <button onClick={handleRefresh} className="btn-primary mt-3 py-1.5 text-xs">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const advisory = getWeatherAdvisory(weather, soilReading, !!user?.sensorIds?.length)

  const getAlertClass = (lvl) => {
    if (lvl === 'warning') return 'bg-amber-50 border border-amber-200 text-amber-800'
    if (lvl === 'info')    return 'bg-blue-50 border border-blue-200 text-blue-800'
    if (lvl === 'danger')  return 'bg-red-50 border border-red-200 text-red-800'
    return 'bg-emerald-50 border border-emerald-200 text-emerald-800'
  }

  return (
    <div className="page-container space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Weather Intelligence
          </h1>
          <p className="text-slate-500 text-sm">
            Live microclimate conditions for the Afgoye agriculture zone
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Data
          </span>
          <button onClick={handleRefresh} className="btn-secondary py-2 flex items-center gap-2">
            <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Grid: Current Conditions + Advisory ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 columns: Current weather */}
        <div className="lg:col-span-2 card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="section-title">Current Microclimate Conditions</h2>
            <span className="text-xs text-slate-400 font-mono">
              Afgoye · {weather?.updatedAt
                ? new Date(weather.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'N/A'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 w-full sm:w-auto">
              <WeatherIcon code={weather?.current?.icon} className="w-16 h-16 sm:w-24 sm:h-24" />
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">{weather?.current?.temp}°C</p>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">{weather?.current?.description}</p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4 w-full border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Feels Like</p>
                <p className="text-base font-semibold text-slate-800 mt-0.5">{weather?.current?.feelsLike}°C</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Humidity</p>
                <p className="text-base font-semibold text-slate-800 mt-0.5">{weather?.current?.humidity}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Wind Speed</p>
                <p className="text-base font-semibold text-slate-800 mt-0.5">{weather?.current?.windSpeed} km/h</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Visibility</p>
                <p className="text-base font-semibold text-slate-800 mt-0.5">{weather?.current?.visibility} km</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Location</p>
                <p className="text-base font-semibold text-slate-800 mt-0.5">Afgoye</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 column: Combined advisory */}
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="section-title">Agronomic Field Advisory</h2>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Precipitation forecast · thermal stress analysis · irrigation scheduling
            </p>
          </div>
          <div className="space-y-3.5">
            {advisory.map(tip => (
              <div
                key={tip.id}
                className={`p-4 rounded-xl border text-xs leading-relaxed ${getAlertClass(tip.level)}`}
              >
                <div className="flex items-start gap-2">
                  {tip.level === 'danger'  && <FiAlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />}
                  {tip.level === 'warning' && <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {tip.level === 'info'    && <FiInfo className="w-4 h-4 shrink-0 mt-0.5" />}
                  {tip.level === 'success' && <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wide mb-1">{tip.title}</p>
                    <p className="font-normal">{tip.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 5-Day Forecast ── */}
      <div className="card space-y-4">
        <h2 className="section-title border-b border-slate-100 pb-3">5-Day Outlook</h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          {weather?.forecast?.map((day, idx) => (
            <div
              key={idx}
              className="p-3 sm:p-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-center space-y-2 sm:space-y-3 transition-colors"
            >
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{day.day}</p>
              <p className="text-[9px] text-slate-400 font-mono">{day.date}</p>
              <WeatherIcon code={day.icon} className="w-9 h-9 sm:w-11 sm:h-11 mx-auto my-1" />
              <div>
                <p className="text-xs font-semibold text-emerald-700">{day.description}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Rain: {day.rain}%</p>
              </div>
              <div className="flex justify-center gap-2 text-xs font-mono">
                <span className="text-slate-800 font-bold">{day.high}°</span>
                <span className="text-slate-400">{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
