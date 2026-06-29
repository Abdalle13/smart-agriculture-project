# AgriSense — Smart Agriculture Platform
### Afgoye District, Somalia · IoT Soil Monitoring System

---

## Overview

A full-stack MERN web platform connecting ESP32 soil probe hardware to a real-time farmer dashboard and admin control panel. Farmers in the **Afgoye district** can monitor live NPK, temperature, humidity, and soil moisture readings from their fields.

---

## System Architecture

```
smart-agriculture-project/
├── frontend/        React 19 + Vite + Tailwind CSS      (Port: 5173)
├── backend/         Node.js + Express + MongoDB          (Port: 5000)
├── iot/             ESP32 Arduino sketch (C++)
└── README.md
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
- OpenWeatherMap API proxy (Afgoye coords)

### IoT Hardware (ESP32)
- DHT11 on pin 14 — temperature + air humidity
- Analog soil moisture sensor on pin 34
- NPK sensor via RS485 Modbus (UART2: RX=16, TX=17, DE=19, RE=4)
- Posts to `POST /sensor` every 30 seconds

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
| **Admin** | System overview, user management, sensor registry, data monitoring |
| **Farmer** | Field dashboard, telemetry charts, weather, AI crop diagnosis |

Default seeded accounts (`node seed.js`):
- Admin: `admin@agrisense.io` / `admin123`
- Farmer: `abdalle@agrisense.io` / `abdalle123`

---

## Real-Time Data Flow

```
ESP32 (every 30s)
    ↓ POST /sensor
Backend saves to MongoDB
    ↓ io.emit('newReading')
Socket.io pushes to all connected browsers
    ↓ socket.on('newReading')
Farmer dashboard cards update instantly
```

---

## Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB (local or Atlas)
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

### Seed default accounts
```bash
cd backend
node seed.js               # create admin + farmer accounts
node seed.js --clear-readings  # wipe all sensor telemetry (keep accounts)
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
4. Probe posts readings every 30 seconds to `POST /sensor`

> Data is auto-deleted after **30 days** via MongoDB TTL index.

---

## Roadmap

- [x] JWT role-based auth (admin / farmer)
- [x] Real-time WebSocket updates via Socket.io
- [x] ESP32 hardware integration
- [x] OpenWeatherMap weather proxy
- [x] Agronomic recommendation engine
- [ ] AI crop disease diagnosis (CNN model — pending)
- [ ] SMS/push alerts for critical thresholds
- [ ] Cloud deployment (Railway / Render)

---

*AgriSense v1.0 · Afgoye District, Somalia*
