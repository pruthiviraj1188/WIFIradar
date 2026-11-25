import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts'
import { useTelemetry } from '../context/TelemetryContext'
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  RadioNodeIcon,
  WaveformIcon,
} from '../components/Icons'

function formatRelativeTime(iso) {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

function Dashboard() {
  const navigate = useNavigate()
  const {
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    currentFrame,
    breathingHistory,
    activities,
    incidents,
    triggerSimulatedFall,
  } = useTelemetry()

  const activeDevices = rooms.filter((r) => r.status === 'online').length
  const pendingIncidents = incidents.filter((i) => i.status === 'pending').length
  const latestBpm = breathingHistory[breathingHistory.length - 1]?.bpm ?? 15.6
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0]

  const sparkData = (currentFrame.csi_data || []).map((amp, idx) => ({
    subcarrier: idx + 1,
    amp,
  }))

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-hairline">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            System Overview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">
            Monitoring Summary
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Contactless WiFi CSI activity, fall detection, and respiratory telemetry across monitored zones.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={triggerSimulatedFall}
            className="px-3.5 py-2 text-xs font-medium border border-signal-alert/40 text-signal-alert bg-signal-alert-bg rounded hover:bg-signal-alert hover:text-white transition-colors"
          >
            Simulate Fall Alert
          </button>
          <button
            type="button"
            onClick={() => navigate('/live')}
            className="px-3.5 py-2 text-xs font-medium bg-ink text-paper rounded hover:bg-ink/85 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Open Live Console</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface border border-hairline rounded-md p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Nodes</span>
            <RadioNodeIcon className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono tabular-nums text-ink">
              {activeDevices}
            </span>
            <span className="text-xs font-mono text-ink-muted">/ {rooms.length} deployed</span>
          </div>
          <p className="mt-2 text-xs text-signal-ok font-medium">
            All primary ESP32 links nominal
          </p>
        </div>

        <div className="bg-surface border border-hairline rounded-md p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Events Logged</span>
            <WaveformIcon className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono tabular-nums text-ink">
              {120 + activities.length}
            </span>
            <span className="text-xs font-mono text-ink-muted">24h window</span>
          </div>
          <p className="mt-2 text-xs text-ink-secondary">
            Current state:{' '}
            <span className="font-mono uppercase font-semibold text-ink">
              {currentFrame.activity}
            </span>
          </p>
        </div>

        <div className="bg-surface border border-hairline rounded-md p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pending Incidents</span>
            <AlertIcon className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-semibold font-mono tabular-nums ${
                pendingIncidents > 0 ? 'text-signal-alert' : 'text-ink'
              }`}
            >
              {pendingIncidents}
            </span>
            <span className="text-xs font-mono text-ink-muted">
              {incidents.length} total logged
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-secondary">
            {pendingIncidents > 0 ? 'Requires caregiver acknowledgment' : 'No unacknowledged alerts'}
          </p>
        </div>

        <div className="bg-surface border border-hairline rounded-md p-5">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Respiration Est.</span>
            <CheckCircleIcon className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold font-mono tabular-nums text-ink">
              {latestBpm}
            </span>
            <span className="text-xs font-mono text-ink-muted">BPM</span>
          </div>
          <p className="mt-2 text-xs text-signal-ok font-medium">
            Within 12–20 BPM resting range
          </p>
        </div>
      </div>

      {/* Middle Split: Live CSI Preview + Monitored Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CSI Subcarrier Snapshot */}
        <div className="lg:col-span-2 bg-surface border border-hairline rounded-md p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Live 52-Subcarrier CSI Envelope
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                {activeRoom.name} ({activeRoom.deviceName}) · Confidence{' '}
                <span className="font-mono tabular-nums text-ink">
                  {Math.round(currentFrame.confidence * 100)}%
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
              <span className="px-2 py-1 bg-subtle rounded text-ink">
                RSSI {currentFrame.rssi} dBm
              </span>
              <span
                className={`px-2 py-1 rounded uppercase font-semibold ${
                  currentFrame.activity === 'fall'
                    ? 'bg-signal-alert-bg text-signal-alert'
                    : 'bg-signal-ok-bg text-signal-ok'
                }`}
              >
                {currentFrame.activity}
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                <YAxis
                  domain={[-1.1, 1.1]}
                  tick={{ fontSize: 10, fill: '#85827A', fontFamily: 'IBM Plex Mono' }}
                  tickCount={3}
                  axisLine={false}
                  tickLine={false}
                />
                <Area
                  type="monotone"
                  dataKey="amp"
                  stroke={currentFrame.activity === 'fall' ? '#B42318' : '#181816'}
                  strokeWidth={1.75}
                  fill={currentFrame.activity === 'fall' ? '#FCECEB' : '#EFEDE7'}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between text-xs text-ink-muted font-mono">
            <span>Subcarriers 1–52 (2.4 GHz HT20)</span>
            <button
              type="button"
              onClick={() => navigate('/live')}
              className="text-ink hover:underline font-sans font-medium"
            >
              Inspect 3D spatial view →
            </button>
          </div>
        </div>

        {/* Monitored Zones */}
        <div className="bg-surface border border-hairline rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink">Monitored Zones</h2>
            <span className="text-[11px] font-mono text-ink-muted">{rooms.length} rooms</span>
          </div>
          <div className="space-y-2.5">
            {rooms.map((room) => {
              const selected = room.id === selectedRoomId
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selected
                      ? 'border-ink bg-paper'
                      : 'border-hairline bg-surface hover:bg-paper/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{room.name}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        room.status === 'online'
                          ? 'bg-signal-ok-bg text-signal-ok'
                          : 'bg-subtle text-ink-secondary'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-ink-muted font-mono">
                    <span>{room.deviceName}</span>
                    <span className="tabular-nums">{room.rssi} dBm</span>
                  </div>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="mt-4 w-full py-2 text-xs font-medium text-ink border border-hairline rounded hover:bg-subtle transition-colors"
          >
            Configure Hardware Nodes
          </button>
        </div>
      </div>

      {/* Activity Ledger Table */}
      <div className="bg-surface border border-hairline rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Recent Activity Ledger</h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Classified motion transitions from the CSI pipeline
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="text-xs font-medium text-ink hover:underline"
          >
            View full trends →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper border-b border-hairline text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                <th className="py-2.5 px-5 font-medium">Activity</th>
                <th className="py-2.5 px-5 font-medium">Zone</th>
                <th className="py-2.5 px-5 font-medium">Confidence</th>
                <th className="py-2.5 px-5 font-medium">Time</th>
                <th className="py-2.5 px-5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-sm">
              {activities.slice(0, 7).map((item) => {
                const isFall = item.activity.toLowerCase() === 'fall'
                return (
                  <tr key={item.id} className="hover:bg-paper/60 transition-colors">
                    <td className="py-3 px-5 font-medium text-ink capitalize">
                      {item.activity}
                    </td>
                    <td className="py-3 px-5 text-ink-secondary">{item.roomName}</td>
                    <td className="py-3 px-5 font-mono text-xs tabular-nums text-ink">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-subtle rounded overflow-hidden">
                          <div
                            className={`h-full ${isFall ? 'bg-signal-alert' : 'bg-ink'}`}
                            style={{ width: `${Math.round(item.confidence * 100)}%` }}
                          />
                        </div>
                        <span>{Math.round(item.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-ink-muted tabular-nums">
                      {formatRelativeTime(item.timestamp)}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-mono uppercase rounded ${
                          isFall
                            ? 'bg-signal-alert-bg text-signal-alert font-semibold'
                            : 'bg-signal-ok-bg text-signal-ok'
                        }`}
                      >
                        {isFall ? 'Alert' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
