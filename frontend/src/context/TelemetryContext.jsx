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
  { id: 1, name: 'Living Room', location: 'Ground Floor · North', deviceName: 'ESP32-WROOM-01', mac: 'A4:CF:12:8E:31:04', status: 'online', rssi: -52, breathingBpm: 16.2 },
  { id: 2, name: 'Primary Bedroom', location: 'First Floor · East', deviceName: 'ESP32-WROOM-02', mac: 'A4:CF:12:8E:31:09', status: 'online', rssi: -61, breathingBpm: 14.8 },
  { id: 3, name: 'Hallway & Bath', location: 'First Floor · Center', deviceName: 'ESP32-WROOM-03', mac: 'A4:CF:12:8E:31:12', status: 'standby', rssi: -69, breathingBpm: null },
]

const INITIAL_ACTIVITIES = [
  { id: 'act-105', roomId: 1, roomName: 'Living Room', activity: 'walk', confidence: 0.91, timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: 'normal' },
  { id: 'act-104', roomId: 1, roomName: 'Living Room', activity: 'sit', confidence: 0.87, timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(), status: 'normal' },
  { id: 'act-103', roomId: 2, roomName: 'Primary Bedroom', activity: 'stand', confidence: 0.84, timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(), status: 'normal' },
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
    notes: 'Caregiver checked in; resident safe.',
    is_false_alarm: false,
  },
]

const SIM_ACTIVITIES = ['walk', 'stand', 'sit', 'Jump']

async function findNearestHospitalFree(lat, lng) {
  try {
    const query = `[out:json][timeout:6];(node["amenity"="hospital"](around:6000,${lat},${lng});way["amenity"="hospital"](around:6000,${lat},${lng}););out center 1;`
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
    const data = await res.json()
    const el = data.elements?.[0]
    if (el) {
      return {
        name: el.tags?.name || 'Nearest Emergency Hospital',
        phone: el.tags?.phone || el.tags?.['contact:phone'] || '108',
        lat: el.lat ?? el.center?.lat ?? lat,
        lng: el.lon ?? el.center?.lon ?? lng,
      }
    }
  } catch {
    // fallback if offline
  }
  return { name: 'Emergency Ambulance Service (108)', phone: '108', lat, lng }
}

