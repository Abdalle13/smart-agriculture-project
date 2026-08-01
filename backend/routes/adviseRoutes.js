import express from 'express'
import { protect } from '../middleware/auth.js'
import { getWeatherAdvisory, getSoilAdvisory } from '../controllers/adviseController.js'

const router = express.Router()

// Both routes require a logged-in farmer/admin
router.post('/weather', protect, getWeatherAdvisory)
router.post('/soil',    protect, getSoilAdvisory)

export default router
