// ─── Mock Data Service ───────────────────────────────────────────────────────
// TODO: INTEGRATE — Replace all mock functions with real API calls
// when backend & IoT hardware are ready.

import { SENSOR_CONFIG } from '../utils/constants'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rand = (min, max, decimals = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

const randomTrend = () => (Math.random() > 0.5 ? 'up' : 'down')

const now = () => new Date().toISOString()

// ─── Mock Users ───────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  {
    _id: 'u001',
    name: 'Admin User',
    email: 'admin@agrisense.io',
    password: 'admin123',   // TODO: INTEGRATE — remove plaintext, use bcrypt
    role: 'admin',
    avatar: null,
    createdAt: '2025-01-10T08:00:00Z',
    isActive: true,
  },
  {
    _id: 'u002',
    name: 'Abukar Hassan',
    email: 'abukar@agrisense.io',
    password: 'farmer123',
    role: 'farmer',
    avatar: null,
    fieldName: 'Hassan North Field',
    location: 'Afgoye, Somalia',
    sensorIds: ['s001', 's002'],
    createdAt: '2025-02-15T09:30:00Z',
    isActive: true,
  },
  {
    _id: 'u003',
    name: 'Fadumo Warsame',
    email: 'fadumo@agrisense.io',
    password: 'farmer123',
    role: 'farmer',
    avatar: null,
    fieldName: 'Warsame South Field',
    location: 'Afgoye, Somalia',
    sensorIds: ['s003'],
    createdAt: '2025-03-01T07:15:00Z',
    isActive: true,
  },
  {
    _id: 'u004',
    name: 'Mahad Jama',
    email: 'mahad@agrisense.io',
    password: 'farmer123',
    role: 'farmer',
    avatar: null,
    fieldName: 'Jama East Field',
    location: 'Afgoye, Somalia',
    sensorIds: ['s004'],
    createdAt: '2025-03-20T10:00:00Z',
    isActive: false,
  },
]

// ─── Mock Auth ────────────────────────────────────────────────────────────────
// TODO: INTEGRATE — Replace with POST /api/auth/login
export const mockLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password && u.isActive
      )
      if (user) {
        const { password: _, ...safeUser } = user
        resolve({
          token: `mock-jwt-token-${safeUser._id}-${Date.now()}`,
          user: safeUser,
        })
      } else {
        reject(new Error('Invalid credentials. Please try again.'))
      }
    }, 800) // simulate network delay
  })
}

// ─── Mock Sensor Readings ─────────────────────────────────────────────────────
// TODO: INTEGRATE — Replace with GET /api/sensors/latest?farmerId=xxx
export const mockGetSensorReadings = (sensorId = 's001') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        sensorId,
        timestamp: now(),
        nitrogen:    rand(30, 180),
        phosphorus:  rand(10, 90),
        potassium:   rand(40, 250),
        temperature: rand(22, 42),
        humidity:    rand(30, 85),
        ph:          rand(5.5, 8.0),
        status: 'online',
      })
    }, 400)
  })
}

// ─── Mock Sensor History (last 12 readings) ───────────────────────────────────
// TODO: INTEGRATE — Replace with GET /api/sensors/history
export const mockGetSensorHistory = (parameter = 'nitrogen', hours = 12) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const ranges = {
        nitrogen:    [30, 180], phosphorus: [10, 90], potassium: [40, 250],
        temperature: [22, 42],  humidity:   [30, 85], ph:        [5.5, 8.0],
      }
      const [min, max] = ranges[parameter] || [0, 100]
      const data = Array.from({ length: hours }, (_, i) => ({
        time: new Date(Date.now() - (hours - i) * 3600000)
          .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        value: rand(min, max),
      }))
      resolve(data)
    }, 300)
  })
}

// ─── Mock Sensors List ────────────────────────────────────────────────────────
export const MOCK_SENSORS = [
  { _id: 's001', name: 'Sensor A',  farmerId: 'u002', location: 'North Plot',  status: 'online',  battery: 87, lastSeen: now() },
  { _id: 's002', name: 'Sensor B',  farmerId: 'u002', location: 'South Plot',  status: 'online',  battery: 54, lastSeen: now() },
  { _id: 's003', name: 'Sensor C',  farmerId: 'u003', location: 'West Field',  status: 'warning', battery: 18, lastSeen: now() },
  { _id: 's004', name: 'Sensor D',  farmerId: 'u004', location: 'East Sector', status: 'offline', battery: 0,  lastSeen: '2026-05-25T14:00:00Z' },
]

