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
  { to: '/', label: 'Overview', icon: GridIcon, end: true },
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
    dismissAlert,
    fallCountdown,
    escalationState,
    emergencyContacts,
    dispatchedContacts,
    cancelFallEscalation,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
  } = useTelemetry()
  const navigate = useNavigate()

  const pendingCount = incidents.filter((i) => i.status === 'pending').length

  const statusConfig = {
    live: { label: 'Live WS Stream', dot: 'bg-signal-ok', text: 'text-signal-ok' },
    simulated: { label: 'Local Simulator', dot: 'bg-signal-warn', text: 'text-signal-warn' },
    paused: { label: 'Stream Paused', dot: 'bg-ink-muted', text: 'text-ink-muted' },
  }[connectionMode]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-hairline">
      {/* Brand Mark */}
      <div className="px-5 py-5 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-ink text-paper flex items-center justify-center relative">
            <RadarMark className="w-4 h-4 relative z-10" />
            <span className="absolute inset-0 rounded bg-ink animate-radar-ping opacity-30" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-ink leading-none">
              WiFi-Radar
            </div>
            <div className="text-[11px] font-mono text-ink-muted mt-1">
              CSI Monitor · v0.1
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-ink-secondary hover:text-ink"
          aria-label="Close navigation"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-2.5 pb-2 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
          Navigation
        </div>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, showBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-subtle text-ink font-semibold'
                  : 'text-ink-secondary hover:bg-paper hover:text-ink font-normal'
              }`
            }
          >
            <span className="flex items-center gap-2.5">
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </span>
            {showBadge && pendingCount > 0 && (
              <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-signal-alert-bg text-signal-alert tabular-nums">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}

        {/* Active Room Quick Switcher */}
        <div className="pt-6 px-2.5">
          <label
            htmlFor="sidebar-room"
            className="block text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-2"
          >
            Active Zone
          </label>
          <select
            id="sidebar-room"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="w-full bg-paper border border-hairline rounded px-2.5 py-1.5 text-xs font-medium text-ink focus:outline-none focus:border-ink"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.deviceName})
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Bottom Telemetry Status */}
      <div className="p-4 border-t border-hairline bg-paper/60">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="flex items-center gap-2 font-medium text-ink">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot} ${connectionMode !== 'paused' ? 'animate-signal-dot' : ''}`} />
            {statusConfig.label}
          </span>
          <span className="font-mono text-[11px] text-ink-muted tabular-nums">
            {currentFrame.rssi} dBm
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted tabular-nums">
          <span>52 subcarriers</span>
          <span>Frame #{currentFrame.frame}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 max-w-[80vw] h-full">{sidebarContent}</div>
          <div
            className="flex-1 bg-ink/30"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-hairline px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1.5 -ml-1.5 text-ink"
              aria-label="Open menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <span className="font-semibold text-sm tracking-tight">WiFi-Radar</span>
          </div>
          <span className={`font-mono text-[11px] font-medium ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </header>

        {/* Global Fall Alert Banner with 30s Recovery Countdown & Auto-Call Escalation */}
        {activeAlert && (
          <div className={`border-b px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 animate-alert-glow ${
            escalationState === 'escalated'
              ? 'bg-signal-alert text-white border-signal-alert'
              : 'bg-signal-alert-bg text-signal-alert border-signal-alert/30'
          }`}>
            <div className="flex flex-col gap-0.5 text-sm">
              <div className="flex items-center gap-2.5">
                <AlertIcon className="w-4 h-4 flex-shrink-0" />
                {escalationState === 'escalated' ? (
                  <span className="font-semibold">
                    NO RECOVERY IN 30s — Auto-Calling &amp; Notifying Emergency Contacts!
                  </span>
                ) : (
                  <span className="font-semibold">
                    Fall Detected — Waiting for person to stand up or walk ({fallCountdown ?? 30}s)
                  </span>
                )}
              </div>
              <div className="text-xs opacity-90 pl-6">
                {escalationState === 'escalated' ? (
                  dispatchedContacts.length > 0 ? (
                    <span>
                      Called &amp; Notified:{' '}
                      {dispatchedContacts.map((c, idx) => (
                        <span key={c.id || idx} className="font-mono font-semibold mr-2">
                          {c.name} (<a href={`tel:${c.phone}`} className="underline">{c.phone}</a>)
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span>No emergency phone numbers saved yet — add contacts in the Emergency Contacts section.</span>
                  )
                ) : (
                  <span>
                    {activeAlert.message} · Will auto-call{' '}
                    <strong>{emergencyContacts.length}</strong> saved emergency contact(s) if not up in {fallCountdown ?? 30}s.
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelFallEscalation}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  escalationState === 'escalated'
                    ? 'bg-white text-signal-alert hover:opacity-90'
                    : 'bg-signal-ok text-white hover:opacity-90'
                }`}
              >
                Person OK / Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  dismissAlert()
                  navigate('/incidents')
                }}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  escalationState === 'escalated'
                    ? 'bg-black/25 text-white hover:bg-black/35'
                    : 'bg-signal-alert text-white hover:opacity-90'
                }`}
              >
                Open Triage
              </button>
              <button
                type="button"
                onClick={dismissAlert}
                className="p-1 hover:opacity-75"
                aria-label="Dismiss alert"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-7">
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
