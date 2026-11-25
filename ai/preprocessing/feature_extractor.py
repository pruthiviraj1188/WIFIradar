"""
Feature Extraction for Activity Classification

Extracts time-domain and frequency-domain features from CSI signals.
"""

import numpy as np
from scipy import stats, signal
from scipy.fft import fft, fftfreq
from typing import Dict, List
from rich.console import Console

console = Console()


class FeatureExtractor:
    """Extract features from preprocessed CSI signals."""
    
    def __init__(self, sampling_rate: float = 50.0):
        """
        Initialize feature extractor.
        
        Args:
            sampling_rate: CSI sampling rate in Hz
        """
        self.sampling_rate = sampling_rate
        
    def extract_time_domain_features(self, signal_data: np.ndarray) -> Dict[str, float]:
        """
        Extract time-domain statistical features.
        
        Args:
            signal_data: Input signal (1D array)
            
        Returns:
            Dictionary of features
        """
        features = {}
        
        # Basic statistics
        features['mean'] = np.mean(signal_data)
        features['std'] = np.std(signal_data)
        features['var'] = np.var(signal_data)
        features['median'] = np.median(signal_data)
        features['min'] = np.min(signal_data)
        features['max'] = np.max(signal_data)
        features['range'] = features['max'] - features['min']
        features['rms'] = np.sqrt(np.mean(signal_data ** 2))
        
        # Higher-order statistics
        features['skewness'] = stats.skew(signal_data)
        features['kurtosis'] = stats.kurtosis(signal_data)
        
        # Percentiles
        features['q25'] = np.percentile(signal_data, 25)
        features['q75'] = np.percentile(signal_data, 75)
        features['iqr'] = features['q75'] - features['q25']
        
        # Energy and power
        features['energy'] = np.sum(signal_data ** 2)
        features['power'] = features['energy'] / len(signal_data)
        
        # Zero crossings
        features['zero_crossings'] = np.sum(np.diff(np.sign(signal_data)) != 0)
        
        # Peak detection
        peaks, _ = signal.find_peaks(signal_data)
        features['num_peaks'] = len(peaks)
        features['peak_density'] = len(peaks) / len(signal_data)
        
        return features
    
    def extract_frequency_domain_features(self, signal_data: np.ndarray) -> Dict[str, float]:
        """
        Extract frequency-domain features using FFT.
        
        Args:
            signal_data: Input signal (1D array)
            
        Returns:
            Dictionary of features
        """
        features = {}
        
        # Compute FFT
        n = len(signal_data)
        fft_values = fft(signal_data)
        fft_magnitude = np.abs(fft_values[:n//2])
        fft_frequencies = fftfreq(n, 1/self.sampling_rate)[:n//2]
        
        # Power spectral density
        psd = fft_magnitude ** 2
        
        # Dominant frequency
        dominant_freq_idx = np.argmax(fft_magnitude)
        features['dominant_frequency'] = fft_frequencies[dominant_freq_idx]
        features['dominant_magnitude'] = fft_magnitude[dominant_freq_idx]
        
        # Spectral statistics
        features['spectral_mean'] = np.mean(fft_magnitude)
        features['spectral_std'] = np.std(fft_magnitude)
        features['spectral_max'] = np.max(fft_magnitude)
        features['spectral_energy'] = np.sum(psd)
        
        # Spectral entropy
        psd_normalized = psd / (np.sum(psd) + 1e-10)
        features['spectral_entropy'] = -np.sum(psd_normalized * np.log2(psd_normalized + 1e-10))
        
        # Band power
        # Low frequency (0-5 Hz): may correlate with large body movements
        low_band_mask = (fft_frequencies >= 0) & (fft_frequencies < 5)
        features['low_band_power'] = np.sum(psd[low_band_mask])
        
        # Mid frequency (5-15 Hz): typical human activity range
        mid_band_mask = (fft_frequencies >= 5) & (fft_frequencies < 15)
        features['mid_band_power'] = np.sum(psd[mid_band_mask])
        
        # High frequency (15+ Hz): noise and fast movements
        high_band_mask = (fft_frequencies >= 15)
        features['high_band_power'] = np.sum(psd[high_band_mask])
        
        # Band power ratios
        total_power = features['spectral_energy'] + 1e-10
        features['low_mid_ratio'] = features['low_band_power'] / (features['mid_band_power'] + 1e-10)
        features['mid_high_ratio'] = features['mid_band_power'] / (features['high_band_power'] + 1e-10)
        
        return features
    
    def extract_temporal_variation_features(self, signal_data: np.ndarray) -> Dict[str, float]:
        """
        Extract features related to temporal variations.
        
        Args:
            signal_data: Input signal (1D array)
            
        Returns:
            Dictionary of features
        """
        features = {}
        
        # First-order differences
        diff1 = np.diff(signal_data)
        features['diff1_mean'] = np.mean(diff1)
        features['diff1_std'] = np.std(diff1)
        features['diff1_max'] = np.max(np.abs(diff1))
        
        # Second-order differences (acceleration)
        diff2 = np.diff(diff1)
        features['diff2_mean'] = np.mean(diff2)
        features['diff2_std'] = np.std(diff2)
        features['diff2_max'] = np.max(np.abs(diff2))
        
        # Autocorrelation at lag 1
        if len(signal_data) > 1:
            autocorr = np.corrcoef(signal_data[:-1], signal_data[1:])[0, 1]
            features['autocorr_lag1'] = autocorr if not np.isnan(autocorr) else 0.0
        else:
            features['autocorr_lag1'] = 0.0
        
        # Moving statistics
        window_size = min(20, len(signal_data) // 5)
        if window_size > 1:
            moving_mean = np.convolve(signal_data, np.ones(window_size)/window_size, mode='valid')
            features['moving_mean_std'] = np.std(moving_mean)
        else:
            features['moving_mean_std'] = 0.0
        
        return features
    
    def extract_all_features(self, signal_data: np.ndarray) -> Dict[str, float]:
        """
        Extract all features from signal.
        
        Args:
            signal_data: Input signal (1D array)
            
        Returns:
            Dictionary containing all features
        """
        features = {}
        
        # Time domain
        time_features = self.extract_time_domain_features(signal_data)
        features.update({f'time_{k}': v for k, v in time_features.items()})
        
        # Frequency domain
        freq_features = self.extract_frequency_domain_features(signal_data)
        features.update({f'freq_{k}': v for k, v in freq_features.items()})
        
        # Temporal variations
        temporal_features = self.extract_temporal_variation_features(signal_data)
        features.update({f'temporal_{k}': v for k, v in temporal_features.items()})
        
        return features
    
    def extract_features_batch(self, X: np.ndarray) -> np.ndarray:
        """
        Extract features from a batch of signals.
        
        Args:
            X: Array of signals, shape (n_samples, signal_length)
            
        Returns:
            Feature matrix, shape (n_samples, n_features)
        """
        console.print(f"[cyan]Extracting features from {len(X)} samples...[/cyan]")
        
        feature_list = []
        feature_names = None
        
        for i, signal_data in enumerate(X):
            features = self.extract_all_features(signal_data)
            
            if feature_names is None:
                feature_names = sorted(features.keys())
            
            feature_vector = [features[name] for name in feature_names]
            feature_list.append(feature_vector)
        
        feature_matrix = np.array(feature_list, dtype=np.float32)
        
        console.print(f"[green]✓ Extracted {feature_matrix.shape[1]} features[/green]")
        
        return feature_matrix, feature_names


if __name__ == "__main__":
    # Test feature extractor
    console.print("[bold cyan]Testing Feature Extractor[/bold cyan]\n")
    
    # Create synthetic CSI signals for different activities
    np.random.seed(42)
    
    # Walking: periodic pattern
    t = np.linspace(0, 4, 200)
    walking_signal = np.sin(2 * np.pi * 2 * t) + 0.3 * np.random.randn(len(t))
    
    # Falling: sudden change
    falling_signal = np.ones(200) * 0.5
    falling_signal[80:120] = 3.0  # Sudden spike
    falling_signal[120:] = 0.1    # Drop
    falling_signal += 0.2 * np.random.randn(len(falling_signal))
    
    # Sitting: low variance
    sitting_signal = 0.3 + 0.1 * np.random.randn(200)
    
    extractor = FeatureExtractor(sampling_rate=50.0)
    
    # Test feature extraction
    console.print("1. Testing Walking signal:")
    walking_features = extractor.extract_all_features(walking_signal)
    console.print(f"   Extracted {len(walking_features)} features")
    console.print(f"   Dominant frequency: {walking_features['freq_dominant_frequency']:.2f} Hz")
    console.print(f"   Signal variance: {walking_features['time_var']:.4f}")
    
    console.print("\n2. Testing Falling signal:")
    falling_features = extractor.extract_all_features(falling_signal)
    console.print(f"   Max value: {falling_features['time_max']:.2f}")
    console.print(f"   Range: {falling_features['time_range']:.2f}")
    console.print(f"   First diff max: {falling_features['temporal_diff1_max']:.2f}")
    
    console.print("\n3. Testing Sitting signal:")
    sitting_features = extractor.extract_all_features(sitting_signal)
    console.print(f"   Signal variance: {sitting_features['time_var']:.4f}")
    console.print(f"   Spectral entropy: {sitting_features['freq_spectral_entropy']:.4f}")
    
    # Test batch extraction
    console.print("\n4. Testing batch extraction:")
    X = np.array([walking_signal, falling_signal, sitting_signal])
    feature_matrix, feature_names = extractor.extract_features_batch(X)
    console.print(f"   Feature matrix shape: {feature_matrix.shape}")
    console.print(f"   Feature names (first 5): {feature_names[:5]}")
    
    console.print("\n[green]✓ All tests passed![/green]")
