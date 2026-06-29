# AgriSense — Backend

Node.js + Express REST API with Socket.io real-time support and MongoDB database.

---

## Commands

```bash
npm run dev          # start with nodemon (hot reload)
npm start            # start without nodemon

node seed.js                   # seed admin + farmer accounts
node seed.js --clear-readings  # wipe all sensor telemetry (keep accounts)
node seed.js --clear           # wipe users + sensors + all readings
```

Runs on **port 5000** by default.

---

## Environment Variables

Create `backend/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrisense
JWT_SECRET=super_secret_agrisense_key_2026
NODE_ENV=development
OPENWEATHER_API_KEY=<your key>
FRONTEND_URL=http://localhost:5173
```

---

## Folder Structure

```
backend/
├── config/
│   └── db.js                   MongoDB connection
├── controllers/
│   ├── authController.js        Login, register, user CRUD
│   ├── sensorController.js      Legacy /sensor endpoint (ESP32)
│   ├── sensorRegisterController.js  Device registry + telemetry
│   └── weatherController.js     OpenWeatherMap proxy
├── middleware/
│   └── auth.js                  JWT protect + role authorize
├── models/
│   ├── SensorRegister.js        Device registry (string _id: "s001")
│   ├── Sensor.js                Time-series telemetry readings (TTL 30d)
│   └── User.js                  Farmer + admin accounts
├── routes/
│   ├── authRoutes.js
│   ├── sensorRoutes.js          Legacy /sensor route
│   ├── sensorRegisterRoutes.js  /api/sensors routes
│   └── weatherRoutes.js
├── server.js                    Entry point — Express + Socket.io
└── seed.js                      Database seeder
```

---

## API Routes

### Auth — `/api/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Login, returns JWT |
| POST | `/register` | Public | Register farmer (inactive until admin approves) |
| GET | `/me` | Farmer/Admin | Current user profile |
| GET | `/users` | Admin | All users |
| POST | `/users` | Admin | Create user (active immediately) |
| PUT | `/users/:id` | Admin | Update user |
| PUT | `/users/:id/status` | Admin | Toggle active/inactive |
| DELETE | `/users/:id` | Admin | Delete user |

### Sensors — `/api/sensors`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/readings` | Public | ESP32 submits telemetry |
| GET | `/readings/all` | Admin | All readings (last 100) |
| GET | `/` | Farmer/Admin | List sensor nodes |
| POST | `/` | Admin | Register new sensor node |
| DELETE | `/:id` | Admin | Decommission sensor |
| PATCH | `/:id` | Admin | Update sensor metadata |
| PATCH | `/:id/status` | Admin | Toggle online/warning/offline |
| GET | `/:id/latest` | Farmer/Admin | Latest reading for sensor |
| GET | `/:id/history` | Farmer/Admin | Historical readings (hours param) |

### Legacy IoT — `/sensor`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Public | ESP32 legacy submission |
| GET | `/` | Public | All raw readings |

### Weather — `/api/weather`
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Farmer/Admin | Current + 5-day forecast (Afgoye) |

---

## Auth Middleware

- `protect` — verifies JWT, attaches `req.user`, rejects inactive accounts
- `authorize('admin')` — role gate, 403 if not admin

---

## Real-Time (Socket.io)

When ESP32 posts a new reading (either endpoint), the backend emits:
```js
io.emit('newReading', readingDocument)
```
All connected frontend clients receive this instantly — no polling needed.

---

## Data Models

**SensorRegister** — device registry
- `_id` — string like `"s001"`
- `name`, `location`, `farmerId`, `status` (online/warning/offline)

**Sensor** — telemetry readings
- `sensorId`, `nitrogen`, `phosphorus`, `potassium`, `temperature`, `humidity`, `moisture`
- Auto-deleted after **30 days** (MongoDB TTL index on `createdAt`)

**User**
- `name`, `email`, `password` (bcrypt), `role` (admin/farmer)
- `fieldName`, `location`, `sensorIds[]`
- `isActive` — admin must activate farmer accounts before login works

---

## Seeded Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@agrisense.io | admin123 |
| Farmer | abdalle@agrisense.io | abdalle123 |
