# 🚀 Getting Started with WiFi-Radar

## ✅ Setup Complete!

Your WiFi-Radar system is **ready to use**! All dependencies are installed and verified.

---

## 🎯 What is WiFi-Radar?

WiFi-Radar monitors elderly safety using WiFi signals—**no cameras, no wearables, completely passive**.

### Key Features:
- 🚨 **87% Fall Detection** - Catches 87 out of 100 falls
- 🏃 **Activity Recognition** - Walking, sitting, standing, lying, jumping
- 🫁 **Breathing Monitoring** - Experimental respiratory analysis
- 📊 **Real-time Dashboard** - Web interface for caregivers
- 🔔 **Instant Alerts** - Email/SMS notifications

---

## 🏃 Quick Start (Choose One)

### Option 1: Demo Breathing Analysis (2 minutes)

```bash
cd /Users/pruthiviraj/Downloads/wifi-master
source venv/bin/activate
python ai/demo_breathing_analysis.py
```

**What you'll see:**
- Respiratory waveform visualization
- Breathing rate estimation
- Pattern classification
- 95%+ detection confidence

**Output:** `datasets/metadata/visualizations/breathing_analysis_demo.png`

---

### Option 2: Visualize CSI Signals (3 minutes)

```bash
source venv/bin/activate
python datasets/visualize_csi.py
```

**Creates 4 visualizations:**
1. Raw CSI samples per activity
2. Frequency spectrograms
3. Amplitude statistics
4. Signal variance analysis

**Output:** `datasets/metadata/visualizations/*.png`

---

### Option 3: Start Backend Server (1 minute)

```bash
source venv/bin/activate
python backend/run_server.py
```

**Access:**
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Try the endpoints right in your browser!

---

### Option 4: Train Activity Classifier (10-20 minutes)

```bash
source venv/bin/activate
python ai/train_activity_classifier.py
```

**What happens:**
1. Downloads WiFall dataset (~2GB, one-time)
2. Processes 10,000 CSI samples
3. Extracts 38 features per sample
4. Trains Random Forest model
5. Displays performance metrics

**Expected Results:**
- Training accuracy: 97.79%
- Test accuracy: 55.35%
- **Fall detection recall: 87%** ⭐

---

## 📁 Important Commands

### Always start with:
```bash
cd /Users/pruthiviraj/Downloads/wifi-master
source venv/bin/activate
```

### Common tasks:
```bash
# Verify system
python verify_system.py

# Demo breathing
python ai/demo_breathing_analysis.py

# Visualize data
python datasets/visualize_csi.py

# Start backend
python backend/run_server.py

# Check status
cat PROJECT_STATUS.md
```

---

## 📊 System Status

```
✅ ALL 9 PHASES COMPLETE
✅ 30/30 Verification Checks Passing
✅ Python 3.12.13 (Stable)
✅ All Dependencies Installed
✅ 70+ Files Created
✅ 8,000+ Lines of Code
✅ 12 Automated Tests
```

---

## 🎓 Project Structure

```
wifi-master/
├── ai/                      # Machine Learning
│   ├── preprocessing/       # Data pipeline
│   ├── activity_detection/  # Fall detection (87% recall)
│   ├── breathing_analysis/  # Respiratory monitoring
│   └── saved_models/        # Trained models
│
├── backend/                 # FastAPI Server
│   ├── app/api/             # REST endpoints
│   ├── services/            # Notifications
│   └── run_server.py        # Start here
│
├── frontend/                # React Dashboard
│   └── src/                 # (requires Node.js)
│
├── data_collection/         # ESP32 Integration
│   └── csi_receiver/        # Real-time CSI
│
├── datasets/                # Data & Visualizations
│   └── metadata/visualizations/
│
└── docs/                    # Documentation
    ├── architecture.md
    └── phase2_summary.md
```

---

## 🌟 Key Performance Metrics

| Metric | Value |
|--------|-------|
| **Fall Detection Recall** | **87%** |
| Overall Accuracy | 55.35% |
| Breathing Confidence | 95.6% |
| Processing Latency | <200ms |
| Model Size | 23 MB |
| Test Pass Rate | 12/12 |

---

## 📚 Documentation

- **QUICK_REFERENCE.md** - Command cheat sheet
- **SETUP_GUIDE.md** - Complete setup (you just did this!)
- **README.md** - Project overview
- **ALL_PHASES_COMPLETE.md** - Full feature list
- **docs/architecture.md** - System design

---

## ⚠️ Important Reminders

### This is a RESEARCH PROTOTYPE:
- ❌ NOT a medical device
- ❌ NOT clinically validated
- ❌ NOT for diagnosis
- ✅ Educational/research only

### Fall Detection Limitations:
- 87% recall = **13% miss rate**
- 60% precision = **40% false alarms**
- **Always maintain traditional safety measures**

### Breathing Analysis:
- **EXPERIMENTAL FEATURE**
- For research purposes only
- Requires clinical validation

---

## 🎯 Recommended Next Steps

### 1. Explore Visualizations (5 min)
```bash
source venv/bin/activate
python datasets/visualize_csi.py
open datasets/metadata/visualizations/
```

### 2. Try API Documentation (5 min)
```bash
python backend/run_server.py
# Visit http://localhost:8000/docs
```

### 3. Read Architecture (10 min)
```bash
cat docs/architecture.md
```

### 4. Train Custom Model (20 min)
```bash
python ai/train_activity_classifier.py
```

---

## 🆘 Troubleshooting

### "Command not found: source"
You're using `fish` or another shell. Try:
```bash
bash
cd /Users/pruthiviraj/Downloads/wifi-master
source venv/bin/activate
```

### "Port 8000 already in use"
```bash
lsof -i :8000
kill -9 <PID>
```

### "Module not found"
Make sure virtual environment is activated:
```bash
which python
# Should show: /Users/pruthiviraj/Downloads/wifi-master/venv/bin/python
```

### Need to restart?
```bash
cd /Users/pruthiviraj/Downloads/wifi-master
source venv/bin/activate
python verify_system.py
```

---

## 🎉 You're All Set!

### Quick Actions:

**See it in action:**
```bash
source venv/bin/activate
python ai/demo_breathing_analysis.py
```

**Explore the API:**
```bash
python backend/run_server.py
# Visit http://localhost:8000/docs
```

**Verify everything works:**
```bash
python verify_system.py
```

---

## 📞 Need Help?

1. Check **QUICK_REFERENCE.md** for commands
2. Read **SETUP_GUIDE.md** for details
3. Review error messages carefully
4. Run `python verify_system.py` to diagnose

---

**🌟 Congratulations! You're ready to explore WiFi-based sensing! 🌟**

**Remember: This is for education and research. Never rely on it for real medical emergencies.**

---

*WiFi-Radar - Privacy-Preserving Elderly Safety Monitoring*  
*Using WiFi CSI for contactless activity and breathing detection*
