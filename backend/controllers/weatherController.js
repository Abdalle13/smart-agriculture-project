// Weather Controller
// Fetches live weather data from OpenWeatherMap API for Afgoye, Somalia.
// Falls back to realistic mock data if API key is not configured.

const AFGOYE_LAT = 2.1393
const AFGOYE_LON = 45.1213
const OWM_BASE   = 'https://api.openweathermap.org/data/2.5'

// Map OWM weather condition codes to icon keys (rendered as real icons on the frontend)
const getWeatherIcon = (code) => {
  if (code >= 200 && code < 300) return 'thunderstorm'
  if (code >= 300 && code < 400) return 'drizzle'
  if (code >= 500 && code < 600) return 'rain'
  if (code >= 600 && code < 700) return 'snow'
  if (code >= 700 && code < 800) return 'fog'
  if (code === 800)               return 'clear'
  if (code === 801)               return 'partly-cloudy'
  if (code === 802)               return 'cloudy'
  if (code >= 803)                return 'overcast'
  return 'unknown'
}



/**
 * @desc    Get current weather + 5-day forecast for Afgoye, Somalia
 * @route   GET /api/weather
 * @access  Private
 */
export const getWeather = async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey || apiKey === 'your_openweather_api_key_here' || apiKey === '') {
    return res.status(500).json({ success: false, message: 'OpenWeather API key is not configured on the server.' })
  }

  try {
    // Parallel fetch: current weather + 5-day forecast
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${OWM_BASE}/weather?lat=${AFGOYE_LAT}&lon=${AFGOYE_LON}&appid=${apiKey}&units=metric`),
      fetch(`${OWM_BASE}/forecast?lat=${AFGOYE_LAT}&lon=${AFGOYE_LON}&appid=${apiKey}&units=metric&cnt=40`),
    ])

    if (!currentRes.ok) {
      const errBody = await currentRes.json()
      throw new Error(`OWM current error ${currentRes.status}: ${errBody.message}`)
    }
    if (!forecastRes.ok) {
      const errBody = await forecastRes.json()
      throw new Error(`OWM forecast error ${forecastRes.status}: ${errBody.message}`)
    }

    const current  = await currentRes.json()
    const forecast = await forecastRes.json()

    // ── Build 5-day daily forecast (aggregate daily min/max/rain, pick midday for condition) ──
    const dailyForecasts = {}
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000)
      const dayKey = date.toISOString().split('T')[0]

      if (!dailyForecasts[dayKey]) {
        dailyForecasts[dayKey] = {
          items: [],
          middayItem: null,
          maxTemp: -Infinity,
          minTemp: Infinity,
          maxPop: 0,
        }
      }

      const df = dailyForecasts[dayKey]
      df.items.push(item)

      // Find daily high (absolute maximum of temp_max)
      if (item.main.temp_max > df.maxTemp) {
        df.maxTemp = item.main.temp_max
      }

      // Find daily low (absolute minimum of temp_min)
      if (item.main.temp_min < df.minTemp) {
        df.minTemp = item.main.temp_min
      }

      // Find daily highest precipitation probability
      if (item.pop !== undefined && item.pop > df.maxPop) {
        df.maxPop = item.pop
      }

      // Select midday item (closest to 12:00 UTC) for general daily weather description/icon
      const hour = date.getUTCHours()
      if (!df.middayItem ||
          Math.abs(hour - 12) < Math.abs(new Date(df.middayItem.dt * 1000).getUTCHours() - 12)) {
        df.middayItem = item
      }
    })

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const sortedKeys = Object.keys(dailyForecasts).sort()
    const forecastDays = sortedKeys.slice(0, 5).map((dayKey, i) => {
      const df = dailyForecasts[dayKey]
      const refItem = df.middayItem || df.items[0]
      const date = new Date(refItem.dt * 1000)
      const desc = refItem.weather[0].description
      return {
        day:         i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[date.getDay()],
        date:        date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        high:        Math.round(df.maxTemp),
        low:         Math.round(df.minTemp),
        icon:        getWeatherIcon(refItem.weather[0].id),
        description: desc.charAt(0).toUpperCase() + desc.slice(1),
        rain:        Math.round((df.maxPop || 0) * 100),
      }
    })

    const windKmh = Math.round((current.wind?.speed || 0) * 3.6)

    // OWM's current-weather endpoint has no rain-probability field — pop only exists
    // on forecast entries, so use the nearest upcoming 3-hour bucket as "rain chance now"
    const nearestForecastPop = forecast.list[0]?.pop ?? 0

    const currentDesc = current.weather[0].description
    res.json({
      success: true,
      data: {
        location: 'Afgoye, Somalia',
        current: {
          temp:        Math.round(current.main.temp),
          feelsLike:   Math.round(current.main.feels_like),
          humidity:    current.main.humidity,
          windSpeed:   windKmh,
          rainChance:  Math.round(nearestForecastPop * 100),
          description: currentDesc.charAt(0).toUpperCase() + currentDesc.slice(1),
          icon:        getWeatherIcon(current.weather[0].id),
          visibility:  parseFloat(((current.visibility || 10000) / 1000).toFixed(1)),
        },
        forecast:  forecastDays,
        updatedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('OpenWeatherMap API Error:', error.message)
    return res.status(500).json({ success: false, message: 'Weather service temporarily unavailable.' })
  }
}
