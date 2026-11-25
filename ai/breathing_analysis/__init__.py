"""
Breathing Analysis Module (Experimental)

IMPORTANT DISCLAIMER:
This is an EXPERIMENTAL research feature. It is NOT:
- A medical device
- Clinically validated
- Suitable for medical diagnosis
- A replacement for proper medical monitoring

Use only for research and demonstration purposes.
"""

from .respiratory_extractor import RespiratoryWaveformExtractor
from .breathing_detector import BreathingRateDetector

__all__ = ['RespiratoryWaveformExtractor', 'BreathingRateDetector']
