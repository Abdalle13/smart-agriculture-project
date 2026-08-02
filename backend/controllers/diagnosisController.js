import axios from 'axios'
import FormData from 'form-data'
import path from 'path'
import ImageKit, { toFile } from '@imagekit/nodejs'
import DiagnosisHistory from '../models/DiagnosisHistory.js'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

const imagekit = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY })

// POST /api/diagnosis
// Farmer uploads image → Node.js forwards to FastAPI → saves result to MongoDB
export const createDiagnosis = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' })
    }

    // Forward image buffer to FastAPI
    const formData = new FormData()
    formData.append('file', req.file.buffer, {
      filename:    req.file.originalname,
      contentType: req.file.mimetype,
    })

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/predict`,
      formData,
      { headers: formData.getHeaders(), timeout: 75000 }
    )

    const { disease, confidence, severity, treatment, prevention, model_used, class_key, crop } = aiResponse.data

    // Upload image to ImageKit CDN (always save — fallback gracefully if ImageKit is unconfigured or fails)
    let imageUrl = ''
    try {
      if (process.env.IMAGEKIT_PRIVATE_KEY) {
        const ext      = path.extname(req.file.originalname) || '.jpg'
        const fileName = `${Date.now()}_${req.user._id}${ext}`
        const uploaded = await imagekit.files.upload({
          file:     await toFile(req.file.buffer, fileName),
          fileName,
          folder:   '/diagnoses',
        })
        imageUrl = uploaded.url
      }
    } catch (imgErr) {
      console.warn('ImageKit upload skipped/failed:', imgErr.message)
    }

    const diagnosis = await DiagnosisHistory.create({
      farmerId:   req.user._id,
      imageUrl,
      disease,
      classKey:   class_key,
      confidence,
      severity,
      treatment,
      prevention,
      modelUsed:  model_used,
    })

    res.status(201).json({ success: true, data: { ...diagnosis.toObject(), crop } })
  } catch (error) {
    console.error('Diagnosis error:', error.message)
    const detail = error.response?.data?.detail || error.message
    res.status(500).json({ success: false, message: 'Diagnosis failed', error: detail })
  }
}

// GET /api/diagnosis/my?range=today|7d|30d|all: farmer sees their own history
export const getMyDiagnoses = async (req, res) => {
  try {
    const { range = 'all' } = req.query
    const filter = { farmerId: req.user._id }

    if (range !== 'all') {
      const now = new Date()
      let cutoff
      if (range === 'today') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (range === '7d') {
        cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000)
      } else if (range === '30d') {
        cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000)
      }
      if (cutoff) filter.createdAt = { $gte: cutoff }
    }

    const diagnoses = await DiagnosisHistory
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)

    res.json({ success: true, count: diagnoses.length, data: diagnoses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/diagnosis/all?range=today|7d|30d|all&farmerId=xxx: admin sees all with filters
export const getAllDiagnoses = async (req, res) => {
  try {
    const { range = 'today', farmerId } = req.query
    const filter = {}

    if (farmerId && farmerId !== 'all') filter.farmerId = farmerId

    if (range !== 'all') {
      const now = new Date()
      let cutoff
      if (range === 'today') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (range === '7d') {
        cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000)
      } else if (range === '30d') {
        cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000)
      }
      if (cutoff) filter.createdAt = { $gte: cutoff }
    }

    const [diagnoses, total] = await Promise.all([
      DiagnosisHistory
        .find(filter)
        .populate('farmerId', 'name email fieldName')
        .sort({ createdAt: -1 })
        .limit(200),
      DiagnosisHistory.countDocuments({}),
    ])

    res.json({ success: true, count: diagnoses.length, total, data: diagnoses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/diagnosis/stats: admin summary
export const getDiagnosisStats = async (req, res) => {
  try {
    const total = await DiagnosisHistory.countDocuments()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const today = await DiagnosisHistory.countDocuments({ createdAt: { $gte: todayStart } })
    res.json({ success: true, data: { total, today } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
