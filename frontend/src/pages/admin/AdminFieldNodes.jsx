import { useState, useEffect, useRef } from 'react'
import {
  FiRadio, FiMapPin, FiUser, FiPlus, FiEdit2,
  FiTrash2, FiRefreshCw, FiAlertTriangle, FiLayers, FiCheck
} from 'react-icons/fi'
import api from '../../services/api'


// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold animate-fade-in
      ${type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
      {type === 'error' ? <FiAlertTriangle size={15} /> : <FiCheck size={15} />}
      {message}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 text-lg cursor-pointer transition-colors">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all'

// ─── Sensor Card ──────────────────────────────────────────────────────────────
function SensorCard({ sensor, users, onEdit, onDelete }) {
  const farmer = users.find(u => u._id === String(sensor.farmerId))

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">

      {/* Top accent bar */}
      <div className="h-1 w-full bg-emerald-500" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <FiRadio size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate leading-tight">{sensor.name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{sensor._id}</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="space-y-1.5 mb-4 pl-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FiMapPin size={11} className="text-slate-300 shrink-0" />
            <span className="truncate">{sensor.location || <span className="text-slate-300 italic">No location set</span>}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FiUser size={11} className="text-slate-300 shrink-0" />
            {farmer
              ? <span className="font-semibold text-emerald-700 truncate">{farmer.name}</span>
              : <span className="text-slate-300 italic">Unassigned</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-3.5 border-t border-slate-100">
          <button
            onClick={() => onEdit(sensor)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-700 transition-all cursor-pointer"
          >
            <FiEdit2 size={11} /> Edit
          </button>
          <button
            onClick={() => onDelete(sensor)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
          >
            <FiTrash2 size={11} /> Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminFieldNodes() {
  const [sensors,    setSensors]    = useState([])
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [showDelete, setShowDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form,       setForm]       = useState({ id: '', name: '', location: '', farmerId: '' })

  const showToast = (message, type = 'success') => setToast({ message, type })

  const [refreshTick, setRefreshTick] = useState(0)
  const handleRefresh = () => setRefreshTick(t => t + 1)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [sRes, uRes] = await Promise.all([api.get('/sensors'), api.get('/auth/users')])
        if (sRes.data.success) setSensors(sRes.data.data)
        if (uRes.data.success) setUsers(uRes.data.users)
      } catch {
        setToast({ message: 'Failed to load data from server.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [refreshTick])

  const farmers       = users.filter(u => u.role === 'farmer')
  const assignedCount = sensors.filter(s => s.farmerId).length

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.id.trim() || !form.name.trim()) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/sensors', {
        _id: form.id.trim(), name: form.name.trim(),
        location: form.location.trim(), farmerId: form.farmerId || null,
      })
      if (data.success) {
        setSensors(prev => [...prev, data.data])
        setForm({ id: '', name: '', location: '', farmerId: '' })
        showToast('Field node registered successfully.')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to register sensor.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.patch(`/sensors/${editTarget._id}`, {
        name: editTarget.name, location: editTarget.location,
        farmerId: editTarget.farmerId || null,
      })
      if (data.success) {
        setSensors(prev => prev.map(s => s._id === editTarget._id ? data.data : s))
        setEditTarget(null)
        showToast('Field node updated successfully.')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update sensor.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/sensors/${showDelete._id}`)
      setSensors(prev => prev.filter(s => s._id !== showDelete._id))
      setShowDelete(null)
      showToast('Field node removed.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove sensor.', 'error')
      setShowDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading field nodes…</p>
      </div>
    )
  }

  return (
    <div className="page-container space-y-7">

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`Edit Node — ${editTarget._id}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Field label="Node ID">
              <input value={editTarget._id} disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 text-sm text-slate-400 bg-slate-50 font-mono cursor-not-allowed" />
              <p className="text-[10px] text-slate-400 mt-1">Node ID cannot be changed after registration.</p>
            </Field>
            <Field label="Display Name">
              <input value={editTarget.name} required className={inputCls}
                onChange={e => setEditTarget(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Location">
              <input value={editTarget.location} className={inputCls}
                onChange={e => setEditTarget(p => ({ ...p, location: e.target.value }))} />
            </Field>
            <Field label="Assigned Farmer">
              <select value={editTarget.farmerId || ''} className={`${inputCls} cursor-pointer`}
                onChange={e => setEditTarget(p => ({ ...p, farmerId: e.target.value }))}>
                <option value="">— Unassigned —</option>
                {farmers.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 cursor-pointer transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm cursor-pointer transition-colors">
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Modal ────────────────────────────────────────────────────── */}
      {showDelete && (
        <Modal title="Remove Field Node" onClose={() => setShowDelete(null)}>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm font-semibold text-red-800">
                Remove <span className="font-black">{showDelete.name}</span>?
              </p>
              <p className="text-xs text-red-500 mt-1 leading-relaxed">
                This decommissions the node and removes it from all farmer assignments. Historical readings are not deleted but will have no linked node.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 cursor-pointer transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm cursor-pointer transition-colors">
                Yes, Remove
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manage Field Nodes</h1>
          <p className="text-slate-400 text-sm mt-0.5">IoT soil probe registry for Afgoye District</p>
        </div>
        <button onClick={handleRefresh}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm">
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Summary Strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
            <FiLayers size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800">{sensors.length}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Total Nodes</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500">
            <FiUser size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-blue-700">{assignedCount}</p>
            <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mt-0.5">Assigned</p>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Node Cards */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Registered Nodes <span className="text-slate-300 font-normal normal-case">({sensors.length})</span>
          </p>

          {sensors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                <FiRadio size={26} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">No field nodes registered</p>
                <p className="text-xs text-slate-400 mt-1">Use the form on the right to add your first sensor node.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sensors.map(s => (
                <SensorCard key={s._id} sensor={s} users={users} onEdit={setEditTarget} onDelete={setShowDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Register Form */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:sticky lg:top-6">
          <div className="px-5 py-4 bg-emerald-600">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <FiPlus size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Register New Node</p>
                <p className="text-[11px] text-emerald-100">Add an IoT probe to the system</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegister} className="p-5 space-y-4">
            <Field label="Node ID">
              <input type="text" required placeholder="e.g., s005" value={form.id}
                onChange={e => setForm(p => ({ ...p, id: e.target.value }))}
                className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Display Name">
              <input type="text" required placeholder="e.g., North Field Probe" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Location">
              <input type="text" placeholder="e.g., East Sector Plot" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Assign to Farmer">
              <select value={form.farmerId} onChange={e => setForm(p => ({ ...p, farmerId: e.target.value }))}
                className={`${inputCls} cursor-pointer`}>
                <option value="">— Unassigned —</option>
                {farmers.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </Field>
            <button type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm mt-2">
              <FiRadio size={13} />
              {submitting ? 'Registering…' : 'Register Node'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
