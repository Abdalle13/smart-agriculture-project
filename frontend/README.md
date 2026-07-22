# AgriSense — Frontend

React 19 + Vite web application for the AgriSense smart agriculture platform.

---

## Prerequisites

- Node.js >= 18.x and npm >= 9.x
- The `backend` service running (this app talks to it for everything except static assets) — see [`../backend/README.md`](../backend/README.md)

---

## Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. You'll need a backend account to log in — either seed one (`node seed.js` in `backend/`) or register and have an admin approve it.

---

## Development Commands

```bash
npm run dev      # Vite dev server with hot reload → http://localhost:5173
npm run build    # production build → dist/
npm run lint     # ESLint
npm run preview  # serve the production build locally, to sanity-check before deploying
```

---

## Environment Variables

Create `frontend/.env` (optional — everything falls back to localhost defaults; see [`.env.example`](.env.example)):

```
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

| Variable       | Required                                     | Purpose                                                             |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `VITE_API_URL` | No (defaults to `http://localhost:5000/api`) | Base URL the app calls for all backend requests (`services/api.js`) |

> `utils/constants.js` also defines an `AI_BASE_URL` (`VITE_AI_URL`, default `http://localhost:8000`), but nothing in the app currently calls it — the AI diagnosis flow goes through the backend (`POST /api/diagnosis`), which forwards to `ai-service` itself. It's safe to leave unset.

> **Deployment note:** in production, set `VITE_API_URL` (and `VITE_AI_URL`) as Vercel environment variables pointing at your deployed backend/ai-service URLs — Vite env vars are baked in at **build time**, so changing them on Vercel requires a redeploy, not just a restart.

---

## VS Code

Recommended extensions: **ESLint** (`dbaeumer.vscode-eslint`), **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`).

No special interpreter/SDK selection is needed (plain Node.js + Vite) — just make sure `npm install` has been run so ESLint and Tailwind's IntelliSense can resolve project dependencies.

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
│   │   └── RegisterPage.jsx
│   ├── admin/
│   │   ├── AdminOverview.jsx         Farmer/node/diagnosis stats + charts
│   │   ├── AdminFieldNodes.jsx       Sensor node registry management
│   │   ├── AdminFarmerManagement.jsx User/farmer account management
│   │   ├── AdminDataMonitoring.jsx   Historical telemetry charts
│   │   ├── AdminAIDiagnosis.jsx      All farmers' AI diagnosis history, filterable
│   │   └── AdminSupportMessages.jsx  Farmer support inbox — filter, reply, resolve
│   └── farmer/
│       ├── FarmerDashboard.jsx        Live soil metric cards (Socket.io)
│       ├── FarmerSensors.jsx          Historical telemetry charts + CSV export
│       ├── FarmerWeather.jsx          Afgoye weather + agronomic advisory
│       ├── FarmerDiagnosis.jsx        AI crop disease scan
│       ├── FarmerDiagnosisHistory.jsx Own past scans, filterable + detail modal
│       └── FarmerContact.jsx          Submit support messages, view admin replies
├── services/
│   └── api.js                   Axios instance (auto JWT + 401 redirect)
├── utils/
│   ├── constants.js             Routes, roles, thresholds, sensor config
│   └── recommendationEngine.js  Agronomic tips from live sensor readings
├── App.jsx                      Role-based routing
└── index.css                    Tailwind + custom utility classes
```

---

## Routing

| Path                     | Role   | Page                      |
| ------------------------ | ------ | ------------------------- |
| `/login`                 | Public | Login                     |
| `/register`              | Public | Register (farmer request) |
| `/admin/dashboard`       | Admin  | Overview dashboard        |
| `/admin/sensors`         | Admin  | Field node registry       |
| `/admin/users`           | Admin  | Farmer management         |
| `/admin/data-monitor`    | Admin  | Data monitoring charts    |
| `/admin/ai-diagnosis`    | Admin  | AI diagnosis history      |
| `/admin/support`         | Admin  | Support message inbox     |
| `/farmer/dashboard`      | Farmer | Live field dashboard      |
| `/farmer/sensors`        | Farmer | Telemetry charts + CSV    |
| `/farmer/weather`        | Farmer | Weather intelligence      |
| `/farmer/diagnosis`      | Farmer | AI crop diagnosis         |
| `/farmer/diagnosis/history` | Farmer | Past scan history      |
| `/farmer/contact`        | Farmer | Contact support           |

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

