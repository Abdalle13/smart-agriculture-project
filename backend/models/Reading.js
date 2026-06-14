import mongoose from 'mongoose'

const readingSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: [true, 'Reading must belong to a sensor ID code'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    nitrogen: {
      type: Number,
      required: [true, 'Please add nitrogen (N) reading'],
    },
    phosphorus: {
      type: Number,
      required: [true, 'Please add phosphorus (P) reading'],
    },
    potassium: {
      type: Number,
      required: [true, 'Please add potassium (K) reading'],
    },
    temperature: {
      type: Number,
      required: [true, 'Please add temperature reading'],
    },
    humidity: {
      type: Number,
      required: [true, 'Please add humidity reading'],
    },
    ph: {
      type: Number,
      required: [true, 'Please add pH reading'],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('Reading', readingSchema)
