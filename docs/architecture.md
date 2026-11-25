# WiFi-Radar System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WiFi-Radar System                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼────────┐         ┌───────▼────────┐
            │  Hardware      │         │  Software      │
            │  Layer         │         │  Layers        │
            └───────┬────────┘         └───────┬────────┘
                    │                           │
       ┌────────────┴────────────┐              │
       │                         │              │
   ┌───▼────┐              ┌────▼────┐         │
   │ WiFi   │              │ ESP32   │         │
   │ Router │─────WiFi────▶│ CSI     │         │
   └────────┘   Signal     │ Receiver│         │
                           └────┬────┘         │
                                │              │
                           USB/Serial          │
                                │              │
                    ┌───────────▼──────────────▼─────────────┐
                    │                                         │
                    │      Data Processing & AI Layer        │
                    │   • CSI Capture                        │
                    │   • Signal Processing                  │
                    │   • Activity Classification            │
                    │   • Fall Detection                     │
                    │   • Breathing Analysis (Experimental)  │
                    │                                         │
                    └───────────┬─────────────────────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │                         │
                    │    Backend Layer        │
                    │   • FastAPI             │
                    │   • WebSocket           │
                    │   • Database            │
                    │   • Notification System │
                    │                         │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │                         │
                    │   Frontend Layer        │
                    │   • React Dashboard     │
                    │   • Real-time Graphs    │
                    │   • Alert Management    │
                    │   • 3D Visualization    │
                    │                         │
                    └───────────┬─────────────┘
                                │
                                ▼
                          Caregiver
```

## Component Details

### 1. Hardware Layer

#### WiFi Router/Transmitter
- **Purpose:** Transmit WiFi signals that interact with human body
- **Requirements:**
  - 2.4 GHz or 5 GHz WiFi
  - Standard 802.11n/ac/ax protocol
  - Stable signal output
- **Configuration:**
  - Fixed position (documented)
  - Known transmission power
  - Minimal movement

#### ESP32 CSI Receiver
- **Model:** ESP32-S3-DevKitC-1 (recommended)
- **Firmware:** Custom ESP-IDF firmware
- **Capabilities:**
  - WiFi CSI packet capture
  - Real-time data streaming
  - USB serial communication
- **Data Output:**
  - CSI amplitude and phase
  - Packet timestamps
  - RSSI values
  - Metadata

**Hardware Setup:**
```
Router Position (R) ←─── 3-5 meters ───→ ESP32 Receiver (E)
        │                                       │
        │                                       │
        └────── Monitored Space ───────────────┘
                 (Person moves here)
```

### 2. Data Collection Layer

#### CSI Capture Module
- **Language:** Python
- **Responsibilities:**
  - Receive serial/WiFi data from ESP32
  - Parse firmware output format
  - Validate packet structure
  - Store raw recordings
  - Handle connection errors

#### Real-time Visualization
- **Purpose:** Monitor live CSI signals
- **Features:**
  - Live amplitude graphs
  - Signal quality indicators
  - Connection status
  - Packet loss tracking

### 3. Signal Processing Layer

#### Preprocessing Pipeline
```
Raw CSI → Noise Filter → Normalization → Segmentation → Features
```

**Steps:**
1. **Noise Filtering**
   - Butterworth low-pass filter
   - Outlier detection and removal
   - Signal quality checks

2. **Normalization**
   - Min-max scaling
   - Z-score normalization
   - Amplitude calibration

3. **Segmentation**
   - Fixed-length sliding windows
   - Overlap strategy (50%)
   - Timestamp preservation

4. **Feature Extraction**
   - Time-domain features (mean, std, variance)
   - Frequency-domain features (FFT, spectral entropy)
   - Statistical features (skewness, kurtosis)

#### Spectrogram Generation
- Short-Time Fourier Transform (STFT)
- Time-frequency representation
- Input for 2D CNN models

### 4. AI/ML Layer

#### Activity Classification Model

**Architecture Options:**

1. **Baseline: Random Forest**
   - Input: Hand-crafted features
   - Classes: 7 activities
   - Fast inference
   - Interpretable

2. **1D CNN**
   - Input: Raw time-series CSI
   - Layers: Conv1D → MaxPool → Dense
   - Direct temporal patterns

3. **2D CNN**
   - Input: CSI spectrograms
   - Layers: Conv2D → MaxPool → Dense
   - Time-frequency patterns

**Target Classes:**
- Walking
- Sitting
- Standing
- Lying Down
- Falling
- Jumping
- Empty Room

#### Fall Detection Verification Layer

**Multi-stage verification prevents false alarms:**

```
Model Prediction → Confidence Check → Temporal Consistency → 
Signal Quality Check → History Analysis → Incident Created
```

**Verification Criteria:**
- Prediction confidence > 0.85
- 3+ consecutive fall predictions
- Signal quality > threshold
- Not duplicate of recent incident
- Activity history analysis

#### Breathing Analysis Module (Experimental)

**Two-phase approach:**
1. **Respiratory Waveform Extraction**
   - Bandpass filtering (0.1-0.5 Hz)
   - Signal periodicity detection
   - Breathing rate estimation

2. **Pattern Classification** (if validated)
   - Normal breathing
   - Slow breathing
   - Fast breathing
   - Irregular patterns

**Important:** Does NOT claim apnea detection without validation.

### 5. Backend Layer

#### FastAPI Application

**Core APIs:**
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/devices/
POST   /api/devices/register
GET    /api/rooms/
POST   /api/csi/live
GET    /api/activities/
GET    /api/incidents/
POST   /api/incidents/{id}/acknowledge
POST   /api/incidents/{id}/resolve
GET    /api/analytics/daily
GET    /api/notifications/
```

