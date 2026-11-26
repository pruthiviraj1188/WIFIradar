import axios from 'axios'

const DEFAULT_API_BASE = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE,
  timeout: 4500,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('wifi_radar_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function checkBackendHealth() {
  try {
    const res = await apiClient.get('/health')
    return res.data?.status === 'healthy'
  } catch {
    return false
  }
}

export async function fetchIncidents(status = null) {
  const params = status && status !== 'all' ? { status } : {}
  const res = await apiClient.get('/api/incidents/', { params })
  return res.data
}

export async function acknowledgeIncidentApi(id) {
  const res = await apiClient.patch(`/api/incidents/${id}/acknowledge`)
  return res.data
}

export async function resolveIncidentApi(id, payload) {
  const res = await apiClient.patch(`/api/incidents/${id}/resolve`, payload)
  return res.data
}

export async function fetchDevices() {
  const res = await apiClient.get('/api/devices/')
  return res.data
}

export async function fetchRooms() {
  const res = await apiClient.get('/api/rooms/')
  return res.data
}

export async function fetchActivities(limit = 50) {
  const res = await apiClient.get('/api/activities/', { params: { limit } })
  return res.data
}

export async function fetchDailyAnalytics() {
  const res = await apiClient.get('/api/analytics/daily')
  return res.data
}

export async function fetchEsp32Status() {
  const res = await apiClient.get('/api/esp32/status')
  return res.data
}

export async function fetchEmergencyContacts() {
  const res = await apiClient.get('/api/esp32/contacts')
  return res.data.contacts || []
}

export async function addEmergencyContactApi(contact) {
  const res = await apiClient.post('/api/esp32/contacts', contact)
  return res.data.contacts || []
}

export async function deleteEmergencyContactApi(id) {
  const res = await apiClient.delete(`/api/esp32/contacts/${id}`)
  return res.data.contacts || []
}

export async function triggerEmergencyEscalationApi(payload) {
  const res = await apiClient.post('/api/esp32/escalate', payload)
  return res.data
}

export function getWebSocketUrl(roomId = 1) {
  const configured = import.meta.env.VITE_WS_URL
  if (configured) {
    return `${configured.replace(/\/$/, '')}/ws/csi/${roomId}`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/csi/${roomId}`
}

/**
 * Generates a realistic 52-subcarrier CSI amplitude frame matching
 * backend/app/api/websocket.py::_generate_csi_sample
 */
export function generateSimulatedCsiFrame(activity, t, roomId = 1, frame = 0) {
  const nSubcarriers = 52
  const freqMap = { walk: 2.0, stand: 0.5, sit: 0.3, Jump: 4.0, fall: 8.0 }
  const ampMap = { walk: 0.4, stand: 0.1, sit: 0.08, Jump: 0.6, fall: 0.9 }
  const noiseMap = { walk: 0.05, stand: 0.02, sit: 0.02, Jump: 0.08, fall: 0.15 }

  const baseFreq = freqMap[activity] ?? 1.0
  const amplitude = ampMap[activity] ?? 0.2
  const noise = noiseMap[activity] ?? 0.03

  const csi_data = []
  for (let i = 0; i < nSubcarriers; i++) {
    const phaseOffset = i * ((2 * Math.PI) / nSubcarriers)
    const gaussian = (Math.random() + Math.random() + Math.random() - 1.5) * noise * 1.6
    const val = amplitude * Math.sin(2 * Math.PI * baseFreq * t + phaseOffset) + gaussian
    csi_data.push(Number(val.toFixed(4)))
  }

  const confidence = Number((0.74 + Math.random() * 0.23).toFixed(3))
  const rssi = Math.round(-58 + (Math.random() - 0.5) * 14)

  // Generate breathing rate (12-20 BPM normal range)
  const bpmMap = { walk: 18.0, stand: 14.5, sit: 14.5, Jump: 22.0, fall: 24.0 }
  const baseBpm = bpmMap[activity] ?? 15.5
  const breathing_bpm = Number((baseBpm + Math.sin(t * 0.5) * 1.5 + (Math.random() - 0.5) * 0.6).toFixed(1))

  const payload = {
    type: 'csi_update',
    room_id: roomId,
    timestamp: new Date().toISOString(),
    activity,
    confidence,
    csi_data,
    rssi,
    frame,
    breathing_bpm,  // Add breathing rate
  }

  if (activity === 'fall') {
    payload.alert = {
      type: 'fall_detected',
      severity: 'high',
      message: `Fall detected in Room ${roomId} (${Math.round(confidence * 100)}% confidence)`,
      timestamp: payload.timestamp,
    }
  }

  return payload
}
