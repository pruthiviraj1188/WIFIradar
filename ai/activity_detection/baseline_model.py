"""
Baseline Random Forest Model

A simple baseline model using hand-crafted features and Random Forest classifier.
"""

import numpy as np
import joblib
from pathlib import Path
from typing import Dict, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from rich.console import Console
from rich.table import Table

console = Console()


class BaselineRandomForest:
    """Baseline activity classification using Random Forest."""
    
    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: Optional[int] = None,
        min_samples_split: int = 2,
        random_state: int = 42
    ):
        """
        Initialize Random Forest classifier.
        
        Args:
            n_estimators: Number of trees
            max_depth: Maximum depth of trees
            min_samples_split: Minimum samples required to split
            random_state: Random seed
        """
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            random_state=random_state,
            n_jobs=-1,  # Use all CPU cores
            verbose=0
        )
        
        self.feature_names = None
        self.class_names = None
        self.is_trained = False
        
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        feature_names: Optional[list] = None,
        class_names: Optional[Dict[int, str]] = None
    ) -> Dict[str, float]:
        """
        Train the Random Forest model.
        
        Args:
            X_train: Training features, shape (n_samples, n_features)
            y_train: Training labels, shape (n_samples,)
            X_val: Validation features (optional)
            y_val: Validation labels (optional)
            feature_names: Names of features
            class_names: Mapping of class IDs to names
            
        Returns:
            Dictionary of training metrics
        """
        console.print("\n[bold cyan]Training Random Forest Model[/bold cyan]")
        console.print(f"Training samples: {len(X_train)}")
        console.print(f"Features: {X_train.shape[1]}")
        console.print(f"Classes: {len(np.unique(y_train))}")
        
        self.feature_names = feature_names
        self.class_names = class_names
        
        # Train model
        console.print("\n[yellow]Training in progress...[/yellow]")
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Training accuracy
        train_pred = self.model.predict(X_train)
        train_acc = accuracy_score(y_train, train_pred)
        
        console.print(f"[green]✓ Training complete![/green]")
        console.print(f"Training accuracy: {train_acc:.4f}")
        
        metrics = {
            'train_accuracy': train_acc
        }
        
        # Validation accuracy
        if X_val is not None and y_val is not None:
            val_pred = self.model.predict(X_val)
            val_acc = accuracy_score(y_val, val_pred)
            metrics['val_accuracy'] = val_acc
            console.print(f"Validation accuracy: {val_acc:.4f}")
        
        return metrics
    
    def evaluate(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray,
        detailed: bool = True
    ) -> Dict[str, any]:
        """
        Evaluate model on test data.
        
        Args:
            X_test: Test features
            y_test: Test labels
            detailed: Whether to print detailed report
            
        Returns:
            Dictionary of evaluation metrics
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        console.print("\n[bold cyan]Evaluating Model[/bold cyan]")
        
        # Predictions
        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)
        
        # Metrics
        accuracy = accuracy_score(y_test, y_pred)
        
        console.print(f"\n[bold]Test Accuracy: {accuracy:.4f}[/bold]")
        
        results = {
            'accuracy': accuracy,
            'predictions': y_pred,
            'probabilities': y_proba,
            'confusion_matrix': confusion_matrix(y_test, y_pred)
        }
        
        if detailed:
            # Classification report
            if self.class_names:
                target_names = [self.class_names[i] for i in sorted(self.class_names.keys())]
            else:
                target_names = [f"Class {i}" for i in range(len(np.unique(y_test)))]
            
            console.print("\n[bold]Classification Report:[/bold]")
            report = classification_report(y_test, y_pred, target_names=target_names)
            console.print(report)
            
            # Confusion matrix
            console.print("\n[bold]Confusion Matrix:[/bold]")
            cm = results['confusion_matrix']
            
            table = Table(show_header=True, header_style="bold cyan")
            table.add_column("True \\ Pred", style="dim")
            for name in target_names:
                table.add_column(name[:10])  # Truncate long names
            
            for i, row in enumerate(cm):
                table.add_row(target_names[i][:10], *[str(val) for val in row])
            
            console.print(table)
        
        return results
    
    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions on new data.
        
        Args:
            X: Features, shape (n_samples, n_features)
            
        Returns:
            Tuple of (predictions, probabilities)
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)
        
        return predictions, probabilities
    
    def get_feature_importance(self, top_n: int = 20) -> Dict[str, float]:
        """
        Get feature importance scores.
        
        Args:
            top_n: Number of top features to return
            
        Returns:
            Dictionary of feature names to importance scores
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        importances = self.model.feature_importances_
        
        if self.feature_names:
            feature_importance = {
                name: importance 
                for name, importance in zip(self.feature_names, importances)
            }
        else:
            feature_importance = {
                f"feature_{i}": importance 
                for i, importance in enumerate(importances)
            }
        
        # Sort by importance
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return dict(sorted_features[:top_n])
    
    def print_feature_importance(self, top_n: int = 20):
        """
        Print top features by importance.
        
        Args:
            top_n: Number of top features to display
        """
        importance_dict = self.get_feature_importance(top_n)
        
        console.print(f"\n[bold cyan]Top {top_n} Most Important Features:[/bold cyan]")
        
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Rank", style="dim", width=6)
        table.add_column("Feature", style="cyan")
        table.add_column("Importance", justify="right")
        
        for rank, (feature, importance) in enumerate(importance_dict.items(), 1):
            table.add_row(str(rank), feature, f"{importance:.6f}")
        
        console.print(table)
    
    def save(self, save_path: Path):
        """
        Save model to disk.
        
        Args:
            save_path: Path to save the model
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Cannot save untrained model.")
        
        save_path.parent.mkdir(parents=True, exist_ok=True)
        
        model_data = {
            'model': self.model,
            'feature_names': self.feature_names,
            'class_names': self.class_names
        }
        
        joblib.dump(model_data, save_path)
        console.print(f"[green]✓ Model saved to {save_path}[/green]")
    
    def load(self, load_path: Path):
        """
        Load model from disk.
        
        Args:
            load_path: Path to load the model from
        """
        model_data = joblib.load(load_path)
        
        self.model = model_data['model']
        self.feature_names = model_data['feature_names']
        self.class_names = model_data['class_names']
        self.is_trained = True
        
        console.print(f"[green]✓ Model loaded from {load_path}[/green]")


if __name__ == "__main__":
    # Test with synthetic data
    console.print("[bold cyan]Testing Baseline Random Forest Model[/bold cyan]\n")
    
    # Create synthetic dataset
    np.random.seed(42)
    n_samples = 1000
    n_features = 50
    n_classes = 5
    
    X = np.random.randn(n_samples, n_features)
    y = np.random.randint(0, n_classes, n_samples)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Create class names
    class_names = {i: f"Activity_{i}" for i in range(n_classes)}
    
    # Train model
    model = BaselineRandomForest(n_estimators=50)
    metrics = model.train(X_train, y_train, X_test, y_test, class_names=class_names)
    
    # Evaluate
    results = model.evaluate(X_test, y_test, detailed=True)
    
    # Feature importance
    model.print_feature_importance(top_n=10)
    
    console.print("\n[green]✓ All tests passed![/green]")
