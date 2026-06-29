import SensorRegister from '../models/SensorRegister.js'
import Sensor from '../models/Sensor.js'
import User from '../models/User.js'
import { io } from '../server.js'

/**
 * @desc    Get latest readings for a registered sensor node
 * @route   GET /api/sensors/:id/latest
 * @access  Private
 */
export const getLatestReadings = async (req, res) => {
  try {
    const sensorId = req.params.id  // e.g. "s001"

    const latestReading = await Sensor.findOne({ sensorId }).sort({ createdAt: -1 })

    if (!latestReading) {
      return res.json({ success: true, data: null })
    }

    res.json({ success: true, data: latestReading })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get historical readings for a sensor node
 * @route   GET /api/sensors/:id/history
 * @access  Private
 */
export const getSensorHistory = async (req, res) => {
  const sensorId = req.params.id
  const { parameter = 'nitrogen', hours = 12 } = req.query

  try {
    const timeThreshold = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000)

    let readings = await Sensor.find({
      sensorId,
      createdAt: { $gte: timeThreshold }
    }).sort({ createdAt: 1 })

    // Format data for Recharts charts
    const formatted = readings.map(r => ({
      time: new Date(r.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: r[parameter] || 0
    }))

    res.json({ success: true, data: formatted })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Submit new IoT probe sensor telemetry readings (to Reading model)
 * @route   POST /api/sensors/readings
 * @access  Public (from physical nodes)
 */
export const addReading = async (req, res) => {
  const { sensorId = 's001', nitrogen, phosphorus, potassium, temperature, humidity, moisture } = req.body

  try {
    const reading = await Sensor.create({
      sensorId,
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      humidity,
      moisture,
    })

    // Push new reading to all connected frontend clients instantly
    io.emit('newReading', reading)

    res.status(201).json({ success: true, data: reading })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get all registered sensor nodes
 * @route   GET /api/sensors
 * @access  Private
 */
export const getSensors = async (req, res) => {
  try {
    let query = {}

    // Farmers can only see their own assigned probes
    if (req.user.role === 'farmer') {
      query = { farmerId: req.user._id }
    }

    const sensors = await SensorRegister.find(query)
    res.json({ success: true, data: sensors })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Register / Deploy a new IoT sensor node
 * @route   POST /api/sensors
 * @access  Private (Admin Only)
 */
export const registerSensor = async (req, res) => {
  const { _id, name, location, farmerId } = req.body

  try {
    const sensorExists = await SensorRegister.findById(_id)
    if (sensorExists) {
      return res.status(400).json({ success: false, message: 'Sensor unique code already exists' })
    }

    const sensor = await SensorRegister.create({
      _id,
      name,
      location,
      farmerId: farmerId || null,
      status: 'online',
    })

    // Add to farmer's sensorIds array if farmerId is assigned
    if (farmerId) {
      await User.findByIdAndUpdate(farmerId, {
        $addToSet: { sensorIds: _id }
      })
    }

    res.status(201).json({ success: true, data: sensor })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


/**
 * @desc    Decommission / Delete a sensor node
 * @route   DELETE /api/sensors/:id
 * @access  Private (Admin Only)
 */
export const decommissionSensor = async (req, res) => {
  const sensorId = req.params.id

  try {
    const sensor = await SensorRegister.findById(sensorId)
    if (!sensor) {
      return res.status(404).json({ success: false, message: 'Sensor node not found' })
    }

    // Remove from farmer's sensorIds list
    if (sensor.farmerId) {
      await User.findByIdAndUpdate(sensor.farmerId, {
        $pull: { sensorIds: sensorId }
      })
    }

    await SensorRegister.findByIdAndDelete(sensorId)
    res.json({ success: true, message: 'Sensor node decommissioned successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Update sensor node metadata (name, location, farmerId)
 * @route   PATCH /api/sensors/:id
 * @access  Private (Admin Only)
 */
export const updateSensor = async (req, res) => {
  const sensorId = req.params.id
  const { name, location, farmerId } = req.body

  try {
    const sensor = await SensorRegister.findById(sensorId)
    if (!sensor) {
      return res.status(404).json({ success: false, message: 'Sensor not found' })
    }

    const oldFarmerId = sensor.farmerId?.toString()
    const newFarmerId = farmerId || null

    // Reassign sensorIds on farmer records if farmerId changed
    if (oldFarmerId !== newFarmerId?.toString()) {
      if (oldFarmerId) {
        await User.findByIdAndUpdate(oldFarmerId, { $pull: { sensorIds: sensorId } })
      }
      if (newFarmerId) {
        await User.findByIdAndUpdate(newFarmerId, { $addToSet: { sensorIds: sensorId } })
      }
    }

    const updated = await SensorRegister.findByIdAndUpdate(
      sensorId,
      { name, location, farmerId: newFarmerId },
      { new: true, runValidators: true }
    )

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * @desc    Get all recent readings across all sensor nodes
 * @route   GET /api/sensors/readings/all
 * @access  Private (Admin Only)
 */
export const getAllReadings = async (req, res) => {
  try {
    const readings = await Sensor.find({}).sort({ createdAt: -1 }).limit(100)

    // Fetch sensor register to map sensorId → sensorName
    const sensors = await SensorRegister.find({})
    const sensorMap = {}
    sensors.forEach(s => {
      sensorMap[s._id] = s.name
    })

    const data = readings.map(r => ({
      _id: r._id,
      sensorId: r.sensorId,
      sensorName: sensorMap[r.sensorId] || r.sensorId,
      timestamp: r.createdAt,
      nitrogen: r.nitrogen,
      phosphorus: r.phosphorus,
      potassium: r.potassium,
      temperature: r.temperature,
      humidity: r.humidity,
      moisture: r.moisture,
    }))

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
