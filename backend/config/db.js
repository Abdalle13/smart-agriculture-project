import mongoose from 'mongoose'


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
