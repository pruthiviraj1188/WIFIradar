"""
Model Tests

Phase 9: Test activity classification models
"""

import pytest
import numpy as np
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ai.activity_detection.baseline_model import BaselineRandomForest


class TestBaselineModel:
    """Test Random Forest baseline model."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.model = BaselineRandomForest(n_estimators=10, random_state=42)
        
        # Create synthetic training data
        np.random.seed(42)
        self.X_train = np.random.randn(100, 38)  # 100 samples, 38 features
        self.y_train = np.random.randint(0, 5, 100)  # 5 classes
        
        self.X_test = np.random.randn(20, 38)
        self.y_test = np.random.randint(0, 5, 20)
    
    def test_model_initialization(self):
        """Test model initialization."""
        assert self.model is not None
        assert self.model.model is not None
    
    def test_model_training(self):
        """Test model training."""
        metrics = self.model.train(self.X_train, self.y_train)
        
        assert 'train_accuracy' in metrics
        assert self.model.is_trained == True
        assert 0 <= metrics['train_accuracy'] <= 1
    
    def test_model_prediction(self):
        """Test model prediction."""
        self.model.train(self.X_train, self.y_train)
        
        predictions, probabilities = self.model.predict(self.X_test)
        
        assert len(predictions) == len(self.X_test)
        assert probabilities.shape[0] == len(self.X_test)
        assert all(0 <= p <= 4 for p in predictions)  # 5 classes (0-4)
    
    def test_model_evaluation(self):
        """Test model evaluation."""
        self.model.train(self.X_train, self.y_train)
        
        results = self.model.evaluate(self.X_test, self.y_test, detailed=False)
        
        assert 'accuracy' in results
        assert 'predictions' in results
        assert 'confusion_matrix' in results
    
    def test_feature_importance(self):
        """Test feature importance extraction."""
        self.model.train(self.X_train, self.y_train)
        
        importance = self.model.get_feature_importance(top_n=10)
        
        assert len(importance) <= 10
        assert all(isinstance(v, float) for v in importance.values())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
