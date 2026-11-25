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
      caregivers: [
        ...prev.caregivers,
        { id: Date.now(), ...newCaregiver },
      ],
    }))
    setNewCaregiver({ name: '', role: 'Caregiver', contact: '' })
    flashNotice('Caregiver added to alert roster.')
  }

  const handleRemoveCaregiver = (id) => {
    setSettings((prev) => ({
      ...prev,
      caregivers: prev.caregivers.filter((c) => c.id !== id),
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-hairline">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            System Configuration
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">
            Hardware & Alert Settings
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Manage ESP32 CSI sampling parameters, fall sensitivity, and caregiver notifications.
          </p>
        </div>
        {savedNotice && (
          <span className="text-xs font-mono px-3 py-1.5 rounded bg-signal-ok-bg text-signal-ok">
            {savedNotice}
          </span>
        )}
      </div>

      {/* Section 1: ESP32 Hardware & CSI Parameters */}
      <section className="bg-surface border border-hairline rounded-md p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">ESP32 Sensor Nodes & CSI Pipeline</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Registered hardware units and sampling thresholds
          </p>
        </div>

        <div className="overflow-x-auto border border-hairline rounded">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-paper border-b border-hairline font-mono uppercase text-[10px] text-ink-muted">
                <th className="py-2 px-3">Device</th>
                <th className="py-2 px-3">Zone</th>
                <th className="py-2 px-3">MAC Address</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-3 font-mono font-medium text-ink">{r.deviceName}</td>
                  <td className="py-2.5 px-3 text-ink-secondary">{r.name}</td>
                  <td className="py-2.5 px-3 font-mono text-ink-muted">{r.mac}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`font-mono uppercase text-[10px] px-1.5 py-0.5 rounded ${
                        r.status === 'online'
                          ? 'bg-signal-ok-bg text-signal-ok'
                          : 'bg-subtle text-ink-secondary'
                      }`}
                    >
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
            <label className="block text-xs font-medium text-ink mb-1.5">
              Fall Confidence Threshold ({Math.round(settings.fallConfidenceThreshold * 100)}%)
            </label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings.fallConfidenceThreshold}
              onChange={(e) => {
                setSettings((p) => ({
                  ...p,
                  fallConfidenceThreshold: Number(e.target.value),
                }))
                flashNotice('Fall threshold saved.')
              }}
              className="w-full accent-ink"
            />
            <div className="flex justify-between text-[10px] font-mono text-ink-muted mt-1">
              <span>50% (High Recall)</span>
              <span>95% (Low False Alarms)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              CSI Frame Sampling Rate
            </label>
            <select
              value={settings.samplingRateHz}
              onChange={(e) => {
                setSettings((p) => ({ ...p, samplingRateHz: Number(e.target.value) }))
                flashNotice('Sampling rate updated.')
              }}
              className="w-full bg-paper border border-hairline rounded px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-ink"
            >
              <option value={10}>10 Hz (Default WebSocket)</option>
              <option value={25}>25 Hz (High Resolution)</option>
              <option value={50}>50 Hz (Raw Research Capture)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 2: Notification Channels */}
      <section className="bg-surface border border-hairline rounded-md p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Alert Channels</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Select how caregivers are notified on confirmed fall events
          </p>
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
              className="flex items-start justify-between gap-3 p-3.5 border border-hairline rounded bg-paper/50 cursor-pointer hover:bg-paper"
            >
              <div>
                <div className="text-xs font-semibold text-ink">{ch.label}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">{ch.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.channels[ch.key]}
                onChange={() => toggleChannel(ch.key)}
                className="mt-0.5 h-4 w-4 accent-ink rounded"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Section 3: Caregiver Roster */}
      <section className="bg-surface border border-hairline rounded-md p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Caregiver Directory</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Authorized personnel who receive escalations and can resolve incidents
          </p>
        </div>

        <div className="divide-y divide-hairline border border-hairline rounded">
          {settings.caregivers.map((c) => (
            <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-ink">{c.name}</div>
                <div className="text-[11px] font-mono text-ink-muted">
                  {c.role} · {c.contact}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCaregiver(c.id)}
                className="text-xs text-ink-muted hover:text-signal-alert transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCaregiver} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          <input
            type="text"
            placeholder="Full name"
            value={newCaregiver.name}
            onChange={(e) => setNewCaregiver((p) => ({ ...p, name: e.target.value }))}
            className="bg-paper border border-hairline rounded px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
          />
          <input
            type="text"
            placeholder="Role (e.g. Nurse)"
            value={newCaregiver.role}
            onChange={(e) => setNewCaregiver((p) => ({ ...p, role: e.target.value }))}
            className="bg-paper border border-hairline rounded px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
          />
          <input
            type="text"
            placeholder="Email or phone"
            value={newCaregiver.contact}
            onChange={(e) => setNewCaregiver((p) => ({ ...p, contact: e.target.value }))}
            className="bg-paper border border-hairline rounded px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
          />
          <button
            type="submit"
            className="px-3 py-2 text-xs font-medium bg-ink text-paper rounded hover:bg-ink/85 transition-colors"
          >
            Add Caregiver
          </button>
        </form>
      </section>

      {/* Section 4: Backend Connection */}
      <section className="bg-surface border border-hairline rounded-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">FastAPI Backend Connection</h2>
          <p className="text-xs text-ink-secondary mt-0.5 font-mono">
            Status:{' '}
            <span className={backendHealthy ? 'text-signal-ok' : 'text-signal-warn'}>
              {backendHealthy ? 'Connected (/health OK)' : 'Offline (Simulator Fallback Active)'}
            </span>
          </p>
        </div>
        <button
          type="button"
          disabled={testingApi}
          onClick={handleTestConnection}
          className="px-3.5 py-2 text-xs font-medium border border-hairline bg-paper text-ink rounded hover:bg-subtle disabled:opacity-50"
        >
          {testingApi ? 'Checking...' : 'Test Backend Health'}
        </button>
      </section>
    </div>
  )
}

export default Settings
