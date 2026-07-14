import mongoose from 'mongoose'

const diagnosisHistorySchema = new mongoose.Schema(
  {
    farmerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl:   { type: String, default: null },
    disease:    { type: String, required: true },
    classKey:   { type: String },
    confidence: { type: Number, required: true },
    severity:   { type: String, enum: ['None', 'Low', 'Medium', 'High', 'Unknown'], default: 'Unknown' },
    treatment:  { type: String },
    prevention: { type: String },
    modelUsed:  { type: String, default: 'CNN' },
  },
  { timestamps: true }
)

export default mongoose.model('DiagnosisHistory', diagnosisHistorySchema)
