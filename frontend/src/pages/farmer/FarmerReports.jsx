import { useState, useEffect, useCallback } from 'react'
import {
  FiDownload, FiCalendar, FiAlertCircle, FiZap, FiMessageSquare, FiActivity,
  FiCheckCircle, FiAlertTriangle
} from 'react-icons/fi'
import api from '../../services/api'

const RANGE_OPTIONS = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
]

const getSeverityBadge = (sev) => {
  if (sev === 'High')    return <span className="badge-red">High</span>
  if (sev === 'Medium')  return <span className="badge-amber">Medium</span>
  if (sev === 'Low')     return <span className="badge-blue">Low</span>
  if (sev === 'Unknown') return <span className="badge-gray">Unrecognized</span>
  return <span className="badge-green">Healthy</span>
}

const getStatusBadge = (status) => {
  if (status === 'Resolved')    return <span className="badge-green">Resolved</span>
  if (status === 'In Progress') return <span className="badge-blue">In Progress</span>
  return <span className="badge-amber">Waiting</span>
}

export default function FarmerReports() {
  const today = new Date().toISOString().split('T')[0]

  const [range,      setRange]      = useState('daily')
  const [date,       setDate]       = useState(today)
  const [report,     setReport]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const { data } = await api.get('/reports/farmer', { params: { range, date } })
      setReport(data.data)
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [range, date])

  useEffect(() => { fetchReport() }, [fetchReport])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await api.get('/reports/farmer/pdf', {
        params: { range, date },
        responseType: 'blob',
        timeout: 30000,
      })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `agrisense_my_${range}_report.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      setFetchError(true)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="page-container max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Reports</h1>
          <p className="text-slate-500 text-sm">Your field activity summary, ready to export as PDF</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={loading || downloading || !report}
          className="btn-primary self-start sm:self-auto py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</span>
          <div className="flex gap-1.5">
            {RANGE_OPTIONS.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                  range === r.value
                    ? 'bg-emerald-600 text-white border border-emerald-600'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <FiCalendar size={10} /> Reference Date
          </span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all cursor-pointer"
          />
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm">
          <span className="font-semibold flex items-center gap-2"><FiAlertCircle className="w-4 h-4" /> Failed to load or generate the report.</span>
          <button onClick={fetchReport} className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <div className="w-9 h-9 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm">Building your report…</p>
        </div>
      ) : report && (
        <>
          {/* ── Verdict ── */}
          {report.verdict.status === 'good' ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-sm font-semibold">
              <FiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
              Your field is in good condition this period.
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 text-sm">
              <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">Needs attention</p>
                <ul className="mt-1.5 space-y-1 list-disc list-inside text-amber-700">
                  {report.verdict.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* ── Soil & Telemetry Summary ── */}
          <div className="card space-y-4">
            <h2 className="section-title border-b border-slate-100 pb-3 flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-emerald-500" /> Soil & Telemetry Summary
            </h2>
            <p className="text-xs text-slate-400">{report.readingCount} readings collected this period</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Nitrogen',    value: `${report.avgReadings.nitrogen} mg/kg` },
                { label: 'Phosphorus',  value: `${report.avgReadings.phosphorus} mg/kg` },
                { label: 'Potassium',   value: `${report.avgReadings.potassium} mg/kg` },
                { label: 'Temperature', value: `${report.avgReadings.temperature}°C` },
                { label: 'Humidity',    value: `${report.avgReadings.humidity}%` },
                { label: 'Soil Moisture', value: `${report.avgReadings.moisture}%` },
              ].map(s => (
                <div key={s.label} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{s.label}</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Crop Disease Scans ── */}
          <div className="card space-y-3">
            <h2 className="section-title border-b border-slate-100 pb-3 flex items-center gap-2">
              <FiZap className="w-4 h-4 text-amber-500" /> Crop Disease Scans
            </h2>
            <p className="text-xs text-slate-400">
              {report.diagnosisCount} scans — High: {report.severityCounts.High}, Medium: {report.severityCounts.Medium}, Low: {report.severityCounts.Low}, Healthy: {report.severityCounts.None}
            </p>
            {report.diagnoses.length > 0 ? (
              <div className="space-y-2 pt-1">
                {report.diagnoses.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                    <p className="font-semibold text-slate-800">{d.disease}</p>
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(d.severity)}
                      <span className="text-xs text-slate-400 font-mono">{new Date(d.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No scans this period.</p>
            )}
          </div>

          {/* ── Support Messages ── */}
          {report.tickets.length > 0 && (
            <div className="card space-y-3">
              <h2 className="section-title border-b border-slate-100 pb-3 flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-blue-500" /> Support Messages
              </h2>
              <div className="space-y-2">
                {report.tickets.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                    <p className="font-semibold text-slate-800">{t.subject}</p>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(t.status)}
                      <span className="text-xs text-slate-400 font-mono">{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
