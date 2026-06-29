# AgriSense — Frontend

React 19 + Vite web application for the AgriSense smart agriculture platform.

---

## Commands

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

---

## Environment Variables

Create `frontend/.env` (optional — falls back to localhost):

```
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

---

## Folder Structure

```
frontend/src/
├── assets/
│   └── logo.svg                 AgriSense brand logo
├── contexts/
│   └── AuthContext.jsx          JWT auth state, login/logout
├── layouts/
│   ├── AdminLayout.jsx          Admin sidebar + header
│   └── FarmerLayout.jsx         Farmer sidebar + header
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── ForgotPassword.jsx
│   ├── admin/
│   │   ├── AdminOverview.jsx         Afgoye Control Center dashboard
│   │   ├── AdminFieldNodes.jsx       Sensor node registry management
│   │   ├── AdminFarmerManagement.jsx User/farmer account management
│   │   ├── AdminDataMonitoring.jsx   Historical telemetry charts
│   │   └── AdminReports.jsx          Reports page
│   └── farmer/
│       ├── FarmerDashboard.jsx   Live soil metric cards (Socket.io)
│       ├── FarmerSensors.jsx     Historical telemetry charts + CSV export
│       ├── FarmerWeather.jsx     Afgoye weather + agronomic advisory
│       └── FarmerDiagnosis.jsx   AI crop disease scan
├── services/
│   ├── api.js                   Axios instance (auto JWT + 401 redirect)
│   └── mockData.js              Mock AI diagnosis (replace when model ready)
├── utils/
│   ├── constants.js             Routes, roles, thresholds, sensor config
│   └── recommendationEngine.js  Agronomic tips from live sensor readings
├── App.jsx                      Role-based routing
└── index.css                    Tailwind + custom utility classes
```

---

## Routing

| Path | Role | Page |
|---|---|---|
| `/login` | Public | Login |
| `/register` | Public | Register (farmer request) |
| `/admin/dashboard` | Admin | Afgoye Control Center |
| `/admin/sensors` | Admin | Field node registry |
| `/admin/users` | Admin | Farmer management |
| `/admin/data-monitor` | Admin | Data monitoring charts |
| `/farmer/dashboard` | Farmer | Live field dashboard |
| `/farmer/sensors` | Farmer | Telemetry charts + CSV |
| `/farmer/weather` | Farmer | Weather intelligence |
| `/farmer/diagnosis` | Farmer | AI crop diagnosis |

Wrong-role access redirects to the user's own home, not a 403 page.

---

## Auth Flow

1. Login → backend returns JWT + user object
2. Stored in `localStorage` (`agrisense_token`, `agrisense_user`)
3. Axios auto-attaches `Authorization: Bearer <token>` on every request
4. On 401 response → auto redirect to `/login`
5. Admin must activate farmer accounts before they can log in

---

## Real-Time Dashboard

`FarmerDashboard.jsx` uses **Socket.io** instead of polling:

```
ESP32 posts reading → Backend emits 'newReading' → Dashboard updates instantly
```

On mount it fetches the latest reading via HTTP (initial load).
Then `socket.on('newReading')` handles all subsequent live updates.

---

## Key Utilities

**`utils/constants.js`** — single source of truth:
- `ROUTES` — all page paths
- `ROLES` — role names
- `SENSOR_THRESHOLDS` — min/max/warning/critical per parameter
- `SENSOR_CONFIG` — label, icon, color, unit per parameter
- `SENSOR_POLL_INTERVAL`, `WEATHER_POLL_INTERVAL` — timing constants

**`utils/recommendationEngine.js`** — pure function:
```js
getRecommendations(readings) → [ { type: 'warning'|'danger'|'success', message: '...' } ]
```
Converts live telemetry into agronomic advisory tips shown on the farmer dashboard and weather page.

---

## Styling

Tailwind CSS with a custom dark-green agricultural theme (`tailwind.config.js`).

Custom utility classes defined in `index.css`:

| Class | Usage |
|---|---|
| `.card` | White rounded panel with shadow |
| `.btn-primary` | Emerald filled button |
| `.btn-secondary` | Slate outlined button |
| `.btn-danger` | Red outlined button |
| `.badge-green` | Green status badge |
| `.badge-amber` | Amber warning badge |
| `.badge-red` | Red critical badge |
| `.alert-warning` | Amber alert box |
| `.alert-danger` | Red alert box |
| `.alert-success` | Green alert box |
| `.nav-link` | Sidebar navigation link |
| `.page-container` | Standard page padding/max-width |
| `.live-dot` | Animated green pulse dot |

---

## AI Diagnosis

`services/mockData.js` — `mockDiagnoseImage()` returns a random disease result after a 2s delay.
Replace with a real `POST /ai-service/predict` call when the model is ready (`VITE_AI_URL`).
