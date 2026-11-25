"""
Signal Processing for CSI Data

Provides filtering, normalization, and segmentation utilities.
"""

import numpy as np
from scipy import signal
from scipy.signal import butter, filtfilt
from typing import List, Tuple, Optional
from rich.console import Console

console = Console()


class SignalProcessor:
    """Process raw CSI signals for model input."""
    
    def __init__(
        self,
        window_size: int = 200,
        window_overlap: int = 100,
        sampling_rate: float = 50.0
    ):
        """
        Initialize signal processor.
        
        Args:
            window_size: Number of samples per window
            window_overlap: Number of overlapping samples between windows
            sampling_rate: CSI sampling rate in Hz
        """
        self.window_size = window_size
        self.window_overlap = window_overlap
        self.sampling_rate = sampling_rate
        
    def apply_butterworth_filter(
        self,
        data: np.ndarray,
        cutoff_freq: float = 10.0,
        filter_order: int = 4,
        filter_type: str = 'low'
    ) -> np.ndarray:
        """
        Apply Butterworth filter to remove noise.
        
        Args:
            data: Input signal (1D array)
            cutoff_freq: Cutoff frequency in Hz
            filter_order: Filter order
            filter_type: 'low', 'high', or 'band'
            
        Returns:
            Filtered signal
        """
        nyquist_freq = 0.5 * self.sampling_rate
        normal_cutoff = cutoff_freq / nyquist_freq
        
        b, a = butter(filter_order, normal_cutoff, btype=filter_type, analog=False)
        filtered_data = filtfilt(b, a, data)
        
        return filtered_data
    
    def remove_outliers(
        self,
        data: np.ndarray,
        threshold: float = 3.0
    ) -> np.ndarray:
        """
        Remove outliers using z-score method.
        
        Args:
            data: Input signal
            threshold: Z-score threshold for outlier detection
            
        Returns:
            Signal with outliers replaced by interpolated values
        """
        z_scores = np.abs((data - np.mean(data)) / (np.std(data) + 1e-8))
        outlier_mask = z_scores > threshold
        
        # Replace outliers with interpolated values
        clean_data = data.copy()
        if np.any(outlier_mask):
            x = np.arange(len(data))
            clean_data[outlier_mask] = np.interp(
                x[outlier_mask],
                x[~outlier_mask],
                data[~outlier_mask]
            )
        
        return clean_data
    
    def normalize(
        self,
        data: np.ndarray,
        method: str = 'minmax'
    ) -> np.ndarray:
        """
        Normalize signal.
        
        Args:
            data: Input signal
            method: 'minmax', 'zscore', or 'robust'
            
        Returns:
            Normalized signal
        """
        if method == 'minmax':
            # Min-max normalization to [0, 1]
            data_min = np.min(data)
            data_max = np.max(data)
            if data_max - data_min > 1e-8:
                return (data - data_min) / (data_max - data_min)
            return data
            
        elif method == 'zscore':
            # Z-score normalization
            mean = np.mean(data)
            std = np.std(data)
            if std > 1e-8:
                return (data - mean) / std
            return data - mean
            
        elif method == 'robust':
            # Robust scaling using median and IQR
            median = np.median(data)
            q75, q25 = np.percentile(data, [75, 25])
            iqr = q75 - q25
            if iqr > 1e-8:
                return (data - median) / iqr
            return data - median
            
        else:
            raise ValueError(f"Unknown normalization method: {method}")
    
    def segment_signal(
        self,
        data: np.ndarray,
        window_size: Optional[int] = None,
        overlap: Optional[int] = None
    ) -> List[np.ndarray]:
        """
        Segment signal into fixed-size windows with overlap.
        
        Args:
            data: Input signal (1D array)
            window_size: Size of each window (uses self.window_size if None)
            overlap: Overlap between windows (uses self.window_overlap if None)
            
        Returns:
            List of windowed segments
        """
        window_size = window_size or self.window_size
        overlap = overlap or self.window_overlap
        
        step = window_size - overlap
        segments = []
        
        for start in range(0, len(data) - window_size + 1, step):
            end = start + window_size
            segments.append(data[start:end])
        
        return segments
    
    def pad_or_truncate(
        self,
        data: np.ndarray,
        target_length: int,
        pad_value: float = 0.0
    ) -> np.ndarray:
        """
        Pad or truncate signal to target length.
        
        Args:
            data: Input signal
            target_length: Desired length
            pad_value: Value to use for padding
            
        Returns:
            Signal with target length
        """
        if len(data) == target_length:
            return data
        elif len(data) > target_length:
            # Truncate
            return data[:target_length]
        else:
            # Pad
            pad_length = target_length - len(data)
            return np.pad(data, (0, pad_length), mode='constant', constant_values=pad_value)
    
    def process_pipeline(
        self,
        data: np.ndarray,
        apply_filter: bool = True,
        remove_outliers: bool = True,
        normalize: bool = True,
        normalization_method: str = 'minmax'
    ) -> np.ndarray:
        """
        Apply complete preprocessing pipeline.
        
        Args:
            data: Input signal
            apply_filter: Whether to apply Butterworth filter
            remove_outliers: Whether to remove outliers
            normalize: Whether to normalize
            normalization_method: Normalization method to use
            
        Returns:
            Processed signal
        """
        processed = data.copy()
        
        # Step 1: Filter noise
        if apply_filter:
            processed = self.apply_butterworth_filter(processed)
        
        # Step 2: Remove outliers
        if remove_outliers:
            processed = self.remove_outliers(processed)
        
        # Step 3: Normalize
        if normalize:
            processed = self.normalize(processed, method=normalization_method)
        
        return processed
    
    def process_batch(
        self,
        X: List[np.ndarray],
        fixed_length: Optional[int] = None,
        **kwargs
    ) -> np.ndarray:
        """
        Process a batch of signals.
        
        Args:
            X: List of input signals
            fixed_length: If provided, all signals will be padded/truncated to this length
            **kwargs: Additional arguments for process_pipeline
            
        Returns:
            Numpy array of processed signals, shape (n_samples, signal_length)
        """
        console.print(f"[cyan]Processing {len(X)} signals...[/cyan]")
        
        processed_signals = []
        
        for signal_data in X:
            # Process signal
            processed = self.process_pipeline(signal_data, **kwargs)
            
            # Pad or truncate if needed
            if fixed_length is not None:
                processed = self.pad_or_truncate(processed, fixed_length)
            
            processed_signals.append(processed)
        
        # Convert to array
        result = np.array(processed_signals, dtype=np.float32)
        
        console.print(f"[green]✓ Processed batch shape: {result.shape}[/green]")
        
        return result


