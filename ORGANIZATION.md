# WiFi-Radar Project Organization

Quick reference for the reorganized project structure.

## 📁 Top-Level Directories

```
wifi-radar/
├── config/           ⚙️  Configuration files (requirements, environment)
├── scripts/          🛠️  Utility scripts (setup, verification, status)
├── docs/            📚  Documentation (guides, architecture)
├── datasets/        📊  Dataset inspection & CSI visualization
├── ai/              🧠  ML models, training, preprocessing
├── hardware/        🔧  ESP32 firmware & configuration
├── data_collection/ 📡  Real-time CSI capture from ESP32
├── backend/         🖥️  FastAPI services & database
├── frontend/        🎨  React dashboard application
├── tests/           ✅  Unit & integration tests
└── logs/            📝  Application logs
```

## 🎯 Find What You Need

### Setup & Getting Started
- **Quick Start:** `QUICKSTART.md`
- **Dependencies:** `config/requirements.txt`
- **Environment:** `config/.env.example`
- **Verify Setup:** `python scripts/verify_setup.py`
- **Check Status:** `python scripts/check_status.py`

### Phase 1: Dataset Inspection
- **Inspector:** `datasets/inspect_wifall.py`
- **Visualizer:** `datasets/visualize_csi.py`
- **Outputs:** `datasets/metadata/`
- **Guide:** `docs/phase1_instructions.md`

### Documentation
- **Overview:** `README.md`
- **Structure:** `PROJECT_STRUCTURE.md` (complete details)
- **Phase 1:** `docs/phase1_instructions.md`
- **Architecture:** `docs/architecture.md`
- **Config:** `config/README.md`
- **Scripts:** `scripts/README.md`
- **Tests:** `tests/README.md`

### AI/ML Development (Phase 2+)
- **Preprocessing:** `ai/preprocessing/`
- **Activity Models:** `ai/activity_detection/`
- **Fall Detection:** `ai/fall_detection/`
- **Breathing:** `ai/breathing_analysis/`
- **Evaluation:** `ai/evaluation/`
- **Saved Models:** `ai/saved_models/`

### Hardware Integration (Phase 4+)
- **Firmware:** `hardware/esp32_firmware/`
- **Config:** `hardware/configuration/`
- **CSI Receiver:** `data_collection/csi_receiver/`
- **Live Viz:** `data_collection/visualization/`

### Backend Development (Phase 5+)
- **Main App:** `backend/app/`
- **API Routes:** `backend/api/`
- **Services:** `backend/services/`
- **Models:** `backend/models/`
- **Database:** `backend/database/`
- **WebSocket:** `backend/websocket/`

### Frontend Development (Phase 6+)
- **Components:** `frontend/src/components/`
- **Pages:** `frontend/src/pages/`
- **Services:** `frontend/src/services/`
- **3D Viz:** `frontend/src/visualizations/`

### Testing (Phase 2+)
- **Unit Tests:** `tests/unit/`
- **Integration:** `tests/integration/`
- **Fixtures:** `tests/fixtures/`

## 🚀 Common Commands

### Initial Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r config/requirements.txt

# Create environment file
cp config/.env.example .env

# Verify everything works
python scripts/verify_setup.py
```

### Phase 1 Workflow
```bash
# Download and inspect dataset
python datasets/inspect_wifall.py

# Create visualizations
python datasets/visualize_csi.py

# Check completion status
python scripts/check_status.py

# View results
open datasets/metadata/visualizations/
```

### Development Workflow (Future Phases)
```bash
# Run tests
pytest tests/

# Run backend server
cd backend && uvicorn app.main:app --reload

# Run frontend dev server
cd frontend && npm run dev

