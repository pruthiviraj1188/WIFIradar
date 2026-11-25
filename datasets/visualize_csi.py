"""
CSI Signal Visualization Tool

Visualizes raw CSI signals from the WiFall dataset to understand:
- Signal amplitude patterns
- Temporal characteristics
- Frequency domain representation
- Activity-specific signatures
"""

import os
import sys
from pathlib import Path
from typing import Optional, List
import json

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datasets import load_dataset
from scipy import signal
from rich.console import Console
from rich import print as rprint

console = Console()

# Set style
sns.set_style("darkgrid")
plt.rcParams['figure.figsize'] = (15, 10)


class CSIVisualizer:
    """Visualize CSI signals from WiFall dataset."""
    
    def __init__(self, cache_dir: Optional[str] = None):
        """Initialize the CSI visualizer."""
        self.cache_dir = cache_dir or str(PROJECT_ROOT / "datasets" / "raw" / "wifall")
        self.output_dir = PROJECT_ROOT / "datasets" / "metadata" / "visualizations"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.dataset = None
        self.label_names = {}
        
    def load_dataset(self):
        """Load the WiFall dataset."""
        console.print("[bold blue]Loading WiFall dataset...[/bold blue]")
        
        try:
            self.dataset = load_dataset(
                "RS2002/WiFall",
                cache_dir=self.cache_dir,
                trust_remote_code=True
            )
            
            # Try to extract label names
            split = list(self.dataset.keys())[0]
            features = self.dataset[split].features
            
            for col in ['label', 'activity', 'class']:
                if col in features and hasattr(features[col], 'names'):
                    self.label_names = {i: name for i, name in enumerate(features[col].names)}
                    break
            
            # If no predefined labels, extract unique values from 'taget' column
            if not self.label_names and 'taget' in self.dataset[split].column_names:
                unique_labels = set()
                for sample in self.dataset[split].select(range(min(1000, len(self.dataset[split])))):
                    unique_labels.add(sample['taget'])
                # Create a mapping of label string to itself
                self.label_names = {label: label for label in sorted(unique_labels)}
            
            console.print("[bold green]✓ Dataset loaded![/bold green]\n")
            return True
            
        except Exception as e:
            console.print(f"[bold red]✗ Error loading dataset: {e}[/bold red]")
            console.print("Run inspect_wifall.py first to download the dataset.")
            return False
    
    def parse_csi_data(self, csi_value):
        """Parse CSI data which might be a string or array."""
        if isinstance(csi_value, str):
            # Parse string representation: "[1, 2, 3, ...]"
            try:
                return np.array(eval(csi_value))
            except:
                return None
        return np.array(csi_value)
    
    def find_csi_and_label_columns(self, data):
        """Automatically detect CSI and label column names."""
        # Find CSI column
        csi_column = None
        for col in ['data', 'csi', 'csi_data', 'csi_amplitude', 'raw_csi']:
            if col in data.column_names:
                csi_column = col
                break
        
        # Find label column
        label_column = None
        for col in ['taget', 'label', 'activity', 'class', 'target']:
            if col in data.column_names:
                label_column = col
                break
        
        return csi_column, label_column
    
    def plot_raw_csi_samples(self, num_samples_per_class: int = 2):
        """Plot raw CSI signals for different activity classes."""
        if self.dataset is None:
            console.print("[red]Dataset not loaded.[/red]")
            return
        
        console.print("[bold cyan]Generating raw CSI visualizations...[/bold cyan]")
        
        split = list(self.dataset.keys())[0]
        data = self.dataset[split]
        
        csi_column, label_column = self.find_csi_and_label_columns(data)
        
        if csi_column is None or label_column is None:
            console.print(f"[red]Could not find CSI or label columns.[/red]")
            console.print(f"Available columns: {data.column_names}")
            return
        
        # Group samples by label
        label_to_samples = {}
        for idx, sample in enumerate(data):
            label = sample[label_column]
            if label not in label_to_samples:
                label_to_samples[label] = []
            if len(label_to_samples[label]) < num_samples_per_class:
                label_to_samples[label].append(idx)
        
        # Plot samples
        num_classes = len(label_to_samples)
        fig, axes = plt.subplots(num_classes, num_samples_per_class, 
                                 figsize=(15, 3 * num_classes))
        
        if num_classes == 1:
            axes = axes.reshape(1, -1)
        if num_samples_per_class == 1:
            axes = axes.reshape(-1, 1)
        
        for class_idx, (label, sample_indices) in enumerate(sorted(label_to_samples.items())):
            label_name = self.label_names.get(label, f"Class {label}")
            
            for sample_idx, data_idx in enumerate(sample_indices):
                ax = axes[class_idx, sample_idx]
                
                sample = data[data_idx]
                csi_data = self.parse_csi_data(sample[csi_column])
                
                if csi_data is None:
                    continue
                
                # Handle different CSI shapes
                if len(csi_data.shape) == 1:
                    # 1D: just time series
                    ax.plot(csi_data, linewidth=0.5)
                    ax.set_ylabel('CSI Amplitude')
                    
                elif len(csi_data.shape) == 2:
                    # 2D: time × subcarriers
                    # Plot first few subcarriers
                    for i in range(min(3, csi_data.shape[1])):
                        ax.plot(csi_data[:, i], linewidth=0.5, 
                               label=f'Subcarrier {i}', alpha=0.7)
                    ax.set_ylabel('CSI Amplitude')
                    if sample_idx == 0:
                        ax.legend(fontsize=8)
                    
                elif len(csi_data.shape) == 3:
                    # 3D: time × antennas × subcarriers
                    # Plot first antenna, first few subcarriers
                    for i in range(min(3, csi_data.shape[2])):
                        ax.plot(csi_data[:, 0, i], linewidth=0.5,
                               label=f'Subcarrier {i}', alpha=0.7)
                    ax.set_ylabel('CSI Amplitude')
                    if sample_idx == 0:
                        ax.legend(fontsize=8)
                
                ax.set_xlabel('Time Steps')
                ax.set_title(f'{label_name} - Sample {sample_idx + 1}')
                ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        output_path = self.output_dir / "raw_csi_samples.png"
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        console.print(f"[green]✓ Saved: {output_path}[/green]")
        plt.close()
    
    def plot_csi_spectrograms(self, num_samples: int = 4):
        """Generate spectrograms to visualize frequency content."""
        if self.dataset is None:
            return
        
        console.print("[bold cyan]Generating CSI spectrograms...[/bold cyan]")
        
        split = list(self.dataset.keys())[0]
        data = self.dataset[split]
        
        csi_column, label_column = self.find_csi_and_label_columns(data)
        
        if csi_column is None:
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        axes = axes.flatten()
        
        for idx in range(min(num_samples, len(data))):
            ax = axes[idx]
            
            sample = data[idx]
            csi_data = self.parse_csi_data(sample[csi_column])
            
            if csi_data is None:
                continue
            
            # Get 1D signal (use first subcarrier/antenna if multi-dimensional)
            if len(csi_data.shape) == 1:
                signal_1d = csi_data
            elif len(csi_data.shape) == 2:
                signal_1d = csi_data[:, 0]
            else:
                signal_1d = csi_data[:, 0, 0]
            
            # Compute spectrogram
            f, t, Sxx = signal.spectrogram(signal_1d, fs=1000, nperseg=64)
            
            im = ax.pcolormesh(t, f, 10 * np.log10(Sxx + 1e-10), 
                              shading='gouraud', cmap='viridis')
            ax.set_ylabel('Frequency [Hz]')
            ax.set_xlabel('Time [sec]')
            
            if label_column:
                label = sample[label_column]
                label_name = self.label_names.get(label, f"Class {label}")
                ax.set_title(f'Spectrogram - {label_name}')
            else:
                ax.set_title(f'Spectrogram - Sample {idx}')
            
            plt.colorbar(im, ax=ax, label='Power [dB]')
        
        plt.tight_layout()
        output_path = self.output_dir / "csi_spectrograms.png"
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        console.print(f"[green]✓ Saved: {output_path}[/green]")
        plt.close()
    
    def plot_amplitude_statistics(self):
        """Plot statistical properties of CSI amplitudes across activities."""
        if self.dataset is None:
            return
        
        console.print("[bold cyan]Computing amplitude statistics...[/bold cyan]")
        
        split = list(self.dataset.keys())[0]
        data = self.dataset[split]
        
        csi_column, label_column = self.find_csi_and_label_columns(data)
        
        if csi_column is None:
            return
        
        # Collect statistics
        stats_by_class = {}
        
        for sample in data:
            label = sample[label_column] if label_column else 0
            csi_data = self.parse_csi_data(sample[csi_column])
            
            if csi_data is None:
                continue
            
            if label not in stats_by_class:
                stats_by_class[label] = {
                    'mean': [],
                    'std': [],
                    'max': [],
                    'min': []
                }
            
            stats_by_class[label]['mean'].append(np.mean(csi_data))
            stats_by_class[label]['std'].append(np.std(csi_data))
            stats_by_class[label]['max'].append(np.max(csi_data))
            stats_by_class[label]['min'].append(np.min(csi_data))
        
        # Plot
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        stat_names = ['mean', 'std', 'max', 'min']
        stat_titles = ['Mean Amplitude', 'Standard Deviation', 'Max Amplitude', 'Min Amplitude']
        
        for idx, (stat_name, stat_title) in enumerate(zip(stat_names, stat_titles)):
            ax = axes[idx // 2, idx % 2]
            
            labels = []
            values = []
            
            for label in sorted(stats_by_class.keys()):
                label_name = self.label_names.get(label, f"Class {label}")
                labels.append(label_name)
                values.append(stats_by_class[label][stat_name])
            
            bp = ax.boxplot(values, patch_artist=True)
            ax.set_xticklabels(labels)
            
            # Color boxes
            colors = plt.cm.Set3(np.linspace(0, 1, len(labels)))
            for patch, color in zip(bp['boxes'], colors):
                patch.set_facecolor(color)
            
            ax.set_ylabel(stat_title)
            ax.set_xlabel('Activity Class')
            ax.set_title(f'CSI {stat_title} Distribution by Activity')
            ax.grid(True, alpha=0.3)
            
            # Rotate labels if needed
            plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
        
        plt.tight_layout()
        output_path = self.output_dir / "csi_amplitude_statistics.png"
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        console.print(f"[green]✓ Saved: {output_path}[/green]")
        plt.close()
    
    def plot_signal_variance_over_time(self, num_samples: int = 5):
        """Plot how signal variance changes over time for different activities."""
        if self.dataset is None:
            return
        
        console.print("[bold cyan]Analyzing signal variance over time...[/bold cyan]")
        
        split = list(self.dataset.keys())[0]
        data = self.dataset[split]
        
        csi_column, label_column = self.find_csi_and_label_columns(data)
        
        if csi_column is None:
            return
        
        # Group by label
        samples_by_label = {}
        for sample in data:
            label = sample[label_column]
            if label not in samples_by_label:
                samples_by_label[label] = []
            if len(samples_by_label[label]) < num_samples:
                samples_by_label[label].append(sample)
        
        # Plot
        num_classes = len(samples_by_label)
        fig, axes = plt.subplots(num_classes, 1, figsize=(15, 3 * num_classes))
        
        if num_classes == 1:
            axes = [axes]
        
        for idx, (label, samples) in enumerate(sorted(samples_by_label.items())):
            ax = axes[idx]
            label_name = self.label_names.get(label, f"Class {label}")
            
            for sample in samples:
                csi_data = self.parse_csi_data(sample[csi_column])
                
                if csi_data is None:
                    continue
                
                # Compute rolling variance
                if len(csi_data.shape) == 1:
                    signal_1d = csi_data
                elif len(csi_data.shape) == 2:
                    signal_1d = np.mean(csi_data, axis=1)
                else:
                    signal_1d = np.mean(csi_data, axis=(1, 2))
                
                # Rolling variance with window size
                window_size = min(50, len(signal_1d) // 10)
                if window_size > 1:
                    variance = np.array([np.var(signal_1d[max(0, i-window_size):i+1]) 
                                       for i in range(len(signal_1d))])
                    ax.plot(variance, alpha=0.5, linewidth=1)
            
            ax.set_ylabel('Variance')
            ax.set_xlabel('Time Steps')
            ax.set_title(f'Signal Variance Over Time - {label_name}')
            ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        output_path = self.output_dir / "signal_variance.png"
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        console.print(f"[green]✓ Saved: {output_path}[/green]")
        plt.close()
    
    def generate_summary_report(self):
        """Generate a summary visualization report."""
        console.print("\n[bold green]Visualization Complete![/bold green]\n")
        console.print("[bold]Generated Visualizations:[/bold]")
        console.print(f"  • Raw CSI samples: {self.output_dir / 'raw_csi_samples.png'}")
        console.print(f"  • CSI spectrograms: {self.output_dir / 'csi_spectrograms.png'}")
        console.print(f"  • Amplitude statistics: {self.output_dir / 'csi_amplitude_statistics.png'}")
        console.print(f"  • Signal variance: {self.output_dir / 'signal_variance.png'}")
        
        console.print("\n[bold yellow]Key Observations to Look For:[/bold yellow]")
        console.print("  • Different activities should show distinct signal patterns")
        console.print("  • Fall events typically show sudden amplitude changes")
        console.print("  • Walking shows periodic patterns")
        console.print("  • Sitting/Standing shows lower variance")
        console.print("  • Empty room should have minimal signal variation")


def main():
    """Main execution."""
    console.print("[bold cyan]WiFi-Radar CSI Signal Visualizer[/bold cyan]\n")
    
    visualizer = CSIVisualizer()
    
    if not visualizer.load_dataset():
        return
    
    # Generate all visualizations
    visualizer.plot_raw_csi_samples(num_samples_per_class=2)
    visualizer.plot_csi_spectrograms(num_samples=4)
    visualizer.plot_amplitude_statistics()
    visualizer.plot_signal_variance_over_time(num_samples=5)
    
    # Summary
    visualizer.generate_summary_report()


if __name__ == "__main__":
    main()
