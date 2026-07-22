import { useState, useEffect, useCallback } from 'react'
import {
  FiSend, FiAlertCircle, FiCheckCircle, FiClock, FiMessageSquare,
  FiPaperclip, FiX, FiAlertTriangle
} from 'react-icons/fi'
import api from '../../services/api'

const CATEGORIES = [
  'Sensor Issue',
  'Reading Problem Issue',
  'Crop Disease Scan Issue',
  'Account Issue',
  'weather Forecast Issue',
  'Other',
]

const getStatusBadge = (status) => {
  if (status === 'Resolved')    return <span className="badge-green">Resolved</span>
  if (status === 'In Progress') return <span className="badge-blue">In Progress</span>
  return <span className="badge-amber">Waiting for Reply</span>
}

export default function FarmerContact() {
  const [category, setCategory] = useState(CATEGORIES[0])
  const [subject,  setSubject]  = useState('')
  const [message,  setMessage]  = useState('')
  const [priority, setPriority] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [history,      setHistory]      = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const { data } = await api.get('/contact/my')
      setHistory(data.data || [])
      setHistoryError(false)
    } catch {
      setHistoryError(true)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const resetForm = () => {
    setCategory(CATEGORIES[0])
    setSubject('')
    setMessage('')
    setPriority(false)
    clearImage()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const formData = new FormData()
      formData.append('category', category)
      formData.append('subject', subject.trim())
      formData.append('message', message.trim())
      formData.append('priority', priority)
      if (imageFile) formData.append('image', imageFile)

      await api.post('/contact', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSubmitSuccess(true)
      resetForm()
      await fetchHistory()
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to send your message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Contact Support</h1>
        <p className="text-slate-500 text-sm">Report an issue or ask the admin team a question</p>
      </div>

      {/* ── Form ── */}
      <div className="card space-y-4">
        <h2 className="section-title border-b border-slate-100 pb-3 flex items-center gap-2">
          <FiMessageSquare className="w-4 h-4 text-emerald-500" /> New Message
        </h2>

        {submitSuccess && (
          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
            <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Your message was sent. Our team will reply soon.</span>
          </div>
        )}

        {submitError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                disabled={submitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="eg. Sensor not sending data"
                disabled={submitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Message</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe the issue or question in detail..."
              disabled={submitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all resize-none"
            />
          </div>

          {/* Optional photo */}
          <p className="text-[11px] text-slate-400 -mb-1">
            If the problem is something you can see (e.g. a burnt or damaged sensor), attach a photo of it.
          </p>
          {imagePreview ? (
            <div className="relative w-32 h-32">
              <img src={imagePreview} alt="Attachment preview" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-sm cursor-pointer transition-colors"
              >
                <FiX size={12} />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400 text-slate-500 hover:text-emerald-600 text-xs font-semibold cursor-pointer transition-colors w-fit">
              <FiPaperclip size={13} /> Attach a photo (optional)
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" disabled={submitting} />
            </label>
          )}

          {/* Priority + submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={priority}
                onChange={e => setPriority(e.target.checked)}
                disabled={submitting}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-red-600"
              />
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <FiAlertTriangle size={12} className="text-red-500" /> This is serious, needs a fast reply
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className="btn-primary px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-4 h-4" /> {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>

      {/* ── History ── */}
      <div className="card space-y-4">
        <h2 className="section-title border-b border-slate-100 pb-3">Your Messages</h2>

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm">Loading your messages…</p>
          </div>
        ) : historyError ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            Failed to load your messages.
            <button onClick={fetchHistory} className="ml-auto text-xs font-semibold text-red-700 hover:underline cursor-pointer">Retry</button>
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No messages yet. Use the form above to reach the admin team.</p>
        ) : (
          <div className="space-y-3">
            {history.map(item => (
              <div key={item._id} className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.priority && <FiAlertTriangle size={12} className="text-red-500 shrink-0" />}
                      <p className="font-semibold text-slate-800 text-sm truncate">{item.subject}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.category} · {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>

                {item.imageUrl && (
                  <img src={item.imageUrl} alt="Attachment" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                )}

                {item.adminReply && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <FiCheckCircle size={10} /> Admin Reply
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.adminReply}</p>
                  </div>
                )}

                {!item.adminReply && item.status === 'Open' && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <FiClock size={11} /> Waiting for a reply
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
