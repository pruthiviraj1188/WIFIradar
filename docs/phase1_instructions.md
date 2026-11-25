# Phase 1: Dataset Inspection & CSI Visualization

## Overview

Phase 1 establishes the foundation for WiFi-Radar by:
1. Setting up the development environment
2. Downloading and inspecting the WiFall dataset
3. Understanding CSI data format and structure
4. Visualizing signal patterns for different activities
5. Documenting dataset characteristics

## Prerequisites

- **Python:** 3.10 or higher
- **Operating System:** macOS, Linux, or Windows
- **RAM:** 8GB minimum (16GB recommended)
- **Disk Space:** 10GB+ for datasets
- **Internet:** Required for dataset download

## Installation Steps

### 1. Navigate to Project Directory

```bash
cd /Users/pruthiviraj/wifi
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate
```

You should see `(venv)` appear in your terminal prompt.

### 3. Upgrade pip

```bash
pip install --upgrade pip
```

### 4. Install Dependencies

```bash
pip install -r config/requirements.txt
```

This will install:
- NumPy, SciPy, Pandas (scientific computing)
- PyTorch (deep learning framework)
- Matplotlib, Seaborn, Plotly (visualization)
- HuggingFace datasets library
- Signal processing tools
- And more...

**Installation may take 5-10 minutes** depending on your internet speed.

### 5. Create Environment File (Optional)

```bash
cp config/.env.example .env
```

Edit `.env` if needed (optional for Phase 1).

## Running Phase 1 Scripts

### Script 1: Dataset Inspector

This script downloads the WiFall dataset and inspects its structure.

```bash
python datasets/inspect_wifall.py
```

**What it does:**
- Downloads WiFall dataset from HuggingFace (~2-5 minutes)
- Analyzes dataset splits (train/test/validation)
- Identifies activity labels and their distribution
- Inspects CSI data format (shape, dimensions, data types)
- Saves metadata to `datasets/metadata/wifall_inspection.json`

**Expected output:**
- Colored terminal output showing dataset structure
- Table of activity labels with counts
- CSI shape analysis
- Metadata JSON file

**Troubleshooting:**

If download fails:
```bash
# Check internet connection
ping huggingface.co

# Try with verbose output
HF_DATASETS_VERBOSITY=info python datasets/inspect_wifall.py
```

If you get a "trust_remote_code" error, the dataset may require manual approval. Check the dataset page: https://huggingface.co/datasets/RS2002/WiFall

### Script 2: CSI Visualizer

This script creates visualizations of CSI signals.

```bash
python datasets/visualize_csi.py
```

**What it does:**
- Loads the WiFall dataset
- Generates 4 types of visualizations:
  1. Raw CSI samples for each activity class
  2. Time-frequency spectrograms
  3. Amplitude statistics (mean, std, max, min)
  4. Signal variance over time

**Outputs:**
- `datasets/metadata/visualizations/raw_csi_samples.png`
- `datasets/metadata/visualizations/csi_spectrograms.png`
- `datasets/metadata/visualizations/csi_amplitude_statistics.png`
- `datasets/metadata/visualizations/signal_variance.png`

**To view visualizations:**

```bash
# On macOS
open datasets/metadata/visualizations/

# On Linux
xdg-open datasets/metadata/visualizations/

# On Windows
explorer datasets/metadata/visualizations/
```

## Understanding the Output

### Dataset Structure

The WiFall dataset typically contains:
- **Multiple splits:** train, validation, test
- **Activity labels:** Walking, Sitting, Standing, Lying, Falling, Jumping, Empty Room
- **CSI data format:** Time-series matrix of WiFi channel measurements
- **Metadata:** Participant IDs, session info, hardware details

### CSI Data Format

CSI (Channel State Information) captures how WiFi signals change as they propagate through space. The format is typically:

```
Shape: [time_steps, subcarriers] or [time_steps, antennas, subcarriers]

Example: (500, 52) means:
- 500 time measurements
- 52 WiFi subcarriers (frequency channels)
```

**Key CSI Properties:**
- **Amplitude:** Signal strength (what we primarily use)
- **Phase:** Signal phase shift (more complex, used in advanced models)
- **Sampling rate:** How often CSI is captured (typically 20-100 Hz)

### Activity Patterns to Observe

When reviewing visualizations, look for:

1. **Walking:**
   - Periodic amplitude variations
   - Regular frequency patterns
   - Medium-high signal variance

2. **Falling:**
   - Sudden, sharp amplitude change
   - High peak followed by low sustained signal
   - Distinct from sitting down (slower transition)

3. **Sitting/Standing:**
   - Lower variance than walking
   - Relatively stable amplitude
   - Minimal periodic patterns

4. **Empty Room:**
   - Very low variance
   - Stable baseline
   - Minimal amplitude changes

