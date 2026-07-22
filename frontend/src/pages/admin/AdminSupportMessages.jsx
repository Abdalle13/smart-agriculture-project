import { useState, useEffect, useCallback } from 'react'
import {
  FiMessageSquare, FiClock, FiCheckCircle, FiAlertTriangle,
  FiRefreshCw, FiAlertCircle, FiFile, FiUser, FiSend
} from 'react-icons/fi'
import api from '../../services/api'

const STATUS_FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'Open',         label: 'Waiting' },
  { value: 'In Progress',  label: 'In Progress' },
  { value: 'Resolved',     label: 'Resolved' },
]

const CATEGORY_FILTERS = [
  'all',
  'Sensor Issue',
  'Reading Problem',
  'Crop Disease Scan',
  'Account Issue',
  'Node Request',
  'Other',
]

const getStatusBadge = (status) => {
  if (status === 'Resolved')    return <span className="badge-green">Resolved</span>
  if (status === 'In Progress') return <span className="badge-blue">In Progress</span>
  return <span className="badge-amber">Waiting for Reply</span>
}

// ─── Reply Modal ────────────────────────────────────────────────────────────
function ReplyModal({ item, onClose, onSaved }) {
  const [status, setStatus]   = useState(item.status)
  const [reply,  setReply]    = useState(item.adminReply || '')
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.patch(`/contact/${item._id}`, { status, adminReply: reply.trim() || undefined })
      onSaved(data.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="text-sm font-bold text-slate-800">Support Message</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 text-lg cursor-pointer transition-colors">×</button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-extrabold text-slate-800">{item.subject}</p>
              {item.priority && <span className="badge-red flex items-center gap-1"><FiAlertTriangle size={10} /> Danger</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {item.category} · {item.farmerId?.name || 'N/A'} ({item.farmerId?.email}) · {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed p-3 bg-slate-50 border border-slate-200 rounded-xl">{item.message}</p>

          {item.imageUrl && (
            <img src={item.imageUrl} alt="Attachment" className="w-full max-h-56 object-contain rounded-xl border border-slate-200 bg-slate-50" />
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all cursor-pointer"
            >
              <option value="Open">Waiting for Reply</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Reply to Farmer</label>
            <textarea
              rows={3}
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Write a reply the farmer will see…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-4 h-4" /> {saving ? 'Saving…' : 'Save & Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSupportMessages() {
  const [contacts,   setContacts]   = useState([])
  const [farmers,    setFarmers]    = useState([])
  const [openCount,  setOpenCount]  = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [farmerFilter,   setFarmerFilter]   = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/auth/users')
      .then(res => setFarmers((res.data.users || []).filter(u => u.role === 'farmer')))
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const params = new URLSearchParams({ status: statusFilter, category: categoryFilter })
      if (farmerFilter !== 'all') params.set('farmerId', farmerFilter)

      const { data } = await api.get(`/contact/all?${params}`)
      setContacts(data.data || [])
      setOpenCount(data.openCount ?? 0)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, farmerFilter, categoryFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaved = (updated) => {
    setContacts(prev => prev.map(c => c._id === updated._id ? updated : c))
  }

  const dangerCount = contacts.filter(c => c.priority && c.status !== 'Resolved').length

  return (
    <div className="page-container space-y-7">

      {selected && <ReplyModal item={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Support Messages</h1>
          <p className="text-slate-400 text-sm mt-0.5">Farmer questions and issue reports</p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {fetchError && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm">
          <span className="font-semibold">Failed to load support messages. Check server connection.</span>
          <button onClick={fetchData} className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">Retry</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',   value: contacts.length, Icon: FiMessageSquare, iconBg: 'bg-slate-100 border-slate-200', iconColor: 'text-slate-500', valColor: 'text-slate-800' },
          { label: 'Waiting', value: openCount,        Icon: FiClock,         iconBg: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600', valColor: 'text-amber-700' },
          { label: 'Danger',  value: dangerCount,       Icon: FiAlertTriangle, iconBg: 'bg-red-50 border-red-200',     iconColor: 'text-red-500',   valColor: 'text-red-700'   },
        ].map(s => (
          <div key={s.label} className="min-w-0 bg-white border border-slate-200 rounded-2xl px-2.5 py-3 sm:px-5 sm:py-4 flex items-center gap-1.5 sm:gap-4 shadow-sm">
            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border flex items-center justify-center ${s.iconBg} ${s.iconColor} shrink-0`}>
              <s.Icon size={13} className="sm:hidden" />
              <s.Icon size={15} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <p className={`text-lg sm:text-2xl font-black ${s.valColor}`}>{s.value}</p>
              <p className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide sm:tracking-wider mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + List ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-end gap-4 bg-slate-50/50">

          {/* Farmer filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiUser size={10} /> Farmer
            </span>
            <select
              value={farmerFilter}
              onChange={e => setFarmerFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all min-w-[160px] shadow-sm"
            >
              <option value="all">All Farmers</option>
              {farmers.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block self-end mb-0.5" />

          {/* Category filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiMessageSquare size={10} /> Category
            </span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all min-w-[150px] shadow-sm"
            >
              <option value="all">All Categories</option>
              {CATEGORY_FILTERS.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block self-end mb-0.5" />

          {/* Status filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                    statusFilter === s.value
                      ? 'bg-emerald-600 text-white border border-emerald-600'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-9 h-9 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-sm">Loading messages…</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <FiMessageSquare size={26} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-600">No messages found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map(item => (
                <button
                  key={item._id}
                  onClick={() => setSelected(item)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.priority && <FiAlertTriangle size={12} className="text-red-500 shrink-0" />}
                        <p className="font-semibold text-slate-800 text-sm truncate">{item.subject}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                        <FiUser size={10} /> {item.farmerId?.name || 'N/A'}
                        <span>·</span> {item.category}
                        <span>·</span> {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 truncate">{item.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {getStatusBadge(item.status)}
                      {item.imageUrl && <FiFile size={12} className="text-slate-300" />}
                    </div>
                  </div>
                  {item.adminReply && (
                    <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
                      <FiCheckCircle size={10} /> Replied
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
