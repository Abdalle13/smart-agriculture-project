import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './config/db.js'

// Import Routes
import authRoutes from './routes/authRoutes.js'
import sensorRegisterRoutes from './routes/sensorRegisterRoutes.js'
import weatherRoutes from './routes/weatherRoutes.js'

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

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
