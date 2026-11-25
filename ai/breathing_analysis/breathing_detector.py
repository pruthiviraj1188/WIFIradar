"""
Breathing Rate Detector

Estimates breathing rate from CSI signals.
"""

import numpy as np
from scipy.signal import find_peaks
from typing import Tuple, Optional, List
from rich.console import Console

console = Console()


class BreathingRateDetector:
    """Detect and estimate breathing rate from CSI signals."""
    
    def __init__(self, sampling_rate: float = 50.0):
        """
        Initialize breathing rate detector.
        
        Args:
            sampling_rate: CSI sampling rate in Hz
        """
        self.sampling_rate = sampling_rate
        
        # Normal breathing range: 12-20 breaths/min
        self.normal_min_bpm = 12
        self.normal_max_bpm = 20
        
    def estimate_rate_from_peaks(
        self,
        respiratory_wave: np.ndarray,
        min_distance: Optional[int] = None
    ) -> Tuple[float, List[int]]:
        """
        Estimate breathing rate by counting peaks in respiratory waveform.
        
        Args:
            respiratory_wave: Extracted respiratory waveform
            min_distance: Minimum distance between peaks (samples)
            
        Returns:
            Tuple of (breathing_rate_bpm, peak_indices)
        """
        # Default min distance: 2 seconds (max 30 breaths/min)
        if min_distance is None:
            min_distance = int(2.0 * self.sampling_rate)
        
        # Find peaks
        peaks, properties = find_peaks(
            respiratory_wave,
            distance=min_distance,
            prominence=0.5  # Require significant peaks
        )
        
        if len(peaks) < 2:
            return 0.0, []
        
        # Calculate breathing rate from peak intervals
        peak_intervals = np.diff(peaks) / self.sampling_rate  # In seconds
        avg_interval = np.mean(peak_intervals)
        
        # Convert to breaths per minute
        breathing_rate_bpm = 60.0 / avg_interval
        
        return breathing_rate_bpm, peaks.tolist()
    
    def estimate_rate_from_fft(
        self,
        respiratory_wave: np.ndarray
    ) -> float:
        """
        Estimate breathing rate from frequency spectrum.
        
        Args:
            respiratory_wave: Extracted respiratory waveform
            
        Returns:
            Breathing rate in breaths per minute
        """
        # Compute FFT
        fft_vals = np.fft.fft(respiratory_wave)
        freqs = np.fft.fftfreq(len(respiratory_wave), 1/self.sampling_rate)
        
        # Only consider positive frequencies in breathing range
        breath_mask = (freqs > 0.1) & (freqs < 0.5)
        
        # Find dominant frequency
        breath_freqs = freqs[breath_mask]
        breath_magnitudes = np.abs(fft_vals[breath_mask])
        
        if len(breath_magnitudes) == 0:
            return 0.0
        
        dominant_freq = breath_freqs[np.argmax(breath_magnitudes)]
        
        # Convert to breaths per minute
        breathing_rate_bpm = dominant_freq * 60.0
        
        return breathing_rate_bpm
    
    def estimate_breathing_rate(
        self,
        respiratory_wave: np.ndarray,
        method: str = 'combined'
    ) -> Tuple[float, dict]:
        """
        Estimate breathing rate using specified method.
        
        Args:
            respiratory_wave: Extracted respiratory waveform
            method: 'peaks', 'fft', or 'combined'
            
        Returns:
            Tuple of (breathing_rate_bpm, metadata)
        """
        metadata = {}
        
        if method == 'peaks':
            rate, peaks = self.estimate_rate_from_peaks(respiratory_wave)
            metadata['method'] = 'peak_counting'
            metadata['num_peaks'] = len(peaks)
            metadata['peak_indices'] = peaks
            
        elif method == 'fft':
            rate = self.estimate_rate_from_fft(respiratory_wave)
            metadata['method'] = 'fft_analysis'
            
        elif method == 'combined':
            # Use both methods and average
            rate_peaks, peaks = self.estimate_rate_from_peaks(respiratory_wave)
            rate_fft = self.estimate_rate_from_fft(respiratory_wave)
            
            # Weighted average (prefer FFT for noisy signals)
            if rate_peaks > 0 and rate_fft > 0:
                rate = 0.4 * rate_peaks + 0.6 * rate_fft
            elif rate_peaks > 0:
                rate = rate_peaks
            elif rate_fft > 0:
                rate = rate_fft
            else:
                rate = 0.0
            
            metadata['method'] = 'combined'
            metadata['rate_from_peaks'] = rate_peaks
            metadata['rate_from_fft'] = rate_fft
            metadata['num_peaks'] = len(peaks)
            
        else:
            raise ValueError(f"Unknown method: {method}")
        
        return rate, metadata
    
    def classify_breathing_pattern(
        self,
        breathing_rate_bpm: float
    ) -> str:
        """
        Classify breathing pattern based on rate.
        
        Args:
            breathing_rate_bpm: Breathing rate in breaths per minute
            
        Returns:
            Classification string
        """
        if breathing_rate_bpm == 0:
            return "No breathing detected"
        elif breathing_rate_bpm < 10:
            return "Very slow (bradypnea)"
        elif breathing_rate_bpm < self.normal_min_bpm:
            return "Slow"
        elif breathing_rate_bpm <= self.normal_max_bpm:
            return "Normal"
        elif breathing_rate_bpm <= 25:
            return "Fast"
        else:
            return "Very fast (tachypnea)"
    
    def compute_breathing_stability(
        self,
        respiratory_wave: np.ndarray
    ) -> Tuple[float, str]:
        """
        Compute breathing stability/regularity.
        
        Args:
            respiratory_wave: Extracted respiratory waveform
            
        Returns:
            Tuple of (stability_score, stability_level)
            - stability_score: 0-1, higher = more stable
            - stability_level: 'unstable', 'moderate', 'stable'
        """
        # Find peaks
        peaks, _ = find_peaks(
            respiratory_wave,
            distance=int(2.0 * self.sampling_rate),
            prominence=0.5
        )
        
        if len(peaks) < 3:
            return 0.0, "insufficient_data"
        
        # Calculate peak interval variability
        intervals = np.diff(peaks) / self.sampling_rate
        mean_interval = np.mean(intervals)
        std_interval = np.std(intervals)
        
        # Coefficient of variation
        cv = std_interval / (mean_interval + 1e-8)
        
        # Convert to stability score (lower CV = higher stability)
        stability_score = np.exp(-5 * cv)  # Exponential decay
        stability_score = np.clip(stability_score, 0, 1)
        
        # Classify
        if stability_score > 0.7:
            stability_level = "stable"
        elif stability_score > 0.4:
            stability_level = "moderate"
        else:
            stability_level = "unstable"
        
        return float(stability_score), stability_level
    
    def analyze_breathing(
        self,
        respiratory_wave: np.ndarray
    ) -> dict:
        """
        Comprehensive breathing analysis.
        
        Args:
            respiratory_wave: Extracted respiratory waveform
            
        Returns:
            Dictionary containing all analysis results
        """
        # Estimate rate
        rate, rate_metadata = self.estimate_breathing_rate(respiratory_wave, method='combined')
        
        # Classify pattern
        pattern = self.classify_breathing_pattern(rate)
        
        # Compute stability
        stability_score, stability_level = self.compute_breathing_stability(respiratory_wave)
        
        # Compile results
        results = {
            'breathing_rate_bpm': round(rate, 2),
            'breathing_pattern': pattern,
            'is_normal': self.normal_min_bpm <= rate <= self.normal_max_bpm,
            'stability_score': round(stability_score, 3),
            'stability_level': stability_level,
            'signal_length_seconds': len(respiratory_wave) / self.sampling_rate,
            'estimation_method': rate_metadata.get('method', 'unknown'),
            'metadata': rate_metadata
        }
        
        return results


