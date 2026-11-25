# Tests Directory

Unit tests, integration tests, and test utilities for WiFi-Radar.

## Test Structure

```
tests/
├── unit/                    # Unit tests (individual functions/classes)
│   ├── test_preprocessing.py
│   ├── test_models.py
│   └── test_utils.py
├── integration/             # Integration tests (multiple components)
│   ├── test_data_pipeline.py
│   ├── test_inference.py
│   └── test_api.py
├── fixtures/                # Test data and fixtures
│   ├── sample_csi.npy
│   └── mock_responses.json
└── conftest.py             # Pytest configuration
```

## Running Tests

### All Tests
```bash
pytest tests/
```

### Specific Test File
```bash
pytest tests/unit/test_preprocessing.py
```

### With Coverage
```bash
pytest --cov=. --cov-report=html tests/
```

### Verbose Output
```bash
pytest -v tests/
```

## Writing Tests

### Test Template

```python
"""
Test module for [component name]
"""

import pytest
import numpy as np
from pathlib import Path

from ai.preprocessing import preprocess_csi


class TestCSIPreprocessing:
    """Test CSI preprocessing functions."""
    
    def test_amplitude_extraction(self):
        """Test CSI amplitude extraction."""
        # Arrange
        raw_csi = np.random.randn(100, 52) + 1j * np.random.randn(100, 52)
        
        # Act
        amplitude = extract_amplitude(raw_csi)
        
        # Assert
        assert amplitude.shape == (100, 52)
        assert np.all(amplitude >= 0)
    
    def test_normalization(self):
        """Test signal normalization."""
        # Arrange
        signal = np.random.randn(100, 52)
        
        # Act
        normalized = normalize_signal(signal)
        
        # Assert
        assert normalized.shape == signal.shape
        assert np.allclose(normalized.mean(), 0, atol=0.1)
        assert np.allclose(normalized.std(), 1, atol=0.1)
    
    def test_invalid_input(self):
        """Test error handling for invalid input."""
        # Assert
        with pytest.raises(ValueError):
            preprocess_csi(None)
```

## Test Guidelines

### 1. Test Organization
- **Unit tests:** Test individual functions
- **Integration tests:** Test component interactions
- **End-to-end tests:** Test full workflows

### 2. Test Naming
- Prefix with `test_`
- Descriptive names: `test_fall_detection_accuracy`
- Group related tests in classes

### 3. Test Structure (AAA Pattern)
```python
def test_something():
    # Arrange - Setup test data
    input_data = create_test_data()
    
    # Act - Execute function
    result = function_under_test(input_data)
    
    # Assert - Verify result
    assert result == expected_value
```

### 4. Fixtures
Use fixtures for shared test data:
```python
@pytest.fixture
def sample_csi():
    """Create sample CSI data."""
    return np.random.randn(500, 52)

def test_with_fixture(sample_csi):
    """Test using fixture."""
    result = process(sample_csi)
    assert result is not None
```

### 5. Parametrized Tests
Test multiple inputs efficiently:
```python
@pytest.mark.parametrize("input,expected", [
    (100, True),
    (50, False),
    (200, True),
])
def test_threshold(input, expected):
    result = check_threshold(input)
    assert result == expected
```

## Test Coverage Goals

### Phase 1-2 (Foundation)
- **Target:** 60% coverage
- **Focus:** Data processing, preprocessing

### Phase 3-5 (Core Features)
- **Target:** 75% coverage
- **Focus:** Models, API endpoints

### Phase 6-9 (Full System)
- **Target:** 85% coverage
- **Focus:** Critical paths, edge cases

## Testing Best Practices

1. **Test behavior, not implementation**
   - Focus on inputs/outputs
   - Don't test internal details

2. **Keep tests independent**
   - No test should depend on another
   - Each test should be runnable alone

3. **Use realistic data**
   - Test with actual CSI patterns
   - Include edge cases

4. **Fast tests**
   - Unit tests should be < 1 second
   - Integration tests < 10 seconds

5. **Clear assertions**
   - One logical assertion per test
   - Descriptive error messages

6. **Mock external dependencies**
   - Don't rely on network/database
   - Use mocks for ESP32 hardware

## Continuous Integration

Tests should run automatically on:
- Every commit
- Pull requests
- Before deployment

### CI Configuration (Future)
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install -r config/requirements.txt
      - run: pytest tests/ --cov=.
```

## Test Types by Phase

### Phase 1: Dataset
- ✓ Dataset loading
- ✓ Format validation
- ✓ Label verification

### Phase 2: Models
- ✓ Model training
- ✓ Inference accuracy
- ✓ Preprocessing pipeline

### Phase 3: Breathing
- ✓ Waveform extraction
- ✓ Rate estimation
- ✓ Pattern classification

### Phase 4: Hardware
- ✓ ESP32 communication
- ✓ CSI packet parsing
- ✓ Real-time streaming

### Phase 5: Backend
- ✓ API endpoints
- ✓ Database operations
- ✓ Authentication
- ✓ WebSocket connections

### Phase 6: Frontend
- ✓ Component rendering
- ✓ User interactions
- ✓ Data visualization

### Phase 7: Alerts
- ✓ Incident detection
- ✓ Notification delivery
- ✓ Escalation workflow

### Phase 8: 3D
- ✓ Scene rendering
- ✓ Animation states
- ✓ User controls

### Phase 9: Integration
- ✓ End-to-end workflows
- ✓ Performance benchmarks
- ✓ System reliability

---

**Start writing tests from Phase 2 onwards!**