// TODO: INTEGRATE — Replace with GET /api/sensors
export const mockGetAllSensors = () =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_SENSORS), 300))

// ─── Mock Weather ─────────────────────────────────────────────────────────────
// TODO: INTEGRATE — Replace with GET /api/weather/forecast
export const mockGetWeather = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        location:    'Afgoye, Somalia',
        current: {
          temp:        rand(28, 38, 0),
          feelsLike:   rand(30, 42, 0),
          humidity:    rand(40, 75, 0),
          windSpeed:   rand(5, 25, 1),
          description: 'Partly Cloudy',
          icon:        '⛅',
          uvIndex:     rand(6, 11, 0),
          visibility:  rand(8, 15, 1),
        },
        forecast: Array.from({ length: 5 }, (_, i) => ({
          day:         ['Today','Tomorrow','Wed','Thu','Fri'][i],
          high:        rand(30, 40, 0),
          low:         rand(22, 28, 0),
          icon:        ['☀️','⛅','🌧️','☀️','⛅'][i],
          description: ['Sunny','Partly Cloudy','Rainy','Sunny','Partly Cloudy'][i],
          rain:        [0, 10, 80, 5, 20][i],
        })),
        alerts: [
          { type: 'warning', message: 'High UV index expected between 11AM–3PM. Irrigate early morning.' },
        ],
        updatedAt: now(),
      })
    }, 500)
  })
}

// ─── Mock Disease Diagnosis ───────────────────────────────────────────────────
// TODO: INTEGRATE — Replace with POST /ai-service/predict
export const mockDiagnoseImage = (imageFile) => {
  const diseases = [
    { name: 'Leaf Blight',       confidence: 0.91, severity: 'High',   treatment: 'Apply copper-based fungicide. Remove infected leaves immediately.' },
    { name: 'Powdery Mildew',    confidence: 0.84, severity: 'Medium', treatment: 'Spray diluted neem oil or sulfur-based fungicide weekly.' },
    { name: 'Nitrogen Deficiency', confidence: 0.78, severity: 'Medium', treatment: 'Apply nitrogen-rich fertilizer (urea). Ensure soil pH is 6–7.' },
    { name: 'Healthy Crop',      confidence: 0.95, severity: 'None',   treatment: 'No action needed. Continue regular monitoring.' },
  ]
  const result = diseases[Math.floor(Math.random() * diseases.length)]
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        fileName:   imageFile?.name || 'unknown.jpg',
        diagnosis:  result.name,
        confidence: result.confidence,
        severity:   result.severity,
        treatment:  result.treatment,
        modelUsed:  'Mock CNN v0.1',   // TODO: INTEGRATE — real model name
        analyzedAt: now(),
      })
    }, 2000) // simulate AI processing time
  })
}

// ─── Mock System Stats (Admin) ────────────────────────────────────────────────
// TODO: INTEGRATE — Replace with GET /api/admin/stats
export const mockGetSystemStats = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalFarmers:    MOCK_USERS.filter(u => u.role === 'farmer').length,
        activeFarmers:   MOCK_USERS.filter(u => u.role === 'farmer' && u.isActive).length,
        totalSensors:    MOCK_SENSORS.length,
        onlineSensors:   MOCK_SENSORS.filter(s => s.status === 'online').length,
        offlineSensors:  MOCK_SENSORS.filter(s => s.status === 'offline').length,
        warningSensors:  MOCK_SENSORS.filter(s => s.status === 'warning').length,
        diagnosesToday:  rand(3, 15, 0),
        alertsActive:    rand(0, 5, 0),
        systemHealth:    'Operational',
        updatedAt:       now(),
      })
    }, 400)
  })
}

// ─── Mock Recommendations ─────────────────────────────────────────────────────
export const mockGetRecommendations = (readings) => {
  const tips = []
  if (readings?.nitrogen < 50)
    tips.push({ type: 'warning', message: 'Low nitrogen detected. Apply urea fertilizer at 50kg/acre.' })
  if (readings?.ph < 6.0)
    tips.push({ type: 'warning', message: 'Soil pH is acidic. Apply lime to raise pH towards 6.5.' })
  if (readings?.humidity < 35)
    tips.push({ type: 'danger',  message: 'Critical: Soil moisture very low. Irrigate immediately.' })
  if (readings?.temperature > 40)
    tips.push({ type: 'warning', message: 'High soil temperature. Consider mulching to retain moisture.' })
  if (tips.length === 0)
    tips.push({ type: 'success', message: 'All sensor readings are within optimal range. Great job!' })
  return tips
}
