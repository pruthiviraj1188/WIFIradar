# WiFi-Radar Quick Reference Card

## 🚀 Essential Commands

### Setup (One-Time)
```bash
cd /Users/pruthiviraj/Downloads/wifi-master
source venv/bin/activate  # Always run this first!
```

### Common Tasks

| Task | Command |
|------|---------|
| **Train Activity Classifier** | `python ai/train_activity_classifier.py` |
| **Demo Breathing Analysis** | `python ai/demo_breathing_analysis.py` |
| **Visualize CSI Data** | `python datasets/visualize_csi.py` |
| **Start Backend Server** | `python backend/run_server.py` |
| **Run All Tests** | `pytest tests/ -v` |
| **View Dataset Info** | `python datasets/inspect_wifall.py` |

---

## 📊 Key Performance Metrics

| Metric | Value |
|--------|-------|
| Fall Detection Recall | **87%** ⭐ |
| Overall Accuracy | 55.35% |
| Breathing Detection | 95.6% |
| Test Pass Rate | 12/12 (100%) |
| Model Size | 23 MB |

---

## 🏗️ Project Layout

```
wifi-master/
├── ai/                  # ML models & training
├── backend/             # FastAPI server
├── frontend/            # React dashboard
├── data_collection/     # ESP32 integration
├── datasets/            # Data & visualizations
├── tests/               # Automated tests
└── docs/                # Documentation
```

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| WebSocket | ws://localhost:8001 |

---

## 🎯 Activities Detected

1. **Walking** 🚶
2. **Sitting** 🪑
3. **Standing** 🧍
4. **Lying Down** 🛏️
5. **Falling** 🚨 (87% recall)

---

## ⚠️ Remember

- ❌ NOT a medical device
- ❌ NOT for clinical use
- ✅ Research prototype only
- ✅ Always maintain traditional safety measures

---

## 📚 Documentation Files

- **SETUP_GUIDE.md** - Complete setup instructions
- **README.md** - Project overview
- **QUICKSTART.md** - 10-minute quick start
- **ALL_PHASES_COMPLETE.md** - Feature list
- **docs/architecture.md** - System design

---

## 🆘 Quick Troubleshooting

**Virtual environment not activated?**
```bash
source venv/bin/activate
```

**Port already in use?**
```bash
lsof -i :8000
kill -9 <PID>
```

**Dataset download failed?**
```bash
ping huggingface.co
python datasets/inspect_wifall.py
```

---

**Need help? Read SETUP_GUIDE.md for detailed instructions!**
