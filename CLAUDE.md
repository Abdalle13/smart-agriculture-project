# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgriSense** is a smart agriculture IoT platform for Afgoye District, Somalia. It connects ESP32 soil probe hardware to a web dashboard used by farmers and an admin control panel. The stack is MERN (MongoDB + Express + React + Node.js).

## Development Commands

### Backend (run from `backend/`)
```
npm run dev        # start with nodemon (hot reload)
npm start          # start without nodemon
node seed.js       # seed default admin + farmer accounts
node seed.js --clear  # wipe all users and sensors
```

### Frontend (run from `frontend/`)
```
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # production build
npm run lint       # ESLint
npm run preview    # preview production build
```

Both services must run simultaneously during development. The backend listens on port 5000 by default.

## Architecture

### Backend (`/backend`)

Three-layer structure: routes → controllers → models, with JWT middleware.

**Entry point:** `server.js` — registers all routes and global error handler.

**Route map:**
| Prefix | File | Purpose |
|---|---|---|
| `/api/auth` | `authRoutes.js` | Login, register, user CRUD (admin) |
| `/api/sensors` | `sensorRegisterRoutes.js` | Device registry + telemetry queries |
| `/sensor` | `sensorRoutes.js` | Legacy IoT endpoint (ESP32 teacher code compatibility) |
| `/api/weather` | `weatherRoutes.js` | OpenWeatherMap proxy |

**Two sensor data models — important distinction:**
- `SensorRegister` (`models/SensorRegister.js`) — device registry. String `_id` like `"s001"`. Tracks name, location, farmerId assignment, and online/warning/offline status.
- `Sensor` (`models/Sensor.js`) — time-series telemetry. Stores each reading with NPK + temperature/humidity/moisture and a `sensorId` foreign key referencing SensorRegister.

**Auth middleware** (`middleware/auth.js`):
- `protect` — verifies JWT, attaches `req.user`, rejects inactive accounts
- `authorize(...roles)` — role gate, used as `authorize('admin')`

**User lifecycle:** Public `POST /api/auth/register` creates farmers with `isActive: false`. Admin must toggle status via `PUT /api/auth/users/:id/status` before the farmer can log in. Admin-created users (`POST /api/auth/users`) are active immediately.

**Seeded credentials** (run `node seed.js`):
- Admin: `admin@agrisense.io` / `admin123`
- Farmer: `abdalle@agrisense.io` / `abdalle123`

**Weather:** Hardcoded to Afgoye, Somalia (lat 2.1393, lon 45.1213). Requires `OPENWEATHER_API_KEY` in `backend/.env`. Returns 500 if key is missing — no silent fallback.

### Frontend (`/frontend`)

React 19 + Vite. Tailwind CSS with a custom dark-green agricultural theme defined in `tailwind.config.js`.

**Auth flow:** `AuthContext.jsx` stores JWT + user object in `localStorage` (keys in `STORAGE_KEYS`). Axios instance in `services/api.js` auto-attaches Bearer token on every request and globally redirects to `/login` on 401.

**Role-based routing** (`App.jsx`):
- `/admin/*` — requires `role === 'admin'`, rendered inside `AdminLayout`
- `/farmer/*` — requires `role === 'farmer'`, rendered inside `FarmerLayout`
- Wrong-role access redirects to the user's own home, not a 403 page.

**Single source of truth:** `utils/constants.js` — all route paths (`ROUTES`), role names (`ROLES`), sensor thresholds (`SENSOR_THRESHOLDS`), display config (`SENSOR_CONFIG`), polling intervals, and the API base URL (`VITE_API_URL`).

**Polling:** Sensor data polls every 10 s (`SENSOR_POLL_INTERVAL`), weather every 5 min (`WEATHER_POLL_INTERVAL`).

**AI diagnosis:** `services/mockData.js` — `mockDiagnoseImage()` is a mock returning a random disease result after a 2-second delay. The real AI microservice is planned at `http://localhost:8000` (`AI_BASE_URL` / `VITE_AI_URL`). Replace `mockDiagnoseImage` with a real `POST /ai-service/predict` call when the model is ready.

**Recommendation engine:** `utils/recommendationEngine.js` — pure function `getRecommendations(readings)` that converts live telemetry into agronomic advisory tips displayed on the farmer dashboard.

### IoT Hardware (`/iot`)

ESP32 Arduino sketch (`iot/esp32/esp32.ino`). Reads:
- DHT11 on pin 14 — temperature + air humidity
- Analog soil moisture sensor on pin 34
- NPK sensor via RS485 Modbus (UART2: RX=16, TX=17, DE=19, RE=4)

Posts JSON to `POST /sensor` (legacy) every 5 seconds with `sensorId: "s001"`. The `serverName` URL in the sketch must be updated to the local machine's IPv4 address.

The new preferred endpoint for IoT submissions is `POST /api/sensors/readings` (no auth required).

## Environment Variables

`backend/.env` (required):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrisense
JWT_SECRET=super_secret_agrisense_key_2026
NODE_ENV=development
OPENWEATHER_API_KEY=<your key>
```

Frontend env (optional, falls back to localhost defaults):
```
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```
