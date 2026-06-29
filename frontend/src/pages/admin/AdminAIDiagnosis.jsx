import { FiCpu, FiUpload, FiClock, FiImage, FiAlertTriangle } from 'react-icons/fi'

export default function AdminAIDiagnosis() {
  return (
    <div className="page-container space-y-7">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Diagnosis</h1>
        <p className="text-slate-400 text-sm mt-0.5">Crop disease detection results from farmer field scans</p>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            <FiCpu size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-300">—</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Total Diagnoses</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
            <FiClock size={18} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-300">—</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Today</p>
          </div>
        </div>
      </div>

      {/* ── Main Placeholder ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Top banner */}
        <div className="bg-emerald-600 px-5 py-4 sm:px-6 sm:py-5 flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
            <FiCpu size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm sm:text-base">AI Crop Disease Detection</p>
            <p className="text-emerald-100 text-xs mt-0.5 hidden sm:block">Powered by computer vision — identify diseases from leaf images</p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Not Active</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-300">
              <FiImage size={36} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
              <FiAlertTriangle size={11} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-bold text-slate-800">Model Not Yet Integrated</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The crop disease AI model is still in development. Once the model is deployed at{' '}
              <span className="font-mono text-emerald-600 text-xs bg-emerald-50 px-1.5 py-0.5 rounded">localhost:8000</span>,
              {' '}farmer scan results will appear here automatically.
            </p>
          </div>

          {/* What it will do */}
          <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">What this page will show</p>
            {[
              { icon: FiUpload, text: 'All crop images submitted by farmers for diagnosis' },
              { icon: FiCpu,    text: 'Disease detection results with confidence scores'   },
              { icon: FiClock,  text: 'Diagnosis history and timestamps per farmer'        },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <Icon size={13} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Awaiting Model Integration</span>
          </div>
        </div>
      </div>

    </div>
  )
}
