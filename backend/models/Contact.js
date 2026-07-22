import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['Sensor Issue', 'Reading Problem', 'Crop Disease Scan', 'Account Issue', 'Node Request', 'Other'],
      required: true,
    },
    subject:    { type: String, required: true },
    message:    { type: String, required: true },
    imageUrl:   { type: String, default: null },
    priority:   { type: Boolean, default: false },
    status:     { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    adminReply: { type: String, default: null },
    farmerSeen: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.model('Contact', contactSchema)
