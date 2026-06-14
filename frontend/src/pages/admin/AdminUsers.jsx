import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users')
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (userId) => {
    try {
      const { data } = await api.put(`/auth/users/${userId}/status`)
      if (data.success) {
        setUsers(prev => prev.map(user => {
          if (user._id === userId) return { ...user, isActive: !user.isActive }
          return user
        }))
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating user status')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user from the AgriSense database?')) {
      try {
        await api.delete(`/auth/users/${userId}`)
        setUsers(prev => prev.filter(user => user._id !== userId))
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting user')
      }
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fieldName && user.fieldName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  return (
    <div className="page-container space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Farmer & User Directory</h1>
        <p className="text-slate-500 text-sm">Approve farmer registrations, toggle account activation status, and manage access parameters</p>
      </div>

      {/* ── Controls Row ── */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Search by name, email, or plot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
        {/* Status Filter */}
        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input cursor-pointer">
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Pending / Inactive</option>
          </select>
        </div>
        {/* Role Filter */}
        <div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-input cursor-pointer">
            <option value="all">All User Roles</option>
            <option value="farmer">Farmers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-4">User Details</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Farm plot (Afgoye)</th>
              <th className="py-3 px-4">Connected Probes</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  <div className="flex justify-center mb-2">
                    <svg className="w-6 h-6 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  No users match the search and filter query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">

                  {/* Name and Email */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 font-mono text-sm">
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-4">
                    {u.role === 'admin' ? (
                      <span className="badge-purple">Administrator</span>
                    ) : (
                      <span className="badge-green">Farmer</span>
                    )}
                  </td>

                  {/* Farm Plot Details */}
                  <td className="py-4 px-4">
                    {u.fieldName ? (
                      <div>
                        <p className="text-slate-700 font-medium text-xs">{u.fieldName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">📍 {u.location}</p>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Probes */}
                  <td className="py-4 px-4 font-mono text-xs text-emerald-700">
                    {u.sensorIds && u.sensorIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {u.sensorIds.map(sid => (
                          <span key={sid} className="px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200 text-emerald-700">
                            {sid}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Active Status Toggle */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(u._id)}
                      className={`badge cursor-pointer transition-all hover:opacity-85 ${u.isActive ? 'badge-green' : 'badge-amber'}`}
                    >
                      {u.isActive ? 'Active' : 'Pending Review'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(u._id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        {u.isActive ? 'Deactivate' : 'Approve'}
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