#### WebSocket Communication
```
ws://backend:8001/ws/{room_id}

Events:
- csi_update: Live CSI data
- activity_detected: New activity classification
- fall_alert: Potential fall incident
- device_status: Connection updates
```

#### Database Schema

**Tables:**

1. **users**
   - user_id, email, password_hash, role, created_at

2. **rooms**
   - room_id, name, location, device_id

3. **devices**
   - device_id, mac_address, status, last_seen

4. **csi_records**
   - record_id, device_id, timestamp, csi_data, signal_quality

5. **activity_events**
   - event_id, room_id, timestamp, activity_type, confidence

6. **fall_incidents**
   - incident_id, room_id, timestamp, status, confidence, model_prediction

7. **notifications**
   - notification_id, incident_id, caregiver_id, sent_at, acknowledged_at

8. **caregiver_actions**
   - action_id, incident_id, caregiver_id, action_type, timestamp

9. **incident_feedback**
   - feedback_id, incident_id, is_false_alarm, notes

#### Notification Service

**Workflow:**
```
Incident Created
      ↓
Primary Caregiver Notified (Email/SMS/WhatsApp)
      ↓
Wait for Acknowledgment (Timeout: 5 min)
      ↓
If No Response → Secondary Caregiver Notified
      ↓
Caregiver Acknowledges → Status: "Acknowledged"
      ↓
Caregiver Checks Person → Status: "Resolved" or "False Alarm"
```

**Notification Channels:**
- In-app notification (always)
- Email (optional)
- WhatsApp (optional, Phase 7+)
- SMS (optional, Phase 7+)

### 6. Frontend Layer

#### Technology Stack
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **3D:** Three.js / React Three Fiber
- **State:** React Context + Hooks
- **API Client:** Axios
- **WebSocket:** Socket.io-client

#### Page Structure

1. **Login Page**
   - Secure authentication
   - Role-based access

2. **Main Dashboard**
   - System status overview
   - Active alerts
   - Recent activities
   - Device health

3. **Live Monitoring**
   - Real-time CSI graphs
   - Current activity
   - Signal quality
   - 3D room visualization

4. **Alerts & Incidents**
   - Incident list (filterable)
   - Acknowledgment controls
   - Incident timeline
   - False alarm marking

5. **Activity Analytics**
   - Daily activity patterns
   - Weekly trends
   - Activity distribution charts

6. **Breathing Analysis**
   - Respiratory waveform
   - Breathing rate
   - Experimental patterns
   - Data quality indicators

7. **Room Management**
   - Room configuration
   - Device assignment
   - Layout visualization

8. **Caregiver Management**
   - Add/remove caregivers
   - Role assignment
   - Notification preferences

9. **Device Settings**
   - Connection status
   - Firmware version
   - Configuration

