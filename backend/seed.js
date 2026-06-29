/**
 * seed.js — Samaynta default accounts (Admin + Farmer)
 * 
 * Sida loo isticmaalo:
 *   node seed.js         → ku dar accountyada
 *   node seed.js --clear → tirtir dhammaan users-ka
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import SensorRegister from './models/SensorRegister.js'
import Sensor from './models/Sensor.js'

dotenv.config()

// Accounts la samaynayo
const SEED_USERS = [
  {
    name: 'Admin AgriSense',
    email: 'admin@agrisense.io',
    password: 'admin123',
    role: 'admin',
    fieldName: 'HQ Control Room',
    location: 'Mogadishu, Somalia',
    sensorIds: [],
    isActive: true,
    isApproved: true,
  },
  {
    name: 'Abdalle',
    email: 'abdalle@agrisense.io',
    password: 'abdalle123',
    role: 'farmer',
    fieldName: 'Hassan North Field',
    location: 'Afgoye, Somalia',
    sensorIds: [],   // start with no sensors assigned
    isActive: true,
    isApproved: true,
  },
]

// Sensor node default
const SEED_SENSORS = []

// Connect & Run
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB Connected')

    const clearMode = process.argv.includes('--clear')

    if (clearMode) {
      await User.deleteMany({})
      await SensorRegister.deleteMany({})
      await Sensor.deleteMany({})
      console.log(' All users, sensors, and telemetry readings cleared.')
      process.exit(0)
    }

    if (process.argv.includes('--clear-readings')) {
      await Sensor.deleteMany({})
      console.log(' All telemetry readings cleared. Accounts untouched.')
      process.exit(0)
    }

    //  Seed Sensors
    for (const s of SEED_SENSORS) {
      const exists = await SensorRegister.findById(s._id)
      if (!exists) {
        await SensorRegister.create(s)
        console.log(` Sensor created: ${s._id} — ${s.name}`)
      } else {
        console.log(` Sensor already exists: ${s._id} (skipped)`)
      }
    }

    // Seed Users
    for (const u of SEED_USERS) {
      const exists = await User.findOne({ email: u.email })
      if (!exists) {
        await User.create(u)       // bcrypt hashing happens automatically via pre-save hook
        console.log(`👤 User created: ${u.email}  [${u.role}]  password: ${u.password}`)
      } else {
        console.log(`⚠️  User already exists: ${u.email} (skipped)`)
      }
    }

    console.log('\n Seeding completed!')
    console.log('─────────────────────────────────')
    console.log('  Admin  → admin@agrisense.io   / admin123')
    console.log('  Farmer → abdalle@agrisense.io / abdalle123')
    console.log('─────────────────────────────────')
    process.exit(0)

  } catch (err) {
    console.error('❌ Seed Error:', err.message)
    process.exit(1)
  }
}

run()
