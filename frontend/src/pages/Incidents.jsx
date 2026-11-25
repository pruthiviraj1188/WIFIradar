import React, { useState } from 'react'
import { useTelemetry } from '../context/TelemetryContext'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'false_alarm', label: 'False Alarm' },
]

const STATUS_BADGE = {
  pending: 'bg-signal-alert-bg text-signal-alert font-semibold',
  acknowledged: 'bg-signal-warn-bg text-signal-warn font-medium',
  resolved: 'bg-signal-ok-bg text-signal-ok font-medium',
  false_alarm: 'bg-subtle text-ink-secondary font-medium',
}

function Incidents() {
  const { incidents, acknowledgeIncident, resolveIncident, triggerSimulatedFall } = useTelemetry()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [notesById, setNotesById] = useState({})

  const filtered = incidents.filter((inc) => {
    const matchesStatus = filter === 'all' || inc.status === filter
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      String(inc.id).includes(q) ||
      (inc.room_name || '').toLowerCase().includes(q) ||
      (inc.notes || '').toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const total = incidents.length
  const pending = incidents.filter((i) => i.status === 'pending').length
  const acknowledged = incidents.filter((i) => i.status === 'acknowledged').length
  const falseAlarms = incidents.filter((i) => i.is_false_alarm).length
  const falseAlarmRate = total > 0 ? Math.round((falseAlarms / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-hairline">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-ink-muted">
            Caregiver Triage Queue
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">
            Incident Log & Resolution
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Acknowledge active fall detections, log caregiver notes, and classify false positives.
          </p>
        </div>
        <button
          type="button"
          onClick={triggerSimulatedFall}
          className="px-3.5 py-2 text-xs font-medium bg-signal-alert-bg border border-signal-alert/40 text-signal-alert rounded hover:bg-signal-alert hover:text-white transition-colors self-start sm:self-auto"
        >
          Log Simulated Fall
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: total },
          { label: 'Pending Action', value: pending, alert: pending > 0 },
          { label: 'In Progress', value: acknowledged },
          { label: 'False Alarm Rate', value: `${falseAlarmRate}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-hairline rounded-md p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              {stat.label}
            </div>
            <div
              className={`mt-2 text-2xl font-semibold font-mono tabular-nums ${
                stat.alert ? 'text-signal-alert' : 'text-ink'
              }`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                filter === tab.key
                  ? 'bg-ink text-paper border-ink font-medium'
                  : 'bg-surface text-ink-secondary border-hairline hover:bg-subtle hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by room, note, or ID..."
          className="w-full sm:w-64 bg-surface border border-hairline rounded px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
        />
      </div>

      {/* Incident Cards */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-hairline rounded-md p-10 text-center">
          <p className="text-sm font-medium text-ink">No incidents match this filter</p>
          <p className="text-xs text-ink-muted mt-1">
            All monitored zones are operating within normal motion bounds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => {
            const isOpen = inc.status === 'pending' || inc.status === 'acknowledged'
            const draftNote = notesById[inc.id] ?? inc.notes ?? ''

            return (
              <div
                key={inc.id}
                className="bg-surface border border-hairline rounded-md p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-ink-muted">#{inc.id}</span>
                      <h3 className="text-sm font-semibold text-ink capitalize">
                        {inc.incident_type} Detected — {inc.room_name || `Room ${inc.room_id}`}
                      </h3>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          STATUS_BADGE[inc.status] || 'bg-subtle text-ink'
                        }`}
                      >
                        {inc.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-muted tabular-nums">
                      <span>Logged: {new Date(inc.timestamp).toLocaleString()}</span>
                      <span>Confidence: {Math.round(inc.confidence * 100)}%</span>
                      {inc.acknowledged_at && (
                        <span>Ack: {new Date(inc.acknowledged_at).toLocaleTimeString()}</span>
                      )}
                      {inc.resolved_at && (
                        <span>Closed: {new Date(inc.resolved_at).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {isOpen ? (
                  <div className="pt-3 border-t border-hairline flex flex-col md:flex-row md:items-center gap-3">
                    <input
                      type="text"
                      value={draftNote}
                      onChange={(e) =>
                        setNotesById((prev) => ({ ...prev, [inc.id]: e.target.value }))
                      }
                      placeholder="Add caregiver resolution note..."
                      className="flex-1 bg-paper border border-hairline rounded px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {inc.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => acknowledgeIncident(inc.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-ink text-paper rounded hover:bg-ink/85"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => resolveIncident(inc.id, draftNote, false)}
                        className="px-3 py-1.5 text-xs font-medium bg-signal-ok-bg text-signal-ok border border-signal-ok/30 rounded hover:bg-signal-ok hover:text-white transition-colors"
                      >
                        Mark Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveIncident(inc.id, draftNote, true)}
                        className="px-3 py-1.5 text-xs font-medium bg-surface text-ink-secondary border border-hairline rounded hover:bg-subtle hover:text-ink transition-colors"
                      >
                        False Alarm
                      </button>
                    </div>
                  </div>
                ) : (
                  inc.notes && (
                    <div className="pt-3 border-t border-hairline text-xs text-ink-secondary">
                      <span className="font-mono uppercase text-[10px] text-ink-muted mr-2">
                        Note:
                      </span>
                      {inc.notes}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Incidents