export function TelemetryProvider({ children }) {
  const [rooms, setRooms] = useState(INITIAL_ROOMS)
  const [selectedRoomId, setSelectedRoomId] = useState(1)
  const [connectionMode, setConnectionMode] = useState('simulated')
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

  // Live GPS + Saved Address + Nearest Hospital State
  const [userLocation, setUserLocation] = useState({
    lat: 13.0827,
    lng: 80.2707,
    address: localStorage.getItem('wifi_radar_home_address') || 'Home Residence',
    source: 'default',
  })
  const [nearestHospital, setNearestHospital] = useState({
    name: 'Nearest Emergency Hospital',
    phone: localStorage.getItem('wifi_radar_hospital_phone') || '108',
  })

  // Escalation State Machine:
  // 'idle' | 'counting_contact' (0-30s) | 'counting_hospital' (30-45s) | 'hospital_dispatched' (45s+) | 'recovered'
  const [elapsedFallSeconds, setElapsedFallSeconds] = useState(0)
  const [escalationState, setEscalationState] = useState('idle')
  const [dispatchedLog, setDispatchedLog] = useState([])

  const [settings, setSettings] = useState({
    samplingRateHz: 10,
    fallConfidenceThreshold: 0.75,
    subcarrierCount: 52,
    homeAddress: localStorage.getItem('wifi_radar_home_address') || '',
    customHospitalPhone: localStorage.getItem('wifi_radar_hospital_phone') || '108',
    channels: { sms: true, email: true, whatsapp: false, inApp: true },
  })

  const simTickRef = useRef({ t: 0, frame: 1, activity: 'stand', countdown: 24 })
  const wsRef = useRef(null)
  const stage30TriggeredRef = useRef(false)
  const stage45TriggeredRef = useRef(false)

  // Acquire Browser GPS + Nearest Free Overpass Hospital on Mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          setUserLocation((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            source: 'gps',
          }))
          const hosp = await findNearestHospitalFree(latitude, longitude)
          setNearestHospital((prev) => ({
            name: hosp.name,
            phone: localStorage.getItem('wifi_radar_hospital_phone') || hosp.phone,
          }))
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [])

  useEffect(() => {
    let mounted = true
    checkBackendHealth().then((ok) => {
      if (mounted) setBackendHealthy(ok)
    })
    return () => { mounted = false }
  }, [])

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
              message: `ESP32 Fall Detected (${Math.round((inf.confidence ?? 0) * 100)}% confidence)`,
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
    return () => { mounted = false; window.clearInterval(timer) }
  }, [backendHealthy, selectedRoomId])

  const ingestFrame = (payload) => {
    setCurrentFrame(payload)

    const ampMean =
      payload.csi_data && payload.csi_data.length > 0
        ? payload.csi_data.reduce((acc, v) => acc + Math.abs(v), 0) / payload.csi_data.length
        : 0.1

    setBreathingHistory((prev) => {
      const nextBpm =
        payload.breathing_bpm !== undefined && payload.breathing_bpm !== null
          ? payload.breathing_bpm
          : payload.activity === 'fall' ? 22.4
          : payload.activity === 'Jump' ? 20.1
          : payload.activity === 'walk' ? 17.8
          : 15.2 + Math.sin(payload.frame * 0.2) * 0.9
      return [
        ...prev.slice(-27),
        {
          t: `F${payload.frame}`,
          bpm: Number(nextBpm.toFixed(1)),
          variance: Number(ampMean.toFixed(3)),
        },
      ]
    })

    if (payload.activity === 'fall' && payload.alert) {
      setActiveAlert(payload.alert)
      setEscalationState((prev) => {
        if (prev === 'idle' || prev === 'recovered') {
          stage30TriggeredRef.current = false
          stage45TriggeredRef.current = false
          setElapsedFallSeconds(0)
          setDispatchedLog([])
          return 'counting_contact'
        }
        return prev
      })
    }

    // Auto-cancel escalation if the person stands up or walks before 30s
    const actLower = String(payload.activity || '').toLowerCase()
    if (actLower === 'walk' || actLower === 'stand') {
      setEscalationState((prev) => {
        if (prev === 'counting_contact') {
          setElapsedFallSeconds(0)
          setActiveAlert(null)
          return 'recovered'
        }
        return prev
      })
    }
  }

  useEffect(() => {
    if (isPaused) {
      setConnectionMode('paused')
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
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
        ingestFrame(generateSimulatedCsiFrame(s.activity, s.t, selectedRoomId, s.frame))
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
            if (data.type === 'csi_update') ingestFrame(data)
          } catch {}
        }
        ws.onerror = () => ws.close()
        ws.onclose = () => { if (!fallbackTimer && !isPaused) startSimulator() }
      } catch {
        startSimulator()
      }
    } else {
      startSimulator()
    }

    return () => {
      if (fallbackTimer) window.clearInterval(fallbackTimer)
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    }
  }, [backendHealthy, selectedRoomId, isPaused])

  // Dispatch helper: free Telegram location pin + native tel: call
  const dispatchFreeTierAlert = async (tier, targetName, targetPhone) => {
    const roomObj = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
    const mapsLink = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`

    setDispatchedLog((prev) => [
      ...prev,
      {
        tier,
        name: targetName,
        phone: targetPhone,
        mapsLink,
        time: new Date().toLocaleTimeString(),
      },
    ])

    // 1. Trigger free Telegram Bot notification + native GPS location pin
    try {
      await fetch('/api/emergency/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          name: targetName,
          phone: targetPhone,
          room_name: roomObj.name,
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: settings.homeAddress || userLocation.address,
          hospital_name: nearestHospital.name,
          maps_url: mapsLink,
          confidence: currentFrame?.confidence ?? 0.88,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch {
      // continue even if offline
    }

    // 2. Also notify local backend escalation log
    triggerEmergencyEscalationApi({
      room_name: roomObj.name,
      confidence: currentFrame?.confidence ?? 0.88,
      elapsed_seconds: tier === 'hospital' ? 45 : 30,
      tier,
      lat: userLocation.lat,
      lng: userLocation.lng,
    }).catch(() => {})

    // 3. Initiate free native device phone call (tel:) if a valid phone number exists
    if (targetPhone && targetPhone.replace(/[^\d+]/g, '').length >= 3) {
      try {
        window.location.href = `tel:${targetPhone.replace(/\s+/g, '')}`
      } catch {
        // browser blocked automatic tel: navigation
      }
    }
  }

  // Master 0s -> 30s -> 45s Escalation Clock
  useEffect(() => {
    const activeStates = ['counting_contact', 'counting_hospital']
    if (!activeStates.includes(escalationState)) return

    const timer = window.setInterval(() => {
      setElapsedFallSeconds((prev) => {
        const next = prev + 1

        // STAGE 1: At 30 seconds -> Auto-Call Saved Emergency Contact + Share Location
        if (next >= 30 && !stage30TriggeredRef.current) {
          stage30TriggeredRef.current = true
          setEscalationState('counting_hospital')
          const primaryContact = emergencyContacts[0]
          if (primaryContact) {
            dispatchFreeTierAlert('contact', primaryContact.name, primaryContact.phone)
          } else {
            dispatchFreeTierAlert('contact', 'Emergency Telegram Group', '')
          }
        }

        // STAGE 2: At 45 seconds -> Auto-Call Nearby Hospital + Send Live GPS Pin
        if (next >= 45 && !stage45TriggeredRef.current) {
          stage45TriggeredRef.current = true
          setEscalationState('hospital_dispatched')
          const hospPhone = settings.customHospitalPhone || nearestHospital.phone || '108'
          dispatchFreeTierAlert('hospital', nearestHospital.name, hospPhone)
        }

        return next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [escalationState, emergencyContacts, nearestHospital, settings.customHospitalPhone, userLocation])

  const triggerSimulatedFall = () => {
    const s = simTickRef.current
    s.activity = 'fall'
    s.countdown = 65 // Keep in fall state long enough to test both 30s & 45s escalation
    s.frame += 1
    const frame = generateSimulatedCsiFrame('fall', s.t + 0.25, selectedRoomId, s.frame)
    ingestFrame(frame)

    const roomObj = rooms.find((r) => r.id === selectedRoomId) || rooms[0]
    setIncidents((prev) => [
      {
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
      },
      ...prev,
    ])
  }

  const acknowledgeIncident = async (id) => {
    const now = new Date().toISOString()
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'acknowledged', acknowledged_at: now } : inc))
    )
    if (backendHealthy) {
      try { await acknowledgeIncidentApi(id) } catch {}
    }
  }

  const resolveIncident = async (id, notes = '', isFalseAlarm = false) => {
    const now = new Date().toISOString()
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? { ...inc, status: isFalseAlarm ? 'false_alarm' : 'resolved', resolved_at: now, notes, is_false_alarm: isFalseAlarm }
          : inc
      )
    )
    if (backendHealthy) {
      try { await resolveIncidentApi(id, { notes, is_false_alarm: isFalseAlarm }) } catch {}
    }
  }

  useEffect(() => {
    if (!backendHealthy) return
    fetchEmergencyContacts()
      .then((list) => {
        setEmergencyContacts(list)
        localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(list))
      })
      .catch(() => {})
  }, [backendHealthy])

  const addEmergencyContact = async (contact) => {
    const fallbackList = [...emergencyContacts, { id: Date.now(), ...contact }]
    setEmergencyContacts(fallbackList)
    localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(fallbackList))
    if (backendHealthy) {
      try {
        const updated = await addEmergencyContactApi(contact)
        setEmergencyContacts(updated)
        localStorage.setItem('wifi_radar_emergency_contacts', JSON.stringify(updated))
      } catch {}
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
      } catch {}
    }
  }

  const updateLocationSettings = (address, hospitalPhone) => {
    localStorage.setItem('wifi_radar_home_address', address)
    localStorage.setItem('wifi_radar_hospital_phone', hospitalPhone)
    setSettings((prev) => ({ ...prev, homeAddress: address, customHospitalPhone: hospitalPhone }))
    setUserLocation((prev) => ({ ...prev, address: address || prev.address }))
    setNearestHospital((prev) => ({ ...prev, phone: hospitalPhone || prev.phone }))
  }

  const cancelFallEscalation = () => {
    stage30TriggeredRef.current = false
    stage45TriggeredRef.current = false
    simTickRef.current.activity = 'stand'
    setEscalationState('idle')
    setElapsedFallSeconds(0)
    setActiveAlert(null)
    setDispatchedLog([])
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
      userLocation,
      nearestHospital,
      updateLocationSettings,
      elapsedFallSeconds,
      fallCountdown: Math.max(0, 30 - elapsedFallSeconds),
      hospitalCountdown: Math.max(0, 45 - elapsedFallSeconds),
      escalationState,
      dispatchedLog,
      cancelFallEscalation,
      dismissAlert: cancelFallEscalation,
      triggerSimulatedFall,
      acknowledgeIncident,
      resolveIncident,
      settings,
      setSettings,
    }),
    [
      rooms, selectedRoomId, connectionMode, backendHealthy, isPaused,
      currentFrame, breathingHistory, activities, incidents, activeAlert,
      esp32Status, emergencyContacts, userLocation, nearestHospital,
      elapsedFallSeconds, escalationState, dispatchedLog, settings,
    ]
  )

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext)
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider')
  return ctx
}
