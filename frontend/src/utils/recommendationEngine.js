/**
 * Soil-based agronomic recommendations from live telemetry readings.
 * @param {object} readings - { nitrogen, phosphorus, potassium, temperature, humidity, moisture }
 * @returns {array} [{ type: 'warning'|'danger'|'success', message }]
 */
export const getSoilRecommendations = (readings) => {
  const tips = []
  if (!readings) return tips

  if (readings.nitrogen < 50) {
    tips.push({
      type: 'warning',
      message: 'Low nitrogen (N) detected. Consider applying urea fertilizer at 50kg/acre to boost vegetative growth.',
    })
  }

  if (readings.nitrogen > 200) {
    tips.push({
      type: 'warning',
      message: 'Excessive nitrogen detected. Reduce nitrogen fertilizer application to prevent leaf burn and environmental runoff.',
    })
  }

  if (readings.phosphorus < 25) {
    tips.push({
      type: 'warning',
      message: 'Low phosphorus (P) detected. Apply DAP fertilizer at 30kg/acre to support root development and flowering.',
    })
  }

  if (readings.potassium < 20) {
    tips.push({
      type: 'warning',
      message: 'Low potassium (K) detected. Apply potassium sulfate at 40kg/acre to improve drought resistance and fruit quality.',
    })
  }

  if (readings.moisture > 85) {
    tips.push({
      type: 'warning',
      message: 'Soil is waterlogged. Improve field drainage immediately to prevent root rot.',
    })
  }

  if (readings.moisture < 35) {
    tips.push({
      type: 'danger',
      message: 'Critical: Soil moisture is extremely low. Irrigate immediately to prevent crop wilting and water stress.',
    })
  }

  if (readings.humidity < 30) {
    tips.push({
      type: 'warning',
      message: 'Low air humidity detected. High transpiration rates may stress crops; consider morning watering.',
    })
  }

  if (readings.temperature > 40) {
    tips.push({
      type: 'warning',
      message: 'Extreme temperature detected. Apply organic mulch layer to reduce soil evaporation and cool the root zone.',
    })
  }

  if (tips.length === 0) {
    tips.push({
      type: 'success',
      message: 'All soil chemistry and moisture parameters are within the optimal range. Keep up the good monitoring!',
    })
  }

  return tips
}

/**
 * Pure weather-based agronomic advisory for the weather intelligence page.
 * @param {object} weather - Weather API response ({ current, forecast })
 * @returns {array} [{ id, level: 'warning'|'danger'|'info'|'success', title, message }]
 */
export const getWeatherAdvisory = (weather) => {
  const tips = []
  if (!weather?.current) return tips

  const current  = weather.current
  const forecast = weather.forecast || []
  const desc     = current.description?.toLowerCase() || ''
  const maxRain  = Math.max(forecast[0]?.rain || 0, forecast[1]?.rain || 0)

  // 1. Heat & Thermal Stress
  if (current.temp >= 35) {
    tips.push({
      id: 'heat-severe', level: 'warning',
      title: 'Extreme Heat Alert',
      message: `High ambient temperature (${current.temp}°C). Irrigate early morning or evening to minimize evaporation loss.`,
    })
  } else if (current.temp >= 30) {
    tips.push({
      id: 'heat-moderate', level: 'info',
      title: 'Warm Weather Notice',
      message: `Temperature is ${current.temp}°C. Keep crop hydration steady.`,
    })
  }

  // 2. Rainfall & Storm Forecast
  if (desc.includes('rain') || desc.includes('storm') || maxRain >= 60) {
    tips.push({
      id: 'rain-high', level: 'info',
      title: 'Rain Forecast Alert',
      message: `Precipitation expected (${maxRain}% chance). Clear field drainage channels to prevent waterlogging.`,
    })
  } else if (maxRain < 20 && current.temp > 28) {
    tips.push({
      id: 'dry-spell', level: 'info',
      title: 'Dry Outlook',
      message: `Low probability of rain over the next 48 hours. Plan scheduled irrigation accordingly.`,
    })
  }

  // 3. Air Humidity & Fungal Risk
  if (current.humidity > 80) {
    tips.push({
      id: 'humidity-high', level: 'warning',
      title: 'High Air Humidity',
      message: `Relative humidity is ${current.humidity}%. Elevated humidity increases leaf fungal disease risk. Inspect foliage.`,
    })
  } else if (current.humidity < 35) {
    tips.push({
      id: 'humidity-low', level: 'info',
      title: 'Dry Air Notice',
      message: `Air humidity is low (${current.humidity}%). Crop transpiration rate will be higher.`,
    })
  }

  // 4. Wind Speed & Field Operations
  if ((current.windSpeed || 0) >= 30) {
    tips.push({
      id: 'wind-strong', level: 'warning',
      title: 'Strong Wind Warning',
      message: `Wind speed is ${current.windSpeed} km/h. Avoid pesticide/fertilizer spraying and secure lightweight farm covers.`,
    })
  }

  // 5. 48-Hour Microclimate Outlook (Always included as a forward-looking guide)
  const tomorrow = forecast[1] || forecast[0]
  if (tomorrow) {
    const rainMsg = tomorrow.rain >= 40
      ? `Rain expected (${tomorrow.rain}% chance, ${tomorrow.description.toLowerCase()}) with highs near ${tomorrow.high}°C.`
      : `Mostly ${tomorrow.description.toLowerCase()} with highs near ${tomorrow.high}°C and low rain probability (${tomorrow.rain}%).`

    tips.push({
      id: 'forecast-48h',
      level: 'info',
      title: '48-Hour Microclimate Outlook',
      message: `${tomorrow.day}: ${rainMsg} (Note: Weather forecasts are probabilistic estimates, not 100% guaranteed. Recheck live conditions before major field work).`,
    })
  }

  // 6. Default Favorable Conditions
  if (tips.length === 0) {
    tips.push({
      id: 'weather-optimal', level: 'success',
      title: 'Favorable Weather Conditions',
      message: 'Stable temperatures and weather conditions. Excellent weather for routine field work and maintenance.',
    })
  }

  return tips
}

// Legacy export, keeps FarmerDashboard import working without change
export const getRecommendations = getSoilRecommendations
