"""
WiFi-Radar Setup Verification Script

Verifies that the development environment is correctly configured
and all dependencies are installed before proceeding with Phase 1.
"""

import sys
import subprocess
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

console = Console()


class SetupVerifier:
    """Verify development environment setup."""
    
    def __init__(self):
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = []
    
    def check_python_version(self):
        """Verify Python version is 3.10 or higher."""
        console.print("\n[bold cyan]Checking Python Version...[/bold cyan]")
        
        version = sys.version_info
        version_str = f"{version.major}.{version.minor}.{version.micro}"
        
        if version.major == 3 and version.minor >= 10:
            console.print(f"[green]✓[/green] Python {version_str} (Supported)")
            self.checks_passed += 1
            return True
        else:
            console.print(f"[red]✗[/red] Python {version_str} (Requires 3.10+)")
            self.checks_failed += 1
            return False
    
    def check_virtual_environment(self):
        """Check if running in a virtual environment."""
        console.print("\n[bold cyan]Checking Virtual Environment...[/bold cyan]")
        
        in_venv = hasattr(sys, 'real_prefix') or (
            hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
        )
        
        if in_venv:
            console.print("[green]✓[/green] Running in virtual environment")
            self.checks_passed += 1
            return True
        else:
            console.print("[yellow]⚠[/yellow] Not in virtual environment (Recommended but not required)")
            self.warnings.append("Consider using a virtual environment (venv)")
            return True
    
    def check_required_packages(self):
        """Verify required Python packages are installed."""
        console.print("\n[bold cyan]Checking Required Packages...[/bold cyan]")
        
        required_packages = [
            'numpy',
            'scipy',
            'pandas',
            'torch',
            'sklearn',
            'matplotlib',
            'seaborn',
            'datasets',
            'huggingface_hub',
            'tqdm',
            'rich',
            'yaml'
        ]
        
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Package", style="cyan")
        table.add_column("Status", style="green")
        table.add_column("Version", style="yellow")
        
        all_installed = True
        
        for package in required_packages:
            try:
                if package == 'sklearn':
                    module = __import__('sklearn')
                else:
                    module = __import__(package)
                
                version = getattr(module, '__version__', 'Unknown')
                table.add_row(package, "✓ Installed", version)
            except ImportError:
                table.add_row(package, "✗ Missing", "N/A")
                all_installed = False
        
        console.print(table)
        
        if all_installed:
            console.print("\n[green]✓[/green] All required packages installed")
            self.checks_passed += 1
            return True
        else:
            console.print("\n[red]✗[/red] Some packages missing")
            console.print("Run: [bold]pip install -r requirements.txt[/bold]")
            self.checks_failed += 1
            return False
    
    def check_directory_structure(self):
        """Verify project directory structure."""
        console.print("\n[bold cyan]Checking Directory Structure...[/bold cyan]")
        
        required_dirs = [
            'hardware',
            'datasets',
            'ai',
            'data_collection',
            'backend',
            'frontend',
            'docs'
        ]
        
        project_root = Path(__file__).parent.parent  # scripts/ -> project root
        all_exist = True
        
        for dir_name in required_dirs:
            dir_path = project_root / dir_name
            if dir_path.exists():
                console.print(f"[green]✓[/green] {dir_name}/")
            else:
                console.print(f"[red]✗[/red] {dir_name}/ (Missing)")
                all_exist = False
        
        if all_exist:
            self.checks_passed += 1
            return True
        else:
            self.checks_failed += 1
            return False
    
    def check_disk_space(self):
        """Check available disk space."""
        console.print("\n[bold cyan]Checking Disk Space...[/bold cyan]")
        
        try:
            import shutil
            total, used, free = shutil.disk_usage("/")
            
            free_gb = free // (2**30)
            
            console.print(f"Free space: {free_gb} GB")
            
            if free_gb >= 10:
                console.print("[green]✓[/green] Sufficient disk space")
                self.checks_passed += 1
                return True
            else:
                console.print("[yellow]⚠[/yellow] Low disk space (< 10GB)")
                self.warnings.append("Datasets require significant storage")
                return True
        except Exception as e:
            console.print(f"[yellow]⚠[/yellow] Could not check disk space: {e}")
            return True
    
    def check_internet_connection(self):
        """Test internet connectivity for dataset download."""
        console.print("\n[bold cyan]Checking Internet Connection...[/bold cyan]")
        
        try:
            import socket
            socket.create_connection(("huggingface.co", 80), timeout=5)
            console.print("[green]✓[/green] Internet connection available")
            console.print("     HuggingFace is reachable")
            self.checks_passed += 1
            return True
        except OSError:
            console.print("[red]✗[/red] Cannot reach HuggingFace")
            console.print("     Dataset download will fail")
            self.checks_failed += 1
            return False
    
    def check_git_repository(self):
        """Check if project is a git repository."""
        console.print("\n[bold cyan]Checking Git Repository...[/bold cyan]")
        
        project_root = Path(__file__).parent.parent  # scripts/ -> project root
        git_dir = project_root / '.git'
        
        if git_dir.exists():
            console.print("[green]✓[/green] Git repository initialized")
            self.checks_passed += 1
            
            # Try to get git status
            try:
                result = subprocess.run(
                    ['git', 'status', '--short'],
                    cwd=project_root,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0:
                    uncommitted = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
                    if uncommitted > 0:
                        console.print(f"     {uncommitted} uncommitted changes")
                else:
                    console.print("     Could not get git status")
            except:
                pass
            
            return True
        else:
            console.print("[yellow]⚠[/yellow] Not a git repository")
            self.warnings.append("Consider initializing git for version control")
            return True
    
    def test_imports(self):
        """Test critical imports."""
        console.print("\n[bold cyan]Testing Critical Imports...[/bold cyan]")
        
        imports_to_test = [
            ('numpy', 'import numpy as np'),
            ('matplotlib', 'import matplotlib.pyplot as plt'),
            ('torch', 'import torch'),
            ('datasets', 'from datasets import load_dataset'),
            ('scipy.signal', 'from scipy import signal'),
        ]
        
        all_passed = True
        
        for name, import_statement in imports_to_test:
            try:
                exec(import_statement)
                console.print(f"[green]✓[/green] {name}")
            except Exception as e:
                console.print(f"[red]✗[/red] {name}: {e}")
                all_passed = False
        
        if all_passed:
            self.checks_passed += 1
            return True
        else:
            self.checks_failed += 1
            return False
    
    def generate_report(self):
        """Generate final verification report."""
        console.print("\n" + "="*70)
        console.print(Panel.fit(
            "[bold]Setup Verification Complete[/bold]",
            border_style="blue"
        ))
        
        # Summary
        total_checks = self.checks_passed + self.checks_failed
        
        summary_table = Table(show_header=False, box=None)
        summary_table.add_row("[bold]Checks Passed:[/bold]", f"[green]{self.checks_passed}/{total_checks}[/green]")
        summary_table.add_row("[bold]Checks Failed:[/bold]", f"[red]{self.checks_failed}/{total_checks}[/red]")
        summary_table.add_row("[bold]Warnings:[/bold]", f"[yellow]{len(self.warnings)}[/yellow]")
        
        console.print(summary_table)
        
        # Warnings
        if self.warnings:
            console.print("\n[bold yellow]Warnings:[/bold yellow]")
            for warning in self.warnings:
                console.print(f"  ⚠ {warning}")
        
        # Verdict
        console.print()
        if self.checks_failed == 0:
            console.print(Panel.fit(
                "[bold green]✓ Setup Complete![/bold green]\n"
                "You are ready to proceed with Phase 1.",
                border_style="green"
            ))
            console.print("\n[bold]Next Steps:[/bold]")
            console.print("  1. Run: [bold]python datasets/inspect_wifall.py[/bold]")
            console.print("  2. Run: [bold]python datasets/visualize_csi.py[/bold]")
            console.print("  3. Review generated visualizations")
            return True
        else:
            console.print(Panel.fit(
                "[bold red]✗ Setup Incomplete[/bold red]\n"
                f"Please fix {self.checks_failed} failed check(s) before continuing.",
                border_style="red"
            ))
            console.print("\n[bold]Recommended Actions:[/bold]")
            console.print("  1. Ensure Python 3.10+ is installed")
            console.print("  2. Activate virtual environment: [bold]source venv/bin/activate[/bold]")
            console.print("  3. Install dependencies: [bold]pip install -r requirements.txt[/bold]")
            console.print("  4. Check internet connection")
            console.print("  5. Run this script again: [bold]python verify_setup.py[/bold]")
            return False


def main():
    """Main execution."""
    console.print(Panel.fit(
        "[bold cyan]WiFi-Radar Setup Verification[/bold cyan]\n"
        "Checking development environment...",
        border_style="cyan"
    ))
    
    verifier = SetupVerifier()
    
    # Run all checks
    verifier.check_python_version()
    verifier.check_virtual_environment()
    verifier.check_required_packages()
    verifier.check_directory_structure()
    verifier.check_disk_space()
    verifier.check_internet_connection()
    verifier.check_git_repository()
    verifier.test_imports()
    
    # Generate report
    success = verifier.generate_report()
    
    # Exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
