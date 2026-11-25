"""
WiFall Dataset Loader

Loads and prepares the WiFall dataset for training activity classification models.
"""

import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import json
from tqdm import tqdm
from datasets import load_dataset
from rich.console import Console

console = Console()


class WiFallDataLoader:
    """Load and prepare WiFall dataset for model training."""
    
    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize the data loader.
        
        Args:
            cache_dir: Directory to cache the dataset
        """
        self.cache_dir = cache_dir
        self.dataset = None
        self.label_mapping = {}
        self.reverse_label_mapping = {}
        
    def load_dataset(self) -> bool:
        """
        Load the WiFall dataset from HuggingFace.
        
        Returns:
            True if successful, False otherwise
        """
        console.print("[bold blue]Loading WiFall dataset...[/bold blue]")
        
        try:
            self.dataset = load_dataset(
                "RS2002/WiFall",
                cache_dir=self.cache_dir,
                trust_remote_code=True
            )
            
            # Create label mapping from unique values in dataset
            split = list(self.dataset.keys())[0]
            unique_labels = set()
            
            # Sample to find unique labels
            sample_size = min(10000, len(self.dataset[split]))
            for sample in self.dataset[split].select(range(sample_size)):
                if 'taget' in sample:
                    unique_labels.add(sample['taget'])
            
            # Create numeric mapping
            sorted_labels = sorted(list(unique_labels))
            self.label_mapping = {label: idx for idx, label in enumerate(sorted_labels)}
            self.reverse_label_mapping = {idx: label for label, idx in self.label_mapping.items()}
            
            console.print(f"[green]✓ Dataset loaded with {len(self.label_mapping)} activity classes[/green]")
            console.print(f"Activity classes: {list(self.label_mapping.keys())}")
            
            return True
            
        except Exception as e:
            console.print(f"[red]✗ Error loading dataset: {e}[/red]")
            return False
    
    def parse_csi_data(self, csi_value) -> Optional[np.ndarray]:
        """
        Parse CSI data from string or array format.
        
        Args:
            csi_value: CSI data (string or array)
            
        Returns:
            Numpy array or None if parsing fails
        """
        if isinstance(csi_value, str):
            try:
                return np.array(eval(csi_value), dtype=np.float32)
            except:
                return None
        return np.array(csi_value, dtype=np.float32)
    
    def prepare_data(
        self,
        split: str = 'train',
        max_samples: Optional[int] = None,
        min_sequence_length: int = 50
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare CSI data and labels for training.
        
        Args:
            split: Dataset split to use ('train', 'test', etc.)
            max_samples: Maximum number of samples to load (None for all)
            min_sequence_length: Minimum CSI sequence length to include
            
        Returns:
            Tuple of (X, y) where X is CSI data and y is labels
        """
        if self.dataset is None:
            raise ValueError("Dataset not loaded. Call load_dataset() first.")
        
        if split not in self.dataset:
            raise ValueError(f"Split '{split}' not found in dataset")
        
        data_split = self.dataset[split]
        num_samples = len(data_split) if max_samples is None else min(max_samples, len(data_split))
        
        console.print(f"\n[bold cyan]Preparing {num_samples} samples from '{split}' split...[/bold cyan]")
        
        X_list = []
        y_list = []
        
        for idx in tqdm(range(num_samples), desc="Processing samples"):
            sample = data_split[idx]
            
            # Parse CSI data
            if 'data' not in sample:
                continue
                
            csi_data = self.parse_csi_data(sample['data'])
            if csi_data is None or len(csi_data) < min_sequence_length:
                continue
            
            # Get label
            if 'taget' not in sample:
                continue
                
            label_name = sample['taget']
            if label_name not in self.label_mapping:
                continue
            
            label = self.label_mapping[label_name]
            
            X_list.append(csi_data)
            y_list.append(label)
        
        console.print(f"[green]✓ Prepared {len(X_list)} valid samples[/green]")
        
        # Convert to numpy arrays
        # Note: X will be a list of variable-length arrays until we segment/pad them
        y = np.array(y_list, dtype=np.int64)
        
        return X_list, y
    
    def get_class_distribution(self, y: np.ndarray) -> Dict[str, int]:
        """
        Get distribution of classes in the dataset.
        
        Args:
            y: Label array
            
        Returns:
            Dictionary mapping class names to counts
        """
        unique, counts = np.unique(y, return_counts=True)
        distribution = {}
        
        for label_id, count in zip(unique, counts):
            class_name = self.reverse_label_mapping[label_id]
            distribution[class_name] = int(count)
        
        return distribution
    
    def save_label_mapping(self, output_path: Path):
        """
        Save label mapping to JSON file.
        
        Args:
            output_path: Path to save the mapping
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        mapping_data = {
            'label_to_id': self.label_mapping,
            'id_to_label': self.reverse_label_mapping,
            'num_classes': len(self.label_mapping)
        }
        
        with open(output_path, 'w') as f:
            json.dump(mapping_data, f, indent=2)
        
        console.print(f"[green]✓ Saved label mapping to {output_path}[/green]")


if __name__ == "__main__":
    # Test the data loader
    from pathlib import Path
    
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    cache_dir = PROJECT_ROOT / "datasets" / "raw" / "wifall"
    
    loader = WiFallDataLoader(cache_dir=str(cache_dir))
    
    if loader.load_dataset():
        X, y = loader.prepare_data(max_samples=1000)
        
        console.print(f"\n[bold]Dataset Summary:[/bold]")
        console.print(f"Number of samples: {len(y)}")
        console.print(f"Number of classes: {len(loader.label_mapping)}")
        console.print(f"\nClass distribution:")
        
        distribution = loader.get_class_distribution(y)
        for class_name, count in sorted(distribution.items()):
            percentage = (count / len(y)) * 100
            console.print(f"  {class_name}: {count} ({percentage:.1f}%)")
