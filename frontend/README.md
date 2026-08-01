# AgriSense — Frontend 💻🌱

React 19 + Vite web application for the AgriSense Smart Agriculture & Crop Advisory Platform.

---

## Prerequisites

- Node.js >= 18.x and npm >= 9.x
- The `backend` service running on `http://localhost:5000` (see [`../backend/README.md`](../backend/README.md))
- The `ai-service` running on `http://localhost:8000` (see [`../ai-service/README.md`](../ai-service/README.md))

---

## Setup & Running

```bash
cd frontend
npm install
npm run dev
```

App opens at `http://localhost:5173`.

---

## Development Commands

```bash
npm run dev      # Vite dev server with hot reload -> http://localhost:5173
npm run build    # Production build -> dist/
npm run lint     # ESLint linting
npm run preview  # Serve production build locally
```

---

## Environment Variables

Create `frontend/.env` (optional — defaults to localhost):

```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | No (defaults to `http://localhost:5000/api`) | Backend Express REST API endpoint |
| `VITE_AI_URL` | No (defaults to `http://localhost:8000`) | FastAPI microservice URL |

---

## Key Features & Pages

- **Farmer Dashboard (`/dashboard`)**: Real-time Socket.io soil Telemetry (NPK, Moisture, Temp) with Agronomic Advisory Cards.
- **Crop Disease Diagnosis (`/diagnosis`)**: Instant leaf image analysis powered by CNN (MobileNetV2) and Google Gemini AI.
- **Scan History (`/diagnosis/history`)**: Table & Detail Modal view of past leaf scans.
- **Weather Page (`/weather`)**: 5-Day forecast and real-time weather advice.
- **Admin AI Diagnosis (`/admin/diagnosis`)**: Table view of all farmer scans with filters for date range and farmer.

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
│   │   ├── AdminAIDiagnosis.jsx      All farmers' AI diagnosis history (Table View + Filter)
│   │   └── AdminSupportMessages.jsx  Farmer support inbox
│   └── farmer/
│       ├── FarmerDashboard.jsx        Live soil metric cards (Socket.io) + Soil Advisory Cards
│       ├── FarmerSensors.jsx          Historical telemetry charts + CSV export
│       ├── FarmerWeather.jsx          Afgoye weather + 5-Day Outlook + Weather Advisory Cards
│       ├── FarmerDiagnosis.jsx        AI crop disease scan (CNN + Gemini)
│       ├── FarmerDiagnosisHistory.jsx Own past scans (Table View + Detail Modal)
│       └── FarmerContact.jsx          Submit support messages & view admin replies
├── services/
│   └── api.js                   Axios instance (JWT interceptor + timeout handling)
├── utils/
│   └── constants.js             Routes, roles, thresholds, sensor config
├── App.jsx                      Role-based routing
└── index.css                    Tailwind + custom utility classes
```
