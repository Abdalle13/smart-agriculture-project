// App constants — single source of truth for the entire frontend

// ─── API Endpoints ─────────────────────────────────────────────────────────
export const API_BASE_URL  = import.meta.env.VITE_API_URL      || 'http://localhost:5000/api'
export const AI_BASE_URL   = import.meta.env.VITE_AI_URL       || 'http://localhost:8000'
export const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_KEY || 'MOCK_KEY'

// ─── User Roles ─────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:  'admin',
  FARMER: 'farmer',
}

// ─── Route Paths ────────────────────────────────────────────────────────────
export const ROUTES = {
  // Auth
  LOGIN:    '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Admin
  ADMIN_DASHBOARD:  '/admin/dashboard',
  ADMIN_USERS:      '/admin/users',
  ADMIN_SENSORS:    '/admin/sensors',
  ADMIN_SYSTEM:     '/admin/system',

  // Farmer
  FARMER_DASHBOARD: '/farmer/dashboard',
  FARMER_SENSORS:   '/farmer/sensors',
  FARMER_WEATHER:   '/farmer/weather',
  FARMER_DIAGNOSIS: '/farmer/diagnosis',
}

// ─── Sensor Thresholds (Afgoye district defaults) ───────────────────────────
export const SENSOR_THRESHOLDS = {
  nitrogen:    { min: 0,   max: 200, unit: 'mg/kg', warning: 40,  critical: 20  },
  phosphorus:  { min: 0,   max: 100, unit: 'mg/kg', warning: 20,  critical: 10  },
  potassium:   { min: 0,   max: 300, unit: 'mg/kg', warning: 50,  critical: 25  },
  temperature: { min: 0,   max: 60,  unit: '°C',    warning: 40,  critical: 45  },
  humidity:    { min: 0,   max: 100, unit: '%',      warning: 20,  critical: 10  },
  ph:          { min: 0,   max: 14,  unit: 'pH',     warning: 5.5, critical: 4.5 },
}

// ─── Sensor Display Config ──────────────────────────────────────────────────
export const SENSOR_CONFIG = {
  nitrogen:    { label: 'Nitrogen',     icon: 'N',  color: '#3b82f6', unit: 'mg/kg' },
  phosphorus:  { label: 'Phosphorus',   icon: 'P',  color: '#a855f7', unit: 'mg/kg' },
  potassium:   { label: 'Potassium',    icon: 'K',  color: '#f97316', unit: 'mg/kg' },
  temperature: { label: 'Temperature',  icon: '🌡', color: '#ef4444', unit: '°C'    },
  humidity:    { label: 'Soil Humidity',icon: '💧', color: '#06b6d4', unit: '%'     },
  ph:          { label: 'Soil pH',      icon: '⚗', color: '#eab308', unit: 'pH'    },
}

// ─── Weather ─────────────────────────────────────────────────────────────────
export const AFGOYE_COORDS = { lat: 2.1393, lon: 45.1213 }
export const AFGOYE_CITY   = 'Afgoye, Somalia'

// ─── App Meta ───────────────────────────────────────────────────────────────
export const APP_NAME    = 'AgriSense'
export const APP_TAGLINE = 'Smart Agriculture · Afgoye District'
export const APP_VERSION = '1.0.0'

// ─── Polling Intervals (ms) ─────────────────────────────────────────────────
export const SENSOR_POLL_INTERVAL  = 10000  // 10 seconds
export const WEATHER_POLL_INTERVAL = 300000 // 5 minutes

// ─── Local Storage Keys ─────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN: 'agrisense_token',
  USER:  'agrisense_user',
}
