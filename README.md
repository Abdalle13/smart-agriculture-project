# 🌾 Integrated Smart Agriculture Web System
### Afgoye District — Precision Farming Platform

---

## Overview

A full-stack, modular web platform connecting IoT soil sensors, weather intelligence, and AI-powered crop disease diagnosis to empower farmers in the **Afgoye district** with data-driven decisions.

---

## System Architecture

```
smart-agriculture-project/          ← Monorepo Root
├── frontend/                       ← React.js + Tailwind CSS (Port: 5173)
├── backend/                        ← Node.js + Express.js + MongoDB (Port: 5000)
├── ai-service/                     ← FastAPI Python Microservice (Port: 8000)
└── README.md
```

---

## Core Pillars

| Pillar | Technology | Status |
|--------|-----------|--------|
| 📡 IoT Soil Monitoring | Node.js + MongoDB + WebSocket | 🟡 Mocked |
| 🌤️ Weather Intelligence | OpenWeatherMap API | 🟡 Mocked |
| 🤖 Crop Disease Diagnosis | FastAPI + CNN/SVM/RF | 🟡 Mocked |

---

## User Roles (RBAC)

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access, user management, system-wide overview & sensor health |
| **Farmer** | Personalized field dashboard, sensor readings, weather forecasts, crop diagnosis |

---

## Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Charts:** Recharts
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Auth:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs

### AI Microservice
- **Framework:** FastAPI (Python)
- **ML Models:** CNN / SVM / Random Forest *(integration pending)*
- **Image Processing:** Pillow / OpenCV

---

## Monitored Parameters (IoT)

| Parameter | Unit | Sensor Type |
|-----------|------|-------------|
| Nitrogen (N) | mg/kg | NPK Sensor |
| Phosphorus (P) | mg/kg | NPK Sensor |
| Potassium (K) | mg/kg | NPK Sensor |
| Soil Temperature | °C | DS18B20 |
| Soil Humidity | % | Capacitive |
| Soil pH | pH units | pH Probe |

---

## Getting Started

### Prerequisites
- Node.js >= 18.x
- Python >= 3.10
- MongoDB (local or Atlas)
- npm >= 9.x

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

### Running the Backend
```bash
cd backend
npm install
npm run dev
```

### Running the AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Environment Variables

Each service uses a `.env` file. See `.env.example` in each service folder.

> ⚠️ **Never commit `.env` files to version control.**

---

## Integration Roadmap

- [ ] Connect real IoT hardware (MQTT/HTTP)
- [ ] Integrate OpenWeatherMap live API
- [ ] Deploy trained CNN model to FastAPI
- [ ] Add SMS/Push notification alerts for critical sensor thresholds
- [ ] Deploy to cloud (Railway / Render / AWS)

---

## Team

> Built for the Afgoye district farming community.
> Hardware & ML Dataset team integration pending.

---

*Last updated: May 2026*
