import express from 'express'
import {
  getSensors,
  registerSensor,
  deleteSensor,
  updateSensor,
  getLatestReadings,
  getSensorHistory,
  addReading,
  getAllReadings
} from '../controllers/sensorRegisterController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// IoT hardware data submission route (Public — no auth needed)
router.post('/readings', addReading)

// Admin: all readings
router.route('/readings/all')
  .get(protect, authorize('admin'), getAllReadings)

// All sensors (admin sees all, farmer sees only theirs)
router.route('/')
  .get(protect, getSensors)
  .post(protect, authorize('admin'), registerSensor)

// Specific sensor node actions
router.route('/:id')
  .delete(protect, authorize('admin'), deleteSensor)
  .patch(protect, authorize('admin'), updateSensor)


router.route('/:id/latest')
  .get(protect, getLatestReadings)

router.route('/:id/history')
  .get(protect, getSensorHistory)

export default router