# Check logs
tail -f logs/wifi_radar.log
```

## 📊 File Organization Rules

### Python Files
- **Modules:** `snake_case.py`
- **Classes:** `PascalCase`
- **Functions:** `snake_case()`
- **Constants:** `UPPER_SNAKE_CASE`

### JavaScript/React
- **Components:** `PascalCase.jsx`
- **Utilities:** `camelCase.js`
- **Constants:** `UPPER_SNAKE_CASE`

### Documentation
- **Guides:** `lowercase_with_underscores.md`
- **Top-level:** `UPPERCASE.md`

### Directories
- **All lowercase:** `directory_name/`
- **Underscores:** For multi-word names

## 🗂️ What Goes Where

### Configuration Files
**Location:** `config/`
- Python dependencies
- Environment variables
- Application settings

### Utility Scripts
**Location:** `scripts/`
- Setup verification
- Status checking
- Data migration (future)
- Report generation (future)

### Documentation
**Location:** `docs/` or root
- Technical guides in `docs/`
- Quick references at root
- READMEs in each directory

### Datasets
**Location:** `datasets/`
- **Raw:** Downloaded datasets (gitignored)
- **Processed:** Preprocessed data (gitignored)
- **Metadata:** Inspection reports (tracked in git)
- **Scripts:** Inspector and visualizer

### AI Code
**Location:** `ai/`
- Organized by function (preprocessing, detection, etc.)
- Each subdirectory is a Python package
- Models saved in `ai/saved_models/` (gitignored)

### Hardware Code
**Location:** `hardware/`
- ESP32 firmware (C/C++)
- Hardware configuration docs
- Calibration procedures

### Data Collection
**Location:** `data_collection/`
- Real-time CSI capture
- Recording utilities
- Live visualization

### Backend
**Location:** `backend/`
- FastAPI application
- Database models
- Business logic services
- API endpoints

### Frontend
**Location:** `frontend/`
- React application
- Reusable components
- Page components
- API clients

### Tests
**Location:** `tests/`
- Mirrors source structure
- Unit and integration tests
- Test fixtures and data

### Logs
**Location:** `logs/`
- Application logs (gitignored)
- Rotation handled by logger

## 🎨 Clean Architecture Principles

### Layers
1. **Configuration Layer:** `config/`
2. **Data Layer:** `datasets/`, `data_collection/`
3. **Processing Layer:** `ai/preprocessing/`
4. **Model Layer:** `ai/*/models.py`
5. **Service Layer:** `backend/services/`
6. **API Layer:** `backend/api/`
7. **Presentation Layer:** `frontend/`

### Dependencies Flow
```
frontend → backend API → services → models → database
                       ↓
                  AI inference → saved models
                       ↑
              preprocessing ← raw data
```

### Key Principles
- **Dependencies point inward**
- **No circular dependencies**
- **Each layer is independently testable**
- **Clear interfaces between layers**

## 📝 Maintenance Tips

### Adding New Features
1. Identify the appropriate directory
2. Create module with clear naming
3. Add tests in `tests/`
4. Update relevant README
5. Document in `docs/` if needed

### Keeping It Clean
- Run `python scripts/check_status.py` regularly
- Remove unused files promptly
- Update documentation when changing structure
- Keep gitignore up to date

### Git Best Practices
- Don't commit large datasets
- Don't commit trained models (unless small)
- Don't commit logs
- Don't commit `.env` files
- Do commit `.env.example`

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| **Quick Start** | `QUICKSTART.md` |
| **Full Structure** | `PROJECT_STRUCTURE.md` |
| **Main README** | `README.md` |
| **Phase 1 Guide** | `docs/phase1_instructions.md` |
| **Architecture** | `docs/architecture.md` |
| **Dependencies** | `config/requirements.txt` |
| **Environment** | `config/.env.example` |
| **Verify Setup** | `scripts/verify_setup.py` |
| **Check Status** | `scripts/check_status.py` |
| **Dataset Inspector** | `datasets/inspect_wifall.py` |
| **CSI Visualizer** | `datasets/visualize_csi.py` |

---

**This organization supports clean development from Phase 1 through Phase 9! 🚀**