5. **Lying Down:**
   - Gradual amplitude transition
   - Lower final amplitude than standing
   - Different pattern than falling

## Verification Checklist

After completing Phase 1, verify:

- [ ] Virtual environment activated
- [ ] All dependencies installed without errors
- [ ] WiFall dataset downloaded (check `datasets/raw/wifall/`)
- [ ] Metadata file created (`datasets/metadata/wifall_inspection.json`)
- [ ] 4 visualization images generated
- [ ] Visualizations show clear differences between activities
- [ ] No major errors in terminal output

## Expected Results

### Dataset Inspection

You should see output similar to:

```
Available Splits:
┌───────┬────────────────────┐
│ Split │ Number of Samples  │
├───────┼────────────────────┤
│ train │ 5000              │
│ test  │ 1000              │
└───────┴────────────────────┘

Activity Label Distribution:
┌──────────┬─────────────┬───────┬────────────┐
│ Label ID │ Label Name  │ Count │ Percentage │
├──────────┼─────────────┼───────┼────────────┤
│ 0        │ Walking     │ 800   │ 16.00%     │
│ 1        │ Sitting     │ 900   │ 18.00%     │
│ 2        │ Standing    │ 850   │ 17.00%     │
│ 3        │ Falling     │ 600   │ 12.00%     │
│ ...      │ ...         │ ...   │ ...        │
└──────────┴─────────────┴───────┴────────────┘
```

(Actual numbers will vary based on the real WiFall dataset)

### Visualizations

Each visualization should:
- Load without errors
- Show clear visual differences between activities
- Have proper labels and legends
- Be saved as high-quality PNG files

## Common Issues & Solutions

### Issue 1: Import Error

```
ModuleNotFoundError: No module named 'datasets'
```

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue 2: Dataset Download Timeout

```
ConnectionError: Unable to download dataset
```

**Solution:**
- Check internet connection
- Try again later (HuggingFace servers may be busy)
- Use VPN if HuggingFace is blocked in your region

### Issue 3: Memory Error

```
MemoryError: Unable to allocate array
```

**Solution:**
- Close other applications
- Process smaller batches (modify num_samples parameters)
- Use a machine with more RAM

### Issue 4: Visualization Not Saving

```
Permission denied: datasets/metadata/visualizations/
```

**Solution:**
```bash
# Create directory manually
mkdir -p datasets/metadata/visualizations

# Check permissions
chmod -R u+w datasets/
```

## Next Steps

After successfully completing Phase 1:

1. **Review the generated visualizations**
   - Open each PNG file
   - Verify activities look distinct
   - Note any unexpected patterns

2. **Review the metadata JSON**
   - Check dataset structure matches expectations
   - Verify label names are correct
   - Note CSI dimensions

3. **Prepare for Phase 2**
   - Understand what preprocessing will be needed
   - Identify which activities might be hard to distinguish
   - Think about feature engineering strategies

4. **Report back for confirmation**
   - Share any observations
   - Ask questions about unexpected results
   - Confirm readiness for Phase 2

## Understanding CSI for Beginners

**What is CSI?**

WiFi signals don't travel in straight lines. They:
- Reflect off walls and furniture
- Get absorbed by human bodies
- Scatter in different directions
- Interfere with each other

CSI measures these effects by capturing:
- **Amplitude:** How strong the signal is at different frequencies
- **Phase:** The timing/phase shift of the signal

**Why does human activity change CSI?**

When a person moves:
- They block/reflect WiFi signals differently
- Signal paths change length
- Interference patterns shift
- CSI measurements change accordingly

**Walking vs. Falling:**
- **Walking:** Gradual, periodic changes (footsteps)
- **Falling:** Sudden, sharp change followed by stillness

This is what makes WiFi-CSI-based monitoring possible!

## Technical Notes

### Dataset Format

WiFall likely uses ESP32-S3 CSI format:
- **Sampling rate:** ~20-50 Hz (20-50 measurements per second)
- **Subcarriers:** 52 or 128 (depending on WiFi bandwidth)
- **Data type:** Float32 (amplitude) or Complex (amplitude + phase)

### Preprocessing Pipeline (Coming in Phase 2)

1. **Noise filtering:** Remove random fluctuations
2. **Normalization:** Scale amplitudes to consistent range
3. **Segmentation:** Cut into fixed-length windows
4. **Feature extraction:** Calculate statistics, FFT, etc.

### Model Architecture (Phase 2)

We'll compare:
- **Baseline:** Random Forest with hand-crafted features
- **CNN:** 1D or 2D Convolutional Neural Network
- **Evaluation:** Participant-independent split (crucial!)

---

## Questions?

If you encounter any issues not covered here:
1. Check terminal output for specific error messages
2. Verify all installation steps were completed
3. Review the generated files
4. Report the issue with error messages

**You are now ready to proceed with Phase 1 execution!**
