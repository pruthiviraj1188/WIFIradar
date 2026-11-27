import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import Room3DVisualization from '../components/Room3D'
import { useTelemetry } from '../context/TelemetryContext'

function Dashboard() {
  const navigate = useNavigate()
  const {
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    currentFrame,
    breathingHistory,
    incidents,
    emergencyContacts,
    addEmergencyContact,
    removeEmergencyContact,
    userLocation,
    nearestHospital,
    updateLocationSettings,
    elapsedFallSeconds,
    fallCountdown,
    hospitalCountdown,
    escalationState,
    dispatchedLog,
    cancelFallEscalation,
    triggerSimulatedFall,
  } = useTelemetry()

  const [contactForm, setContactForm] = useState({ name: '', phone: '', relation: 'Family' })
  const [addressInput, setAddressInput] = useState(userLocation.address || '')
  const [hospitalPhoneInput, setHospitalPhoneInput] = useState(nearestHospital.phone || '108')
  const [savedToast, setSavedToast] = useState(false)

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
  const latestBpm = breathingHistory[breathingHistory.length - 1]?.bpm ?? 15.6
  const pendingIncidents = incidents.filter((i) => i.status === 'pending').length

  const sparkData = (currentFrame.csi_data || []).map((amp, idx) => ({
    subcarrier: idx + 1,
    amp,
  }))

  const handleSaveContact = async (e) => {
    e.preventDefault()
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return
    await addEmergencyContact(contactForm)
    setContactForm({ name: '', phone: '', relation: 'Family' })
  }

  const handleSaveLocation = (e) => {
    e.preventDefault()
    updateLocationSettings(addressInput, hospitalPhoneInput)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
  }

  const isEmergencyActive =
    escalationState === 'counting_contact' ||
    escalationState === 'counting_hospital' ||
    escalationState === 'hospital_dispatched'

  return (
    <div className="space-y-6 text-slate-100">

      {/* Top Minimal Spatial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
              WiFi-Radar Spatial Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mt-0.5">
            {activeRoom.name} · Live 3D Sensing
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(Number(e.target.value))}
            className="bg-slate-950/90 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.deviceName})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={triggerSimulatedFall}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white transition-all"
          >
            Test Fall (30s → 45s)
          </button>
          <button
            type="button"
            onClick={() => navigate('/live')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all"
          >
            Full Telemetry →
          </button>
        </div>
      </div>

      {/* Live Emergency Escalation Banner (0s -> 30s Contact -> 45s Hospital + GPS) */}
      {isEmergencyActive && (
        <div className="rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/90 via-slate-900/95 to-red-950/90 backdrop-blur-xl p-5 shadow-2xl animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-red-500 text-white">
                  Fall Detected · {elapsedFallSeconds}s Elapsed
                </span>
                <span className="text-xs font-mono text-red-200">
                  GPS: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white">
                {escalationState === 'counting_contact' &&
                  `Calling Emergency Contact in ${fallCountdown}s (Hospital + GPS dispatch in ${hospitalCountdown}s)`}
                {escalationState === 'counting_hospital' &&
                  `Emergency Contact Alerted! Calling Nearby Hospital & Sharing GPS in ${hospitalCountdown}s`}
                {escalationState === 'hospital_dispatched' &&
                  `Hospital & Emergency Contact Called — Live GPS Location Shared!`}
              </h2>
              {dispatchedLog.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {dispatchedLog.map((d, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/10 text-emerald-300 border border-emerald-400/30"
                    >
                      ✓ {d.tier === 'hospital' ? 'Hospital' : 'Contact'}: {d.name} ({d.phone || 'Telegram Pin'}) @ {d.time}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={cancelFallEscalation}
              className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg flex-shrink-0"
            >
              I Am Okay · Cancel Alert
            </button>
          </div>
        </div>
      )}

      {/* Hero 3D Spatial Room View */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <Room3DVisualization
          activity={currentFrame.activity}
          confidence={currentFrame.confidence}
          rssi={currentFrame.rssi}
          breathingBpm={latestBpm}
          roomName={activeRoom.name}
          fullScreen
        />
      </div>

      {/* Clean 3-Card Vital & CSI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Respiration &amp; Vitals
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-semibold font-mono text-white">{latestBpm}</span>
              <span className="text-xs font-mono text-cyan-400 ml-1.5">BPM</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-mono">
              Normal Rhythm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Contactless chest micro-motion via 2.4 GHz CSI
          </p>
        </div>

        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              52-Subcarrier Envelope
            </span>
            <span className="text-xs font-mono text-cyan-300">{currentFrame.rssi} dBm</span>
          </div>
          <div className="h-16 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <Area
                  type="monotone"
                  dataKey="amp"
                  stroke={currentFrame.activity === 'fall' ? '#EF4444' : '#06B6D4'}
                  strokeWidth={2}
                  fill={currentFrame.activity === 'fall' ? '#EF444433' : '#06B6D422'}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Active Escalation Rules
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>30s Unresponsive:</span>
                <span className="font-mono text-cyan-300">Call Saved Contact</span>
              </div>
              <div className="flex justify-between">
                <span>45s Unresponsive:</span>
                <span className="font-mono text-amber-300">Call Hospital + GPS</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Pending Alerts: {pendingIncidents}</span>
            <button
              type="button"
              onClick={() => navigate('/incidents')}
              className="text-cyan-400 hover:underline font-medium"
            >
              View Logs →
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Contacts & Hospital Location Dispatch Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Saved Emergency Contacts (Called at 30s) */}
        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
              Stage 1 · 30 Seconds
            </span>
            <h2 className="text-base font-semibold text-white mt-0.5">
              Emergency Contact Numbers
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically called &amp; sent your live GPS pin if no walk/stand is detected within 30s.
            </p>
          </div>

          <form onSubmit={handleSaveContact} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Name (e.g. Father)"
              value={contactForm.name}
              onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 text-xs bg-slate-950/90 border border-white/15 rounded-xl text-white placeholder:text-slate-500"
              required
            />
            <input
              type="tel"
              placeholder="Phone (+91 98765...)"
              value={contactForm.phone}
              onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
              className="px-3 py-2 text-xs bg-slate-950/90 border border-white/15 rounded-xl text-white font-mono placeholder:text-slate-500"
              required
            />
            <button
              type="submit"
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              + Save Contact
            </button>
          </form>

          <div className="space-y-2">
            {emergencyContacts.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No emergency numbers saved yet. Add a family member or caregiver above.
              </p>
            ) : (
              emergencyContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="ml-2 font-mono text-cyan-300">{c.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(c.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nearby Hospital Auto-Call & GPS Location Sharing (Called at 45s) */}
        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                Stage 2 · 45 Seconds
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5">
                Nearby Hospital &amp; Live Location
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Auto-detected via free OpenStreetMap GPS; shares live coordinates on escalation.
              </p>
            </div>
            {savedToast && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                Saved ✓
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Detected Nearest Hospital:</span>
              <span className="font-medium text-amber-300">{nearestHospital.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active GPS Coordinates:</span>
              <a
                href={`https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 underline"
              >
                {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
              </a>
            </div>
          </div>

          <form onSubmit={handleSaveLocation} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Home Street Address / Landmark"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950/90 border border-white/15 rounded-xl text-white placeholder:text-slate-500"
              />
              <input
                type="tel"
                placeholder="Hospital / Ambulance Phone (e.g. 108)"
                value={hospitalPhoneInput}
                onChange={(e) => setHospitalPhoneInput(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-950/90 border border-white/15 rounded-xl text-white font-mono placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-colors"
            >
              Update Hospital Number &amp; Home Address
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
