import { useState } from 'react'
import { FiCamera, FiSearch, FiCpu, FiInfo, FiZoomIn, FiFile } from 'react-icons/fi'
import { mockDiagnoseImage } from '../../services/mockData'

export default function FarmerDiagnosis() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0) // 0 to 3 for loading simulator
  const [result, setResult] = useState(null)
  
  // Previous diagnosis logs
  const [history, setHistory] = useState([
    { id: 1, diagnosis: 'Healthy Crop', confidence: 0.95, severity: 'None', treatment: 'No action needed. Continue regular monitoring.', analyzedAt: '2026-06-01T10:00:00Z', modelUsed: 'AgriCNN v1.2' },
    { id: 2, diagnosis: 'Nitrogen Deficiency', confidence: 0.78, severity: 'Medium', treatment: 'Apply nitrogen-rich fertilizer (urea). Ensure soil pH is 6–7.', analyzedAt: '2026-05-20T14:30:00Z', modelUsed: 'AgriCNN v1.2' }
  ])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
    }
  }

  const runScanningSimulation = async (file) => {
    setScanning(true)
    setScanStep(1)
    
    // Simulate steps in CNN pipeline
    await new Promise(r => setTimeout(r, 600))
    setScanStep(2)
    
    await new Promise(r => setTimeout(r, 600))
    setScanStep(3)
    
    await new Promise(r => setTimeout(r, 600))

    try {
      const scanResult = await mockDiagnoseImage(file)
      setResult(scanResult)
      
      // Prepend to history log
      setHistory(prev => [
        {
          id: Date.now(),
          ...scanResult
        },
        ...prev
      ])
    } catch (err) {
      console.error('Diagnosis failed:', err)
    } finally {
      setScanning(false)
      setScanStep(0)
    }
  }

  const handleUploadSubmit = (e) => {
    e.preventDefault()
    if (!selectedFile) return
    runScanningSimulation(selectedFile)
  }

  const triggerReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
  }

  const getSeverityBadge = (sev) => {
    if (sev === 'High') return <span className="badge-red">High Risk</span>
    if (sev === 'Medium') return <span className="badge-amber">Medium Risk</span>
    if (sev === 'Low') return <span className="badge-blue">Low Risk</span>
    return <span className="badge-green">None (Healthy)</span>
  }

  return (
    <div className="page-container max-w-6xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Crop Disease Diagnosis</h1>
        <p className="text-slate-500 text-sm">Upload leaf photographs to run instant neural network health analysis</p>
      </div>

      {/* ── Diagnostic Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Image Dropzone Form */}
        <div className="card space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="section-title">Diagnostic Scanner</h2>
            {previewUrl && !scanning && (
              <button 
                onClick={triggerReset}
                className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors cursor-pointer"
              >
                Clear Image
              </button>
            )}
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
            {!previewUrl ? (
              // Empty state dropzone
              <label className="flex-1 min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500/50 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer group">
                <FiCamera className="w-12 h-12 text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all" />
                <p className="text-sm font-semibold text-slate-700 mt-4">Select leaf photo or take a picture</p>
                <p className="text-xs text-slate-400 mt-1">Supports JPEG, PNG up to 10MB</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
            ) : (
              // Preview & Upload State
              <div className="relative flex-1 min-h-[220px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Crop preview" 
                  className="max-h-[300px] w-full object-contain" 
                />
                
                {/* Visual scanning green overlay line */}
                {scanning && (
                  <div className="absolute inset-0 bg-emerald-500/20 h-10 w-full animate-pulse-slow border-y border-emerald-500/30 pointer-events-none"
                       style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }} />
                )}
              </div>
            )}

            {/* Scanning details indicator */}
            {scanning && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-pulse">
                <div className="flex justify-between text-xs text-emerald-700 font-bold uppercase tracking-wider">
                  <span>
                    {scanStep === 1 && 'Extracting texture features...'}
                    {scanStep === 2 && 'Matching pathological contours...'}
                    {scanStep === 3 && 'Running classification model...'}
                  </span>
                  <span>{Math.round(scanStep * 33.3)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${scanStep * 33.3}%` }}
                  />
                </div>
              </div>
            )}

            {!result && !scanning && (
              <button
                type="submit"
                disabled={!selectedFile}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSearch className="w-4 h-4" /> Analyze Crop Health
              </button>
            )}
          </form>
        </div>

        {/* Right Column: AI Output Results */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-slate-100 pb-3">Diagnosis Output</h2>
          
          {scanning ? (
            <div className="min-h-[250px] flex flex-col items-center justify-center gap-3 text-center">
              <FiCpu className="w-10 h-10 text-emerald-600 animate-pulse" />
              <p className="text-sm font-semibold text-emerald-700">Classifying patterns...</p>
              <p className="text-xs text-slate-500 max-w-xs">AI is comparing color histograms and leaf lesions against reference datasets</p>
            </div>
          ) : result ? (
            // Result Cards
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Model: {result.modelUsed}</span>
                  {getSeverityBadge(result.severity)}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Detected Disease / Condition</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-1">{result.diagnosis}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Confidence Score</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{(result.confidence * 100).toFixed(0)}% Match</p>
                </div>
              </div>

              {/* Treatment Advisory */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
                  <FiInfo className="w-4 h-4" /> Agronomic Treatment Advisory
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {result.treatment}
                </p>
              </div>

              <button
                onClick={triggerReset}
                className="w-full btn-secondary py-2.5 text-xs"
              >
                Scan Another Leaf
              </button>
            </div>
          ) : (
            // Empty placeholder state
            <div className="min-h-[250px] flex flex-col items-center justify-center gap-2 text-center text-slate-400">
              <FiZoomIn className="w-12 h-12 text-slate-300" />
              <p className="text-sm font-semibold mt-3 text-slate-600">Ready for analysis</p>
              <p className="text-xs max-w-xs leading-relaxed">Select a leaf photograph on the left and submit it to the deep-learning classifier.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Diagnosis Logs History ── */}
      <div className="card space-y-4">
        <h2 className="section-title border-b border-slate-100 pb-3">Crop Health Scanning Log</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-2">Analysis Date</th>
                <th className="py-3 px-2">Crop Image</th>
                <th className="py-3 px-2">AI Diagnosis</th>
                <th className="py-3 px-2">Confidence</th>
                <th className="py-3 px-2">Severity</th>
                <th className="py-3 px-2">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 text-slate-500 font-mono text-xs">
                    {new Date(log.analyzedAt).toLocaleDateString()} {new Date(log.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-500 text-xs">
                    <span className="inline-flex items-center gap-1"><FiFile className="w-3 h-3 flex-shrink-0" />{log.fileName || 'analyzed_sample.jpg'}</span>
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-800">{log.diagnosis}</td>
                  <td className="py-3 px-2 font-bold font-mono text-emerald-700">
                    {(log.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-2">
                    {getSeverityBadge(log.severity)}
                  </td>
                  <td className="py-3 px-2 text-slate-500 font-mono text-xs">{log.modelUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
