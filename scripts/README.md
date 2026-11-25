# Scripts Directory

Utility scripts for setup, verification, and project management.

## Available Scripts

### `verify_setup.py`
**Purpose:** Verify development environment is correctly configured

**Usage:**
```bash
python scripts/verify_setup.py
```

**Checks:**
- Python version (3.10+)
- Virtual environment status
- Required packages installed
- Directory structure
- Disk space
- Internet connectivity
- Critical imports

**When to run:**
- Before starting Phase 1
- After installing dependencies
- When troubleshooting environment issues

---

### `check_status.py`
**Purpose:** Check project progress and completion status

**Usage:**
```bash
python scripts/check_status.py
```

**Shows:**
- Phase 1 completion status
- Dataset download status
- Visualization creation status
- Next steps and recommendations

**When to run:**
- To check current progress
- After completing phase tasks
- To see what's remaining

---

## Creating New Scripts

When adding utility scripts:

1. **Place in this directory:** `scripts/`
2. **Follow naming convention:** `verb_noun.py` (e.g., `generate_report.py`)
3. **Add docstring:** Explain purpose at top
4. **Use rich console:** For colored output
5. **Handle errors:** Graceful error messages
6. **Document here:** Add to this README

### Script Template

```python
#!/usr/bin/env python3
"""
Script Name and Brief Description

Detailed explanation of what this script does.
"""

import sys
from pathlib import Path
from rich.console import Console

console = Console()
PROJECT_ROOT = Path(__file__).parent.parent


def main():
    """Main execution."""
    console.print("[bold cyan]Script Title[/bold cyan]")
    
    # Your code here
    
    console.print("[green]✓ Complete![/green]")


if __name__ == "__main__":
    main()
```

---

## Script Categories

### Setup & Verification
- `verify_setup.py` - Environment verification
- `check_status.py` - Progress tracking

### Dataset Management (Future)
- `download_datasets.py` - Download all datasets
- `validate_datasets.py` - Check dataset integrity
- `clean_datasets.py` - Remove temporary files

### Model Management (Future)
- `train_model.py` - Train models
- `evaluate_model.py` - Evaluate performance
- `export_model.py` - Export for deployment

### System Testing (Future)
- `test_integration.py` - Integration tests
- `benchmark_performance.py` - Performance metrics
- `generate_report.py` - Generate test reports

---

## Best Practices

1. **Make scripts standalone** - Don't require complex setup
2. **Provide clear feedback** - Use rich console for output
3. **Handle errors gracefully** - Catch exceptions, show helpful messages
4. **Document parameters** - Use argparse for CLI arguments
5. **Return exit codes** - 0 for success, non-zero for failure
6. **Keep focused** - One clear purpose per script
