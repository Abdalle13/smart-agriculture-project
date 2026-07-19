import dns from 'dns'
import mongoose from 'mongoose'

// Some routers/ISP DNS proxies don't resolve mongodb+srv:// SRV records —
// force a resolver that does, so local dev doesn't depend on network config.
dns.setServers(['8.8.8.8', '1.1.1.1'])

//Establishes connection to MongoDB database

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`)
  }
}

export default connectDB
