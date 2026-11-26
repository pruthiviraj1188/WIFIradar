import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  acknowledgeIncidentApi,
  addEmergencyContactApi,
  checkBackendHealth,
  deleteEmergencyContactApi,
  fetchEmergencyContacts,
  fetchEsp32Status,
  generateSimulatedCsiFrame,
  getWebSocketUrl,
  resolveIncidentApi,
  triggerEmergencyEscalationApi,
} from '../services/api'

const TelemetryContext = createContext(null)

const INITIAL_ROOMS = [
  { id: 1, name: 'Living Room', location: 'Ground Floor · North', deviceName: 'ESP32-S3-01', mac: 'A4:CF:12:8E:31:04', status: 'online', rssi: -52, breathingBpm: 16.2 },
  { id: 2, name: 'Primary Bedroom', location: 'First Floor · East', deviceName: 'ESP32-S3-02', mac: 'A4:CF:12:8E:31:09', status: 'online', rssi: -61, breathingBpm: 14.8 },
  { id: 3, name: 'Hallway & Bath', location: 'First Floor · Center', deviceName: 'ESP32-S3-03', mac: 'A4:CF:12:8E:31:12', status: 'standby', rssi: -69, breathingBpm: null },
]

const INITIAL_ACTIVITIES = [
  { id: 'act-105', roomId: 1, roomName: 'Living Room', activity: 'walk', confidence: 0.91, timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: 'normal' },
  { id: 'act-104', roomId: 1, roomName: 'Living Room', activity: 'sit', confidence: 0.87, timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(), status: 'normal' },
  { id: 'act-103', roomId: 2, roomName: 'Primary Bedroom', activity: 'stand', confidence: 0.84, timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(), status: 'normal' },
  { id: 'act-102', roomId: 1, roomName: 'Living Room', activity: 'walk', confidence: 0.89, timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(), status: 'normal' },
  { id: 'act-101', roomId: 2, roomName: 'Primary Bedroom', activity: 'sit', confidence: 0.93, timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), status: 'normal' },
]

const INITIAL_INCIDENTS = [
  {
    id: 1003,
    room_id: 1,
    room_name: 'Living Room',
    incident_type: 'fall',
    status: 'acknowledged',
    confidence: 0.88,
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    resolved_at: null,
    notes: 'Caregiver called residence; checking in via intercom.',
    is_false_alarm: false,
  },
  {
    id: 1002,
    room_id: 2,
    room_name: 'Primary Bedroom',
    incident_type: 'fall',
    status: 'resolved',
    confidence: 0.82,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 60 * 7 + 45000).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 6.8).toISOString(),
    notes: 'Slip near bedside mat; resident uninjured and assisted back up.',
    is_false_alarm: false,
  },
  {
    id: 1001,
    room_id: 1,
    room_name: 'Living Room',
    incident_type: 'fall',
    status: 'false_alarm',
    confidence: 0.67,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 60 * 22 + 30000).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 21.9).toISOString(),
    notes: 'Heavy chair moved quickly during cleaning.',
    is_false_alarm: true,
  },
]

const SIM_ACTIVITIES = ['walk', 'stand', 'sit', 'Jump']

