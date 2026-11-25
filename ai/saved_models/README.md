# Saved Models

This directory contains trained machine learning models for the WiFi-Radar system.

## Available Models

### 1. Baseline Random Forest Activity Classifier

**File**: `baseline_rf_model.joblib` (22 MB)  
**Type**: Random Forest Classifier  
**Purpose**: Fall detection and activity classification

**Performance Metrics**:
- Overall Accuracy: 55.35%
- **Fall Detection Recall: 87%** (critical safety metric)
- Fall Detection Precision: 60%
- Trained on: WiFall dataset (232,941 samples)

**To download the trained model**:

Since the model file is too large for GitHub (22MB), you have two options:

#### Option 1: Train the model yourself (Recommended)
```bash
cd /Users/pruthiviraj/wifi
source venv/bin/activate
python ai/train_activity_classifier.py
```

This will:
- Download the WiFall dataset from HuggingFace
- Train the Random Forest model
- Save it as `baseline_rf_model.joblib`
- Generate metrics in `baseline_rf_metrics.json`
- Training takes approximately 5-10 minutes

#### Option 2: Use Git LFS (Large File Storage)

If you have Git LFS installed:
```bash
git lfs install
git lfs pull
```

## Model Files

- `baseline_rf_model.joblib` - Trained Random Forest model (excluded from git)
- `baseline_rf_metrics.json` - Training metrics and performance statistics
- `.gitkeep` - Placeholder to keep directory in git

## Training New Models

To train improved models:

1. **Deep Learning Models** (Future):
   ```bash
   python ai/train_cnn_classifier.py  # CNN model
   python ai/train_lstm_classifier.py  # LSTM model
   ```

2. **Hyperparameter Tuning**:
   ```bash
   python ai/train_activity_classifier.py --tune-hyperparameters
   ```

3. **Different Datasets**:
   - Modify `ai/preprocessing/data_loader.py` to load custom datasets
   - Ensure data format matches WiFall structure

## Model Format

Models are saved using joblib for compatibility with scikit-learn:

```python
import joblib
from ai.activity_detection.baseline_model import BaselineActivityClassifier

# Load model
model = joblib.load('ai/saved_models/baseline_rf_model.joblib')

# Make predictions
predictions = model.predict(csi_features)
```

## Model Size Limits

GitHub has the following file size limits:
- Files < 50MB: Can be committed normally
- Files 50-100MB: Warning issued
- Files > 100MB: Push will fail

Our baseline model (22MB) exceeds the recommended size for direct git commits, hence the .gitignore exclusion.

## Alternative: Cloud Storage

For production deployments, consider storing models in:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- HuggingFace Model Hub

Example deployment script:
```bash
# Upload to S3
aws s3 cp ai/saved_models/baseline_rf_model.joblib \
  s3://your-bucket/models/baseline_rf_model.joblib

# Download in production
aws s3 cp s3://your-bucket/models/baseline_rf_model.joblib \
  ai/saved_models/baseline_rf_model.joblib
```

---

**Last Updated**: 2026-11-25  
**Model Version**: 1.0.0
