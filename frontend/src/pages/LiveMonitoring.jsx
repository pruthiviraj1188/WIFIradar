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
  const csiSeries = (currentFrame.csi_data || []).map((val, idx) => ({
    sc: idx + 1,
    amp: val,
  }))

  const meanAmplitude =
    csiSeries.length > 0
      ? (csiSeries.reduce((s, d) => s + Math.abs(d.amp), 0) / csiSeries.length).toFixed(3)
      : '0.000'

  const peakAmplitude =
    csiSeries.length > 0
      ? Math.max(...csiSeries.map((d) => Math.abs(d.amp))).toFixed(3)
      : '0.000'

  const isFall = String(currentFrame.activity).toLowerCase() === 'fall'

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-hairline">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Real-Time Telemetry Console
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">
            Live CSI & Spatial Monitor
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Subcarrier amplitude envelope, respiratory rate extraction, and 3D posture tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="bg-surface border border-hairline rounded px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:border-ink"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.deviceName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="px-3.5 py-2 text-xs font-medium bg-surface border border-hairline text-ink rounded hover:bg-subtle transition-colors"
          >
            {isPaused ? 'Resume Stream' : 'Pause Stream'}
          </button>

          <button
            type="button"
            onClick={triggerSimulatedFall}
            className="px-3.5 py-2 text-xs font-medium bg-signal-alert-bg border border-signal-alert/40 text-signal-alert rounded hover:bg-signal-alert hover:text-white transition-colors"
          >
            Trigger Test Fall
          </button>
        </div>
      </div>

      {/* Live Telemetry Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Detected State',
            value: String(currentFrame.activity).toUpperCase(),
            highlight: isFall ? 'text-signal-alert' : 'text-ink',
          },
          {
            label: 'Confidence',
            value: `${Math.round(currentFrame.confidence * 100)}%`,
          },
          {
            label: 'RSSI Level',
            value: `${currentFrame.rssi} dBm`,
          },
          {
            label: 'Mean |CSI|',
            value: meanAmplitude,
          },
          {
            label: 'Peak |CSI|',
            value: peakAmplitude,
          },
          {
            label: 'Frame Index',
            value: `#${currentFrame.frame}`,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="bg-surface border border-hairline rounded-md px-3.5 py-3"
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              {metric.label}
            </div>
            <div
              className={`mt-1 text-base font-semibold font-mono tabular-nums ${
                metric.highlight || 'text-ink'
              }`}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Split: 3D Spatial Room + 52-Subcarrier Spectrum */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 3D Room Canvas */}
        <div className="bg-surface border border-hairline rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">3D Spatial Inference</h2>
              <p className="text-xs text-ink-secondary">
                TX Router → Subject Reflection → {activeRoom.deviceName} RX
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-subtle text-ink-secondary uppercase">
              {connectionMode}
            </span>
          </div>
          <Room3DVisualization
            activity={currentFrame.activity}
            confidence={currentFrame.confidence}
            rssi={currentFrame.rssi}
            roomName={activeRoom.name}
          />
        </div>

        {/* 52-Subcarrier Waveform */}
        <div className="bg-surface border border-hairline rounded-md p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                52-Subcarrier Amplitude Spectrum
              </h2>
              <p className="text-xs text-ink-secondary">
                Instantaneous CSI magnitude across 20 MHz OFDM channel
              </p>
            </div>
            <span className="text-[11px] font-mono text-ink-muted tabular-nums">
              10 Hz nominal
            </span>
          </div>
          <div className="flex-1 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={csiSeries} margin={{ top: 10, right: 12, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="#ECE9E1" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="sc"
                  tick={{ fontSize: 10, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2DFD7' }}
                  interval={7}
                />
                <YAxis
                  domain={[-1.2, 1.2]}
                  tick={{ fontSize: 10, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
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
                  dataKey="amp"
                  name="CSI Amp"
                  stroke={isFall ? '#B42318' : '#181816'}
                  strokeWidth={1.8}
                  fill={isFall ? '#FCECEB' : '#EFEDE7'}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Respiratory Rate Strip */}
      <div className="bg-surface border border-hairline rounded-md p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Respiratory Rate & Motion Variance
            </h2>
            <p className="text-xs text-ink-secondary">
              Bandpass-filtered chest micro-movement estimate (0.1–0.5 Hz)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-ink">
              <span className="w-2.5 h-0.5 bg-ink inline-block" />
              Breathing (BPM)
            </span>
            <span className="text-signal-ok font-medium">Normal Range: 12–20 BPM</span>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={breathingHistory} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#ECE9E1" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
                tickLine={false}
                axisLine={{ stroke: '#E2DFD7' }}
                interval={4}
              />
              <YAxis
                domain={[10, 26]}
                tick={{ fontSize: 10, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
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
              <Line
                type="monotone"
                dataKey="bpm"
                name="Respiration (BPM)"
                stroke="#1E6B47"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default LiveMonitoring
