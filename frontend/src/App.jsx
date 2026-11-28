import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LiveMonitoring from './pages/LiveMonitoring'
import Incidents from './pages/Incidents'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext'
import {
  AlertIcon,
  BarChartIcon,
  GridIcon,
  RadarMark,
  SlidersIcon,
  WaveformIcon,
} from './components/Icons'

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/',          label: 'Spatial',    icon: GridIcon,     end: true },
  { to: '/live',      label: 'Telemetry',  icon: WaveformIcon },
  { to: '/incidents', label: 'Incidents',  icon: AlertIcon,    showBadge: true },
  { to: '/analytics', label: 'Analytics',  icon: BarChartIcon },
  { to: '/settings',  label: 'Settings',   icon: SlidersIcon },
]

function AppShell() {
  const {
    connectionMode,
    currentFrame,
    incidents,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    triggerSimulatedFall,
    escalationState,
    cancelFallEscalation,
  } = useTelemetry()

  const location   = useLocation()
  const isSpatial  = location.pathname === '/'
  const pendingCount = incidents.filter((i) => i.status === 'pending').length

  const statusDot = {
    live:      'bg-emerald-400',
    simulated: 'bg-cyan-400',
    paused:    'bg-slate-500',
  }[connectionMode] || 'bg-slate-500'

  return (
    <div className="bg-obsidian text-slate-100" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Thin top bar (non-spatial pages only) ──────────────────────────── */}
      {!isSpatial && (
        <header className="flex-shrink-0 sticky top-0 z-30 backdrop-blur-2xl bg-slate-950/80 border-b border-white/8 h-12 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2.5 mr-4">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center text-cyan-400">
              <RadarMark className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-white">WiFi-Radar</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot} animate-pulse`} />
            <span className="text-[11px] font-mono text-slate-500 mr-3">{currentFrame.rssi} dBm</span>
          </div>
        </header>
      )}

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <main
        className={isSpatial ? '' : 'overflow-y-auto'}
        style={isSpatial
          ? { flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }
          : { flex: 1, minHeight: 0, paddingBottom: '80px' }
        }
      >
        {!isSpatial && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
            <Routes>
              <Route path="/live"      element={<LiveMonitoring />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings"  element={<Settings />} />
            </Routes>
          </div>
        )}
        {isSpatial && (
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          Floating Glass Bottom Dock — always visible
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center ${isSpatial ? 'gap-1.5' : 'gap-1'} backdrop-blur-2xl bg-slate-900/65 border border-white/10 rounded-full px-3 py-2 shadow-2xl`}>

        {/* Brand dot */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-400/25 text-cyan-400 mr-1">
          <RadarMark className="w-3.5 h-3.5" />
        </div>

        {/* Nav pills */}
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, showBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {showBadge && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Room selector pill */}
        <select
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(Number(e.target.value))}
          className="bg-transparent border-0 text-xs font-medium text-slate-300 focus:outline-none cursor-pointer pr-1 max-w-[110px]"
          style={{ appearance: 'none' }}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id} className="bg-slate-900 text-white">
              {r.name}
            </option>
          ))}
        </select>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Test Fall button */}
        <button
          type="button"
          onClick={triggerSimulatedFall}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-red-300 bg-red-500/12 border border-red-500/25 hover:bg-red-500/25 hover:text-red-200 transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M10.3 3.9 2.4 17.5a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <line x1="12" y1="9.5" x2="12" y2="13.5" />
          </svg>
          <span className="hidden sm:inline">Test Fall</span>
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <TelemetryProvider>
        <AppShell />
      </TelemetryProvider>
    </Router>
  )
}

export default App
