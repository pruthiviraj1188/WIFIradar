# WiFi-Radar Project Structure

Complete directory organization and architecture layout.

## 📁 Directory Tree

```
wifi-radar/
│
├── 📄 README.md                    # Project overview
├── 📄 QUICKSTART.md               # 10-minute setup guide
├── 📄 PROJECT_STRUCTURE.md        # This file
├── 📄 .gitignore                  # Git exclusions
│
├── 📂 config/                     # Configuration files
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example              # Environment variables template
│   └── README.md                 # Configuration guide
│
├── 📂 scripts/                    # Utility scripts
│   ├── verify_setup.py           # Environment verification
│   ├── check_status.py           # Progress tracking
│   └── README.md                 # Scripts documentation
│
├── 📂 docs/                       # Documentation
│   ├── phase1_instructions.md    # Phase 1 detailed guide
│   ├── architecture.md           # System architecture
│   ├── api_documentation.md      # API docs (Phase 5+)
│   ├── hardware_setup.md         # Hardware guide (Phase 4+)
│   └── deployment.md             # Deployment guide (Phase 9+)
│
├── 📂 datasets/                   # Dataset management
│   ├── inspect_wifall.py         # WiFall inspector
│   ├── visualize_csi.py          # CSI visualizer
│   ├── load_uthar.py             # UT-HAR loader (Phase 2)
│   ├── load_falldar.py           # FallDar loader (Phase 2)
│   │
│   ├── raw/                      # Raw datasets (gitignored)
│   │   ├── wifall/
│   │   ├── uthar/
│   │   ├── falldar/
│   │   ├── wire_breath/
│   │   └── nist_breathe/
│   │
│   ├── processed/                # Preprocessed data (gitignored)
│   │   ├── activity/
│   │   └── breathing/
│   │
│   └── metadata/                 # Dataset documentation
│       ├── wifall_inspection.json
│       └── visualizations/
│           ├── raw_csi_samples.png
│           ├── csi_spectrograms.png
│           ├── csi_amplitude_statistics.png
│           └── signal_variance.png
│
├── 📂 ai/                         # AI/ML components
│   │
│   ├── 📂 preprocessing/         # Signal processing
│   │   ├── __init__.py
│   │   ├── filters.py            # Noise filtering
│   │   ├── normalization.py      # Signal normalization
│   │   ├── segmentation.py       # Window segmentation
│   │   ├── features.py           # Feature extraction
│   │   └── spectrograms.py       # STFT generation
│   │
│   ├── 📂 activity_detection/    # Activity classification
│   │   ├── __init__.py
│   │   ├── dataset.py            # PyTorch dataset
│   │   ├── models.py             # CNN architectures
│   │   ├── baseline.py           # Random Forest baseline
│   │   ├── train.py              # Training script
│   │   └── evaluate.py           # Evaluation script
│   │
│   ├── 📂 fall_detection/        # Fall verification
│   │   ├── __init__.py
│   │   ├── verifier.py           # Multi-stage verification
│   │   ├── temporal.py           # Temporal consistency
│   │   └── threshold.py          # Confidence thresholds
│   │
│   ├── 📂 breathing_analysis/    # Breathing module (experimental)
│   │   ├── __init__.py
│   │   ├── waveform.py           # Waveform extraction
│   │   ├── rate_estimation.py    # Breathing rate
│   │   └── patterns.py           # Pattern classification
│   │
│   ├── 📂 evaluation/            # Model evaluation
│   │   ├── __init__.py
│   │   ├── metrics.py            # Performance metrics
│   │   ├── confusion_matrix.py   # Confusion analysis
│   │   └── reports.py            # Evaluation reports
│   │
│   └── 📂 saved_models/          # Trained models (gitignored)
│       ├── activity_cnn_v1.pth
│       ├── activity_rf_v1.pkl
│       ├── label_mapping.json
│       └── preprocessing_config.json
│
├── 📂 hardware/                   # ESP32 firmware & config
│   │
│   ├── 📂 esp32_firmware/        # ESP-IDF firmware
│   │   ├── main/
│   │   │   ├── main.c            # Main entry point
│   │   │   ├── wifi_csi.c        # CSI capture
│   │   │   ├── wifi_csi.h
│   │   │   └── CMakeLists.txt
│   │   ├── CMakeLists.txt
│   │   ├── sdkconfig
│   │   └── README.md             # Firmware build guide
│   │
│   └── 📂 configuration/         # Hardware config
│       ├── router_setup.md       # Router configuration
│       ├── esp32_pinout.md       # Pin connections
│       └── calibration.md        # Device calibration
│
├── 📂 data_collection/           # Real-time data capture
│   │
│   ├── 📂 csi_receiver/          # ESP32 communication
│   │   ├── __init__.py
│   │   ├── serial_receiver.py    # Serial communication
│   │   ├── wifi_receiver.py      # WiFi communication
│   │   └── packet_parser.py      # CSI packet parsing
│   │
│   ├── 📂 recording/             # Data recording
│   │   ├── __init__.py
│   │   ├── recorder.py           # Recording manager
│   │   └── formats.py            # Data formats
│   │
│   ├── 📂 visualization/         # Live visualization
│   │   ├── __init__.py
│   │   ├── live_plot.py          # Real-time graphs
│   │   └── signal_quality.py     # Quality indicators
│   │
│   └── 📂 recordings/            # Saved recordings (gitignored)
│       └── .gitkeep
│
├── 📂 backend/                    # FastAPI backend
│   │
│   ├── 📂 app/                   # Main application
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry
│   │   ├── config.py             # App configuration
│   │   └── dependencies.py       # Dependency injection
│   │
│   ├── 📂 api/                   # API routes
│   │   ├── __init__.py
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── devices.py            # Device management
│   │   ├── rooms.py              # Room management
│   │   ├── csi.py                # CSI data endpoints
│   │   ├── activities.py         # Activity events
│   │   ├── incidents.py          # Fall incidents
│   │   ├── notifications.py      # Notifications
│   │   └── analytics.py          # Analytics endpoints
│   │
│   ├── 📂 models/                # Database models
│   │   ├── __init__.py
│   │   ├── user.py               # User model
│   │   ├── device.py             # Device model
│   │   ├── room.py               # Room model
│   │   ├── csi_record.py         # CSI records
│   │   ├── activity.py           # Activity events
│   │   ├── incident.py           # Incidents
│   │   └── notification.py       # Notifications
│   │
│   ├── 📂 services/              # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py       # Authentication
│   │   ├── csi_service.py        # CSI processing
│   │   ├── inference_service.py  # Model inference
│   │   ├── incident_service.py   # Incident management
│   │   └── notification_service.py # Notifications
│   │
│   ├── 📂 database/              # Database configuration
│   │   ├── __init__.py
│   │   ├── connection.py         # DB connection
│   │   └── migrations/           # Alembic migrations
│   │
│   ├── 📂 websocket/             # WebSocket handlers
│   │   ├── __init__.py
│   │   ├── manager.py            # Connection manager
│   │   └── handlers.py           # Message handlers
│   │
│   └── 📂 tests/                 # Backend tests
│       ├── test_api.py
│       └── test_services.py
│
├── 📂 frontend/                   # React application
│   │
│   ├── 📂 public/                # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── logo.png
│   │
│   ├── 📂 src/                   # Source code
│   │   ├── App.jsx               # Main app component
│   │   ├── index.js              # Entry point
│   │   ├── index.css             # Global styles
│   │   │
│   │   ├── 📂 components/        # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── CSIGraph.jsx
│   │   │   ├── ActivityCard.jsx
│   │   │   └── IncidentAlert.jsx
│   │   │
│   │   ├── 📂 pages/             # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LiveMonitoring.jsx
│   │   │   ├── Alerts.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── BreathingAnalysis.jsx
│   │   │   ├── RoomManagement.jsx
│   │   │   ├── CaregiverManagement.jsx
│   │   │   ├── DeviceSettings.jsx
│   │   │   └── Reports.jsx
│   │   │
│   │   ├── 📂 services/          # API clients
│   │   │   ├── api.js            # Axios instance
│   │   │   ├── authService.js
│   │   │   ├── deviceService.js
│   │   │   └── incidentService.js
│   │   │
│   │   ├── 📂 visualizations/    # 3D & charts
│   │   │   ├── Room3D.jsx        # Three.js room
│   │   │   ├── CSIChart.jsx      # Recharts CSI
│   │   │   └── ActivityTimeline.jsx
│   │   │
│   │   ├── 📂 hooks/             # Custom hooks
│   │   │   ├── useWebSocket.js
│   │   │   ├── useAuth.js
│   │   │   └── useRealTimeCSI.js
│   │   │
│   │   └── 📂 utils/             # Utilities
│   │       ├── constants.js
│   │       ├── formatters.js
│   │       └── validators.js
│   │
│   ├── package.json              # NPM dependencies
│   ├── vite.config.js            # Vite configuration
│   └── tailwind.config.js        # Tailwind CSS config
│
├── 📂 tests/                      # Project-wide tests
│   ├── __init__.py
│   ├── conftest.py               # Pytest configuration
│   │
│   ├── 📂 unit/                  # Unit tests
│   │   ├── test_preprocessing.py
│   │   ├── test_models.py
│   │   └── test_utils.py
│   │
│   ├── 📂 integration/           # Integration tests
│   │   ├── test_data_pipeline.py
│   │   ├── test_inference.py
│   │   └── test_api.py
│   │
│   └── 📂 fixtures/              # Test fixtures
│       ├── sample_csi.npy
│       └── mock_responses.json
│
└── 📂 logs/                       # Application logs (gitignored)
    └── .gitkeep
```

