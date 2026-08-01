# AgriSense — Backend ⚙️

Node.js + Express REST API with Socket.io real-time support, MongoDB database, and AI Agronomic Advisory microservice proxying.

---

## Prerequisites

- Node.js >= 18.x and npm >= 9.x
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas connection string
- `ai-service` running on `http://localhost:8000` for crop diagnosis & Gemini AI advisories

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create or edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrisense
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8000
OPENWEATHER_API_KEY=your_openweather_api_key_here
FRONTEND_URL=http://localhost:5173
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No (defaults to `5000`) | Port the Express server listens on |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs and verifies login tokens |
| `NODE_ENV` | No | `development` or `production` |
| `AI_SERVICE_URL` | No (defaults to `http://localhost:8000`) | Base URL of `ai-service` FastAPI microservice |
| `OPENWEATHER_API_KEY` | Yes (for `/api/weather`) | OpenWeatherMap API Key |
| `FRONTEND_URL` | No (defaults to `http://localhost:5173`) | CORS origin for frontend and Socket.io |
| `IMAGEKIT_PRIVATE_KEY` | Yes (for `/api/diagnosis`) | Uploads leaf images to ImageKit CDN |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for Generative AI |

### 3. Seed the database (first run)

```bash
node seed.js
```

Creates default admin and farmer accounts along with sample field sensor nodes.

### 4. Start the server

```bash
npm run dev
```

Runs on **port 5000** (`http://localhost:5000`).

---

## Development Commands

```bash
npm run dev                    # Start with nodemon (auto-reload)
npm start                      # Start without nodemon

node seed.js                   # Seed database (users + sensors)
node seed.js --clear-readings  # Wipe telemetry readings only
node seed.js --clear           # Wipe all users, sensors, and readings
```

---

## Folder Structure

```
backend/
├── config/
│   └── db.js                   MongoDB connection
├── controllers/
│   ├── authController.js            Login, register, user CRUD
│   ├── sensorRegisterController.js  Device registry + telemetry
│   ├── weatherController.js         OpenWeatherMap proxy
│   ├── adviseController.js          Rule-based + Gemini AI advisory for soil & weather
│   ├── diagnosisController.js       Forwards images to ai-service, saves results
│   └── contactController.js         Farmer support messages & admin replies
├── middleware/
│   └── auth.js                  JWT protect + role authorization
├── models/
│   ├── SensorRegister.js        Device registry (string _id: "s001")
│   ├── Sensor.js                Time-series telemetry readings (TTL 30d)
│   ├── User.js                  Farmer + admin accounts
│   ├── DiagnosisHistory.js      Saved AI diagnosis results
│   └── Contact.js               Farmer support/contact messages
├── routes/
│   ├── authRoutes.js
│   ├── sensorRegisterRoutes.js  /api/sensors routes
│   ├── weatherRoutes.js
│   ├── adviseRoutes.js          /api/advise routes
│   ├── diagnosisRoutes.js       /api/diagnosis routes
│   └── contactRoutes.js         /api/contact routes
├── server.js                    Entry point — Express + Socket.io
└── seed.js                      Database seeder
```

---

## API Routes Summary

### Auth — `/api/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Login, returns JWT |
| POST | `/register` | Public | Register farmer (pending admin approval) |
| GET | `/users` | Admin | All registered users |
| POST | `/users` | Admin | Create approved user |
| PUT | `/users/:id` | Admin | Update user details |
| PUT | `/users/:id/status` | Admin | Toggle approval status |
| DELETE | `/users/:id` | Admin | Delete user |

### Sensors — `/api/sensors`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/readings` | Public | ESP32 submits telemetry readings |
| GET | `/readings/all` | Admin | All sensor telemetry readings |
| GET | `/` | Farmer/Admin | List sensor nodes |
| POST | `/` | Admin | Register new sensor node |
| DELETE | `/:id` | Admin | Delete sensor node |
| PATCH | `/:id` | Admin | Update sensor metadata / farmer assignment |
| GET | `/:id/latest` | Farmer/Admin | Latest telemetry reading |
| GET | `/:id/history` | Farmer/Admin | Historical telemetry readings |

### Advisory — `/api/advise`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/weather` | Farmer/Admin | Generates agronomic weather advisory cards |
| POST | `/soil` | Farmer/Admin | Generates agronomic soil NPK & moisture advisory cards |

### Diagnosis — `/api/diagnosis`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Farmer | Upload leaf image (`multipart/form-data`) → proxies `ai-service` → saves to DB & ImageKit |
| GET | `/my` | Farmer | Farmer's own scan history |
| GET | `/all` | Admin | All diagnosis scans, filterable by date range and farmer |
| GET | `/stats` | Admin | Total and today's diagnosis statistics |
