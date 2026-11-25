"""
Activity Classification Training Script

Phase 2: Train activity classification models on WiFall dataset.
"""

import sys
from pathlib import Path
import numpy as np
from sklearn.model_selection import train_test_split
import json

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ai.preprocessing.data_loader import WiFallDataLoader
from ai.preprocessing.signal_processor import SignalProcessor
from ai.preprocessing.feature_extractor import FeatureExtractor
from ai.activity_detection.baseline_model import BaselineRandomForest
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress

console = Console()


def main():
    """Main training pipeline."""
    console.print(Panel.fit(
        "[bold cyan]WiFi-Radar Activity Classification[/bold cyan]\n"
        "Phase 2: Training Models on WiFall Dataset",
        border_style="cyan"
    ))
    
    # Configuration
    CACHE_DIR = PROJECT_ROOT / "datasets" / "raw" / "wifall"
    MODEL_SAVE_DIR = PROJECT_ROOT / "ai" / "saved_models"
    METADATA_DIR = PROJECT_ROOT / "datasets" / "metadata"
    
    MAX_SAMPLES = 10000  # Limit for faster training (use None for full dataset)
    FIXED_SEQUENCE_LENGTH = 200  # Fixed length for all signals
    TEST_SIZE = 0.2
    VAL_SIZE = 0.1
    RANDOM_STATE = 42
    
    # Step 1: Load Dataset
    console.print("\n[bold]Step 1: Loading WiFall Dataset[/bold]")
    loader = WiFallDataLoader(cache_dir=str(CACHE_DIR))
    
    if not loader.load_dataset():
        console.print("[red]Failed to load dataset. Exiting.[/red]")
        return
    
    # Load data
    X_raw, y = loader.prepare_data(
        split='train',
        max_samples=MAX_SAMPLES,
        min_sequence_length=100
    )
    
    if len(X_raw) == 0:
        console.print("[red]No valid samples found. Exiting.[/red]")
        return
    
    # Save label mapping
    label_mapping_path = METADATA_DIR / "label_mapping.json"
    loader.save_label_mapping(label_mapping_path)
    
    # Print class distribution
    console.print("\n[bold]Class Distribution:[/bold]")
    distribution = loader.get_class_distribution(y)
    for class_name, count in sorted(distribution.items()):
        percentage = (count / len(y)) * 100
        console.print(f"  {class_name}: {count} ({percentage:.1f}%)")
    
    # Step 2: Signal Preprocessing
    console.print("\n[bold]Step 2: Preprocessing Signals[/bold]")
    processor = SignalProcessor(
        window_size=FIXED_SEQUENCE_LENGTH,
        window_overlap=0,
        sampling_rate=50.0
    )
    
    X_processed = processor.process_batch(
        X_raw,
        fixed_length=FIXED_SEQUENCE_LENGTH,
        apply_filter=True,
        remove_outliers=True,
        normalize=True,
        normalization_method='minmax'
    )
    
    console.print(f"[green]✓ Processed data shape: {X_processed.shape}[/green]")
    
    # Step 3: Feature Extraction
    console.print("\n[bold]Step 3: Extracting Features[/bold]")
    extractor = FeatureExtractor(sampling_rate=50.0)
    
    X_features, feature_names = extractor.extract_features_batch(X_processed)
    
    console.print(f"[green]✓ Feature matrix shape: {X_features.shape}[/green]")
    console.print(f"Number of features: {len(feature_names)}")
    
    # Save feature names
    feature_names_path = METADATA_DIR / "feature_names.json"
    feature_names_path.parent.mkdir(parents=True, exist_ok=True)
    with open(feature_names_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    console.print(f"[green]✓ Saved feature names to {feature_names_path}[/green]")
    
    # Step 4: Train-Val-Test Split
    console.print("\n[bold]Step 4: Splitting Dataset[/bold]")
    
    # First split: separate test set
    X_temp, X_test, y_temp, y_test = train_test_split(
        X_features, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y
    )
    
    # Second split: separate validation set from training
    val_size_adjusted = VAL_SIZE / (1 - TEST_SIZE)
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp,
        test_size=val_size_adjusted,
        random_state=RANDOM_STATE,
        stratify=y_temp
    )
    
    console.print(f"Training samples: {len(X_train)}")
    console.print(f"Validation samples: {len(X_val)}")
    console.print(f"Test samples: {len(X_test)}")
    
    # Step 5: Train Baseline Model (Random Forest)
    console.print("\n[bold]Step 5: Training Baseline Random Forest Model[/bold]")
    
    rf_model = BaselineRandomForest(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        random_state=RANDOM_STATE
    )
    
    train_metrics = rf_model.train(
        X_train, y_train,
        X_val, y_val,
        feature_names=feature_names,
        class_names=loader.reverse_label_mapping
    )
    
    # Step 6: Evaluate Model
    console.print("\n[bold]Step 6: Evaluating on Test Set[/bold]")
    
    test_results = rf_model.evaluate(X_test, y_test, detailed=True)
    
    # Feature importance
    rf_model.print_feature_importance(top_n=15)
    
    # Step 7: Save Model
    console.print("\n[bold]Step 7: Saving Model[/bold]")
    
    model_path = MODEL_SAVE_DIR / "baseline_rf_model.joblib"
    rf_model.save(model_path)
    
    # Save evaluation metrics
    metrics_path = MODEL_SAVE_DIR / "baseline_rf_metrics.json"
    metrics_data = {
        'train_accuracy': float(train_metrics['train_accuracy']),
        'val_accuracy': float(train_metrics['val_accuracy']),
        'test_accuracy': float(test_results['accuracy']),
        'num_features': len(feature_names),
        'num_samples_train': len(X_train),
        'num_samples_val': len(X_val),
        'num_samples_test': len(X_test),
        'num_classes': len(loader.label_mapping),
        'class_distribution': distribution
    }
    
    with open(metrics_path, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    
    console.print(f"[green]✓ Saved metrics to {metrics_path}[/green]")
    
    # Summary
    console.print("\n" + "="*70)
    console.print(Panel.fit(
        "[bold green]✓ Phase 2 Training Complete![/bold green]\n\n"
        f"Test Accuracy: {test_results['accuracy']:.4f}\n"
        f"Model saved to: {model_path}\n\n"
        "[bold]Next Steps:[/bold]\n"
        "  1. Review the confusion matrix above\n"
        "  2. Analyze feature importance\n"
        "  3. Consider training CNN model for comparison\n"
        "  4. Test model on real-time CSI data (Phase 4)",
        border_style="green"
    ))


if __name__ == "__main__":
    main()