## Notifications

Both layouts (`AdminLayout.jsx`, `FarmerLayout.jsx`) show a bell icon in the top-right header instead of a static status pill:

- **Admin** — badge count = number of support messages still `Open` (`GET /contact/all?status=Open`). Click → Support Messages page.
- **Farmer** — badge count = number of the farmer's own support messages with an unseen admin reply (`GET /contact/my`, filtered by `adminReply` set and `farmerSeen: false`). Click, or simply visiting `/farmer/contact`, marks them seen (`PATCH /contact/mark-seen`) and clears the badge — independent of whether the admin has marked the ticket `Resolved`.

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

| Class             | Usage                           |
| ----------------- | ------------------------------- |
| `.card`           | White rounded panel with shadow |
| `.btn-primary`    | Emerald filled button           |
| `.btn-secondary`  | Slate outlined button           |
| `.btn-danger`     | Red outlined button             |
| `.badge-green`    | Green status badge              |
| `.badge-amber`    | Amber warning badge             |
| `.badge-red`      | Red critical badge              |
| `.alert-warning`  | Amber alert box                 |
| `.alert-danger`   | Red alert box                   |
| `.alert-success`  | Green alert box                 |
| `.nav-link`       | Sidebar navigation link         |
| `.page-container` | Standard page padding/max-width |
| `.live-dot`       | Animated green pulse dot        |

---

## AI Diagnosis

`FarmerDiagnosis.jsx` uploads the leaf photo directly to the backend:

```js
api.post("/diagnosis", formData); // formData field name: "image"
```

The backend forwards the image to `ai-service` for CNN inference, saves the result, and returns it — the frontend never calls `ai-service` directly. See [`../ai-service/README.md`](../ai-service/README.md) for the model itself.

---

## Troubleshooting

| Problem                                   | Cause                                                                              | Fix                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Login/API calls fail with a network error | Backend isn't running, or `VITE_API_URL` points to the wrong address               | Start the backend (`npm run dev` in `backend/`) and confirm the port matches           |
| Stuck on a loading spinner after login    | Socket.io can't reach the backend, or the account is pending approval              | Check the backend is running; confirm an admin has approved the account (`isApproved`) |
| Env var changes don't seem to apply       | Vite only reads `.env` at dev-server startup                                       | Restart `npm run dev` after editing `frontend/.env`                                    |
| 401 redirect loop to `/login`             | Stored token expired or invalid                                                    | Clear `localStorage` (`agrisense_token`, `agrisense_user`) and log in again            |
| AI diagnosis upload fails                 | Backend's `AI_SERVICE_URL` can't reach `ai-service`, or `ai-service` isn't running | Confirm `ai-service` is running on port 8000 — see its Troubleshooting section         |
| Refreshing a deep link (e.g. `/farmer/dashboard`) 404s in production | Vercel doesn't know to fall back to `index.html` for client-side routes | Already handled by `frontend/vercel.json` (SPA rewrite) — make sure it's present and deployed |

---

## Deployment (Vercel)

1. Import this GitHub repo into Vercel → set **root directory** to `frontend/` → framework preset: **Vite**.
2. Set environment variables in Vercel's project settings: `VITE_API_URL` (deployed backend URL + `/api`), `VITE_AI_URL` (deployed ai-service URL, optional — not currently called directly by the app).
3. `vercel.json` in this folder already handles the SPA rewrite needed for React Router — no extra config required.
4. Deploy → Vercel gives you a `*.vercel.app` URL. Set that as `FRONTEND_URL` on the Railway backend afterwards (see [`../backend/README.md`](../backend/README.md)) so Socket.io's CORS allows it.
