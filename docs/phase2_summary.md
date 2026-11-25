# Phase 2: Activity Classification - Summary Report

## Overview

Phase 2 successfully implemented and trained a baseline activity classification model using the WiFall dataset. The model classifies 5 different human activities from WiFi CSI (Channel State Information) signals.

## Activities Classified

1. **Jump** - Vertical jumping movements
2. **Fall** - Falling events (most critical for elderly safety)
3. **Sit** - Sitting down or sitting still
4. **Stand** - Standing still
5. **Walk** - Walking movements

## Dataset Statistics

- **Total Samples**: 10,000 (from WiFall dataset)
- **Training Set**: 7,000 samples (70%)
- **Validation Set**: 1,000 samples (10%)
- **Test Set**: 2,000 samples (20%)

### Class Distribution

| Activity | Count | Percentage |
|----------|-------|------------|
| Fall     | 5,150 | 51.5%      |
| Jump     | 1,998 | 20.0%      |
| Sit      | 960   | 9.6%       |
| Stand    | 947   | 9.5%       |
| Walk     | 945   | 9.4%       |

**Note**: The dataset is imbalanced, with "fall" being the dominant class.

## Signal Processing Pipeline

### 1. Data Loading
- Loaded raw CSI data from WiFall dataset
- Parsed string-formatted CSI arrays into numerical data
- Created label mappings for 5 activity classes

### 2. Preprocessing
- **Filtering**: Butterworth low-pass filter to remove high-frequency noise
- **Outlier Removal**: Z-score based outlier detection and interpolation
- **Normalization**: Min-max normalization to [0, 1] range
- **Fixed Length**: Padded/truncated all signals to 200 samples

### 3. Feature Extraction
Extracted **38 hand-crafted features** from preprocessed signals:

#### Time-Domain Features (18 features)
- Basic statistics: mean, std, variance, median, min, max, range, RMS
- Higher-order statistics: skewness, kurtosis
- Percentiles: Q25, Q75, IQR
- Energy and power metrics
- Zero crossings
- Peak detection metrics

#### Frequency-Domain Features (12 features)
- FFT-based spectral analysis
- Dominant frequency and magnitude
- Spectral statistics: mean, std, max, energy
- Spectral entropy
- Band power (low 0-5Hz, mid 5-15Hz, high 15+Hz)
- Band power ratios

#### Temporal Variation Features (8 features)
- First and second-order differences
- Autocorrelation at lag 1
- Moving statistics

## Model Architecture

### Baseline: Random Forest Classifier

**Hyperparameters:**
- Number of trees: 100
- Max depth: 20
- Min samples split: 5
- Random state: 42

**Why Random Forest?**
- Good baseline for structured/tabular data
- Handles non-linear relationships
- Provides feature importance
- Fast inference
- No need for GPU

## Performance Results

### Overall Accuracy

| Split      | Accuracy |
|------------|----------|
| Training   | 97.79%   |
| Validation | 56.30%   |
| Test       | 55.35%   |

**Analysis**: The large gap between training (97.79%) and test (55.35%) accuracy indicates **overfitting**. The model memorized training patterns but doesn't generalize well to new data.

### Per-Class Performance (Test Set)

| Activity | Precision | Recall | F1-Score | Support |
|----------|-----------|--------|----------|---------|
| Jump     | 0.47      | 0.42   | 0.44     | 400     |
| Fall     | 0.60      | 0.87   | 0.71     | 1,030   |
| Sit      | 0.21      | 0.04   | 0.06     | 192     |
| Stand    | 0.31      | 0.06   | 0.11     | 189     |
| Walk     | 0.36      | 0.13   | 0.19     | 189     |

**Key Observations:**

1. **Fall Detection (Most Important)**
   - Best recall: 87% - catches most fall events
   - Precision: 60% - some false positives
   - Best overall F1-score: 0.71
   - This is good for safety: better to have false alarms than miss real falls

2. **Jump Detection**
   - Moderate performance (F1: 0.44)
   - Often confused with falls

3. **Sit, Stand, Walk**
   - Poor performance (F1 < 0.20)
   - Very low recall (4-13%)
   - Often misclassified as "fall"

### Confusion Matrix

```
True \ Pred   Jump   fall   sit   stand   walk
Jump           168    212     4      3      13
fall            98    895    12      9      16
sit             30    142     7      6       7
stand           21    142     5     12       9
walk            42    107     6      9      25
```

**Interpretation:**
- Model is biased toward predicting "fall" (the majority class)
- Sit/Stand/Walk are frequently misclassified as fall
- Jump and fall are sometimes confused (both involve vertical movement)

## Feature Importance

### Top 15 Most Important Features

