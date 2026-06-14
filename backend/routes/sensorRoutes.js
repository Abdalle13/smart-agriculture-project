import express from 'express'
import {
  getSensors,
  registerSensor,
  decommissionSensor,
  toggleSensorStatus,
  getLatestReadings,
  getSensorHistory,
  addReading
} from '../controllers/sensorController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// IoT hardware data submission route (Public API endpoint)
router.post('/readings', addReading)

// Client routes
router.route('/')
  .get(protect, getSensors)
  .post(protect, authorize('admin'), registerSensor)

router.route('/:id')
  .delete(protect, authorize('admin'), decommissionSensor)

router.route('/:id/status')
  .patch(protect, authorize('admin'), toggleSensorStatus)

router.route('/:id/latest')
  .get(protect, getLatestReadings)

router.route('/:id/history')
  .get(protect, getSensorHistory)

export default router
