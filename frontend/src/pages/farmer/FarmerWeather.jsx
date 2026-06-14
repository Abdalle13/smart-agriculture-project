import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function FarmerWeather() {
  const [weather, setWeather]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [apiError, setApiError] = useState(null)

  const fetchWeather = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const { data: res } = await api.get('/weather')
      if (res.success) {
        setWeather(res.data)
      } else {
        setApiError(res.message || 'Unknown error occurred')
      }
    } catch (err) {
      console.error('Weather fetch failed:', err)
      setApiError('Could not reach weather service.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount — auto-refresh every 5 minutes
  useEffect(() => {
    fetchWeather()
    const timer = setInterval(fetchWeather, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  if (loading || !weather) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-sm text-emerald-600 animate-pulse font-medium">
          Fetching live Afgoye weather data...
        </p>
      </div>
    )
  }

  // ── Smart agri-advisory based on live conditions ──────────────────────────
  const getAgriSuggestions = () => {
    const tips     = []
    const current  = weather?.current
    const forecast = weather?.forecast || []

    const currentDesc = current?.description?.toLowerCase() || ''
    const maxRain = Math.max(forecast[0]?.rain || 0, forecast[1]?.rain || 0)

    // 1. Extreme Heat / UV Alert
    if (current?.uvIndex >= 8 || current?.temp >= 35) {
      tips.push({
        id: 1,
        title: 'Extreme Heat / UV Alert',
        message: `HIGH SOLAR RADIATION INTENSITY: UV index is ${current?.uvIndex || 0}. Apply temporary shading or mulch for young crops and irrigate before 9AM.`,
        level: 'warning', // Renders as Yellow/Amber card
      })
    }

    // 2. Heavy Rain Alert
    if (currentDesc.includes('rain') || currentDesc.includes('storm') || maxRain >= 70) {
      tips.push({
        id: 2,
        title: 'Heavy Rain Alert',
        message: `HEAVY PRECIPITATION FORECAST: High chance of rain detected (${maxRain}%). Ensure proper farm drainage channels are open to prevent waterlogging.`,
        level: 'info', // Renders as Blue card
      })
    }

    // 3. Normal/Optimal Farming Weather
    if (tips.length === 0) {
      tips.push({
        id: 3,
        title: 'Optimal Farming Weather',
        message: 'STABLE FARMING CONDITIONS: Moderate conditions expected. Maintain standard watering and crop maintenance schedules.',
        level: 'success', // Renders as Green card
      })
    }

    return tips
  }

  const suggestions = getAgriSuggestions()

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
          {/* Live indicator badge */}
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Data
          </span>
          <button onClick={fetchWeather} className="btn-secondary py-2">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── API Error / Mock fallback notice ── */}
      {apiError && (
        <div className="alert-warning flex items-start gap-3 border border-amber-200">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">Weather API Notice</p>
            <p className="text-sm mt-0.5 leading-relaxed font-normal">{apiError}</p>
          </div>
        </div>
      )}

      {/* ── OWM Weather Alerts ── */}
      {weather?.alerts?.map((alert, idx) => (
        <div key={idx} className="alert-warning flex items-start gap-3 border border-amber-200">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">Afgoye Weather Alert</p>
            <p className="text-sm mt-0.5 leading-relaxed font-normal">{alert.message}</p>
          </div>
        </div>
      ))}

      {/* ── Grid Layout: Current Conditions + Agri Advisory ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns — Current weather */}
        <div className="lg:col-span-2 card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="section-title">Current Microclimate Conditions</h2>
            <span className="text-xs text-slate-400 font-mono">
              Afgoye · {weather?.updatedAt
                ? new Date(weather.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Big temperature display */}
            <div className="text-center sm:text-left space-y-1">
              <span className="text-6xl sm:text-7xl block">{weather?.current?.icon}</span>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {weather?.current?.temp}°C
              </p>
              <p className="text-sm text-emerald-650 font-bold uppercase tracking-wider">
                {weather?.current?.description}
              </p>
            </div>

            {/* Weather stat grid */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
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
                <p className="text-xs text-slate-400 font-bold uppercase">UV Index</p>
                <p className="text-base font-semibold text-slate-800 mt-0.5">{weather?.current?.uvIndex} / 11</p>
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

        {/* Right 1 Column — Agri advisory */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3">
            Irrigation & Farm Advisory
          </h2>
          <div className="space-y-3.5">
            {suggestions.map(sug => (
              <div
                key={sug.id}
                className={`p-4 rounded-xl border text-xs leading-relaxed ${getAlertClass(sug.level)}`}
              >
                <p className="font-bold text-xs uppercase tracking-wide mb-1">{sug.title}</p>
                <p className="text-slate-600 font-normal">{sug.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── 5-Day Forecast ── */}
      <div className="card space-y-4">
        <h2 className="section-title border-b border-slate-100 pb-3">5-Day Outlook</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {weather?.forecast?.map((day, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-2xl text-center space-y-3 transition-colors"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day.day}</p>
              <span className="text-4xl block my-1">{day.icon}</span>
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
