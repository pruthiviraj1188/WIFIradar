"""
Preprocessing Tests

Phase 9: Test data preprocessing pipeline
"""

import pytest
import numpy as np
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ai.preprocessing.signal_processor import SignalProcessor
from ai.preprocessing.feature_extractor import FeatureExtractor


class TestSignalProcessor:
    """Test signal processing functions."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.processor = SignalProcessor()
        self.test_signal = np.random.randn(1000)
    
    def test_butterworth_filter(self):
        """Test Butterworth filter."""
        filtered = self.processor.apply_butterworth_filter(self.test_signal)
        assert len(filtered) == len(self.test_signal)
        assert isinstance(filtered, np.ndarray)
    
    def test_remove_outliers(self):
        """Test outlier removal."""
        signal_with_outliers = self.test_signal.copy()
        signal_with_outliers[100] = 1000  # Add outlier
        
        cleaned = self.processor.remove_outliers(signal_with_outliers)
        assert len(cleaned) == len(signal_with_outliers)
        assert cleaned[100] != 1000  # Outlier should be replaced
    
    def test_normalize(self):
        """Test normalization."""
        normalized = self.processor.normalize(self.test_signal, method='minmax')
        assert np.min(normalized) >= 0
        assert np.max(normalized) <= 1
    
    def test_segment_signal(self):
        """Test signal segmentation."""
        segments = self.processor.segment_signal(self.test_signal, window_size=100, overlap=50)
        assert len(segments) > 0
        assert all(len(seg) == 100 for seg in segments)


class TestFeatureExtractor:
    """Test feature extraction."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.extractor = FeatureExtractor()
        self.test_signal = np.sin(2 * np.pi * 1 * np.linspace(0, 1, 100))
    
    def test_time_domain_features(self):
        """Test time-domain feature extraction."""
        features = self.extractor.extract_time_domain_features(self.test_signal)
        
        assert 'mean' in features
        assert 'std' in features
        assert 'max' in features
        assert 'min' in features
        assert isinstance(features['mean'], (int, float))
    
    def test_frequency_domain_features(self):
        """Test frequency-domain features."""
        features = self.extractor.extract_frequency_domain_features(self.test_signal)
        
        assert 'dominant_frequency' in features
        assert 'spectral_entropy' in features
        assert isinstance(features['dominant_frequency'], (int, float))
    
    def test_extract_all_features(self):
        """Test complete feature extraction."""
        features = self.extractor.extract_all_features(self.test_signal)
        
        assert len(features) > 30  # Should have many features
        assert all(isinstance(v, (int, float, np.number)) for v in features.values())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
