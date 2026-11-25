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
  { label: '00:00', bpm: 13.8, snr: 24 },
  { label: '04:00', bpm: 13.4, snr: 26 },
  { label: '08:00', bpm: 16.2, snr: 22 },
  { label: '12:00', bpm: 17.1, snr: 21 },
  { label: '16:00', bpm: 16.4, snr: 23 },
  { label: '20:00', bpm: 14.9, snr: 25 },
]

// Grounded directly in ai/saved_models/baseline_rf_metrics.json
const MODEL_CLASS_DISTRIBUTION = [
  { label: 'fall', count: 5150, pct: 51.5 },
  { label: 'Jump', count: 1998, pct: 20.0 },
  { label: 'sit', count: 960, pct: 9.6 },
  { label: 'stand', count: 947, pct: 9.5 },
  { label: 'walk', count: 945, pct: 9.4 },
]

function Analytics() {
  const [range, setRange] = useState('24H')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-hairline">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Longitudinal Telemetry
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">
            Activity & Model Analytics
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Mobility patterns, respiratory stability, and Random Forest classifier diagnostics.
          </p>
        </div>

        <div className="inline-flex bg-surface border border-hairline rounded p-0.5 self-start sm:self-auto">
          {['24H', '7D', '30D'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                range === r ? 'bg-ink text-paper font-medium' : 'text-ink-secondary hover:text-ink'
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
        <div className="bg-surface border border-hairline rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Activity Transitions ({range})</h2>
              <p className="text-xs text-ink-secondary">Walk, sit, and stand event volume</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-ink inline-block rounded-sm" /> Walk
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#85827A] inline-block rounded-sm" /> Sit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#C7C3B8] inline-block rounded-sm" /> Stand
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA[range]} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#ECE9E1" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2DFD7' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2DFD7',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'IBM Plex Mono',
                  }}
                />
                <Bar dataKey="walk" name="Walk" fill="#181816" radius={[2, 2, 0, 0]} />
                <Bar dataKey="sit" name="Sit" fill="#85827A" radius={[2, 2, 0, 0]} />
                <Bar dataKey="stand" name="Stand" fill="#C7C3B8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Respiratory Baseline */}
        <div className="bg-surface border border-hairline rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Circadian Respiration Curve</h2>
              <p className="text-xs text-ink-secondary">Mean breaths per minute (24h profile)</p>
            </div>
            <span className="text-[11px] font-mono text-signal-ok bg-signal-ok-bg px-2 py-0.5 rounded">
              Avg 15.3 BPM
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RESPIRATORY_TREND} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#ECE9E1" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2DFD7' }}
                />
                <YAxis
                  domain={[10, 22]}
                  tick={{ fontSize: 11, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2DFD7',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'IBM Plex Mono',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bpm"
                  name="Breathing (BPM)"
                  stroke="#1E6B47"
                  strokeWidth={2}
                  fill="#ECF6F0"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Baseline Classifier Diagnostics (from ai/saved_models/baseline_rf_metrics.json) */}
      <div className="bg-surface border border-hairline rounded-md p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-hairline">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Baseline Classifier Diagnostics (Random Forest)
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Metrics from <code className="text-[11px]">ai/saved_models/baseline_rf_metrics.json</code> · 38 CSI features · 10,000 samples
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-signal-warn-bg text-signal-warn">
            Overfitting Detected (Δ 42.4%)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="grid grid-cols-3 gap-3 lg:col-span-1">
            {[
              { label: 'Train Acc', val: '97.8%' },
              { label: 'Val Acc', val: '56.3%' },
              { label: 'Test Acc', val: '55.4%' },
            ].map((m) => (
              <div key={m.label} className="bg-paper border border-hairline rounded p-3">
                <div className="text-[10px] font-mono uppercase text-ink-muted">{m.label}</div>
                <div className="mt-1 text-lg font-semibold font-mono tabular-nums text-ink">
                  {m.val}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Training Class Balance (5 Classes)
            </div>
            {MODEL_CLASS_DISTRIBUTION.map((cls) => (
              <div key={cls.label} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-14 text-ink capitalize">{cls.label}</span>
                <div className="flex-1 h-2 bg-subtle rounded overflow-hidden">
                  <div
                    className={`h-full ${cls.label === 'fall' ? 'bg-ink' : 'bg-ink-muted'}`}
                    style={{ width: `${cls.pct}%` }}
                  />
                </div>
                <span className="w-24 text-right text-ink-secondary tabular-nums">
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
