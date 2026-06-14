import { useState } from 'react'
import { MOCK_SENSORS, MOCK_USERS } from '../../services/mockData'

export default function AdminSensors() {
  const [sensors, setSensors] = useState(MOCK_SENSORS)
  
  // Registration form state
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newFarmerId, setNewFarmerId] = useState('')
  
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Filter farmers to show in selection dropdown
  const farmers = MOCK_USERS.filter(u => u.role === 'farmer')

  const handleRegisterSensor = (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!newId || !newName || !newLocation) {
      setError('Please fill in all fields.')
      return
    }

    // Check duplicate ID
    if (sensors.some(s => s._id === newId)) {
      setError('Sensor Code/ID already exists in database.')
      return
    }

    const newSensorObj = {
      _id: newId,
      name: newName,
      farmerId: newFarmerId || null,
      location: newLocation,
      status: 'online',
      battery: 100,
      lastSeen: new Date().toISOString()
    }

    setSensors(prev => [...prev, newSensorObj])
    setSuccess(true)
    
    // Reset Form
    setNewId('')
    setNewName('')
    setNewLocation('')
    setNewFarmerId('')

    setTimeout(() => setSuccess(false), 3000)
  }

  const handleToggleStatus = (sensorId) => {
    setSensors(prev => prev.map(s => {
      if (s._id === sensorId) {
        const nextStatus = s.status === 'online' ? 'warning' : s.status === 'warning' ? 'offline' : 'online'
        const nextBattery = nextStatus === 'offline' ? 0 : nextStatus === 'warning' ? 18 : 95
        return { 
          ...s, 
          status: nextStatus,
          battery: nextBattery,
          lastSeen: new Date().toISOString() 
        }
      }
      return s
    }))
  }

  const handleDeleteSensor = (sensorId) => {
    if (window.confirm('Are you sure you want to decommission this IoT probe?')) {
      setSensors(prev => prev.filter(s => s._id !== sensorId))
    }
  }

  const getFarmerName = (fid) => {
    const found = MOCK_USERS.find(u => u._id === fid)
    return found ? found.name : 'Unassigned'
  }

  return (
    <div className="page-container space-y-6">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">IoT Sensor Infrastructure</h1>
        <p className="text-slate-500 text-sm">Register new physical probe nodes, inspect telemetry gateways, and evaluate battery nodes</p>
      </div>

      {success && (
        <div className="alert-success animate-fade-in">
          <span>✅</span>
          <span>Sensor registered successfully! Connection sync confirmed.</span>
        </div>
      )}

      {error && (
        <div className="alert-danger animate-fade-in">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Sensors Directory */}
        <div className="lg:col-span-2 card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3">Active Physical Nodes</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Code/ID</th>
                  <th className="py-3 px-2">Sensor Name</th>
                  <th className="py-3 px-2">Assigned Farmer</th>
                  <th className="py-3 px-2">Plot Location</th>
                  <th className="py-3 px-2">Battery</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sensors.map((s) => {
                  const getStatusClass = (status) => {
                    if (status === 'online') return 'badge-green'
                    if (status === 'warning') return 'badge-amber'
                    return 'badge-red'
                  }
                  
                  return (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2 font-mono text-xs text-emerald-700 font-bold">{s._id}</td>
                      <td className="py-4 px-2 font-semibold text-slate-800">{s.name}</td>
                      <td className="py-4 px-2 text-slate-600 text-xs">{getFarmerName(s.farmerId)}</td>
                      <td className="py-4 px-2 text-slate-500 text-xs">{s.location}</td>
                      <td className="py-4 px-2 font-mono font-bold text-xs">
                        <span className={s.battery > 50 ? 'text-emerald-600' : s.battery > 20 ? 'text-amber-600' : 'text-red-600'}>
                          {s.battery}%
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <button 
                          onClick={() => handleToggleStatus(s._id)}
                          className={`badge ${getStatusClass(s.status)} cursor-pointer hover:opacity-80 transition-all`}
                          title="Click to toggle status for testing"
                        >
                          {s.status}
                        </button>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => handleDeleteSensor(s._id)}
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors cursor-pointer"
                        >
                          Decommission
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Deploy / Register Sensor Form */}
        <div className="space-y-6">
          
          {/* Register Form */}
          <div className="card space-y-4">
            <h2 className="section-title border-b border-slate-100 pb-3">Deploy New Probe</h2>
            
            <form onSubmit={handleRegisterSensor} className="space-y-4">
              {/* ID Code */}
              <div>
                <label className="form-label">Sensor Unique Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., s005"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Name */}
              <div>
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sensor E"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Location */}
              <div>
                <label className="form-label">Plot Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., East Sector Plot"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Assigned Farmer */}
              <div>
                <label className="form-label">Assign Farmer</label>
                <select
                  value={newFarmerId}
                  onChange={(e) => setNewFarmerId(e.target.value)}
                  className="form-input cursor-pointer"
                >
                  <option value="">Leave Unassigned (Inventory)</option>
                  {farmers.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.fieldName})</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full btn-primary py-2.5 mt-2"
              >
                Sync & Register Probe
              </button>
            </form>
          </div>

          {/* Node Operations Checklist */}
          <div className="card space-y-4">
            <h2 className="section-title border-b border-slate-100 pb-3">Maintenance Guide</h2>
            <div className="space-y-3 text-xs text-slate-500 leading-relaxed">
              <p>✔ <strong>Calibration:</strong> Soil probes should be calibrated using buffer solutions once every 6 months to guarantee NPK precision.</p>
              <p>✔ <strong>Warning Threshold:</strong> The gateway automatically triggers warning codes when a node’s battery voltage drops below 3.3V (approx 20%).</p>
              <p>✔ <strong>Radio Sync:</strong> Telemetry is received via LoRaWAN endpoints at 10-second intervals.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
