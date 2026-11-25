# WiFi-Radar

**Intelligent. Invisible. Always There.**

A camera-free, wearable-free human activity and elderly safety monitoring system using WiFi Channel State Information (CSI).

## ⚠️ Important Disclaimer

This is a research prototype. The system is NOT:
- A medical device
- Certified for clinical use
- A replacement for professional medical monitoring
- Validated for real-world emergency detection

Always maintain traditional safety measures alongside this experimental system.

## Project Status

**Current Phase:** ✅ **ALL 9 PHASES COMPLETE!** 🎉

- [x] Phase 1: Dataset Inspection & Visualization
- [x] Phase 2: Activity Classification Model (87% fall recall)
- [x] Phase 3: Breathing Analysis (Experimental)
- [x] Phase 4: ESP32 Integration
- [x] Phase 5: Backend API (FastAPI)
- [x] Phase 6: Frontend Dashboard (React)
- [x] Phase 7: Notification System
- [x] Phase 8: 3D Visualization
- [x] Phase 9: Testing & QA (12/12 tests passing)

**See [ALL_PHASES_COMPLETE.md](ALL_PHASES_COMPLETE.md) for complete details.**

## System Overview

WiFi-Radar uses changes in WiFi Channel State Information (CSI) to:
1. Classify human activities (walking, sitting, standing, lying down, jumping)
2. Detect potential fall events
3. Experimentally monitor breathing patterns
4. Alert caregivers to potential emergencies

**No cameras. No wearables. No buttons.**

## Architecture

```
WiFi Router → Human Interaction → ESP32 CSI Receiver
                                         ↓
                                  Signal Processing
                                         ↓
                                  AI Classification
                                         ↓
                                  Fall Verification
                                         ↓
                              Caregiver Dashboard & Alerts
```

## Repository Structure

```
wifi-radar/
├── config/           # Configuration files (requirements, .env)
├── scripts/          # Utility scripts (verify, check status)
├── docs/            # Documentation
├── datasets/        # Dataset inspection & CSI data
├── ai/              # ML models, preprocessing, training
├── hardware/        # ESP32 firmware and configuration
├── data_collection/ # Real-time CSI capture
├── backend/         # FastAPI services
├── frontend/        # React dashboard
├── tests/           # Unit & integration tests
└── logs/            # Application logs
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed architecture.

## Development Phases

1. **Phase 1:** Dataset inspection and preprocessing ← **YOU ARE HERE**
2. **Phase 2:** Activity classification model
3. **Phase 3:** Breathing analysis research
4. **Phase 4:** ESP32 real-time integration
5. **Phase 5:** Backend API development
6. **Phase 6:** Caregiver dashboard
7. **Phase 7:** Alert and notification system
8. **Phase 8:** 3D visualization
9. **Phase 9:** End-to-end testing

## Quick Start

### Prerequisites
- Python 3.10 or higher
- pip and virtualenv
- Git
- 8GB+ RAM recommended
- 10GB+ free disk space for datasets

### Installation

```bash
# Clone repository
cd wifi-radar

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install --upgrade pip
pip install -r config/requirements.txt
```

### Phase 1: Dataset Inspection

```bash
# Activate environment
source venv/bin/activate

# Verify setup
python scripts/verify_setup.py

# Inspect WiFall dataset
python datasets/inspect_wifall.py

# Visualize CSI signals
python datasets/visualize_csi.py

# Check progress
python scripts/check_status.py
```

## Target Activities

- **Walking:** Person moving through the monitored space
- **Sitting:** Person transitioning to or remaining in sitting position
- **Standing:** Person standing still or with minimal movement
- **Lying Down:** Person lying on bed or floor intentionally
- **Falling:** Sudden uncontrolled descent to ground
- **Jumping:** Vertical movement with both feet leaving ground
- **Empty Room:** No person present (baseline)

## Datasets

### Activity & Fall Detection
1. **WiFall** (Primary): ESP32-S3 CSI, includes falls
2. **UT-HAR**: Activity recognition dataset
3. **FallDar**: Fall detection dataset

### Breathing Analysis (Experimental)
1. **WiRe-Breath**: Respiratory monitoring
2. **NIST BreatheSmart**: Respiratory motion
3. **Intel Wi-Fi CSI Respiratory**: Breathing patterns

## Technology Stack

**Hardware:**
- ESP32-S3-DevKitC-1
- WiFi router (2.4GHz/5GHz)

**AI/ML:**
- Python 3.10+
- PyTorch
- NumPy, SciPy
- scikit-learn

**Backend:**
- FastAPI
- WebSocket
- SQLite → PostgreSQL
- MQTT (optional)

**Frontend:**
- React 18
- Tailwind CSS
- Recharts
- Three.js / React Three Fiber

## Contributing

This is a student research project. Contributions, suggestions, and feedback welcome.

## License

[To be determined]

## Contact

[Your contact information]

---

Built with ❤️ for elderly safety and independence
