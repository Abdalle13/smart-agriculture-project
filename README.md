# AgriSense Smart Agriculture Platform 🌾🤖

### Afgoye District, Somalia · IoT Soil Monitoring & AI Agronomic Advisory

---

## Overview

AgriSense is a full-stack smart agriculture platform connecting IoT soil hardware probes to a real-time farmer dashboard and admin control panel. Designed specifically for farmers in **Afgoye, Somalia**, the system provides live soil telemetry monitoring (NPK, moisture, temperature), real-time agronomic advisories, and instant crop disease diagnosis powered by a **CNN MobileNetV2 Deep Learning Model** and **Google Gemini Generative AI (`gemini-flash-latest`)**.

---

## System Architecture

```
smart-agriculture-project/
├── frontend/        React 19 + Vite + Tailwind CSS      (Port: 5173)
├── backend/         Node.js + Express + MongoDB          (Port: 5000)
├── ai-service/      Python FastAPI + TensorFlow + Gemini (Port: 8000)
└── iot/             ESP32 Arduino sketch (C++)
```

---

## Tech Stack

### Frontend
- **React 19** (Vite)
- **Tailwind CSS** with custom emerald design system
- **React Router v6** — role-based routing (Admin / Farmer)
- **Recharts** — real-time and historical telemetry charts
- **Axios** — HTTP client with auto JWT authentication
- **Socket.io-client** — real-time WebSocket telemetry stream

### Backend
- **Node.js + Express.js**
- **MongoDB + Mongoose ODM**
- **JWT Authentication** + bcryptjs password hashing
- **Socket.io Server** — WebSocket room broadcasting
- **Agronomic Advisory Engine** — localized Somali rule engine for soil & weather
- **OpenWeatherMap API Proxy** (Afgoye coordinates: 2.1393°N, 45.1213°E)
- **ImageKit CDN** — leaf scan image storage

### AI Microservice
- **Python FastAPI**
- **TensorFlow / Keras** — MobileNetV2 CNN model (`cnn_best.keras`, 97.92% accuracy)
- **Google Gemini Generative AI (`gemini-flash-latest`)** — real-time localized Somali treatment & prevention advisor
- **Warm-Up Pipeline** — instant model response on first run (~0.5–1s)
- **Non-blocking Async Executor** for Gemini API calls

### IoT Hardware (ESP32)
- **DHT11** — temperature + air humidity
- **Analog Soil Moisture Sensor** — soil moisture percentage
- **NPK Sensor (RS485 Modbus)** — Nitrogen, Phosphorus, Potassium
- Posts telemetry every 30 seconds to `POST /api/sensors/readings`

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
| **Admin** | Overview analytics, farmer management, field node registry, telemetry monitoring, AI diagnosis history (Table view) |
| **Farmer** | Dashboard with live Socket.io soil cards & advisories, telemetry charts, weather, crop disease diagnosis scanner |

Default seeded accounts (`node seed.js` in `backend/`):
- **Admin**: `admin@gmail.com` / `admin123`
- **Farmer**: `abdalle@gmail.com` / `abdalle123`

---

## Quick Start

### 1. AI Service
```bash
cd ai-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

### 2. Backend
```bash
cd backend
npm install
node seed.js
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.
