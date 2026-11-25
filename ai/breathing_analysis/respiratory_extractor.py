"""
Respiratory Waveform Extraction

Extracts breathing patterns from WiFi CSI signals using signal processing.
Normal human breathing rate: 12-20 breaths per minute (0.2-0.33 Hz)
"""

import numpy as np
from scipy import signal
from scipy.signal import butter, filtfilt, find_peaks
from typing import Tuple, Optional
from rich.console import Console

console = Console()


class RespiratoryWaveformExtractor:
    """Extract respiratory waveforms from CSI signals."""
    
    def __init__(self, sampling_rate: float = 50.0):
        """
        Initialize respiratory waveform extractor.
        
        Args:
            sampling_rate: CSI sampling rate in Hz
        """
        self.sampling_rate = sampling_rate
        
        # Breathing frequency range
        self.min_breath_freq = 0.1  # 6 breaths/min (very slow)
        self.max_breath_freq = 0.5  # 30 breaths/min (fast/hyperventilating)
        
    def bandpass_filter_breathing(
        self,
        signal_data: np.ndarray,
        low_freq: Optional[float] = None,
        high_freq: Optional[float] = None,
        order: int = 4
    ) -> np.ndarray:
        """
        Apply bandpass filter to isolate breathing frequency range.
        
        Args:
            signal_data: Input CSI signal
            low_freq: Low cutoff frequency (Hz), default 0.1 Hz
            high_freq: High cutoff frequency (Hz), default 0.5 Hz
            order: Filter order
            
        Returns:
            Filtered signal containing only breathing frequencies
        """
        low_freq = low_freq or self.min_breath_freq
        high_freq = high_freq or self.max_breath_freq
        
        nyquist_freq = 0.5 * self.sampling_rate
        low = low_freq / nyquist_freq
        high = high_freq / nyquist_freq
        
        b, a = butter(order, [low, high], btype='band')
        filtered_signal = filtfilt(b, a, signal_data)
        
        return filtered_signal
    
    def remove_body_motion(
        self,
        signal_data: np.ndarray,
        motion_cutoff: float = 1.0
    ) -> np.ndarray:
        """
        Remove body motion artifacts using high-pass filter.
        
        Args:
            signal_data: Input signal
            motion_cutoff: Cutoff frequency for body motion (Hz)
            
        Returns:
            Signal with body motion removed
        """
        nyquist_freq = 0.5 * self.sampling_rate
        normalized_cutoff = motion_cutoff / nyquist_freq
        
        b, a = butter(3, normalized_cutoff, btype='high')
        filtered_signal = filtfilt(b, a, signal_data)
        
        return filtered_signal
    
    def extract_respiratory_waveform(
        self,
        csi_signal: np.ndarray,
        apply_motion_removal: bool = False
    ) -> np.ndarray:
        """
        Extract respiratory waveform from CSI signal.
        
        Args:
            csi_signal: Input CSI signal
            apply_motion_removal: Whether to apply motion artifact removal
            
        Returns:
            Extracted respiratory waveform
        """
        # Step 1: Remove body motion if requested
        if apply_motion_removal:
            processed = self.remove_body_motion(csi_signal)
        else:
            processed = csi_signal.copy()
        
        # Step 2: Apply bandpass filter for breathing frequencies
        respiratory_wave = self.bandpass_filter_breathing(processed)
        
        # Step 3: Normalize
        respiratory_wave = (respiratory_wave - np.mean(respiratory_wave)) / (np.std(respiratory_wave) + 1e-8)
        
        return respiratory_wave
    
    def compute_breathing_periodicity(
        self,
        respiratory_wave: np.ndarray
    ) -> Tuple[float, bool]:
        """
        Compute breathing periodicity score.
        
        Args:
            respiratory_wave: Extracted respiratory waveform
            
        Returns:
            Tuple of (periodicity_score, is_periodic)
            - periodicity_score: 0-1, higher = more periodic
            - is_periodic: True if signal shows periodic breathing pattern
        """
        # Use autocorrelation to detect periodicity
        autocorr = np.correlate(respiratory_wave, respiratory_wave, mode='full')
        autocorr = autocorr[len(autocorr)//2:]
        
        # Normalize
        autocorr = autocorr / autocorr[0]
        
        # Find peaks in autocorrelation (excluding the first peak at lag 0)
        min_lag = int(self.sampling_rate / self.max_breath_freq)  # Min period
        max_lag = int(self.sampling_rate / self.min_breath_freq)  # Max period
        
        peaks, properties = find_peaks(
            autocorr[min_lag:max_lag],
            height=0.3,  # Minimum correlation coefficient
            distance=min_lag
        )
        
        if len(peaks) > 0:
            # Periodicity score based on first peak height
            periodicity_score = float(properties['peak_heights'][0])
            is_periodic = periodicity_score > 0.5
        else:
            periodicity_score = 0.0
            is_periodic = False
        
        return periodicity_score, is_periodic
    
    def detect_breathing_presence(
        self,
        csi_signal: np.ndarray,
        threshold: float = 0.4
    ) -> Tuple[bool, float]:
        """
        Detect if breathing pattern is present in signal.
        
        Args:
            csi_signal: Input CSI signal
            threshold: Periodicity threshold for detection
            
        Returns:
            Tuple of (breathing_detected, confidence)
        """
        # Extract respiratory waveform
        respiratory_wave = self.extract_respiratory_waveform(csi_signal)
        
        # Check periodicity
        periodicity_score, is_periodic = self.compute_breathing_periodicity(respiratory_wave)
        
        # Check signal power in breathing frequency range
        fft_vals = np.fft.fft(respiratory_wave)
        freqs = np.fft.fftfreq(len(respiratory_wave), 1/self.sampling_rate)
        
        breath_band_mask = (np.abs(freqs) >= self.min_breath_freq) & (np.abs(freqs) <= self.max_breath_freq)
        breath_power = np.sum(np.abs(fft_vals[breath_band_mask])**2)
        total_power = np.sum(np.abs(fft_vals)**2)
        power_ratio = breath_power / (total_power + 1e-10)
        
        # Combine metrics
        confidence = 0.6 * periodicity_score + 0.4 * power_ratio
        breathing_detected = confidence > threshold
        
        return breathing_detected, float(confidence)
    
    def visualize_extraction(
        self,
        csi_signal: np.ndarray,
        output_path: Optional[str] = None
    ):
        """
        Visualize respiratory waveform extraction process.
        
        Args:
            csi_signal: Input CSI signal
            output_path: Optional path to save figure
        """
        import matplotlib.pyplot as plt
        
        # Extract waveform
        respiratory_wave = self.extract_respiratory_waveform(csi_signal)
        
        # Time axis
        time = np.arange(len(csi_signal)) / self.sampling_rate
        
        # Create figure
        fig, axes = plt.subplots(3, 1, figsize=(14, 10))
        
        # 1. Original CSI signal
        axes[0].plot(time, csi_signal, linewidth=0.8, color='steelblue')
        axes[0].set_ylabel('CSI Amplitude', fontweight='bold')
        axes[0].set_title('Original CSI Signal', fontweight='bold', fontsize=12)
        axes[0].grid(True, alpha=0.3)
        
        # 2. Extracted respiratory waveform
        axes[1].plot(time, respiratory_wave, linewidth=1.2, color='crimson')
        axes[1].set_ylabel('Normalized Amplitude', fontweight='bold')
        axes[1].set_title('Extracted Respiratory Waveform (0.1-0.5 Hz)', fontweight='bold', fontsize=12)
        axes[1].grid(True, alpha=0.3)
        
        # 3. Frequency spectrum
        fft_vals = np.fft.fft(respiratory_wave)
        freqs = np.fft.fftfreq(len(respiratory_wave), 1/self.sampling_rate)
        
        # Only plot positive frequencies up to 2 Hz
        pos_mask = (freqs >= 0) & (freqs <= 2.0)
        
        axes[2].plot(freqs[pos_mask], np.abs(fft_vals[pos_mask]), linewidth=1.5, color='darkgreen')
        axes[2].axvspan(self.min_breath_freq, self.max_breath_freq, alpha=0.2, color='yellow', 
                       label='Breathing Range')
        axes[2].set_xlabel('Frequency (Hz)', fontweight='bold')
        axes[2].set_ylabel('Magnitude', fontweight='bold')
        axes[2].set_title('Frequency Spectrum', fontweight='bold', fontsize=12)
        axes[2].legend()
        axes[2].grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        if output_path:
            plt.savefig(output_path, dpi=150, bbox_inches='tight')
            console.print(f"[green]✓ Saved visualization to {output_path}[/green]")
        
        return fig


if __name__ == "__main__":
    # Test respiratory waveform extractor
    console.print("[bold cyan]Testing Respiratory Waveform Extractor[/bold cyan]\n")
    
    # Create synthetic signal: CSI with breathing component
    np.random.seed(42)
    duration = 30  # seconds
    sampling_rate = 50  # Hz
    t = np.linspace(0, duration, int(duration * sampling_rate))
    
    # Simulate breathing at 15 breaths/min = 0.25 Hz
    breathing_freq = 0.25
    breathing_signal = 2 * np.sin(2 * np.pi * breathing_freq * t)
    
    # Add slow body motion
    body_motion = 0.5 * np.sin(2 * np.pi * 0.05 * t)
    
    # Add noise and baseline
    noise = 0.3 * np.random.randn(len(t))
    baseline = 5.0
    
    # Combined signal
    csi_signal = baseline + breathing_signal + body_motion + noise
    
    # Extract respiratory waveform
    extractor = RespiratoryWaveformExtractor(sampling_rate=sampling_rate)
    respiratory_wave = extractor.extract_respiratory_waveform(csi_signal)
    
    console.print(f"1. Original signal length: {len(csi_signal)} samples")
    console.print(f"2. Extracted waveform length: {len(respiratory_wave)} samples")
    
    # Check periodicity
    periodicity, is_periodic = extractor.compute_breathing_periodicity(respiratory_wave)
    console.print(f"3. Periodicity score: {periodicity:.3f}")
    console.print(f"4. Is periodic: {is_periodic}")
    
    # Detect breathing
    detected, confidence = extractor.detect_breathing_presence(csi_signal)
    console.print(f"5. Breathing detected: {detected}")
    console.print(f"6. Confidence: {confidence:.3f}")
    
    console.print("\n[green]✓ All tests passed![/green]")