if __name__ == "__main__":
    # Test signal processor
    console.print("[bold cyan]Testing Signal Processor[/bold cyan]\n")
    
    # Create synthetic CSI signal
    np.random.seed(42)
    t = np.linspace(0, 10, 1000)
    signal_data = np.sin(2 * np.pi * 1 * t) + 0.5 * np.random.randn(len(t))
    
    # Add some outliers
    signal_data[100] = 10
    signal_data[500] = -10
    
    processor = SignalProcessor(window_size=200, window_overlap=100)
    
    # Test processing
    console.print("1. Original signal shape:", signal_data.shape)
    
    filtered = processor.apply_butterworth_filter(signal_data)
    console.print("2. Filtered signal shape:", filtered.shape)
    
    cleaned = processor.remove_outliers(signal_data)
    console.print("3. Cleaned signal shape:", cleaned.shape)
    
    normalized = processor.normalize(signal_data, method='minmax')
    console.print("4. Normalized range:", normalized.min(), "to", normalized.max())
    
    segments = processor.segment_signal(signal_data)
    console.print(f"5. Segmented into {len(segments)} windows of size {len(segments[0])}")
    
    # Test full pipeline
    processed = processor.process_pipeline(signal_data)
    console.print("6. Full pipeline output shape:", processed.shape)
    
    console.print("\n[green]✓ All tests passed![/green]")
