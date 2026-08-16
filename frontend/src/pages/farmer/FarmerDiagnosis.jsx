import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FiCamera, FiUpload, FiSearch, FiCpu, FiZoomIn,
  FiAlertCircle, FiX, FiCircle, FiClock, FiChevronRight,
  FiCheckCircle, FiAlertTriangle, FiShield, FiRefreshCw
} from 'react-icons/fi'
import api from '../../services/api'
import { ROUTES } from '../../utils/constants'

const getSeverityBadge = (sev) => {
  if (sev === 'High')    return <span className="badge-red">High Risk</span>
  if (sev === 'Medium')  return <span className="badge-amber">Medium Risk</span>
  if (sev === 'Low')     return <span className="badge-blue">Low Risk</span>
  if (sev === 'Unknown') return <span className="badge-gray">Unrecognized</span>
  return <span className="badge-green">Healthy Crop</span>
}

const getSeverityColor = (sev) => {
  if (sev === 'High')    return { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-500',     title: 'text-red-800'    }
  if (sev === 'Medium')  return { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-500',   title: 'text-amber-800'  }
  if (sev === 'Unknown') return { bg: 'bg-slate-50',   border: 'border-slate-200',   icon: 'text-slate-400',   title: 'text-slate-700'  }
  if (sev === 'None')    return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', title: 'text-emerald-800'}
  return                        { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', title: 'text-emerald-800'}
}

export default function FarmerDiagnosis() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl,   setPreviewUrl]   = useState(null)
  const [scanning,     setScanning]     = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [stepLabel,    setStepLabel]    = useState('')
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState(null)
  const progressRef = useRef(null)

  // Camera state
  const [cameraOpen,  setCameraOpen]  = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  // Animated progress bar while scanning
  useEffect(() => {
    if (scanning) {
      setProgress(0)
      let pct = 0
      const steps = [
        { label: 'Uploading image to server...',   target: 20, ms: 600  },
        { label: 'Forwarding to AI model...',      target: 45, ms: 800  },
        { label: 'Running CNN classification...', target: 70, ms: 1000 },
        { label: 'Generating AI advisory...',      target: 90, ms: 2000 },
      ]
      let i = 0
      const runStep = () => {
        if (i >= steps.length) return
        const { label, target, ms } = steps[i]
        setStepLabel(label)
        const inc = (target - pct) / (ms / 80)
        const interval = setInterval(() => {
          pct = Math.min(pct + inc, target)
          setProgress(Math.round(pct))
          if (pct >= target) {
            clearInterval(interval)
            i++
            runStep()
          }
        }, 80)
        progressRef.current = interval
      }
      runStep()
    } else {
      if (progressRef.current) clearInterval(progressRef.current)
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [scanning])

  // Camera
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

  // File upload
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }

  // Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) return
    setScanning(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      const { data } = await api.post('/diagnosis', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      })
      setProgress(100)
      setStepLabel('Natiijooyinka la heyay!')
      await new Promise(r => setTimeout(r, 400))
      setResult(data.data)
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message
      if (err.code === 'ERR_NETWORK') {
        setError('Connection failed. Make sure the backend and AI service are both running.')
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.')
      } else {
        setError(msg || 'Diagnosis failed. Please try again.')
      }
    } finally {
      setScanning(false)
    }
  }

  const triggerReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setProgress(0)
    setStepLabel('')
  }

  const colors = result ? getSeverityColor(result.severity) : null

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">

      {/* ── Camera Modal ── */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FiCamera className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-800">Sawir Caleen ah Qaado</span>
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Crop Disease Diagnosis</h1>
          <p className="text-slate-500 text-sm">Upload or photograph a leaf to run instant neural network health analysis</p>
        </div>
        <Link
          to={ROUTES.FARMER_DIAGNOSIS_HISTORY}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-500 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <FiClock size={13} /> View Scan History <FiChevronRight size={13} />
        </Link>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Scanner ── */}
        <div className="card flex flex-col gap-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="section-title">Diagnostic Scanner</h2>
            {previewUrl && !scanning && (
              <button onClick={triggerReset} title="Clear image" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tip — only show when no image selected */}
          {!previewUrl && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <span className="shrink-0 text-base mt-0.5">⚠️</span>
              <span>
                <strong>Talo Muhiim ah:</strong> HAL CALEEN oo keli ah sawir — ha sawirin geed dhan. Kaamirada u soo dhowee (10–20 cm) oo caleenta si cad u muuji.
              </span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">

            {/* Image area */}
            {!previewUrl ? (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500/50 rounded-2xl p-8 bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer group min-h-[220px]">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FiUpload className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Upload from gallery</p>
                  <p className="text-xs text-slate-400 mt-1 sm:hidden">Your phone will also let you take a new photo from here</p>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </label>

                {/* Camera capture — hidden on mobile, where the gallery picker above already offers the device camera */}
                <div className="hidden sm:flex sm:flex-col sm:gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={openCamera}
                    className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-2xl transition-all cursor-pointer"
                  >
                    <FiCamera className="w-4 h-4" />
                    Take Photo with Camera
                  </button>
                </div>
              </div>
            ) : (
              /* Preview image — fills the card nicely */
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50" style={{ aspectRatio: '4/3' }}>
                <img src={previewUrl} alt="Crop preview" className="w-full h-full object-cover" />
                {scanning && (
                  <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-emerald-900 bg-white/80 px-3 py-1 rounded-lg">{stepLabel}</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            {scanning && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="font-medium">{stepLabel}</span>
                  <span className="font-bold text-emerald-700">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            {previewUrl && !scanning && !result && (
              <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold">
                <FiSearch className="w-4 h-4" /> Analyze Crop Health
              </button>
            )}
            {previewUrl && !scanning && result && (
              <button type="button" onClick={triggerReset} className="btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2">
                <FiRefreshCw className="w-4 h-4" /> Scan Another Leaf
              </button>
            )}
          </form>
        </div>

        {/* ── RIGHT: Result ── */}
        <div className="card flex flex-col gap-4">
          <h2 className="section-title border-b border-slate-100 pb-3">Diagnosis Output</h2>

          {scanning ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl scale-150 animate-pulse" />
                <FiCpu className="relative w-12 h-12 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">AI model is analyzing...</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">{stepLabel}</p>
              </div>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">Please wait — this may take 10–30 seconds</p>
            </div>

          ) : result ? (
            <div className="space-y-4 animate-fade-in">

              {/* Disease / Condition Card */}
              <div className={`p-4 ${colors.bg} border ${colors.border} rounded-2xl`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Detected Condition</p>
                  {getSeverityBadge(result.severity)}
                </div>
                <p className="text-xl font-extrabold text-slate-800 leading-snug">{result.disease}</p>
                {result.crop && result.crop !== 'Unknown' && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Crop: <span className="font-semibold text-slate-700">{result.crop}</span>
                  </p>
                )}
              </div>

              {/* Treatment — only render when we have real advice */}
              {result.treatment ? (
                <div className={`p-4 ${colors.bg} border ${colors.border} rounded-2xl`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.severity === 'None'
                      ? <FiCheckCircle className={`w-4 h-4 shrink-0 ${colors.icon}`} />
                      : result.severity === 'Unknown'
                      ? <FiAlertCircle className={`w-4 h-4 shrink-0 ${colors.icon}`} />
                      : <FiAlertTriangle className={`w-4 h-4 shrink-0 ${colors.icon}`} />
                    }
                    <p className={`text-xs font-bold uppercase tracking-wider ${colors.title}`}>
                      {result.severity === 'Unknown' ? 'Xaaladda Sawirka'
                       : result.severity === 'None'  ? 'Xaaladda Geedka'
                       : 'Daaweynta Cudurka'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.treatment}</p>
                </div>
              ) : (
                /* When Gemini advisory is unavailable — show quiet note, not in a result card */
                result.severity !== 'Unknown' && result.severity !== 'None' && (
                  <p className="text-xs text-slate-400 text-center py-2">
                    AI advisory is temporarily unavailable for this diagnosis.
                  </p>
                )
              )}

              {/* Prevention — only render when we have real advice */}
              {result.prevention && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FiShield className="w-4 h-4 shrink-0 text-blue-500" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      {result.severity === 'Unknown' ? 'Sida Sawir Fiican Loo Qaado'
                       : result.severity === 'None'  ? 'Xaaladda Wanaagsan u Sii Wad'
                       : 'Ka Hortaga Cudurka'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.prevention}</p>
                </div>
              )}
            </div>


          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center text-slate-400">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/15 blur-xl scale-150 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <FiZoomIn className="w-7 h-7 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm font-semibold mt-1 text-slate-600">Ready for analysis</p>
              <p className="text-xs max-w-xs leading-relaxed">Upload a photo or use the camera to photograph the diseased leaf.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
