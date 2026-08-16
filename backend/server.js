import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db.js'

// Import Routes
import authRoutes from './routes/authRoutes.js'
import sensorRegisterRoutes from './routes/sensorRegisterRoutes.js'
import weatherRoutes from './routes/weatherRoutes.js'
import diagnosisRoutes from './routes/diagnosisRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import adviseRoutes from './routes/adviseRoutes.js'
import reportRoutes from './routes/reportRoutes.js'

import { globalLimiter } from './middleware/rateLimiter.js'

connectDB()

const app = express()

// Trust reverse proxies (Railway) for accurate client IP rate limiting
app.set('trust proxy', 1)

app.use(cors())
app.use(express.json())

// Apply Global Rate Limiter to all API routes
app.use('/api', globalLimiter)

// Create HTTP server wrapping Express
const httpServer = createServer(app)

// Socket.io attached to HTTP server
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // Client joins the room for their sensor, only receives that sensor's updates
  socket.on('joinSensor', (sensorId) => {
    socket.join(sensorId)
    console.log(`Socket ${socket.id} joined sensor room: ${sensorId}`)
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'AgriSense API Gateway is online' })
})

// Bind Routes
app.use('/api/auth', authRoutes)
app.use('/api/sensors', sensorRegisterRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/diagnosis', diagnosisRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/advise', adviseRoutes)
app.use('/api/reports', reportRoutes)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Server Error Stack:', err.stack)
  res.status(500).json({ success: false, message: 'Internal Server Error' })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`AgriSense Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
})