| Rank | Feature                   | Importance |
|------|---------------------------|------------|
| 1    | time_median               | 0.0478     |
| 2    | temporal_diff2_mean       | 0.0428     |
| 3    | freq_spectral_entropy     | 0.0412     |
| 4    | freq_mid_high_ratio       | 0.0411     |
| 5    | temporal_diff2_max        | 0.0397     |
| 6    | time_skewness             | 0.0392     |
| 7    | temporal_moving_mean_std  | 0.0390     |
| 8    | freq_low_mid_ratio        | 0.0387     |
| 9    | freq_spectral_mean        | 0.0383     |
| 10   | time_kurtosis             | 0.0381     |
| 11   | temporal_diff1_max        | 0.0377     |
| 12   | freq_mid_band_power       | 0.0364     |
| 13   | temporal_autocorr_lag1    | 0.0354     |
| 14   | temporal_diff2_std        | 0.0353     |
| 15   | freq_high_band_power      | 0.0338     |

**Insights:**
- Temporal features (diff2_mean, diff2_max) are highly important - captures sudden changes
- Frequency features (spectral entropy, band ratios) help distinguish periodic vs. aperiodic movements
- Statistical features (median, skewness, kurtosis) capture signal distribution
- No single feature dominates - classification uses multiple weak signals

## Challenges Identified

### 1. Class Imbalance
- 51.5% of data is "fall" class
- Minority classes (sit, stand, walk) have only ~9% each
- Model biased toward majority class

### 2. Overfitting
- Training accuracy: 97.79%
- Test accuracy: 55.35%
- Gap of 42% indicates poor generalization

### 3. Similar Activity Patterns
- Sit/Stand/Walk have similar low-variance CSI patterns
- Hard to distinguish without more context

### 4. Limited CSI Information
- Raw CSI is just 104 values per sample
- May not capture full spatial-temporal patterns
- Hand-crafted features may miss complex patterns

## Recommendations for Improvement

### Short-term (Phase 2 Extensions)

1. **Address Class Imbalance**
   - Use class weights in Random Forest
   - Apply SMOTE or other oversampling techniques
   - Collect more data for minority classes

2. **Reduce Overfitting**
   - Increase regularization (lower max_depth, increase min_samples_split)
   - Add more diverse training data
   - Use cross-validation for hyperparameter tuning

3. **Feature Engineering**
   - Add more domain-specific features
   - Try different time windows
   - Extract features from multiple scales

4. **Try Other Classical ML Models**
   - Gradient Boosting (XGBoost, LightGBM)
   - SVM with RBF kernel
   - Ensemble of multiple models

### Medium-term (Phase 2.5 - CNN Model)

5. **Deep Learning Approach**
   - Train 1D CNN on raw/preprocessed CSI sequences
   - Learn features automatically instead of hand-crafting
   - Use data augmentation (time warping, noise injection)
   - Apply techniques like dropout and batch normalization

6. **Advanced Architectures**
   - LSTM/GRU for temporal patterns
   - Attention mechanisms
   - ResNet-style skip connections

### Long-term (Phase 3+)

7. **Multi-modal Data**
   - Combine CSI with RSSI
   - Use multiple receiver positions
   - Incorporate temporal context (activity history)

8. **Real-time Considerations**
   - Optimize for inference speed
   - Implement sliding window predictions
   - Add verification layers for fall detection

## Files Generated

### Models
- `ai/saved_models/baseline_rf_model.joblib` - Trained Random Forest model (23 MB)
- `ai/saved_models/baseline_rf_metrics.json` - Performance metrics

### Metadata
- `datasets/metadata/label_mapping.json` - Activity label mappings
- `datasets/metadata/feature_names.json` - List of 38 feature names

### Code
- `ai/preprocessing/data_loader.py` - WiFall dataset loader
- `ai/preprocessing/signal_processor.py` - Signal preprocessing pipeline
- `ai/preprocessing/feature_extractor.py` - Feature extraction
- `ai/activity_detection/baseline_model.py` - Random Forest classifier
- `ai/train_activity_classifier.py` - Main training script

## Next Steps

### Immediate Actions
1. ✅ Review confusion matrix and feature importance
2. ✅ Document findings (this report)
3. ⏭️ Implement improvements for better generalization
4. ⏭️ Train CNN model for comparison

### Phase 3 Preview
- Breathing analysis (experimental)
- Respiratory waveform extraction
- Breathing rate estimation

### Phase 4 Preview
- ESP32 integration
- Real-time CSI capture
- Live activity classification

## Conclusion

Phase 2 successfully established a baseline activity classification system with **55.35% test accuracy**. While this is modest, it demonstrates that:

1. ✅ WiFi CSI signals contain information about human activities
2. ✅ Fall detection works reasonably well (87% recall)
3. ⚠️ Distinguishing subtle activities (sit/stand/walk) is challenging
4. ⚠️ Current model overfits and needs improvement

The system provides a foundation for:
- Further model development (CNN, LSTM)
- Real-time classification pipeline
- Safety monitoring applications

**Most importantly**: The 87% recall for fall detection shows promise for the core use case of elderly safety monitoring, though precision needs improvement to reduce false alarms.

---

**Phase 2 Status: COMPLETE** ✓  
**Date**: November 25, 2026  
**Next Phase**: Phase 2.5 (CNN Model) or Phase 3 (Breathing Analysis)