export function TelemetryProvider({ children }) {
  const [rooms, setRooms] = useState(INITIAL_ROOMS)
  const [selectedRoomId, setSelectedRoomId] = useState(1)
  const [connectionMode, setConnectionMode] = useState('simulated') // 'live' | 'simulated' | 'paused'
  const [backendHealthy, setBackendHealthy] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const [currentFrame, setCurrentFrame] = useState(() =>
    generateSimulatedCsiFrame('stand', 0, 1, 0)
  )
  const [breathingHistory, setBreathingHistory] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      t: `${i}s`,
      bpm: Number((15.4 + Math.sin(i * 0.45) * 1.1).toFixed(1)),
      variance: Number((0.12 + Math.abs(Math.sin(i * 0.3)) * 0.08).toFixed(3)),
    }))
  )
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES)
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS)
  const [activeAlert, setActiveAlert] = useState(null)
  const [esp32Status, setEsp32Status] = useState(null)
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('wifi_radar_emergency_contacts')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [fallCountdown, setFallCountdown] = useState(null)
  const [escalationState, setEscalationState] = useState('idle') // 'idle' | 'counting' | 'recovered' | 'escalated'
  const [dispatchedContacts, setDispatchedContacts] = useState([])

  const [settings, setSettings] = useState({
    samplingRateHz: 10,
    fallConfidenceThreshold: 0.75,
    subcarrierCount: 52,
    channels: {
      sms: true,
      email: true,
      whatsapp: false,
      inApp: true,
    },
    apiBaseUrl: 'http://localhost:8080',
    caregivers: [
      { id: 1, name: 'Dr. Meera Nair', role: 'Primary Caregiver', contact: 'meera.nair@clinic.example' },
      { id: 2, name: 'Arjun Raman', role: 'Family Contact', contact: '+91 98400 00142' },
    ],
  })

  const simTickRef = useRef({ t: 0, frame: 1, activity: 'stand', countdown: 24 })
  const wsRef = useRef(null)

  // Check backend health once on mount
  useEffect(() => {
    let mounted = true
    checkBackendHealth().then((ok) => {
      if (mounted) setBackendHealthy(ok)
    })
    return () => {
      mounted = false
    }
  }, [])

  // Poll real ESP32 hardware + local ML inference status from port 8080 backend
  useEffect(() => {
    if (!backendHealthy) return
    let mounted = true
    const pollEsp32 = async () => {
      try {
        const data = await fetchEsp32Status()
        if (!mounted) return
        setEsp32Status(data)
        const log = data?.logger
        const inf = data?.inference
        if (log && log.records_received > 0 && log.last_amplitudes?.length > 0) {
          const livePayload = {
            type: 'csi_update',
            room_id: selectedRoomId,
            timestamp: log.last_packet_at || new Date().toISOString(),
            activity: inf?.predicted_label || 'stand',
            confidence: inf?.confidence ?? 0.0,
            csi_data: log.last_amplitudes,
            rssi: log.last_rssi ?? -60,
            frame: log.records_received,
          }
          if (inf?.system_state === 'POTENTIAL_FALL') {
            livePayload.alert = {
              type: 'fall_detected',
              severity: 'high',
              message: `ESP32 ML Fall Detected (${Math.round((inf.confidence ?? 0) * 100)}% confidence)`,
              timestamp: livePayload.timestamp,
            }
          }
          ingestFrame(livePayload)
        }
      } catch {
        // ignore transient errors
      }
    }
    pollEsp32()
    const timer = window.setInterval(pollEsp32, 750)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [backendHealthy, selectedRoomId])

  // Handle incoming frame (from either WS or simulator)
  const ingestFrame = (payload) => {
    setCurrentFrame(payload)

    const ampMean =
      payload.csi_data && payload.csi_data.length > 0
        ? payload.csi_data.reduce((acc, v) => acc + Math.abs(v), 0) / payload.csi_data.length
        : 0.1

    setBreathingHistory((prev) => {
      // Use breathing_bpm from payload if available, otherwise calculate from activity
      let nextBpm
      if (payload.breathing_bpm !== undefined && payload.breathing_bpm !== null) {
        nextBpm = payload.breathing_bpm
      } else {
        nextBpm =
          payload.activity === 'fall'
            ? 22.4
            : payload.activity === 'Jump'
            ? 20.1
            : payload.activity === 'walk'
            ? 17.8
            : 15.2 + Math.sin(payload.frame * 0.2) * 0.9
      }
      const next = [
        ...prev.slice(-27),
        {
          t: `F${payload.frame}`,
          bpm: Number(nextBpm.toFixed(1)),
          variance: Number(ampMean.toFixed(3)),
        },
      ]
      return next
    })

    if (payload.activity === 'fall' && payload.alert) {
      setActiveAlert(payload.alert)
      setEscalationState((prev) => {
        if (prev === 'idle' || prev === 'recovered') {
          setFallCountdown(30)
          setDispatchedContacts([])
          return 'counting'
        }
        return prev
      })
    }

    // Auto-cancel 30s fall escalation if person stands up or walks within 30s
    const actLower = String(payload.activity || '').toLowerCase()
    if (actLower === 'walk' || actLower === 'stand') {
      setEscalationState((prev) => {
        if (prev === 'counting') {
          setFallCountdown(null)
          setActiveAlert(null)
          return 'recovered'
        }
        return prev
      })
    }
  }

  // Try WebSocket if backend is healthy, else run smooth local simulator
  useEffect(() => {
    if (isPaused) {
      setConnectionMode('paused')
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }

    let fallbackTimer = null

    const startSimulator = () => {
      setConnectionMode('simulated')
      fallbackTimer = window.setInterval(() => {
        const s = simTickRef.current
        s.countdown -= 1
        if (s.countdown <= 0) {
          s.activity = SIM_ACTIVITIES[Math.floor(Math.random() * SIM_ACTIVITIES.length)]
          s.countdown = 16 + Math.floor(Math.random() * 20)
          const roomObj = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
          setActivities((prev) => [
            {
              id: `act-${Date.now()}`,
              roomId: roomObj.id,
              roomName: roomObj.name,
              activity: s.activity,
              confidence: Number((0.76 + Math.random() * 0.21).toFixed(2)),
              timestamp: new Date().toISOString(),
              status: 'normal',
            },
            ...prev.slice(0, 29),
          ])
        }
        s.t += 0.25
        s.frame += 1
        const frame = generateSimulatedCsiFrame(s.activity, s.t, selectedRoomId, s.frame)
        ingestFrame(frame)
      }, 280)
    }

    if (backendHealthy) {
      try {
        const ws = new WebSocket(getWebSocketUrl(selectedRoomId))
        wsRef.current = ws
        ws.onopen = () => setConnectionMode('live')
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'csi_update') {
              ingestFrame(data)
            }
          } catch {
            // ignore malformed frame
          }
        }
        ws.onerror = () => {
          ws.close()
        }
        ws.onclose = () => {
          if (!fallbackTimer && !isPaused) {
            startSimulator()
          }
        }
      } catch {
        startSimulator()
      }
    } else {
      startSimulator()
    }

    return () => {
      if (fallbackTimer) window.clearInterval(fallbackTimer)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [backendHealthy, selectedRoomId, isPaused])

  const triggerSimulatedFall = () => {
    const s = simTickRef.current
    s.activity = 'fall'
    s.countdown = 18
    s.frame += 1
    const frame = generateSimulatedCsiFrame('fall', s.t + 0.25, selectedRoomId, s.frame)
    ingestFrame(frame)

    const roomObj = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
    const newIncident = {
      id: Date.now() % 100000,
      room_id: roomObj.id,
      room_name: roomObj.name,
      incident_type: 'fall',
      status: 'pending',
      confidence: frame.confidence,
      timestamp: frame.timestamp,
      acknowledged_at: null,
      resolved_at: null,
      notes: '',
      is_false_alarm: false,
    }

    setIncidents((prev) => [newIncident, ...prev])
    setActivities((prev) => [
      {
        id: `act-fall-${Date.now()}`,
        roomId: roomObj.id,
        roomName: roomObj.name,
        activity: 'fall',
        confidence: frame.confidence,
        timestamp: frame.timestamp,
        status: 'alert',
      },
      ...prev.slice(0, 29),
    ])
  }

  const acknowledgeIncident = async (id) => {
    const now = new Date().toISOString()
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id ? { ...inc, status: 'acknowledged', acknowledged_at: now } : inc
      )
    )
    if (backendHealthy) {
      try {
        await acknowledgeIncidentApi(id)
      } catch {
        // local optimistic state remains
      }
    }
  }

  const resolveIncident = async (id, notes = '', isFalseAlarm = false) => {
    const now = new Date().toISOString()
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: isFalseAlarm ? 'false_alarm' : 'resolved',
              resolved_at: now,
              notes: notes || inc.notes,
              is_false_alarm: isFalseAlarm,
            }
          : inc
      )
    )
    if (backendHealthy) {
      try {
        await resolveIncidentApi(id, { notes, is_false_alarm: isFalseAlarm })
      } catch {
        // local optimistic state remains
      }
    }
  }

  // Load saved emergency contacts from backend
  useEffect(() => {
    if (!backendHealthy) return
    fetchEmergencyContacts()
      .then((list) => {
        setEmergencyContacts(list)
        localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(list))
      })
      .catch(() => {})
  }, [backendHealthy])

  // 30-second countdown timer when fall is active; auto-call & notify at 0s
  useEffect(() => {
    if (escalationState !== 'counting' || fallCountdown === null) return

    if (fallCountdown <= 0) {
      setEscalationState('escalated')
      const roomObj = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
      setDispatchedContacts(emergencyContacts)
      triggerEmergencyEscalationApi({
        room_name: roomObj.name,
        confidence: currentFrame?.confidence ?? 0.85,
        elapsed_seconds: 30,
      }).catch(() => {})
      return
    }

    const timer = window.setTimeout(() => {
      setFallCountdown((c) => (c !== null ? c - 1 : null))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [escalationState, fallCountdown, emergencyContacts, rooms, selectedRoomId, currentFrame?.confidence])

  const addEmergencyContact = async (contact) => {
    const fallbackList = [...emergencyContacts, { id: Date.now(), ...contact }]
    setEmergencyContacts(fallbackList)
    localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(fallbackList))
    if (backendHealthy) {
      try {
        const updated = await addEmergencyContactApi(contact)
        setEmergencyContacts(updated)
        localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(updated))
      } catch {
        // keep local list
      }
    }
  }

  const removeEmergencyContact = async (id) => {
    const fallbackList = emergencyContacts.filter((c) => c.id !== id)
    setEmergencyContacts(fallbackList)
    localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(fallbackList))
    if (backendHealthy) {
      try {
        const updated = await deleteEmergencyContactApi(id)
        setEmergencyContacts(updated)
        localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(updated))
      } catch {
        // keep local list
      }
    }
  }

  const cancelFallEscalation = () => {
    setEscalationState('idle')
    setFallCountdown(null)
    setActiveAlert(null)
    setDispatchedContacts([])
  }

  const value = useMemo(
    () => ({
      rooms,
      setRooms,
      selectedRoomId,
      setSelectedRoomId,
      connectionMode,
      backendHealthy,
      setBackendHealthy,
      isPaused,
      setIsPaused,
      currentFrame,
      breathingHistory,
      activities,
      incidents,
      activeAlert,
      esp32Status,
      emergencyContacts,
      addEmergencyContact,
      removeEmergencyContact,
      fallCountdown,
      escalationState,
      dispatchedContacts,
      cancelFallEscalation,
      dismissAlert: cancelFallEscalation,
      triggerSimulatedFall,
      acknowledgeIncident,
      resolveIncident,
      settings,
      setSettings,
    }),
    [
      rooms,
      selectedRoomId,
      connectionMode,
      backendHealthy,
      isPaused,
      currentFrame,
      breathingHistory,
      activities,
      incidents,
      activeAlert,
      esp32Status,
      emergencyContacts,
      fallCountdown,
      escalationState,
      dispatchedContacts,
      settings,
    ]
  )

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext)
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider')
  return ctx
}
