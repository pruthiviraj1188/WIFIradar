import React, { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const HOURLY_DATA = {
  '24H': [
    { label: '00:00', walk: 2, sit: 4, stand: 1 },
    { label: '04:00', walk: 1, sit: 2, stand: 1 },
    { label: '08:00', walk: 14, sit: 8, stand: 9 },
    { label: '12:00', walk: 18, sit: 12, stand: 7 },
    { label: '16:00', walk: 15, sit: 14, stand: 6 },
    { label: '20:00', walk: 9, sit: 16, stand: 5 },
  ],
  '7D': [
    { label: 'Mon', walk: 54, sit: 68, stand: 32 },
    { label: 'Tue', walk: 61, sit: 62, stand: 29 },
    { label: 'Wed', walk: 48, sit: 74, stand: 35 },
    { label: 'Thu', walk: 59, sit: 65, stand: 30 },
    { label: 'Fri', walk: 63, sit: 60, stand: 34 },
    { label: 'Sat', walk: 52, sit: 71, stand: 28 },
    { label: 'Sun', walk: 49, sit: 76, stand: 26 },
  ],
  '30D': [
    { label: 'Wk 1', walk: 372, sit: 440, stand: 210 },
    { label: 'Wk 2', walk: 398, sit: 418, stand: 224 },
    { label: 'Wk 3', walk: 360, sit: 462, stand: 198 },
    { label: 'Wk 4', walk: 384, sit: 435, stand: 216 },
  ],
}

const RESPIRATORY_TREND = [
  { label: '00:00', bpm: 13.8 },
  { label: '04:00', bpm: 13.4 },
  { label: '08:00', bpm: 16.2 },
  { label: '12:00', bpm: 17.1 },
  { label: '16:00', bpm: 16.4 },
  { label: '20:00', bpm: 14.9 },
]

const MODEL_CLASS_DISTRIBUTION = [
  { label: 'fall',  count: 5150, pct: 51.5, color: '#EF4444' },
  { label: 'Jump',  count: 1998, pct: 20.0, color: '#F59E0B' },
  { label: 'sit',   count: 960,  pct: 9.6,  color: '#38BDF8' },
  { label: 'stand', count: 947,  pct: 9.5,  color: '#06B6D4' },
  { label: 'walk',  count: 945,  pct: 9.4,  color: '#10B981' },
]

function Analytics() {
  const [range, setRange] = useState('24H')

  const tooltipStyle = {
    backgroundColor: 'rgba(15,23,42,0.95)',
    border: '1px solid rgba(6,182,212,0.25)',
    borderRadius: '8px',
    color: '#F8FAFC',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400">
              Longitudinal Telemetry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Activity &amp; Model Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Mobility patterns, respiratory stability, and Random Forest classifier diagnostics.
          </p>
        </div>
        <div className="inline-flex bg-[#1A2744]/75 border border-white/10 rounded-xl p-1 self-start sm:self-auto">
          {['24H', '7D', '30D'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all ${
                range === r
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Activity Breakdown */}
        <div className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Activity Transitions ({range})</h2>
              <p className="text-xs text-slate-400">Walk, sit, and stand event volume</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-cyan-400 rounded-sm" /> Walk</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-sky-400 rounded-sm" /> Sit</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-500 rounded-sm" /> Stand</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA[range]} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(30,41,59,0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="walk" name="Walk" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sit"  name="Sit"  fill="#38BDF8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="stand" name="Stand" fill="#475569" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Respiratory Baseline */}
        <div className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Circadian Respiration Curve</h2>
              <p className="text-xs text-slate-400">Mean breaths per minute (24h profile)</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Avg 15.3 BPM
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RESPIRATORY_TREND} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(30,41,59,0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <YAxis domain={[10, 22]} tick={{ fontSize: 11, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="bpm" name="Breathing (BPM)" stroke="#10B981" strokeWidth={2} fill="url(#respGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Classifier Diagnostics */}
      <div className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-glass">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Baseline Classifier Diagnostics (Random Forest)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Metrics from <code className="text-[11px] text-cyan-400">ai/saved_models/baseline_rf_metrics.json</code> · 38 CSI features · 10,000 samples
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300">
            Overfitting Detected (Δ 42.4%)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="grid grid-cols-3 gap-3 lg:col-span-1">
            {[
              { label: 'Train Acc', val: '97.8%', color: 'text-cyan-300' },
              { label: 'Val Acc',   val: '56.3%', color: 'text-amber-300' },
              { label: 'Test Acc',  val: '55.4%', color: 'text-amber-300' },
            ].map((m) => (
              <div key={m.label} className="bg-[#1A2744]/75 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-mono uppercase text-slate-400">{m.label}</div>
                <div className={`mt-1.5 text-lg font-semibold font-mono tabular-nums ${m.color}`}>
                  {m.val}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Training Class Balance (5 Classes)
            </div>
            {MODEL_CLASS_DISTRIBUTION.map((cls) => (
              <div key={cls.label} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-14 text-slate-300 capitalize">{cls.label}</span>
                <div className="flex-1 h-2 bg-[#243352]/70 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cls.pct}%`, backgroundColor: cls.color, opacity: 0.8 }}
                  />
                </div>
                <span className="w-28 text-right text-slate-400 tabular-nums">
                  {cls.count.toLocaleString()} ({cls.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