## 🎯 Key Design Principles

### 1. **Separation of Concerns**
- Each directory has a single, clear purpose
- No cross-contamination between layers
- Clean interfaces between components

### 2. **Scalability**
- Modular architecture allows independent scaling
- Each service can be containerized
- Database can be migrated/replicated

### 3. **Testability**
- Tests mirror source structure
- Fixtures isolated from production code
- Easy to mock dependencies

### 4. **Documentation**
- README in every major directory
- Inline docstrings for all functions
- Architecture docs at project root

### 5. **Maintainability**
- Consistent naming conventions
- Clear file purposes
- Minimal coupling between modules

## 📦 Module Dependencies

```
frontend → backend API → services → models → database
                       → AI inference → models
                       
hardware → data_collection → preprocessing → AI models

datasets → preprocessing → AI training
```

## 🔄 Data Flow

```
1. ESP32 Hardware
   ↓
2. data_collection/csi_receiver
   ↓
3. ai/preprocessing
   ↓
4. ai/activity_detection
   ↓
5. ai/fall_detection (verification)
   ↓
6. backend/services
   ↓
7. backend/database
   ↓
8. backend/websocket
   ↓
9. frontend/components
```

## 🚀 Development Workflow

### Phase 1-3: Foundation (Current)
- Work in: `datasets/`, `ai/`
- Output: Trained models in `ai/saved_models/`

