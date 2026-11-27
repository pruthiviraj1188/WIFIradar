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
  pending:      'bg-red-500/15 text-red-300 border border-red-500/30 font-semibold',
  acknowledged: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium',
  resolved:     'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium',
  false_alarm:  'bg-slate-700/50 text-slate-400 border border-white/10 font-medium',
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
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-red-400">
              Caregiver Triage Queue
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Incident Log &amp; Resolution
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Acknowledge active fall detections, log notes, and classify false positives.
          </p>
        </div>
        <button
          type="button"
          onClick={triggerSimulatedFall}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white transition-all self-start sm:self-auto"
        >
          Log Simulated Fall
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Incidents', value: total, accent: 'text-slate-100' },
          { label: 'Pending Action', value: pending, accent: pending > 0 ? 'text-red-400' : 'text-slate-100' },
          { label: 'In Progress', value: acknowledged, accent: 'text-amber-300' },
          { label: 'False Alarm Rate', value: `${falseAlarmRate}%`, accent: 'text-slate-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-4 card-elevated">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              {stat.label}
            </div>
            <div className={`mt-2 text-2xl font-semibold font-mono tabular-nums ${stat.accent}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                filter === tab.key
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30 font-semibold'
                  : 'bg-slate-900/50 text-slate-400 border-white/10 hover:bg-white/5 hover:text-white'
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
          className="w-full sm:w-64 bg-slate-950/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Incident Cards */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-slate-300">No incidents match this filter</p>
          <p className="text-xs text-slate-500 mt-1">
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
                className="bg-slate-900/75 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 card-elevated"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs text-slate-500">#{inc.id}</span>
                      <h3 className="text-sm font-semibold text-white capitalize">
                        {inc.incident_type} Detected — {inc.room_name || `Room ${inc.room_id}`}
                      </h3>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${STATUS_BADGE[inc.status] || 'bg-slate-800 text-slate-400'}`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 tabular-nums">
                      <span>Logged: {new Date(inc.timestamp).toLocaleString()}</span>
                      <span>Confidence: <span className="text-cyan-400">{Math.round(inc.confidence * 100)}%</span></span>
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
                  <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center gap-3">
                    <input
                      type="text"
                      value={draftNote}
                      onChange={(e) => setNotesById((prev) => ({ ...prev, [inc.id]: e.target.value }))}
                      placeholder="Add caregiver resolution note..."
                      className="flex-1 bg-slate-950/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {inc.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => acknowledgeIncident(inc.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => resolveIncident(inc.id, draftNote, false)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                      >
                        Mark Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveIncident(inc.id, draftNote, true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/60 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                      >
                        False Alarm
                      </button>
                    </div>
                  </div>
                ) : (
                  inc.notes && (
                    <div className="pt-3 border-t border-white/10 text-xs text-slate-400">
                      <span className="font-mono uppercase text-[10px] text-slate-500 mr-2">Note:</span>
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
