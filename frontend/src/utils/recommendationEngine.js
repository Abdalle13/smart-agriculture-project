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
 * Combined weather + soil advisory for the weather intelligence page.
 * @param {object} weather - Weather API response ({ current, forecast })
 * @param {object|null} soilReading - Latest soil telemetry (optional)
 * @param {boolean} hasSensor - Whether a field probe is assigned to this farmer at all
 * @returns {array} [{ id, level: 'warning'|'danger'|'info'|'success', title, message }]
 */
export const getWeatherAdvisory = (weather, soilReading = null, hasSensor = false) => {
  const tips = []
  const current  = weather?.current
  const forecast = weather?.forecast || []
  const desc     = current?.description?.toLowerCase() || ''
  const maxRain  = Math.max(forecast[0]?.rain || 0, forecast[1]?.rain || 0)

  if (current?.temp >= 35) {
    tips.push({
      id: 'heat', level: 'warning',
      title: 'Extreme Heat Alert',
      message: `Temperature is ${current?.temp}°C. Irrigate before 9AM and apply shading to young crops.`,
    })
  }

  if (desc.includes('rain') || desc.includes('storm') || maxRain >= 70) {
    tips.push({
      id: 'rain', level: 'info',
      title: 'Heavy Rain Alert',
      message: `High rain probability detected (${maxRain}%). Ensure farm drainage channels are open to prevent waterlogging.`,
    })
  }

  if ((current?.windSpeed || 0) > 35) {
    tips.push({
      id: 'wind', level: 'warning',
      title: 'High Wind Warning',
      message: `Wind speed is ${current?.windSpeed} km/h. Secure lightweight irrigation equipment and crop covers.`,
    })
  }

  if (soilReading) {
    getSoilRecommendations(soilReading)
      .filter(t => t.type !== 'success')
      .forEach((t, i) => {
        tips.push({
          id: `soil-${i}`,
          level: t.type === 'danger' ? 'danger' : 'warning',
          title: 'Soil Advisory',
          message: t.message,
        })
      })
  }

  if (tips.length === 0) {
    if (soilReading) {
      tips.push({
        id: 'ok', level: 'success',
        title: 'Optimal Farming Conditions',
        message: 'Stable weather and soil conditions. Maintain standard watering and crop maintenance schedules.',
      })
    } else if (hasSensor) {
      tips.push({
        id: 'no-data', level: 'info',
        title: 'Waiting for Sensor Data',
        message: 'Your field probe is connected but hasn\'t sent any readings yet. This advisory is based on weather alone for now. Soil-based tips will appear once it starts reporting.',
      })
    } else {
      tips.push({
        id: 'no-soil', level: 'info',
        title: 'Weather-Only Advisory',
        message: 'No field sensor is connected to your account yet, so this advisory is based on weather alone. Ask your administrator to assign a soil probe for full soil-based recommendations.',
      })
    }
  }

  return tips
}

// Legacy export, keeps FarmerDashboard import working without change
export const getRecommendations = getSoilRecommendations