### Phase 4: Hardware Integration
- Work in: `hardware/`, `data_collection/`
- Test: Real-time CSI capture

### Phase 5-6: Application Development
- Work in: `backend/`, `frontend/`
- Deploy: Local development servers

### Phase 7-8: Advanced Features
- Work in: `backend/services/`, `frontend/visualizations/`
- Integrate: Notification system, 3D rendering

### Phase 9: Testing & Deployment
- Work in: `tests/`, `docs/`
- Output: Production deployment

## 📝 File Naming Conventions

### Python
- **Modules:** `snake_case.py`
- **Classes:** `PascalCase`
- **Functions:** `snake_case()`
- **Constants:** `UPPER_SNAKE_CASE`

### JavaScript/React
- **Components:** `PascalCase.jsx`
- **Utilities:** `camelCase.js`
- **Constants:** `UPPER_SNAKE_CASE`

### Documentation
- **General docs:** `lowercase_with_underscores.md`
- **Top-level:** `UPPERCASE.md` (README, QUICKSTART)

## 🔧 Configuration Files

| File | Purpose | Phase |
|------|---------|-------|
| `config/requirements.txt` | Python dependencies | 1 |
| `config/.env.example` | Environment template | 1 |
| `frontend/package.json` | Node dependencies | 6 |
| `frontend/vite.config.js` | Vite bundler | 6 |
| `frontend/tailwind.config.js` | Tailwind CSS | 6 |
| `hardware/esp32_firmware/sdkconfig` | ESP32 config | 4 |
| `.gitignore` | Git exclusions | 1 |

---

**This structure supports all 9 phases of development while maintaining clean architecture principles.**
