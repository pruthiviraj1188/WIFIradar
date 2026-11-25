#!/usr/bin/env python3
"""
WiFi-Radar System Verification Script

Checks that all major components are working correctly.
"""

import sys
import importlib
from pathlib import Path

def print_header(text):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print('='*60)

def check_module(module_name, description):
    """Check if a module can be imported"""
    try:
        importlib.import_module(module_name)
        print(f"✅ {description}: OK")
        return True
    except Exception as e:
        print(f"❌ {description}: FAILED")
        print(f"   Error: {str(e)[:100]}")
        return False

def check_file(filepath, description):
    """Check if a file exists"""
    if Path(filepath).exists():
        size = Path(filepath).stat().st_size
        size_str = f"{size/1024:.1f} KB" if size < 1024*1024 else f"{size/(1024*1024):.1f} MB"
        print(f"✅ {description}: {size_str}")
        return True
    else:
        print(f"❌ {description}: NOT FOUND")
        return False

def main():
    print_header("WiFi-Radar System Verification")
    
    checks_passed = 0
    checks_total = 0
    
    # Check Python version
    print_header("Python Environment")
    print(f"Python Version: {sys.version}")
    print(f"Python Path: {sys.executable}")
    checks_total += 1
    if sys.version_info >= (3, 10):
        print("✅ Python version >= 3.10")
        checks_passed += 1
    else:
        print("❌ Python version < 3.10 (not recommended)")
    
    # Check core dependencies
    print_header("Core Dependencies")
    dependencies = [
        ('numpy', 'NumPy'),
        ('scipy', 'SciPy'),
        ('pandas', 'Pandas'),
        ('sklearn', 'scikit-learn'),
        ('matplotlib', 'Matplotlib'),
        ('torch', 'PyTorch'),
    ]
    
    for module, name in dependencies:
        checks_total += 1
        if check_module(module, name):
            checks_passed += 1
    
    # Check project modules
    print_header("Project Modules")
    project_modules = [
        ('ai.preprocessing.data_loader', 'Data Loader'),
        ('ai.preprocessing.signal_processor', 'Signal Processor'),
        ('ai.preprocessing.feature_extractor', 'Feature Extractor'),
        ('ai.activity_detection.baseline_model', 'Activity Classifier'),
        ('ai.breathing_analysis.respiratory_extractor', 'Respiratory Extractor'),
        ('ai.breathing_analysis.breathing_detector', 'Breathing Detector'),
    ]
    
    for module, name in project_modules:
        checks_total += 1
        if check_module(module, name):
            checks_passed += 1
    
    # Check important files
    print_header("Important Files")
    files = [
        ('config/requirements.txt', 'Requirements file'),
        ('README.md', 'README'),
        ('SETUP_GUIDE.md', 'Setup Guide'),
        ('docs/architecture.md', 'Architecture docs'),
        ('ai/saved_models/baseline_rf_metrics.json', 'Model metrics'),
    ]
    
    for filepath, name in files:
        checks_total += 1
        if check_file(filepath, name):
            checks_passed += 1
    
    # Check directories
    print_header("Project Structure")
    directories = [
        'ai/preprocessing',
        'ai/activity_detection',
        'ai/breathing_analysis',
        'ai/saved_models',
        'backend/app/api',
        'frontend/src',
        'data_collection/csi_receiver',
        'datasets/metadata',
        'tests',
    ]
    
    for directory in directories:
        checks_total += 1
        if Path(directory).is_dir():
            print(f"✅ {directory}/")
            checks_passed += 1
        else:
            print(f"❌ {directory}/ NOT FOUND")
    
    # Backend check
    print_header("Backend Components")
    backend_modules = [
        ('fastapi', 'FastAPI'),
        ('sqlalchemy', 'SQLAlchemy'),
        ('uvicorn', 'Uvicorn'),
    ]
    
    for module, name in backend_modules:
        checks_total += 1
        if check_module(module, name):
            checks_passed += 1
    
    # Summary
    print_header("Verification Summary")
    success_rate = (checks_passed / checks_total) * 100
    print(f"\nTotal Checks: {checks_total}")
    print(f"Passed: {checks_passed}")
    print(f"Failed: {checks_total - checks_passed}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("\n🎉 System Status: EXCELLENT - Ready to use!")
    elif success_rate >= 70:
        print("\n✅ System Status: GOOD - Minor issues detected")
    elif success_rate >= 50:
        print("\n⚠️  System Status: FAIR - Some components missing")
    else:
        print("\n❌ System Status: POOR - Setup incomplete")
    
    print_header("Quick Start")
    print("\n1. Activate environment:")
    print("   source venv/bin/activate")
    print("\n2. Train model:")
    print("   python ai/train_activity_classifier.py")
    print("\n3. Demo breathing:")
    print("   python ai/demo_breathing_analysis.py")
    print("\n4. Start backend:")
    print("   python backend/run_server.py")
    print("\nFor details, see: SETUP_GUIDE.md")
    print()
    
    return 0 if success_rate >= 70 else 1

if __name__ == '__main__':
    sys.exit(main())
