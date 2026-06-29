// ─── Mock Data Service (AI Crop Diagnosis Only) ──────────────────────────────
// TODO: INTEGRATE — Replace mockDiagnoseImage with real AI endpoint POST /ai-service/predict
// when microservice and training dataset are ready.

const now = () => new Date().toISOString()

// ─── Mock Disease Diagnosis ───────────────────────────────────────────────────
export const mockDiagnoseImage = (imageFile) => {
  const diseases = [
    { name: 'Leaf Blight',       confidence: 0.91, severity: 'High',   treatment: 'Apply copper-based fungicide. Remove infected leaves immediately.' },
    { name: 'Powdery Mildew',    confidence: 0.84, severity: 'Medium', treatment: 'Spray diluted neem oil or sulfur-based fungicide weekly.' },
    { name: 'Nitrogen Deficiency', confidence: 0.78, severity: 'Medium', treatment: 'Apply nitrogen-rich fertilizer (urea). Ensure soil pH is 6–7.' },
    { name: 'Healthy Crop',      confidence: 0.95, severity: 'None',   treatment: 'No action needed. Continue regular monitoring.' },
  ]
  const result = diseases[Math.floor(Math.random() * diseases.length)]
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        fileName:   imageFile?.name || 'unknown.jpg',
        diagnosis:  result.name,
        confidence: result.confidence,
        severity:   result.severity,
        treatment:  result.treatment,
        modelUsed:  'Mock CNN v0.1',
        analyzedAt: now(),
      })
    }, 2000) // simulate AI processing time
  })
}
