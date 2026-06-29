import { useState, useEffect, useRef } from 'react'
import {
  FiSearch, FiUserPlus, FiEdit2, FiMapPin,
  FiUsers, FiUserCheck, FiClock, FiUserX,
  FiRadio, FiCheck, FiX, FiAlertTriangle
} from 'react-icons/fi'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const roleColor = (role) =>
  role === 'admin'
    ? 'bg-violet-100 text-violet-700 border-violet-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200'

const avatarBg = (role) =>
  role === 'admin'
    ? 'bg-violet-100 border-violet-200 text-violet-700'
    : 'bg-emerald-100 border-emerald-200 text-emerald-700'

const inputCls = `w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white
  focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all`

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold
      ${type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
      {type === 'error' ? <FiX size={14} /> : <FiCheck size={14} />}
      {message}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, accent, onClose, children }) {
  const ref = useRef()
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${accent ? 'bg-emerald-600' : 'bg-slate-50'}`}>
          <h3 className={`text-sm font-bold ${accent ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
          <button onClick={onClose}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-lg cursor-pointer transition-colors
              ${accent ? 'hover:bg-white/20 text-white/70 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'}`}>
            ×
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Field Label ──────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ─── User Form ────────────────────────────────────────────────────────────────
function UserForm({ editTarget, currentUserId, onSave, onClose }) {
  const isEdit = !!editTarget
  const isSelf = editTarget?._id === currentUserId

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name:      editTarget.name      || '',
          email:     editTarget.email     || '',
          password:  '',
          role:      editTarget.role      || 'farmer',
          fieldName: editTarget.fieldName || '',
          location:  editTarget.location  || '',
          sensorId:  (editTarget.sensorIds || [])[0] || '',
        }
      : { name: '', email: '', password: '', role: 'farmer', fieldName: '', location: 'Afgoye, Somalia', sensorId: '' }
  )
  const [sensors, setSensors] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})

  useEffect(() => {
    api.get('/sensors').then(res => setSensors(res.data.data || [])).catch(() => {})
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!isEdit && !form.password) e.password = 'Password is required for new users'
    if (form.password && form.password.length < 6) e.password = 'Minimum 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setSaving(true)
    try {
      const payload = {
        name:      form.name.trim(),
        email:     form.email.trim(),
        role:      form.role,
        fieldName: form.fieldName.trim(),
        location:  form.location.trim(),
        sensorIds: form.sensorId ? [form.sensorId] : [],
      }
      if (form.password) payload.password = form.password
      const res = isEdit
        ? await api.put(`/auth/users/${editTarget._id}`, payload)
        : await api.post('/auth/users', payload)
      if (res.data.success) onSave(res.data.user, isEdit)
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'An error occurred. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit — ${editTarget.name}` : 'Create New Farmer'}
      accent={!isEdit}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full Name" error={errors.name}>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Abukar Hassan"
              className={`${inputCls} ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'}`} />
          </Field>
          <Field label="Email Address" error={errors.email}>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="john.doe@gmail.com"
              className={`${inputCls} ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'}`} />
          </Field>
        </div>

        <Field label={isEdit ? 'Password (leave blank to keep)' : 'Password'} error={errors.password}>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
            placeholder={isEdit ? 'Enter new password to change…' : 'Min. 6 characters'}
            className={`${inputCls} ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'}`} />
        </Field>

        <Field label="Role">
          <select value={form.role} onChange={e => set('role', e.target.value)} disabled={isSelf}
            className={`${inputCls} border-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}>
            <option value="farmer">Farmer</option>
            <option value="admin">Administrator</option>
          </select>
          {isSelf && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <FiAlertTriangle size={11} /> You cannot change your own role.
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Farm / Plot Name">
            <input type="text" value={form.fieldName} onChange={e => set('fieldName', e.target.value)}
              placeholder="e.g. Hassan North Field"
              className={`${inputCls} border-slate-200`} />
          </Field>
          <Field label="Location">
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="e.g. Afgoye, Somalia"
              className={`${inputCls} border-slate-200`} />
          </Field>
        </div>

        <Field label="Assign Field Node">
          <select value={form.sensorId} onChange={e => set('sensorId', e.target.value)}
            className={`${inputCls} border-slate-200 cursor-pointer`}>
            <option value="">— No sensor assigned —</option>
            {sensors.map(s => (
              <option key={s._id} value={s._id}>{s.name || s._id}</option>
            ))}
          </select>
        </Field>

        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
            <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
            {errors.submit}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm transition-colors cursor-pointer">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Farmer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminFarmerManagement() {
  const { user: currentUser } = useAuth()
  const [users,        setUsers]        = useState([])
  const [allSensors,   setAllSensors]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [searchTerm,   setSearchTerm]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter,   setRoleFilter]   = useState('all')
  const [showCreate,   setShowCreate]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [toast,        setToast]        = useState(null)
  const [togglingId,   setTogglingId]   = useState(null)

  const showToast = (message, type = 'success') => setToast({ message, type })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/auth/users')
        if (data.success) setUsers(data.users)
      } catch (err) {
        setToast({ message: err.response?.data?.message || 'Failed to load users', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
    api.get('/sensors').then(res => setAllSensors(res.data.data || [])).catch(() => {})
  }, [])

  const handleToggle = async (userId) => {
    if (userId === currentUser._id) {
      showToast('You cannot change your own account status.', 'error')
      return
    }
    setTogglingId(userId)
    try {
      const { data } = await api.put(`/auth/users/${userId}/status`)
      if (data.success) {
        setUsers(prev => prev.map(u =>
          u._id === userId ? { ...u, isActive: data.user.isActive, isApproved: data.user.isApproved } : u
        ))
        showToast(data.user.isActive ? 'Account activated successfully.' : 'Account deactivated.')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating status', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleSave = (savedUser, isEdit) => {
    if (isEdit) {
      setUsers(prev => prev.map(u => u._id === savedUser._id ? savedUser : u))
      showToast('Farmer updated successfully.')
    } else {
      setUsers(prev => [savedUser, ...prev])
      showToast('New farmer created successfully.')
    }
    setEditTarget(null)
    setShowCreate(false)
  }

  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.fieldName || '').toLowerCase().includes(q) ||
      (u.location  || '').toLowerCase().includes(q)
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active'   && u.isActive && u.isApproved) ||
      (statusFilter === 'pending'  && !u.isApproved) ||
      (statusFilter === 'inactive' && u.isApproved && !u.isActive)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchStatus && matchRole
  })

  const totalFarmers = users.filter(u => u.role === 'farmer').length
  const totalAdmins  = users.filter(u => u.role === 'admin').length
  const active       = users.filter(u => u.isActive && u.isApproved).length
  const pending      = users.filter(u => !u.isApproved).length
  const inactive     = users.filter(u => u.isApproved && !u.isActive).length
  const isSelf       = (uid) => uid === currentUser?._id

  return (
    <div className="page-container space-y-7">

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {showCreate && (
        <UserForm currentUserId={currentUser?._id} onSave={handleSave} onClose={() => setShowCreate(false)} />
      )}
      {editTarget && (
        <UserForm editTarget={editTarget} currentUserId={currentUser?._id} onSave={handleSave} onClose={() => setEditTarget(null)} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Farmer Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Approve registrations and manage all farmer accounts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <FiUserPlus size={15} /> Add New Farmer
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users',      value: users.length, Icon: FiUsers,     iconColor: 'text-slate-500',   iconBg: 'bg-slate-100 border-slate-200',   valColor: 'text-slate-800'   },
          { label: 'Active',           value: active,       Icon: FiUserCheck, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 border-emerald-200', valColor: 'text-emerald-700' },
          { label: 'Pending',          value: pending,      Icon: FiClock,     iconColor: 'text-amber-600',   iconBg: 'bg-amber-50 border-amber-200',     valColor: 'text-amber-700'   },
          { label: 'Inactive',         value: inactive,     Icon: FiUserX,     iconColor: 'text-slate-400',   iconBg: 'bg-slate-100 border-slate-200',    valColor: 'text-slate-500'   },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-2 sm:gap-4 shadow-sm">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center ${s.iconBg} ${s.iconColor} shrink-0`}>
              <s.Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl sm:text-2xl font-black ${s.valColor}`}>{s.value}</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search by name, email, farm, or location…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer">
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="pending">Pending Approval</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer">
          <option value="all">All Roles</option>
          <option value="farmer">Farmers</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['User', 'Role', 'Farm Details', 'Assigned Node', 'Joined', 'Status', ''].map(h => (
                  <th key={h} className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                      <p className="text-sm text-slate-400">Loading farmers…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <FiSearch size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-600 text-sm">No farmers found</p>
                        <p className="text-xs mt-0.5">Try adjusting your search or filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u._id} className={`hover:bg-slate-50/60 transition-colors ${isSelf(u._id) ? 'bg-emerald-50/30' : ''}`}>

                    {/* User */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${avatarBg(u.role)}`}>
                          {initials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                            {isSelf(u._id) && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold border border-emerald-200 shrink-0">YOU</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleColor(u.role)}`}>
                        {u.role === 'admin' ? 'Admin' : 'Farmer'}
                      </span>
                    </td>

                    {/* Farm Details */}
                    <td className="py-3.5 px-5">
                      {u.fieldName ? (
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{u.fieldName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <FiMapPin size={9} /> {u.location || 'No location'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs italic">Not set</span>
                      )}
                    </td>

                    {/* Assigned Node */}
                    <td className="py-3.5 px-5">
                      {u.sensorIds?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.sensorIds.map(sid => {
                            const node = allSensors.find(n => n._id === sid)
                            return (
                              <span key={sid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                                <FiRadio size={9} /> {node?.name || sid}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs italic">Unassigned</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="py-3.5 px-5 text-xs text-slate-400 font-mono whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border whitespace-nowrap
                        ${!u.isApproved
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                        {!u.isApproved
                          ? <><FiClock size={10} /> Pending</>
                          : u.isActive
                            ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</>
                            : <><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive</>
                        }
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-2">
                        {!isSelf(u._id) && (
                          <button
                            onClick={() => handleToggle(u._id)}
                            disabled={togglingId === u._id}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer min-w-[80px] text-center whitespace-nowrap
                              ${!u.isApproved || !u.isActive
                                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                                : 'bg-slate-50 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600'
                              }`}
                          >
                            {togglingId === u._id ? '…' : !u.isApproved ? 'Approve' : u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        <button
                          onClick={() => setEditTarget(u)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-700 transition-all cursor-pointer"
                        >
                          <FiEdit2 size={10} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing <span className="font-bold text-slate-600">{filtered.length}</span> of{' '}
              <span className="font-bold text-slate-600">{users.length}</span> users
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><FiUsers size={10} /> {totalFarmers} Farmer{totalFarmers !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{totalAdmins} Admin{totalAdmins !== 1 ? 's' : ''}</span>
              {pending > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <FiClock size={10} /> {pending} Pending
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
