import mongoose from 'mongoose'

const sensorRegisterSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // e.g. "s001", "s002"
    },
    name: {
      type: String,
      required: [true, 'Please add a sensor name'],
    },
    location: {
      type: String,
      default: '',
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
)

export default mongoose.model('SensorRegister', sensorRegisterSchema)
