# AgriSense — Backend

Node.js + Express REST API with Socket.io real-time support and MongoDB database.

---

## Prerequisites

- Node.js >= 18.x and npm >= 9.x
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas connection string

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

`backend/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrisense
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8000
OPENWEATHER_API_KEY=your_openweather_api_key_here
FRONTEND_URL=http://localhost:5173
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here
```

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No (defaults to 5000) | Port the Express server listens on |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs and verifies login tokens — use a long random string, especially in production |
| `NODE_ENV` | No | `development` or `production` |
| `AI_SERVICE_URL` | No (defaults to `http://localhost:8000`) | Base URL of the `ai-service` FastAPI microservice, used by `/api/diagnosis` |
| `OPENWEATHER_API_KEY` | Yes, for `/api/weather` | Free key from https://openweathermap.org/api — get one under *My API Keys* |
| `FRONTEND_URL` | No (defaults to `http://localhost:5173`) | Allowed origin for Socket.io CORS |
| `IMAGEKIT_PRIVATE_KEY` | Yes, for `/api/diagnosis` | From your [ImageKit dashboard](https://imagekit.io/dashboard/developer/api-keys) → used to upload diagnosis leaf photos to ImageKit's CDN instead of local disk |

### 3. Seed the database (first run)

```bash
node seed.js
```

Creates the admin + farmer accounts below plus 5 sample field nodes.

### 4. Start the server

```bash
npm run dev
```

Runs on **port 5000** by default (`http://localhost:5000`).

---

## Development Commands

```bash
npm run dev                    # start with nodemon (auto-restarts on file changes)
npm start                      # start without nodemon (closer to production)

node seed.js                   # seed admin + farmer accounts + 5 field nodes
node seed.js --clear-readings  # wipe all sensor telemetry (keep accounts)
node seed.js --clear           # wipe users + sensors + all readings
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
│   └── diagnosisController.js       Forwards images to ai-service, saves results
├── middleware/
│   └── auth.js                  JWT protect + role authorize
├── models/
│   ├── SensorRegister.js        Device registry (string _id: "s001")
│   ├── Sensor.js                Time-series telemetry readings (TTL 30d)
│   ├── User.js                  Farmer + admin accounts
│   └── DiagnosisHistory.js      Saved AI diagnosis results
├── routes/
│   ├── authRoutes.js
│   ├── sensorRegisterRoutes.js  /api/sensors routes
│   ├── weatherRoutes.js
│   └── diagnosisRoutes.js       /api/diagnosis routes
├── uploads/diagnoses/           Saved leaf images from diagnosis uploads
├── server.js                    Entry point — Express + Socket.io
└── seed.js                      Database seeder
```

---

## API Routes

### Auth — `/api/auth`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Login, returns JWT |
| POST | `/register` | Public | Register farmer (pending until admin approves) |
| GET | `/users` | Admin | All users |
| POST | `/users` | Admin | Create user directly (approved immediately) |
| PUT | `/users/:id` | Admin | Update user (cannot edit own role) |
| PUT | `/users/:id/status` | Admin | Toggle approval status (cannot self-toggle) |
| DELETE | `/users/:id` | Admin | Delete user (cannot delete self or other admins) |

### Sensors — `/api/sensors`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/readings` | Public | ESP32 submits telemetry |
| GET | `/readings/all` | Admin | All readings (filterable by `range`, `sensorId`) |
| GET | `/` | Farmer/Admin | List sensor nodes (farmer sees only their own) |
| POST | `/` | Admin | Register new sensor node |
| DELETE | `/:id` | Admin | Delete sensor node |
| PATCH | `/:id` | Admin | Update sensor metadata / reassign farmer |
| GET | `/:id/latest` | Farmer/Admin | Latest reading for sensor |
| GET | `/:id/history` | Farmer/Admin | Historical readings (`hours` query param) |

### Diagnosis — `/api/diagnosis`
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Farmer | Upload leaf image (`multipart/form-data`, field name `image`) → forwards to `ai-service` → saves result |
| GET | `/my` | Farmer | Own diagnosis history (last 50) |
| GET | `/all` | Admin | All diagnoses, filterable by `range` (`today`/`7d`/`30d`/`all`) and `farmerId` |
| GET | `/stats` | Admin | Total + today's diagnosis counts |

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
- `name`, `location`, `farmerId` (ref to `User`, nullable until assigned)

**Sensor** — telemetry readings
- `sensorId`, `nitrogen`, `phosphorus`, `potassium`, `temperature`, `humidity`, `moisture`
- Auto-deleted after **30 days** (MongoDB TTL index on `createdAt`)

**User**
- `name`, `email`, `password` (bcrypt-hashed), `role` (admin/farmer)
- `fieldName`, `location`, `sensorIds[]`
- `isApproved` — public self-registrations start `false`; admin must approve before login works. Users created directly by an admin (`POST /users`) are approved immediately.

---

## Real-Time Diagnosis (ai-service)

`POST /api/diagnosis` forwards the uploaded image to the Python `ai-service` microservice (`AI_SERVICE_URL`, default `http://localhost:8000`), saves the returned prediction to `DiagnosisHistory`, and stores the original image under `backend/uploads/diagnoses/`. See [`../ai-service/README.md`](../ai-service/README.md) for that service's setup.

> **Update:** image storage moved to **ImageKit** (CDN) — `diagnosisController.js` now uploads the file via `@imagekit/nodejs` (`IMAGEKIT_PRIVATE_KEY`) and saves the returned CDN `url` on `DiagnosisHistory.imageUrl` directly. `backend/uploads/` is no longer written to (it's gitignored) — this was required because Railway's filesystem is ephemeral and would lose local files on every redeploy.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `MongoServerError: connect ECONNREFUSED` on startup | MongoDB isn't running, or `MONGODB_URI` is wrong | Start MongoDB locally, or check your Atlas connection string |
| `OpenWeather API key is not configured on the server` | `OPENWEATHER_API_KEY` missing or still the placeholder in `.env` | Add a real key from https://openweathermap.org/api and restart the server |
| Weather works but changes to `.env` seem ignored | `.env` is only read once, at server startup | Restart the server (`npm run dev`) after editing `.env` |
| `Diagnosis failed` / 500 from `POST /api/diagnosis` | `ai-service` isn't running, or `AI_SERVICE_URL` points to the wrong address | Start `ai-service` (see its README) and confirm the URL/port match |
| Login succeeds but returns 403 "pending administrator approval" | New farmer registrations start with `isApproved: false` | Log in as admin and approve the account via `PUT /api/auth/users/:id/status` |
| Socket.io events never arrive on the frontend | `FRONTEND_URL` doesn't match the origin the frontend is actually served from | Set `FRONTEND_URL` in `.env` to match (default assumes `http://localhost:5173`) |
| `querySrv ECONNREFUSED _mongodb._tcp.cluster0...` on startup or `node seed.js` | Your router/ISP DNS doesn't resolve `mongodb+srv://` SRV records (common on home networks) — not an Atlas or credentials problem | Already handled: `config/db.js` forces Node to use Google/Cloudflare DNS (`8.8.8.8`, `1.1.1.1`) before connecting. If it still fails, confirm the cluster is running in Atlas and your IP is whitelisted (`0.0.0.0/0`) |
| `ImageKitError: The IMAGEKIT_PRIVATE_KEY environment variable is missing or empty` | `IMAGEKIT_PRIVATE_KEY` not set in `.env`, or `.env` wasn't loaded before `diagnosisController.js` imported | Add the key to `.env`; `server.js` loads `dotenv/config` as its very first import specifically so this doesn't happen |

---

## Deployment (Railway)

1. New Railway service → connect this GitHub repo → set **root directory** to `backend/`.
2. Start command: `npm start` (Railway auto-detects this from `package.json`).
3. Set environment variables in Railway's "Variables" tab: `MONGODB_URI` (Atlas connection string), `JWT_SECRET`, `AI_SERVICE_URL` (the deployed `ai-service` Railway URL), `FRONTEND_URL` (the deployed Vercel URL), `IMAGEKIT_PRIVATE_KEY`, `OPENWEATHER_API_KEY`, `NODE_ENV=production`. Do **not** upload your local `.env` file — paste the values directly into Railway's dashboard.
4. `PORT` doesn't need to be set — Railway injects it automatically and `server.js` already reads `process.env.PORT`.
5. After the frontend is deployed to Vercel, come back and update `FRONTEND_URL` to the real Vercel domain, then redeploy — Socket.io's CORS check depends on it matching exactly.

---

## Seeded Accounts

`node seed.js` creates:

| Role | Email | Password |
|---|---|---|
| Admin | admin@gmail.com | admin123 |
| Farmer | abdalle@gmail.com | abdalle123 |
