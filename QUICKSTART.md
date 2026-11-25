# WiFi-Radar Quick Start Guide

## Phase 1: Get Started in 10 Minutes

This guide will get you running the WiFi-Radar dataset inspection in under 10 minutes.

### Step 1: Open Terminal (30 seconds)

```bash
cd /Users/pruthiviraj/wifi
```

### Step 2: Create Virtual Environment (1 minute)

```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your prompt.

### Step 3: Install Dependencies (3-5 minutes)

```bash
pip install --upgrade pip
pip install -r config/requirements.txt
```

**This will download ~2GB of packages. Get a coffee! ☕**

### Step 4: Verify Setup (30 seconds)

```bash
python scripts/verify_setup.py
```

If you see **"✓ Setup Complete!"** → Continue to Step 5

If you see errors → Check the error messages and fix them first

### Step 5: Download & Inspect Dataset (2-5 minutes)

```bash
python datasets/inspect_wifall.py
```

**What you'll see:**
- Dataset download progress bar
- Table of activity labels (Walking, Sitting, Falling, etc.)
- CSI data format information
- Metadata saved message

### Step 6: Visualize CSI Signals (1-2 minutes)

```bash
python datasets/visualize_csi.py
```

**What you'll see:**
- 4 visualization files created
- Saved to: `datasets/metadata/visualizations/`

### Step 7: Check Status (30 seconds)

```bash
python scripts/check_status.py
```

### Step 8: View Results (1 minute)

```bash
# Open visualization folder
open datasets/metadata/visualizations/

# Or list files
ls -lh datasets/metadata/visualizations/
```

**Expected files:**
- `raw_csi_samples.png` - CSI signals for each activity
- `csi_spectrograms.png` - Frequency analysis
- `csi_amplitude_statistics.png` - Statistical distribution
- `signal_variance.png` - Variance over time

---

## ✓ Success!

You've completed Phase 1 if you can see:
- 4 PNG visualization files
- Clear differences between activities in the graphs
- Metadata JSON file created

---

## What's Next?

**Phase 2: Activity Classification Model**
- Preprocess WiFall dataset
- Train baseline Random Forest model
- Train CNN model
- Evaluate fall detection accuracy

**Before starting Phase 2:**
1. Review all visualization files
2. Check if activities look distinct
3. Read `docs/phase1_instructions.md` for details
4. Report back any observations or questions

---

## Troubleshooting Quick Fixes

### Issue: "ModuleNotFoundError"
```bash
source venv/bin/activate
pip install -r config/requirements.txt
```

### Issue: "Dataset download failed"
- Check internet connection: `ping huggingface.co`
- Try again (may be temporary network issue)

### Issue: "Permission denied"
```bash
chmod -R u+w datasets/
```

### Issue: "Command not found: python3"
Try `python` instead of `python3`:
```bash
python --version  # Should show 3.10 or higher
```

---

## Important Files

- `README.md` - Project overview
- `PROJECT_STRUCTURE.md` - Complete project architecture
- `docs/phase1_instructions.md` - Detailed Phase 1 guide
- `docs/architecture.md` - System architecture
- `config/requirements.txt` - Python dependencies
- `config/.env.example` - Configuration template

---

## Questions?

If something doesn't work:
1. Check the terminal error message
2. Read the full error (scroll up if needed)
3. Check `docs/phase1_instructions.md` for detailed troubleshooting
4. Report the specific error message

---

**🎯 Goal: Complete Phase 1 dataset inspection before proceeding to model training.**

Good luck! 🚀
