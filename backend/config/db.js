import mongoose from 'mongoose'

/**
 * Establishes connection to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`)
    // If we're offline or DB is down during local testing, don't crash the server.
    // This allows the mocked fallback API routes to function without failing startup.
    console.warn('⚠️ Server will run in OFFLINE/MOCKED mode for database queries if connection failed.')
  }
}

export default connectDB
