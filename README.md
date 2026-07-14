# AgriSense — Smart Agriculture Platform
### Afgoye District, Somalia · IoT Soil Monitoring & AI Crop Diagnosis

---

## Overview

A full-stack MERN web platform connecting ESP32 soil probe hardware to a real-time farmer dashboard and admin control panel. Farmers in the **Afgoye district** can monitor live NPK, temperature, humidity, and soil moisture readings — and diagnose crop diseases using a CNN deep learning model.

---

## System Architecture

```
smart-agriculture-project/
├── frontend/        React 19 + Vite + Tailwind CSS      (Port: 5173)
├── backend/         Node.js + Express + MongoDB          (Port: 5000)
├── ai-service/      Python FastAPI + TensorFlow CNN      (Port: 8000)
└── iot/             ESP32 Arduino sketch (C++)
```

---

## Tech Stack

### Frontend
- React 19 (Vite)
- Tailwind CSS with custom emerald theme
- React Router v6 — role-based routing (admin / farmer)
- Recharts — sensor telemetry charts
- Axios — HTTP client with JWT auto-attach
- Socket.io-client — real-time live updates

### Backend
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT authentication + bcryptjs
- Socket.io — WebSocket server for real-time push
- OpenWeatherMap API proxy (Afgoye coords: 2.1393°N, 45.1213°E)

### AI Service
- Python FastAPI
- TensorFlow / Keras — CNN model (`cnn_best.keras`)
- Pillow — image preprocessing (224×224, normalize 0–1)
- 27 disease classes: Corn (4), Pepper (2), Potato (3), Tomato (10), Mango (8)

### IoT Hardware (ESP32)
- DHT11 on pin 14 — temperature + air humidity
- Analog soil moisture sensor on pin 34
- NPK sensor via RS485 Modbus (UART2: RX=16, TX=17, DE=19, RE=4)
- Posts to `POST /sensor` every 5 seconds

---

## Monitored Parameters

| Parameter | Unit | Sensor |
|---|---|---|
| Nitrogen (N) | mg/kg | NPK RS485 Modbus |
| Phosphorus (P) | mg/kg | NPK RS485 Modbus |
| Potassium (K) | mg/kg | NPK RS485 Modbus |
| Temperature | °C | DHT11 |
| Air Humidity | % | DHT11 |
| Soil Moisture | % | Analog capacitive |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | System overview, farmer management, field node registry, data monitoring, AI diagnosis history |
| **Farmer** | Field dashboard, telemetry charts, weather, AI crop disease scanner |

Default seeded accounts (`node seed.js`):
- Admin: `admin@gmail.com` / `admin123`
- Farmer: `abdalle@gmail.com` / `abdalle123`

---

## Real-Time Data Flow

```
ESP32 (every 5s)
    ↓  POST /sensor
Backend saves to MongoDB
    ↓  io.to(sensorId).emit('newReading')
Socket.io pushes to farmer's browser (room-based)
    ↓  socket.on('newReading')
Farmer dashboard updates instantly
```

---

## AI Diagnosis Flow

```
Farmer uploads leaf photo
    ↓  POST http://localhost:8000/predict  (multipart/form-data)
FastAPI preprocesses image → CNN inference → 27-class result
    ↓  { disease, confidence, severity, treatment, prevention }
Frontend saves result to backend
    ↓  POST /api/diagnosis  (JWT-protected)
Admin AI Diagnosis page shows all results from all farmers
```

---

## Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB (local or Atlas)
- Python >= 3.9
- npm >= 9.x

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
# Place trained model at: ai-service/models/cnn_best.keras
uvicorn main:app --port 8000 --reload
```

### Seed default accounts + field nodes
```bash
cd backend
node seed.js                   # create admin + farmer + 5 field nodes
node seed.js --clear-readings  # wipe sensor telemetry only (keep accounts)
node seed.js --clear           # wipe everything (users + sensors + readings)
```

---

## Environment Variables

`backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrisense
JWT_SECRET=super_secret_agrisense_key_2026
NODE_ENV=development
OPENWEATHER_API_KEY=<your key>
FRONTEND_URL=http://localhost:5173
```

`frontend/.env` (optional):
```
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

---

## IoT Setup

1. Open `iot/esp32/esp32.ino` in Arduino IDE
2. Set `serverName` to your machine's local IPv4 address
3. Flash to ESP32
4. Probe posts readings every 5 seconds to `POST /sensor`

> Telemetry data is auto-deleted after **30 days** via MongoDB TTL index.

---

## AI Model Setup

The CNN model file is **not included** in this repository (too large for git).

1. Train your model using the PlantVillage + MangoLeafBD datasets
2. Export: `model.save("cnn_best.keras")`
3. Place the file at: `ai-service/models/cnn_best.keras`
4. Verify `ai-service/models/class_names.json` class order matches your training class order exactly

**Supported crops and classes (27 total):**

| Crop | Classes |
|---|---|
| Mango | Anthracnose, Bacterial Canker, Cutting Weevil, Die Back, Gall Midge, Powdery Mildew, Sooty Mould, Healthy |
| Corn | Cercospora Leaf Spot, Common Rust, Northern Leaf Blight, Healthy |
| Pepper | Bacterial Spot, Healthy |
| Potato | Early Blight, Late Blight, Healthy |
| Tomato | Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Mosaic Virus, Yellow Leaf Curl Virus, Healthy |

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/register` | Public | Farmer registration (pending approval) |
| GET | `/api/auth/users` | Admin | List all farmers |
| PUT | `/api/auth/users/:id/status` | Admin | Toggle farmer approval |
| DELETE | `/api/auth/users/:id` | Admin | Delete farmer |
| GET | `/api/sensors` | Admin | List all field nodes |
| PATCH | `/api/sensors/:id` | Admin | Assign farmer to node |
| POST | `/api/sensors/readings` | Public | ESP32 telemetry submission |
| GET | `/api/weather` | Protected | Weather proxy (Afgoye) |
| POST | `/api/diagnosis` | Farmer | Save AI diagnosis result |
| GET | `/api/diagnosis` | Protected | Farmer: own history · Admin: all |
| GET | `/api/diagnosis/stats` | Admin | Total and today count |
| POST | `/predict` (port 8000) | None | AI service — image → disease result |

---

## Roadmap

- [x] JWT role-based auth (admin / farmer)
- [x] Farmer approval workflow (admin approves registrations)
- [x] Real-time WebSocket updates via Socket.io
- [x] ESP32 hardware integration (NPK + DHT11 + moisture)
- [x] OpenWeatherMap weather proxy
- [x] Agronomic recommendation engine
- [x] AI crop disease diagnosis (CNN — 27 classes)
- [x] Diagnosis history (per-farmer + admin overview)
- [ ] SMS/push alerts for critical sensor thresholds
- [ ] Cloud deployment (Railway / Render)

---

*AgriSense v1.0 · Afgoye District, Somalia*
