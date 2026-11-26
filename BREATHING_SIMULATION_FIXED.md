# Breathing Simulation Integration - Fixed ✅

## Issue
User reported not seeing breathing simulation in the web interface.

## Root Cause
The websocket backend (`backend/app/api/websocket.py`) was generating CSI data but **not sending breathing rate (BPM)** in the payload. The frontend was calculating breathing from activity type as a fallback, but not receiving real breathing data from the backend.

## Solution Applied

### 1. Backend WebSocket Enhancement
**File**: `backend/app/api/websocket.py`

Added breathing rate simulation to the CSI stream:
- Base BPM varies by activity:
  - **Sitting/Standing**: 14.5 BPM (resting)
  - **Walking**: 18.0 BPM (moderate activity)
  - **Jumping**: 22.0 BPM (intense activity)  
  - **Fall**: 24.0 BPM (distressed/irregular)
- Natural variation using sine wave + Gaussian noise
- Clamped to realistic range: 10-26 BPM
- Added `breathing_bpm` field to websocket payload

### 2. Frontend Context Update
**File**: `frontend/src/context/TelemetryContext.jsx`

Updated `ingestFrame()` to use `breathing_bpm` from websocket payload when available, falling back to activity-based calculation for simulated mode.

### 3. Simulated Frame Generator
**File**: `frontend/src/services/api.js`

Added `breathing_bpm` generation to `generateSimulatedCsiFrame()` for offline/simulated mode, ensuring consistent behavior whether connected to backend or running in simulation mode.

## Verification

### Where to See Breathing Simulation

1. **Dashboard Page** (`/`)
   - Top KPI card shows "Respiration Est." with current BPM
   - Updates in real-time as breathing rate changes with activity

2. **Live Monitoring Page** (`/live`)
   - Bottom chart: "Respiratory Rate & Motion Variance"
   - Real-time line graph showing BPM over last ~28 frames
   - Green line showing breathing rate ranging from 10-26 BPM
   - Normal range indicator: 12-20 BPM

3. **Analytics Page** (`/analytics`)
   - Historical breathing trends
   - Correlation with activity patterns

### Expected Behavior

- **Normal breathing at rest**: 14-16 BPM
- **Walking**: 17-19 BPM
- **Intense activity (Jump)**: 20-23 BPM
- **After fall**: 22-25 BPM (elevated/irregular)
- Chart updates every 100ms (10 Hz)

## Technical Details

### WebSocket Payload Example
```json
{
  "type": "csi_update",
  "room_id": 1,
  "timestamp": "2026-11-25T10:30:45.123Z",
  "activity": "walk",
  "confidence": 0.87,
  "csi_data": [...52 subcarrier amplitudes...],
  "rssi": -52,
  "frame": 1234,
  "breathing_bpm": 17.8
}
```

### Breathing Algorithm
The breathing rate is modulated by:
1. **Base rate** from activity type
2. **Sinusoidal variation** (simulates natural breathing rhythm)
3. **Random noise** (simulates measurement uncertainty)
4. **Realistic clamping** (10-26 BPM range)

## Status
✅ **FIXED** - Breathing simulation now fully integrated and visible in the web interface

Backend restarted: PID 12337 on port 8080  
Frontend auto-reloaded: Vite HMR active on port 3000

## How to Test
1. Open http://localhost:3000
2. Navigate to "Live Monitoring" page
3. Scroll down to see the green "Respiratory Rate" graph
4. Watch the BPM value change as activity switches (walk, sit, stand, jump)
5. Trigger a test fall - breathing rate should spike to 22-25 BPM

## Related Files
- `backend/app/api/websocket.py` - WebSocket CSI stream
- `frontend/src/context/TelemetryContext.jsx` - Telemetry context provider
- `frontend/src/services/api.js` - Simulated frame generator
- `frontend/src/pages/LiveMonitoring.jsx` - Live monitoring UI
- `frontend/src/pages/Dashboard.jsx` - Dashboard UI with BPM card
- `ai/breathing_analysis/breathing_detector.py` - ML breathing detection module
