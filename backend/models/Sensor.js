import mongoose from 'mongoose'

const sensorSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // using custom string code like 's001', 's002' as the primary key
      required: [true, 'Please add a sensor ID code'],
    },
    name: {
      type: String,
      required: [true, 'Please add a sensor name'],
      trim: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    location: {
      type: String,
      required: [true, 'Please add a location/plot details'],
    },
    status: {
      type: String,
      enum: ['online', 'warning', 'offline'],
      default: 'online',
    },
    battery: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    _id: false, // disable automatic ObjectId generation for schema root since we use _id as string code
  }
)

export default mongoose.model('Sensor', sensorSchema)