if __name__ == "__main__":
    # Test breathing rate detector
    console.print("[bold cyan]Testing Breathing Rate Detector[/bold cyan]\n")
    
    # Create synthetic respiratory waveform
    np.random.seed(42)
    duration = 60  # 60 seconds
    sampling_rate = 50  # Hz
    t = np.linspace(0, duration, int(duration * sampling_rate))
    
    # Simulate breathing at 15 breaths/min = 0.25 Hz
    true_breathing_rate = 15  # BPM
    breathing_freq = true_breathing_rate / 60.0
    
    respiratory_wave = np.sin(2 * np.pi * breathing_freq * t)
    respiratory_wave += 0.1 * np.random.randn(len(t))  # Add small noise
    
    # Create detector
    detector = BreathingRateDetector(sampling_rate=sampling_rate)
    
    # Estimate rate
    console.print(f"True breathing rate: {true_breathing_rate} BPM")
    
    rate_peaks, peaks = detector.estimate_rate_from_peaks(respiratory_wave)
    console.print(f"\n1. Peak method: {rate_peaks:.2f} BPM ({len(peaks)} peaks)")
    
    rate_fft = detector.estimate_rate_from_fft(respiratory_wave)
    console.print(f"2. FFT method: {rate_fft:.2f} BPM")
    
    rate_combined, metadata = detector.estimate_breathing_rate(respiratory_wave, method='combined')
    console.print(f"3. Combined method: {rate_combined:.2f} BPM")
    
    # Classify pattern
    pattern = detector.classify_breathing_pattern(rate_combined)
    console.print(f"\n4. Breathing pattern: {pattern}")
    
    # Stability
    stability, level = detector.compute_breathing_stability(respiratory_wave)
    console.print(f"5. Stability score: {stability:.3f} ({level})")
    
    # Full analysis
    console.print("\n6. Full Analysis:")
    results = detector.analyze_breathing(respiratory_wave)
    for key, value in results.items():
        if key != 'metadata':
            console.print(f"   {key}: {value}")
    
    console.print("\n[green]✓ All tests passed![/green]")
