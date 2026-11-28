import React, { useState } from 'react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import Room3DVisualization from '../components/Room3D'
import { useTelemetry } from '../context/TelemetryContext'

// ─── Drawer: Emergency Contacts & Hospital Config ─────────────────────────────
function EmergencyDrawer({ open, onClose }) {
  const {
    emergencyContacts,
    addEmergencyContact,
    removeEmergencyContact,
    nearestHospital,
    userLocation,
    updateLocationSettings,
    escalationState,
    elapsedFallSeconds,
    fallCountdown,
    hospitalCountdown,
    dispatchedLog,
    cancelFallEscalation,
  } = useTelemetry()

  const [contactForm, setContactForm] = useState({ name: '', phone: '', relation: 'Family' })
  const [address, setAddress] = useState('')
  const [hospPhone, setHospPhone] = useState(nearestHospital?.phone || '108')
  const [saved, setSaved] = useState(false)

  const handleContact = async (e) => {
    e.preventDefault()
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return
    await addEmergencyContact(contactForm)
    setContactForm({ name: '', phone: '', relation: 'Family' })
  }

  const handleLocation = (e) => {
    e.preventDefault()
    updateLocationSettings(address, hospPhone)
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const isActive =
    escalationState === 'counting_contact' ||
    escalationState === 'counting_hospital' ||
    escalationState === 'hospital_dispatched'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pt-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">Emergency Dispatch</p>
              <h2 className="text-lg font-semibold text-white mt-0.5">Auto-Escalation Setup</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* Active escalation status */}
          {isActive && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-sm font-semibold text-red-300">
                  Fall Active · {elapsedFallSeconds}s elapsed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {escalationState === 'counting_contact' && `Calling contact in ${fallCountdown}s · Hospital + GPS in ${hospitalCountdown}s`}
                {escalationState === 'counting_hospital' && `Contact alerted · Hospital call in ${hospitalCountdown}s`}
                {escalationState === 'hospital_dispatched' && 'Hospital & contact called · GPS shared'}
              </p>
              {dispatchedLog.length > 0 && (
                <div className="space-y-1 pt-1">
                  {dispatchedLog.map((d, i) => (
                    <div key={i} className="text-[11px] font-mono text-emerald-400">
                      ✓ {d.tier === 'hospital' ? 'Hospital' : 'Contact'}: {d.name} @ {d.time}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={cancelFallEscalation}
                className="mt-1 w-full py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                I'm Okay — Cancel Alert
              </button>
            </div>
          )}

          {/* Stage 1: Emergency contacts */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Stage 1 · 30 seconds</span>
              <h3 className="text-sm font-semibold text-white mt-0.5">Emergency Contacts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Called automatically if no movement detected for 30s</p>
            </div>

            <form onSubmit={handleContact} className="grid grid-cols-3 gap-2">
              <input type="text" placeholder="Name" value={contactForm.name}
                onChange={(e) => setContactForm(p => ({ ...p, name: e.target.value }))}
                className="col-span-1 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                required />
              <input type="tel" placeholder="+91 98765..." value={contactForm.phone}
                onChange={(e) => setContactForm(p => ({ ...p, phone: e.target.value }))}
                className="col-span-1 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                required />
              <button type="submit"
                className="col-span-1 py-2 text-xs font-semibold rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all">
                + Add
              </button>
            </form>

            <div className="space-y-1.5">
              {emergencyContacts.length === 0 ? (
                <p className="text-xs text-slate-600 py-1">No contacts saved. Add one above.</p>
              ) : emergencyContacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/8 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="font-mono text-cyan-300">{c.phone}</span>
                  </div>
                  <button onClick={() => removeEmergencyContact(c.id)} className="text-slate-600 hover:text-red-400 transition-colors text-[11px]">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 2: Hospital + GPS */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Stage 2 · 45 seconds</span>
              <h3 className="text-sm font-semibold text-white mt-0.5">Hospital &amp; Live Location</h3>
              <p className="text-xs text-slate-500 mt-0.5">Auto-detected via OpenStreetMap · GPS coordinates shared on escalation</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/8 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nearest hospital:</span>
                <span className="font-medium text-amber-300 truncate ml-2">{nearestHospital?.name || 'Detecting...'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Your GPS:</span>
                <a
                  href={`https://maps.google.com/?q=${userLocation?.lat},${userLocation?.lng}`}
                  target="_blank" rel="noreferrer"
                  className="font-mono text-cyan-400 underline"
                >
                  {userLocation?.lat?.toFixed(4)}, {userLocation?.lng?.toFixed(4)}
                </a>
              </div>
            </div>

            <form onSubmit={handleLocation} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Home address / landmark" value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400" />
                <input type="tel" placeholder="Hospital phone (108)" value={hospPhone}
                  onChange={(e) => setHospPhone(e.target.value)}
                  className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400" />
              </div>
              <button type="submit"
                className="w-full py-2 text-xs font-semibold rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:bg-white/12 hover:text-white transition-colors">
                {saved ? '✓ Saved' : 'Save Location & Hospital Number'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const {
    rooms,
    selectedRoomId,
    currentFrame,
    breathingHistory,
    escalationState,
    elapsedFallSeconds,
    fallCountdown,
    hospitalCountdown,
    cancelFallEscalation,
    dispatchedLog,
  } = useTelemetry()

  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
  const latestBpm  = breathingHistory[breathingHistory.length - 1]?.bpm ?? 15.6
  const isFall     = String(currentFrame.activity).toLowerCase() === 'fall'
  const isActive   =
    escalationState === 'counting_contact' ||
    escalationState === 'counting_hospital' ||
    escalationState === 'hospital_dispatched'

  const sparkData = (currentFrame.csi_data || []).slice(-28).map((amp, idx) => ({ i: idx, amp }))

  return (
    <div className="relative w-full h-full">

      {/* ── Full-bleed 3D canvas ───────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <Room3DVisualization
          activity={currentFrame.activity}
          confidence={currentFrame.confidence}
          rssi={currentFrame.rssi}
          breathingBpm={latestBpm}
          roomName={activeRoom.name}
          fullScreen
        />
      </div>

      {/* ── Top-left status pill ──────────────────────────────────────────── */}
      <div className="absolute top-5 left-5 z-20">
        <div className={`flex items-center gap-2.5 backdrop-blur-2xl bg-slate-900/55 border px-4 py-2.5 rounded-full shadow-glass transition-colors ${
          isFall ? 'border-red-500/40' : 'border-white/12'
        }`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isFall ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
          <span className="text-sm font-medium text-white">
            {activeRoom.name}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-sm text-emerald-300 font-mono tabular-nums">{latestBpm} BPM</span>
          <span className="text-white/20">·</span>
          <span className={`text-sm font-medium capitalize ${isFall ? 'text-red-400' : 'text-cyan-300'}`}>
            {currentFrame.activity === 'Jump' ? 'Jumping' : currentFrame.activity}ing
          </span>
        </div>
      </div>

      {/* ── Escalation countdown banner ───────────────────────────────────── */}
      {isActive && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 w-[90vw] max-w-xl">
          <div className="backdrop-blur-2xl bg-red-900/70 border border-red-500/40 rounded-2xl px-5 py-3.5 shadow-2xl animate-alert-glow">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span className="text-sm font-semibold text-white">
                    {escalationState === 'counting_contact'  && `Fall — calling contact in ${fallCountdown}s`}
                    {escalationState === 'counting_hospital' && `Contact alerted · hospital call in ${hospitalCountdown}s`}
                    {escalationState === 'hospital_dispatched' && 'Hospital & contact called · GPS shared'}
                  </span>
                </div>
                {dispatchedLog.length > 0 && (
                  <p className="text-[11px] font-mono text-emerald-400 mt-1 pl-4">
                    ✓ {dispatchedLog[dispatchedLog.length - 1].name} notified @ {dispatchedLog[dispatchedLog.length - 1].time}
                  </p>
                )}
              </div>
              <button
                onClick={cancelFallEscalation}
                className="flex-shrink-0 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                I'm OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom-right corner widget: CSI sparkline + Emergency button ──── */}
      <div className="absolute bottom-28 right-5 z-20 flex flex-col items-end gap-3">
        {/* CSI sparkline card */}
        <div className="backdrop-blur-2xl bg-slate-900/55 border border-white/10 rounded-2xl px-4 py-3 shadow-glass w-52">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">CSI Envelope</span>
            <span className="text-[11px] font-mono text-cyan-300 tabular-nums">{currentFrame.rssi} dBm</span>
          </div>
          <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="csiGradDB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={isFall ? '#EF4444' : '#06B6D4'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isFall ? '#EF4444' : '#06B6D4'} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amp"
                  stroke={isFall ? '#EF4444' : '#06B6D4'} strokeWidth={1.5}
                  fill="url(#csiGradDB)" isAnimationActive={false} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono">
            <span className="text-slate-500">Conf</span>
            <span className="text-slate-200 tabular-nums">{Math.round(currentFrame.confidence * 100)}%</span>
          </div>
        </div>

        {/* Emergency config button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex items-center gap-2 backdrop-blur-2xl border px-4 py-2.5 rounded-full shadow-glass text-xs font-semibold transition-all ${
            isActive
              ? 'bg-red-900/70 border-red-500/50 text-red-200 animate-alert-glow'
              : 'bg-slate-900/55 border-white/12 text-slate-200 hover:border-cyan-400/40 hover:text-cyan-300'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.8 19.8 0 0 1 1.63 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" />
          </svg>
          {isActive ? `Emergency Active · ${elapsedFallSeconds}s` : 'Emergency Setup'}
        </button>
      </div>

      {/* ── Emergency drawer ──────────────────────────────────────────────── */}
      <EmergencyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export default Dashboard
