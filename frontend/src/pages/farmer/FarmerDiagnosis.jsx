import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FiCamera, FiUpload, FiSearch, FiCpu, FiInfo, FiZoomIn,
  FiAlertCircle, FiX, FiCircle, FiClock, FiChevronRight
} from 'react-icons/fi'
import api from '../../services/api'
import { ROUTES } from '../../utils/constants'

const getSeverityBadge = (sev) => {
  if (sev === 'High')    return <span className="badge-red">High Risk</span>
  if (sev === 'Medium')  return <span className="badge-amber">Medium Risk</span>
  if (sev === 'Low')     return <span className="badge-blue">Low Risk</span>
  if (sev === 'Unknown') return <span className="badge-gray">Unrecognized</span>
  return <span className="badge-green">None (Healthy)</span>
}

export default function FarmerDiagnosis() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [scanning,     setScanning]     = useState(false)
  const [scanStep,     setScanStep]     = useState(0)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState(null)

  // Camera state
  const [cameraOpen,  setCameraOpen]  = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  // ── Camera ──────────────────────────────────────────────────────────────────
  const openCamera = async () => {
    setCameraError(null)
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCameraError('Camera access denied. Allow camera permission and try again.')
    }
  }

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
    setCameraError(null)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setError(null)
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  // ── File upload ─────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }

  // ── Submit to backend (Node.js → FastAPI) ───────────────────────────────────
  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) return

    setScanning(true)
    setScanStep(1)
    setError(null)

    try {
      await new Promise(r => setTimeout(r, 500))
      setScanStep(2)
      await new Promise(r => setTimeout(r, 500))
      setScanStep(3)

      const formData = new FormData()
      formData.append('image', selectedFile)

      const { data } = await api.post('/diagnosis', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })

      setResult(data.data)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message
      if (err.code === 'ERR_NETWORK') {
        setError('Connection failed. Make sure the backend and AI service are both running.')
      } else {
        setError(msg || 'Diagnosis failed. Please try again.')
      }
    } finally {
      setScanning(false)
      setScanStep(0)
    }
  }

  const triggerReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">

      {/* ── Camera Modal ── */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FiCamera className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-800">Take Leaf Photo</span>
              </div>
              <button onClick={closeCamera} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                  <FiAlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-sm text-red-600 font-medium">{cameraError}</p>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[360px] object-cover" />
              )}
              {!cameraError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/60 rounded-2xl" />
                </div>
              )}
            </div>

            {!cameraError && (
              <div className="flex items-center justify-center py-5 bg-slate-50">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 border-4 border-white shadow-lg flex items-center justify-center text-white transition-all cursor-pointer"
                >
                  <FiCircle className="w-7 h-7" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Crop Disease Diagnosis</h1>
          <p className="text-slate-500 text-sm">Upload or photograph a leaf to run instant neural network health analysis</p>
        </div>
        <Link
          to={ROUTES.FARMER_DIAGNOSIS_HISTORY}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <FiClock size={13} /> View Scan History <FiChevronRight size={13} />
        </Link>
      </div>

      {/* ── Diagnostic Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Scanner */}
        <div className="card space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="section-title">Diagnostic Scanner</h2>
            {previewUrl && !scanning && (
              <button onClick={triggerReset} title="Clear image" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
            {!previewUrl ? (
              <div className="flex-1 min-h-[220px] flex flex-col gap-3">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500/50 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer group">
                  <FiUpload className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-all" />
                  <p className="text-sm font-semibold text-slate-700 mt-3">Upload from gallery</p>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={openCamera}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  <FiCamera className="w-4 h-4" />
                  Take Photo with Camera
                </button>
              </div>
            ) : (
              <div className="relative flex-1 min-h-[220px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                <img src={previewUrl} alt="Crop preview" className="max-h-[300px] w-full object-contain" />
                {scanning && <div className="absolute inset-0 bg-emerald-500/20 animate-pulse pointer-events-none" />}
              </div>
            )}

            {scanning && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-emerald-700 font-bold uppercase tracking-wider">
                  <span>
                    {scanStep === 1 && 'Uploading image to server...'}
                    {scanStep === 2 && 'Forwarding to AI model...'}
                    {scanStep === 3 && 'Running classification...'}
                  </span>
                  <span>{Math.round(scanStep * 33.3)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${scanStep * 33.3}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!result && !scanning && (
              <button type="submit" disabled={!selectedFile} className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                <FiSearch className="w-4 h-4" /> Analyze Crop Health
              </button>
            )}
          </form>
        </div>

        {/* Right: AI Output */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3">Diagnosis Output</h2>

          {scanning ? (
            <div className="min-h-[250px] flex flex-col items-center justify-center gap-3 text-center">
              <FiCpu className="w-10 h-10 text-emerald-600 animate-pulse" />
              <p className="text-sm font-semibold text-emerald-700">Classifying patterns...</p>
              <p className="text-xs text-slate-500 max-w-xs">AI is comparing color histograms and leaf lesions against 27 disease classes</p>
            </div>
          ) : result ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Model: {result.modelUsed}</span>
                  {getSeverityBadge(result.severity)}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Detected Disease / Condition</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-1">{result.disease}</p>
                  {result.crop && (
                    <p className="text-xs text-slate-500 mt-1">Crop: <span className="font-semibold">{result.crop}</span></p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Confidence Score</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{(result.confidence * 100).toFixed(0)}% Match</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-200 flex items-center justify-center shrink-0">
                    <FiInfo className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <p className="text-sm font-bold text-emerald-800 tracking-tight">
                    {result.severity === 'Unknown' ? 'Recommended Action' : 'Agronomic Treatment Advisory'}
                  </p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed pl-8">{result.treatment}</p>
              </div>

              {result.prevention && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-200 flex items-center justify-center shrink-0">
                      <FiInfo className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    <p className="text-sm font-bold text-blue-800 tracking-tight">
                      {result.severity === 'Unknown' ? 'Photo Tips' : 'Prevention'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pl-8">{result.prevention}</p>
                </div>
              )}

              <button onClick={triggerReset} className="w-full btn-secondary py-2.5 text-xs">
                Scan Another Leaf
              </button>
            </div>
          ) : (
            <div className="min-h-[250px] flex flex-col items-center justify-center gap-2 text-center text-slate-400">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/15 blur-xl scale-150 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <FiZoomIn className="w-7 h-7 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm font-semibold mt-3 text-slate-600">Ready for analysis</p>
              <p className="text-xs max-w-xs leading-relaxed">Upload a photo or use the camera to photograph the diseased leaf.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
