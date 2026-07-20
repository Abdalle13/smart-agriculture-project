import mongoose from 'mongoose'

// Sensor Model: wuxu keydiya xogta ESP32 soo diro
const sensorSchema = new mongoose.Schema({
  sensorId:    { type: String, index: true },  // ID-da aalada (s001, s002...)
  temperature: { type: Number },
  humidity:    { type: Number },
  moisture:    { type: Number },
  nitrogen:    { type: Number },
  phosphorus:  { type: Number },
  potassium:   { type: Number },
  timestamp:   { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now },
})

// Auto-delete readings older than 30 days
sensorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export default mongoose.model('Sensor', sensorSchema)