10. **Reports**
    - Generate reports
    - Export data (PDF/CSV)

#### Design System

**Colors:**
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Neutral: Gray scale

**Typography:**
- Headings: Inter, sans-serif
- Body: Inter, sans-serif
- Monospace: JetBrains Mono (for data)

**Components:**
- Material design influence
- Healthcare-appropriate aesthetics
- High contrast for readability
- Responsive breakpoints (mobile, tablet, desktop)

### 7. 3D Visualization Layer

#### Smart Room Visualization

**Scene Elements:**
- Room (walls, floor, ceiling)
- Bed
- Elderly person model (animated)
- WiFi router (with signal waves)
- ESP32 receiver
- Signal path visualization

**Animations:**
- WiFi signal propagation
- Person movement (walking, sitting, falling)
- Signal distortion during activity
- Alert indicators (red glow on fall)

**Integration:**
- Connected to real-time activity state
- Updates based on AI predictions
- Simulation mode vs. live mode toggle

## Data Flow

### End-to-End Flow

```
1. WiFi Router transmits signal
         ↓
2. Signal interacts with person's body
         ↓
3. ESP32 receives modified signal (CSI)
         ↓
4. ESP32 firmware extracts CSI data
         ↓
5. Python receiver captures CSI packets
         ↓
6. Signal preprocessing (filter, normalize, segment)
         ↓
7. AI model classifies activity
         ↓
8. Fall verification layer (if fall detected)
         ↓
9. Backend API receives classification
         ↓
10. Database stores event
         ↓
11. WebSocket broadcasts update to frontend
         ↓
12. Dashboard updates in real-time
         ↓
13. If fall: Notification service triggers alert
         ↓
14. Caregiver receives notification
         ↓
15. Caregiver acknowledges and responds
```

### Real-time Processing Pipeline

```
ESP32 CSI Stream (20-50 Hz)
         ↓
Sliding Window Buffer (500 samples)
         ↓
Preprocessing (< 50ms)
         ↓
Model Inference (< 100ms)
         ↓
Verification Layer (< 20ms)
         ↓
Total Latency: < 200ms + network delay
```

## Deployment Architecture

### Development Environment
```
localhost:8000  → FastAPI Backend
localhost:8001  → WebSocket Server
localhost:3000  → React Frontend
/dev/ttyUSB0    → ESP32 Serial Connection
```

### Production Deployment (Future)

```
                  Internet
                     │
                     ▼
              Load Balancer
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   Backend 1    Backend 2    Backend 3
        │            │            │
        └────────────┴────────────┘
                     │
              Database Cluster
             (PostgreSQL)
```

**Components:**
- **Backend:** Docker containers
- **Database:** PostgreSQL with replication
- **Frontend:** Static hosting (Vercel/Netlify)
- **ESP32:** Local network, connects to backend via API

## Security Considerations

1. **Authentication:**
   - JWT tokens
   - Secure password hashing (bcrypt)
   - Role-based access control

2. **API Security:**
   - HTTPS only
   - Rate limiting
   - Input validation
   - SQL injection prevention

3. **Data Privacy:**
   - No video/audio recording
   - Encrypted data transmission
   - Anonymized CSI data
   - GDPR compliance considerations

4. **Device Security:**
   - ESP32 firmware verification
   - Secure WiFi connections
   - Device authentication tokens

## Scalability

### Single Room (MVP)
- 1 ESP32 device
- 1 monitored person
- Local processing
- SQLite database

### Multiple Rooms
- N ESP32 devices
- Centralized backend
- PostgreSQL database
- Distributed processing

### Future: Edge Processing
- On-device AI inference (ESP32-S3)
- Reduced bandwidth
- Lower latency
- Privacy enhancement

## Technical Constraints

### Hardware
- ESP32-S3 limited memory (~520KB RAM)
- WiFi range limitations (5-10 meters)
- Signal interference from other devices

### Software
- Real-time processing requirements
- Model inference latency
- False positive/negative tradeoffs

### Environmental
- Room layout affects signal propagation
- Multiple people create ambiguity
- Furniture and walls cause signal attenuation

---

**This architecture is designed to be modular, testable, and incrementally buildable across the 9 development phases.**
