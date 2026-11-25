"""
WiFall Dataset Inspector

This script downloads and inspects the WiFall dataset from HuggingFace.
WiFall uses ESP32-S3 CSI data for human activity and fall detection.

Dataset: https://huggingface.co/datasets/RS2002/WiFall
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import json

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd
from datasets import load_dataset
from tqdm import tqdm
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

console = Console()


class WiFallInspector:
    """Inspect and document the WiFall dataset structure and content."""
    
    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize the WiFall inspector.
        
        Args:
            cache_dir: Directory to cache downloaded dataset (default: ./datasets/raw/wifall)
        """
        self.cache_dir = cache_dir or str(PROJECT_ROOT / "datasets" / "raw" / "wifall")
        self.metadata_dir = PROJECT_ROOT / "datasets" / "metadata"
        self.metadata_dir.mkdir(parents=True, exist_ok=True)
        
        self.dataset = None
        self.metadata = {}
        
    def download_dataset(self):
        """Download the WiFall dataset from HuggingFace."""
        console.print("\n[bold blue]Downloading WiFall Dataset from HuggingFace...[/bold blue]")
        console.print("This may take several minutes depending on your connection.\n")
        
        try:
            # Try to load the dataset
            self.dataset = load_dataset(
                "RS2002/WiFall",
                cache_dir=self.cache_dir,
                trust_remote_code=True  # Required for some datasets
            )
            console.print("[bold green]✓ Dataset downloaded successfully![/bold green]\n")
            return True
            
        except Exception as e:
            console.print(f"[bold red]✗ Error downloading dataset: {e}[/bold red]")
            console.print("\n[yellow]Troubleshooting tips:[/yellow]")
            console.print("1. Check your internet connection")
            console.print("2. Verify the dataset exists: https://huggingface.co/datasets/RS2002/WiFall")
            console.print("3. Try setting HF_TOKEN if the dataset is private")
            return False
    
    def inspect_structure(self):
        """Inspect the dataset structure and splits."""
        if self.dataset is None:
            console.print("[red]Dataset not loaded. Call download_dataset() first.[/red]")
            return
        
        console.print(Panel.fit(
            "[bold]WiFall Dataset Structure Inspection[/bold]",
            border_style="blue"
        ))
        
        # Check available splits
        console.print("\n[bold cyan]Available Splits:[/bold cyan]")
        splits = list(self.dataset.keys())
        
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Split", style="cyan")
        table.add_column("Number of Samples", justify="right", style="green")
        
        for split in splits:
            num_samples = len(self.dataset[split])
            table.add_row(split, str(num_samples))
        
        console.print(table)
        
        self.metadata['splits'] = {split: len(self.dataset[split]) for split in splits}
        
        # Inspect features
        console.print("\n[bold cyan]Dataset Features:[/bold cyan]")
        features = self.dataset[splits[0]].features
        
        feature_table = Table(show_header=True, header_style="bold magenta")
        feature_table.add_column("Feature Name", style="cyan")
        feature_table.add_column("Data Type", style="yellow")
        
        for feature_name, feature_type in features.items():
            feature_table.add_row(feature_name, str(feature_type))
        
        console.print(feature_table)
        
        self.metadata['features'] = {name: str(dtype) for name, dtype in features.items()}
    
    def inspect_labels(self):
        """Inspect and document activity labels."""
        if self.dataset is None:
            return
        
        console.print("\n[bold cyan]Activity Label Distribution:[/bold cyan]")
        
        # Get the first available split
        split = list(self.dataset.keys())[0]
        data = self.dataset[split]
        
        # Try to find label column (might be 'label', 'activity', 'class', etc.)
        label_column = None
        for col in ['label', 'activity', 'class', 'target', 'activity_label']:
            if col in data.column_names:
                label_column = col
                break
        
        if label_column is None:
            console.print("[yellow]⚠ Could not automatically detect label column.[/yellow]")
            console.print(f"Available columns: {data.column_names}")
            return
        
        # Count label distribution
        labels = []
        for sample in tqdm(data, desc="Analyzing labels"):
            labels.append(sample[label_column])
        
        label_counts = pd.Series(labels).value_counts().sort_index()
        
        label_table = Table(show_header=True, header_style="bold magenta")
        label_table.add_column("Label ID", justify="right", style="cyan")
        label_table.add_column("Label Name", style="yellow")
        label_table.add_column("Count", justify="right", style="green")
        label_table.add_column("Percentage", justify="right", style="blue")
        
        total_samples = len(labels)
        
        # Try to get label names if available
        label_names = {}
        if hasattr(data.features[label_column], 'names'):
            label_names = {i: name for i, name in enumerate(data.features[label_column].names)}
        
        for label_id, count in label_counts.items():
            label_name = label_names.get(label_id, "Unknown")
            percentage = (count / total_samples) * 100
            label_table.add_row(
                str(label_id),
                label_name,
                str(count),
                f"{percentage:.2f}%"
            )
        
        console.print(label_table)
        
        self.metadata['labels'] = {
            'column_name': label_column,
            'label_names': label_names,
            'distribution': label_counts.to_dict()
        }
    
    def inspect_csi_format(self, num_samples: int = 5):
        """Inspect the CSI data format and shape."""
        if self.dataset is None:
            return
        
        console.print("\n[bold cyan]CSI Data Format Inspection:[/bold cyan]")
        
        split = list(self.dataset.keys())[0]
        data = self.dataset[split]
        
        # Try to find CSI column
        csi_column = None
        for col in ['csi', 'csi_data', 'csi_amplitude', 'raw_csi', 'channel_state_information']:
            if col in data.column_names:
                csi_column = col
                break
        
        if csi_column is None:
            console.print("[yellow]⚠ Could not automatically detect CSI column.[/yellow]")
            console.print(f"Available columns: {data.column_names}")
            
            # Inspect first sample to find CSI
            console.print("\n[bold]Inspecting first sample:[/bold]")
            first_sample = data[0]
            for key, value in first_sample.items():
                if isinstance(value, (list, np.ndarray)):
                    value_array = np.array(value)
                    console.print(f"  {key}: shape {value_array.shape}, dtype {value_array.dtype}")
            return
        
        console.print(f"Found CSI data in column: [bold]{csi_column}[/bold]\n")
        
        # Analyze CSI shape and statistics
        shapes = []
        dtypes = []
        
        for i in range(min(num_samples, len(data))):
            sample = data[i]
            csi_data = np.array(sample[csi_column])
            shapes.append(csi_data.shape)
            dtypes.append(csi_data.dtype)
        
        # Display findings
        console.print(f"[bold]CSI Shape Analysis (first {num_samples} samples):[/bold]")
        
        shape_table = Table(show_header=True, header_style="bold magenta")
        shape_table.add_column("Sample", justify="right", style="cyan")
        shape_table.add_column("Shape", style="yellow")
        shape_table.add_column("Data Type", style="green")
        shape_table.add_column("Min Value", justify="right", style="blue")
        shape_table.add_column("Max Value", justify="right", style="blue")
        
        for i in range(len(shapes)):
            sample = data[i]
            csi_data = np.array(sample[csi_column])
            shape_table.add_row(
                str(i),
                str(shapes[i]),
                str(dtypes[i]),
                f"{csi_data.min():.4f}",
                f"{csi_data.max():.4f}"
            )
        
        console.print(shape_table)
        
        # Store metadata
        self.metadata['csi'] = {
            'column_name': csi_column,
            'typical_shape': str(shapes[0]) if shapes else None,
            'dtype': str(dtypes[0]) if dtypes else None,
            'shape_consistent': len(set(shapes)) == 1
        }
        
        # Additional metadata
        console.print("\n[bold]Additional CSI Information:[/bold]")
        console.print(f"  • Shape consistency: {'✓ All samples same shape' if len(set(shapes)) == 1 else '✗ Varying shapes detected'}")
        
        if len(shapes) > 0 and len(shapes[0]) == 2:
            console.print(f"  • CSI format appears to be: [bold]{shapes[0][0]} time steps × {shapes[0][1]} subcarriers[/bold]")
            self.metadata['csi']['time_steps'] = shapes[0][0]
            self.metadata['csi']['num_subcarriers'] = shapes[0][1]
        elif len(shapes) > 0 and len(shapes[0]) == 3:
            console.print(f"  • CSI format appears to be: [bold]{shapes[0][0]} time steps × {shapes[0][1]} antennas × {shapes[0][2]} subcarriers[/bold]")
            self.metadata['csi']['time_steps'] = shapes[0][0]
            self.metadata['csi']['num_antennas'] = shapes[0][1]
            self.metadata['csi']['num_subcarriers'] = shapes[0][2]
    
    def inspect_metadata_fields(self):
        """Inspect additional metadata fields like sampling rate, hardware info."""
        if self.dataset is None:
            return
        
        console.print("\n[bold cyan]Additional Metadata Fields:[/bold cyan]")
        
        split = list(self.dataset.keys())[0]
        first_sample = self.dataset[split][0]
        
        metadata_fields = {}
        
        for key, value in first_sample.items():
            if key not in ['csi', 'csi_data', 'label', 'activity']:
                metadata_fields[key] = value
                console.print(f"  • {key}: {value}")
        
        self.metadata['additional_fields'] = metadata_fields
    
    def save_metadata(self):
        """Save inspection metadata to JSON file."""
        output_path = self.metadata_dir / "wifall_inspection.json"
        
        with open(output_path, 'w') as f:
            json.dump(self.metadata, f, indent=2, default=str)
        
        console.print(f"\n[bold green]✓ Metadata saved to: {output_path}[/bold green]")
    
    def generate_report(self):
        """Generate a comprehensive inspection report."""
        console.print("\n" + "="*70)
        console.print(Panel.fit(
            "[bold green]WiFall Dataset Inspection Complete[/bold green]",
            border_style="green"
        ))
        
        console.print("\n[bold]Summary:[/bold]")
        console.print(f"  • Total splits: {len(self.metadata.get('splits', {}))}")
        console.print(f"  • Total samples: {sum(self.metadata.get('splits', {}).values())}")
        console.print(f"  • Number of activity classes: {len(self.metadata.get('labels', {}).get('label_names', {}))}")
        console.print(f"  • CSI data shape: {self.metadata.get('csi', {}).get('typical_shape', 'Unknown')}")
        
        console.print("\n[bold yellow]Next Steps:[/bold yellow]")
        console.print("  1. Review the metadata file: datasets/metadata/wifall_inspection.json")
        console.print("  2. Run visualize_csi.py to see actual CSI signal patterns")
        console.print("  3. Proceed with preprocessing and feature extraction")


def main():
    """Main execution function."""
    console.print(Panel.fit(
        "[bold cyan]WiFi-Radar Dataset Inspector[/bold cyan]\n"
        "Phase 1: WiFall Dataset Analysis",
        border_style="cyan"
    ))
    
    inspector = WiFallInspector()
    
    # Step 1: Download dataset
    if not inspector.download_dataset():
        console.print("\n[bold red]Failed to download dataset. Exiting.[/bold red]")
        return
    
    # Step 2: Inspect structure
    inspector.inspect_structure()
    
    # Step 3: Inspect labels
    inspector.inspect_labels()
    
    # Step 4: Inspect CSI format
    inspector.inspect_csi_format(num_samples=10)
    
    # Step 5: Inspect metadata
    inspector.inspect_metadata_fields()
    
    # Step 6: Save metadata
    inspector.save_metadata()
    
    # Step 7: Generate report
    inspector.generate_report()


if __name__ == "__main__":
    main()
