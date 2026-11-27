import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LiveMonitoring from './pages/LiveMonitoring'
import Incidents from './pages/Incidents'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext'
import {
  AlertIcon,
  BarChartIcon,
  CloseIcon,
  GridIcon,
  MenuIcon,
  RadarMark,
  SlidersIcon,
  WaveformIcon,
} from './components/Icons'

const NAV_ITEMS = [
  { to: '/', label: '3D Spatial View', icon: GridIcon, end: true },
  { to: '/live', label: 'Live Telemetry', icon: WaveformIcon },
  { to: '/incidents', label: 'Incidents', icon: AlertIcon, showBadge: true },
  { to: '/analytics', label: 'Analytics', icon: BarChartIcon },
  { to: '/settings', label: 'Settings', icon: SlidersIcon },
]

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const {
    connectionMode,
    currentFrame,
    incidents,
    activeAlert,
    fallCountdown,
    hospitalCountdown,
    escalationState,
    cancelFallEscalation,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
  } = useTelemetry()
  const navigate = useNavigate()

  const pendingCount = incidents.filter((i) => i.status === 'pending').length

  const statusConfig = {
    live: { label: 'Live ESP32 Stream', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    simulated: { label: 'Spatial Simulator', dot: 'bg-cyan-400', text: 'text-cyan-400' },
    paused: { label: 'Stream Paused', dot: 'bg-slate-500', text: 'text-slate-400' },
  }[connectionMode]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-white/10 text-slate-200">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center relative">
            <RadarMark className="w-4 h-4 relative z-10" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white leading-none">
              WiFi-Radar
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Spatial CSI · 3D
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-white"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, showBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-400/25'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="flex items-center gap-2.5">
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </span>
            {showBadge && pendingCount > 0 && (
              <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}

        {/* Active Zone Switcher */}
        <div className="pt-6 px-2">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            Active Zone
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-2 font-medium text-slate-200">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`} />
            {statusConfig.label}
          </span>
          <span className="font-mono text-[11px] text-slate-400">{currentFrame.rssi} dBm</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>52 subcarriers</span>
          <span>#{currentFrame.frame}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 max-w-[80vw] h-full">{sidebarContent}</div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setMobileOpen(true)} className="p-1.5 -ml-1.5 text-slate-200">
              <MenuIcon className="w-5 h-5" />
            </button>
            <span className="font-semibold text-sm text-white">WiFi-Radar</span>
          </div>
          <span className={`font-mono text-[11px] ${statusConfig.text}`}>{statusConfig.label}</span>
        </header>

        {/* Global Fall Alert Banner — 30s → 45s Escalation Countdown */}
        {activeAlert && (
          <div className="bg-red-600 text-white px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <AlertIcon className="w-4 h-4" />
              <span>
                {escalationState === 'counting_contact' &&
                  `FALL DETECTED — Calling Contact in ${fallCountdown}s`}
                {escalationState === 'counting_hospital' &&
                  `CONTACT CALLED — Calling Hospital + Sending GPS in ${hospitalCountdown}s`}
                {escalationState === 'hospital_dispatched' &&
                  `HOSPITAL & CONTACT CALLED — GPS LOCATION SHARED`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelFallEscalation}
                className="px-3 py-1 rounded-lg bg-white text-red-600 font-bold"
              >
                Person OK / Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate('/incidents')}
                className="px-3 py-1 rounded-lg bg-black/30 text-white"
              >
                Incidents
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveMonitoring />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
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
