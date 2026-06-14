import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'

// Import Routes
import authRoutes from './routes/authRoutes.js'
import sensorRoutes from './routes/sensorRoutes.js'
import weatherRoutes from './routes/weatherRoutes.js'

// Import Models for Seeding
import User from './models/User.js'
import Sensor from './models/Sensor.js'
import Reading from './models/Reading.js'

// Load Environment Variables
dotenv.config()

// Connect to Database
connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'AgriSense API Gateway is online' })
})

// Bind Routes
app.use('/api/auth', authRoutes)
app.use('/api/sensors', sensorRoutes)
app.use('/api/weather', weatherRoutes)

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Server Error Stack:', err.stack)
  res.status(500).json({ success: false, message: 'Internal Server Error' })
})

// Database Seeder Function
const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments()
    if (userCount === 0) {
      console.log('🌱 Database is empty. Seeding default demo accounts...')

      // 1. Create Admin
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@agrisense.io',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      })

      // 2. Create Farmer
      const farmer = await User.create({
        name: 'Abukar Hassan',
        email: 'abukar@agrisense.io',
        password: 'farmer123',
        role: 'farmer',
        fieldName: 'Hassan North Field',
        location: 'Afgoye, Somalia',
        sensorIds: ['s001', 's002'],
        isActive: true,
      })

      // 3. Create another Farmer (Inactive / Pending Review)
      await User.create({
        name: 'Fadumo Warsame',
        email: 'fadumo@agrisense.io',
        password: 'farmer123',
        role: 'farmer',
        fieldName: 'Warsame South Field',
        location: 'Afgoye, Somalia',
        sensorIds: ['s003'],
        isActive: false,
      })

      console.log('👤 Seeding default users successful.')

      // 4. Seed Sensors
      await Sensor.create([
        { _id: 's001', name: 'Soil Probe A', farmerId: farmer._id, location: 'North Plot', status: 'online', battery: 87 },
        { _id: 's002', name: 'Soil Probe B', farmerId: farmer._id, location: 'South Plot', status: 'online', battery: 54 },
        { _id: 's003', name: 'Soil Probe C', farmerId: null, location: 'West Field Inventory', status: 'warning', battery: 18 },
        { _id: 's004', name: 'Soil Probe D', farmerId: null, location: 'East Sector Inventory', status: 'offline', battery: 0 },
      ])
      console.log('📡 Seeding default sensors successful.')

      // 5. Seed Historical Readings for s001 (last 12 hours)
      const readings = []
      for (let i = 12; i > 0; i--) {
        const timeOffset = new Date(Date.now() - i * 60 * 60 * 1000)
        readings.push({
          sensorId: 's001',
          timestamp: timeOffset,
          nitrogen: parseFloat((Math.random() * (150 - 45) + 45).toFixed(1)),
          phosphorus: parseFloat((Math.random() * (70 - 20) + 20).toFixed(1)),
          potassium: parseFloat((Math.random() * (220 - 60) + 60).toFixed(1)),
          temperature: parseFloat((Math.random() * (35 - 24) + 24).toFixed(1)),
          humidity: parseFloat((Math.random() * (75 - 45) + 45).toFixed(1)),
          ph: parseFloat((Math.random() * (7.2 - 6.0) + 6.0).toFixed(1))
        })
      }
      await Reading.insertMany(readings)
      console.log('📈 Seeding default telemetry readings successful.')
      console.log('✅ Seeding completed successfully!')
    }
  } catch (error) {
    console.error('❌ Database Seeding Error:', error.message)
  }
}

// Start Server & Listen
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`🚀 AgriSense Express Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
  // Run seeding checks
  await seedDatabase()
})
