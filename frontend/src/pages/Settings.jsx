import React, { useState } from 'react'
import { useTelemetry } from '../context/TelemetryContext'
import { checkBackendHealth } from '../services/api'

function Settings() {
  const { settings, setSettings, rooms, backendHealthy, setBackendHealthy } = useTelemetry()
  const [newCaregiver, setNewCaregiver] = useState({ name: '', role: 'Caregiver', contact: '' })
  const [savedNotice, setSavedNotice] = useState('')
  const [testingApi, setTestingApi] = useState(false)

  const flashNotice = (msg) => {
    setSavedNotice(msg)
    window.setTimeout(() => setSavedNotice(''), 2800)
  }

  const toggleChannel = (key) => {
    setSettings((prev) => ({
      ...prev,
      channels: { ...prev.channels, [key]: !prev.channels[key] },
    }))
    flashNotice('Alert channel preference updated.')
  }

  const handleAddCaregiver = (e) => {
    e.preventDefault()
    if (!newCaregiver.name.trim() || !newCaregiver.contact.trim()) return
    setSettings((prev) => ({
      ...prev,
      caregivers: [...(prev.caregivers || []), { id: Date.now(), ...newCaregiver }],
    }))
    setNewCaregiver({ name: '', role: 'Caregiver', contact: '' })
    flashNotice('Caregiver added to alert roster.')
  }

  const handleRemoveCaregiver = (id) => {
    setSettings((prev) => ({
      ...prev,
      caregivers: (prev.caregivers || []).filter((c) => c.id !== id),
    }))
    flashNotice('Caregiver removed.')
  }

  const handleTestConnection = async () => {
    setTestingApi(true)
    const ok = await checkBackendHealth()
    setBackendHealthy(ok)
    setTestingApi(false)
    flashNotice(ok ? 'Backend health check passed.' : 'Backend unreachable; running local simulator.')
  }

  const inputCls = 'bg-[#1A2744]/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-full'

  return (
    <div className="space-y-6 max-w-4xl animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
              System Configuration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Hardware &amp; Alert Settings
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage ESP32 CSI sampling parameters, fall sensitivity, and caregiver notifications.
          </p>
        </div>
        {savedNotice && (
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
            ✓ {savedNotice}
          </span>
        )}
      </div>

      {/* Section 1: ESP32 Hardware */}
      <section className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-glass">
        <div>
          <h2 className="text-sm font-semibold text-white">ESP32 Sensor Nodes &amp; CSI Pipeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">Registered hardware units and sampling thresholds</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1A2744]/70 border-b border-white/10 font-mono uppercase text-[10px] text-slate-400">
                <th className="py-2.5 px-4">Device</th>
                <th className="py-2.5 px-4">Zone</th>
                <th className="py-2.5 px-4">MAC Address</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-200">{r.deviceName}</td>
                  <td className="py-2.5 px-4 text-slate-400">{r.name}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">{r.mac}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className={`font-mono uppercase text-[10px] px-2 py-0.5 rounded-lg ${
                      r.status === 'online'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                        : 'bg-[#243352]/50 text-slate-400 border border-white/10'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Fall Confidence Threshold
              <span className="ml-2 font-mono text-cyan-400">{Math.round(settings.fallConfidenceThreshold * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.5" max="0.95" step="0.05"
              value={settings.fallConfidenceThreshold}
              onChange={(e) => {
                setSettings((p) => ({ ...p, fallConfidenceThreshold: Number(e.target.value) }))
                flashNotice('Fall threshold saved.')
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>50% (High Recall)</span>
              <span>95% (Low False Alarms)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              CSI Frame Sampling Rate
            </label>
            <select
              value={settings.samplingRateHz}
              onChange={(e) => {
                setSettings((p) => ({ ...p, samplingRateHz: Number(e.target.value) }))
                flashNotice('Sampling rate updated.')
              }}
              className={inputCls}
            >
              <option value={10}>10 Hz (Default WebSocket)</option>
              <option value={25}>25 Hz (High Resolution)</option>
              <option value={50}>50 Hz (Raw Research Capture)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 2: Notification Channels */}
      <section className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-glass">
        <div>
          <h2 className="text-sm font-semibold text-white">Alert Channels</h2>
          <p className="text-xs text-slate-400 mt-0.5">Select how caregivers are notified on confirmed fall events</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'inApp', label: 'Dashboard Priority Banner', desc: 'Immediate in-browser alert strip' },
            { key: 'sms', label: 'SMS Dispatch', desc: 'Carrier text alert to primary contact' },
            { key: 'email', label: 'Email Incident Report', desc: 'Timestamped summary with room log' },
            { key: 'whatsapp', label: 'WhatsApp Escalation', desc: 'Secondary caregiver group alert' },
          ].map((ch) => (
            <label
              key={ch.key}
              className="flex items-start justify-between gap-3 p-3.5 border border-white/10 rounded-xl bg-slate-950/50 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">{ch.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{ch.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.channels?.[ch.key] ?? false}
                onChange={() => toggleChannel(ch.key)}
                className="mt-0.5 h-4 w-4 rounded"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Section 3: Caregiver Roster */}
      <section className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-glass">
        <div>
          <h2 className="text-sm font-semibold text-white">Caregiver Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Authorized personnel who receive escalations and can resolve incidents
          </p>
        </div>

        <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
          {(settings.caregivers || []).map((c) => (
            <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
              <div>
                <div className="text-xs font-semibold text-slate-200">{c.name}</div>
                <div className="text-[11px] font-mono text-slate-400">
                  {c.role} · {c.contact}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCaregiver(c.id)}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCaregiver} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <input type="text" placeholder="Full name" value={newCaregiver.name}
            onChange={(e) => setNewCaregiver((p) => ({ ...p, name: e.target.value }))}
            className={inputCls} />
          <input type="text" placeholder="Role (e.g. Nurse)" value={newCaregiver.role}
            onChange={(e) => setNewCaregiver((p) => ({ ...p, role: e.target.value }))}
            className={inputCls} />
          <input type="text" placeholder="Email or phone" value={newCaregiver.contact}
            onChange={(e) => setNewCaregiver((p) => ({ ...p, contact: e.target.value }))}
            className={inputCls} />
          <button
            type="submit"
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all"
          >
            Add Caregiver
          </button>
        </form>
      </section>

      {/* Section 4: Backend Connection */}
      <section className="bg-[#1E2E4A]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-glass">
        <div>
          <h2 className="text-sm font-semibold text-white">FastAPI Backend Connection</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Status:{' '}
            <span className={backendHealthy ? 'text-emerald-400' : 'text-amber-400'}>
              {backendHealthy ? 'Connected (/health OK)' : 'Offline (Simulator Fallback Active)'}
            </span>
          </p>
        </div>
        <button
          type="button"
          disabled={testingApi}
          onClick={handleTestConnection}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#243352]/70 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
        >
          {testingApi ? 'Checking...' : 'Test Backend Health'}
        </button>
      </section>
    </div>
  )
}

export default Settings
