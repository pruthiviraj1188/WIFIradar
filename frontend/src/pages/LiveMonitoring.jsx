import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import Room3DVisualization from '../components/Room3D'
import { useTelemetry } from '../context/TelemetryContext'

function LiveMonitoring() {
  const {
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    connectionMode,
    isPaused,
    setIsPaused,
    currentFrame,
    breathingHistory,
    triggerSimulatedFall,
  } = useTelemetry()

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
  const csiSeries = (currentFrame.csi_data || []).map((val, idx) => ({ sc: idx + 1, amp: val }))

  const meanAmplitude =
    csiSeries.length > 0
      ? (csiSeries.reduce((s, d) => s + Math.abs(d.amp), 0) / csiSeries.length).toFixed(3)
      : '0.000'

  const peakAmplitude =
    csiSeries.length > 0
      ? Math.max(...csiSeries.map((d) => Math.abs(d.amp))).toFixed(3)
      : '0.000'

  const isFall = String(currentFrame.activity).toLowerCase() === 'fall'

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
              Real-Time Telemetry Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Live CSI &amp; Spatial Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Subcarrier amplitude envelope, respiratory extraction, and 3D posture tracking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="bg-[#1A2744]/90 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} · {r.deviceName}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1E2E4A]/80 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            type="button"
            onClick={triggerSimulatedFall}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white transition-all"
          >
            Trigger Test Fall
          </button>
        </div>
      </div>

      {/* Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Detected State', value: String(currentFrame.activity).toUpperCase(), accent: isFall ? 'text-red-400 text-glow-crimson' : 'text-cyan-300 text-glow-cyan' },
          { label: 'Confidence', value: `${Math.round(currentFrame.confidence * 100)}%` },
          { label: 'RSSI Level', value: `${currentFrame.rssi} dBm` },
          { label: 'Mean |CSI|', value: meanAmplitude },
          { label: 'Peak |CSI|', value: peakAmplitude },
          { label: 'Frame Index', value: `#${currentFrame.frame}` },
        ].map((metric) => (
          <div key={metric.label} className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-3 card-elevated">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {metric.label}
            </div>
            <div className={`mt-1.5 text-base font-semibold font-mono tabular-nums ${metric.accent || 'text-slate-100'}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3D Room + CSI Spectrum */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-glass">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
            <div>
              <h2 className="text-sm font-semibold text-white">3D Spatial Inference</h2>
              <p className="text-xs text-slate-400">TX Router → Subject → {activeRoom.deviceName} RX</p>
            </div>
            <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg uppercase font-medium ${
              connectionMode === 'live' ? 'bg-emerald-500/15 text-emerald-300' :
              connectionMode === 'simulated' ? 'bg-cyan-500/15 text-cyan-300' :
              'bg-slate-700/50 text-slate-400'
            }`}>
              {connectionMode}
            </span>
          </div>
          <Room3DVisualization
            activity={currentFrame.activity}
            confidence={currentFrame.confidence}
            rssi={currentFrame.rssi}
            breathingBpm={breathingHistory[breathingHistory.length - 1]?.bpm ?? 15.6}
            roomName={activeRoom.name}
          />
        </div>

        <div className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">52-Subcarrier Amplitude Spectrum</h2>
              <p className="text-xs text-slate-400">Instantaneous CSI magnitude · 20 MHz OFDM</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">10 Hz nominal</span>
          </div>
          <div className="flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={csiSeries} margin={{ top: 10, right: 12, left: -18, bottom: 4 }}>
                <defs>
                  <linearGradient id="csiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isFall ? '#EF4444' : '#06B6D4'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isFall ? '#EF4444' : '#06B6D4'} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(30,41,59,0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sc" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={7} />
                <YAxis domain={[-1.2, 1.2]} tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="amp" name="CSI Amp" stroke={isFall ? '#EF4444' : '#06B6D4'} strokeWidth={1.8} fill="url(#csiGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Respiratory Rate Chart */}
      <div className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-glass">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Respiratory Rate &amp; Motion Variance</h2>
            <p className="text-xs text-slate-400">Bandpass-filtered chest micro-movement (0.1–0.5 Hz)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />
              Breathing (BPM)
            </span>
            <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Normal: 12–20 BPM
            </span>
          </div>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={breathingHistory} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="breathGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(30,41,59,0.6)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis domain={[10, 26]} tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="bpm" name="Respiration (BPM)" stroke="url(#breathGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default LiveMonitoring
