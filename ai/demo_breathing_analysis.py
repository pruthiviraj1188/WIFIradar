"""
Breathing Analysis Demonstration

Phase 3: Demonstrate respiratory monitoring capabilities (EXPERIMENTAL)
"""

import sys
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ai.breathing_analysis.respiratory_extractor import RespiratoryWaveformExtractor
from ai.breathing_analysis.breathing_detector import BreathingRateDetector
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()


def create_synthetic_breathing_scenarios():
    """Create synthetic CSI signals with different breathing patterns."""
    duration = 60  # seconds
    sampling_rate = 50  # Hz
    t = np.linspace(0, duration, int(duration * sampling_rate))
    
    scenarios = {}
    
    # 1. Normal breathing (15 BPM)
    normal_freq = 15 / 60.0
    breathing = 2.0 * np.sin(2 * np.pi * normal_freq * t)
    baseline = 5.0 + 0.3 * np.random.randn(len(t))
    scenarios['normal'] = {
        'signal': baseline + breathing,
        'true_rate': 15,
        'description': 'Normal breathing at rest'
    }
    
    # 2. Slow breathing (10 BPM)
    slow_freq = 10 / 60.0
    breathing = 2.0 * np.sin(2 * np.pi * slow_freq * t)
    baseline = 5.0 + 0.3 * np.random.randn(len(t))
    scenarios['slow'] = {
        'signal': baseline + breathing,
        'true_rate': 10,
        'description': 'Slow breathing (relaxed)'
    }
    
    # 3. Fast breathing (24 BPM)
    fast_freq = 24 / 60.0
    breathing = 1.5 * np.sin(2 * np.pi * fast_freq * t)
    baseline = 5.0 + 0.4 * np.random.randn(len(t))
    scenarios['fast'] = {
        'signal': baseline + breathing,
        'true_rate': 24,
        'description': 'Fast breathing (exercise/stress)'
    }
    
    # 4. Irregular breathing
    # Varying frequency
    freq_variation = 0.1 * np.sin(2 * np.pi * 0.05 * t)
    irregular_freq = (18 / 60.0) + freq_variation / 60.0
    phase = 2 * np.pi * np.cumsum(irregular_freq) * (t[1] - t[0])
    breathing = 2.0 * np.sin(phase)
    baseline = 5.0 + 0.4 * np.random.randn(len(t))
    scenarios['irregular'] = {
        'signal': baseline + breathing,
        'true_rate': 18,
        'description': 'Irregular breathing pattern'
    }
    
    return scenarios, sampling_rate


def analyze_scenario(
    scenario_name: str,
    signal: np.ndarray,
    true_rate: float,
    description: str,
    sampling_rate: float
) -> dict:
    """Analyze a breathing scenario."""
    console.print(f"\n[bold cyan]Analyzing: {scenario_name.upper()}[/bold cyan]")
    console.print(f"[dim]{description}[/dim]")
    console.print(f"[dim]True rate: {true_rate} BPM[/dim]")
    
    # Extract respiratory waveform
    extractor = RespiratoryWaveformExtractor(sampling_rate=sampling_rate)
    respiratory_wave = extractor.extract_respiratory_waveform(signal)
    
    # Detect breathing presence
    detected, confidence = extractor.detect_breathing_presence(signal)
    console.print(f"Breathing detected: {'Yes' if detected else 'No'} (confidence: {confidence:.2%})")
    
    # Analyze breathing
    detector = BreathingRateDetector(sampling_rate=sampling_rate)
    results = detector.analyze_breathing(respiratory_wave)
    
    # Display results
    console.print(f"Estimated rate: [bold]{results['breathing_rate_bpm']} BPM[/bold]")
    console.print(f"Pattern: {results['breathing_pattern']}")
    console.print(f"Stability: {results['stability_level']} ({results['stability_score']:.3f})")
    
    # Calculate error
    error = abs(results['breathing_rate_bpm'] - true_rate)
    error_pct = (error / true_rate) * 100
    console.print(f"Error: {error:.2f} BPM ({error_pct:.1f}%)")
    
    return {
        'scenario': scenario_name,
        'true_rate': true_rate,
        'estimated_rate': results['breathing_rate_bpm'],
        'error': error,
        'error_percent': error_pct,
        'pattern': results['breathing_pattern'],
        'stability': results['stability_level'],
        'confidence': confidence,
        'respiratory_wave': respiratory_wave,
        'original_signal': signal
    }


def create_summary_table(all_results: list):
    """Create summary table of all scenarios."""
    console.print("\n" + "="*70)
    console.print("[bold cyan]Summary of All Scenarios[/bold cyan]\n")
    
    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Scenario", style="cyan")
    table.add_column("True Rate", justify="right")
    table.add_column("Estimated", justify="right")
    table.add_column("Error", justify="right")
    table.add_column("Error %", justify="right")
    table.add_column("Pattern", style="yellow")
    table.add_column("Stability", style="green")
    
    for result in all_results:
        error_color = "green" if result['error_percent'] < 10 else "yellow" if result['error_percent'] < 20 else "red"
        table.add_row(
            result['scenario'].title(),
            f"{result['true_rate']} BPM",
            f"{result['estimated_rate']:.1f} BPM",
            f"[{error_color}]{result['error']:.1f}[/{error_color}]",
            f"[{error_color}]{result['error_percent']:.1f}%[/{error_color}]",
            result['pattern'],
            result['stability']
        )
    
    console.print(table)
    
    # Overall statistics
    avg_error = np.mean([r['error'] for r in all_results])
    avg_error_pct = np.mean([r['error_percent'] for r in all_results])
    
    console.print(f"\n[bold]Average Error:[/bold] {avg_error:.2f} BPM ({avg_error_pct:.1f}%)")


def create_visualization(all_results: list, output_dir: Path):
    """Create visualization of breathing analysis."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    axes = axes.flatten()
    
    for idx, result in enumerate(all_results):
        ax = axes[idx]
        
        # Time axis
        time = np.arange(len(result['respiratory_wave'])) / 50.0
        
        # Plot respiratory waveform
        ax.plot(time, result['respiratory_wave'], linewidth=1.2, color='crimson', alpha=0.8)
        ax.set_xlabel('Time (seconds)', fontweight='bold')
        ax.set_ylabel('Normalized Amplitude', fontweight='bold')
        ax.set_title(
            f"{result['scenario'].title()}: {result['estimated_rate']:.1f} BPM "
            f"(True: {result['true_rate']} BPM)",
            fontweight='bold', fontsize=11
        )
        ax.grid(True, alpha=0.3)
        
        # Add text box with info
        info_text = (
            f"Pattern: {result['pattern']}\n"
            f"Stability: {result['stability']}\n"
            f"Error: {result['error_percent']:.1f}%"
        )
        ax.text(0.02, 0.98, info_text,
               transform=ax.transAxes,
               verticalalignment='top',
               bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8),
               fontsize=9)
    
    plt.tight_layout()
    
    output_path = output_dir / "breathing_analysis_demo.png"
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    console.print(f"\n[green]✓ Saved visualization to {output_path}[/green]")
    
    return output_path


def main():
    """Main demonstration."""
    console.print(Panel.fit(
        "[bold cyan]WiFi-Radar Breathing Analysis[/bold cyan]\n"
        "[bold yellow]⚠ EXPERIMENTAL FEATURE ⚠[/bold yellow]\n\n"
        "This demonstration shows respiratory monitoring capabilities\n"
        "using simulated WiFi CSI signals.\n\n"
        "[bold red]NOT FOR MEDICAL USE[/bold red]",
        border_style="cyan"
    ))
    
    # Create synthetic scenarios
    console.print("\n[bold]Creating synthetic breathing scenarios...[/bold]")
    scenarios, sampling_rate = create_synthetic_breathing_scenarios()
    console.print(f"[green]✓ Created {len(scenarios)} scenarios[/green]")
    
    # Analyze each scenario
    all_results = []
    for name, data in scenarios.items():
        result = analyze_scenario(
            name,
            data['signal'],
            data['true_rate'],
            data['description'],
            sampling_rate
        )
        all_results.append(result)
    
    # Summary
    create_summary_table(all_results)
    
    # Visualization
    console.print("\n[bold]Creating visualizations...[/bold]")
    viz_dir = PROJECT_ROOT / "datasets" / "metadata" / "visualizations"
    viz_path = create_visualization(all_results, viz_dir)
    
    # Disclaimer
    console.print("\n" + "="*70)
    console.print(Panel.fit(
        "[bold green]✓ Phase 3 Demonstration Complete![/bold green]\n\n"
        "[bold]Results Summary:[/bold]\n"
        f"• Analyzed {len(scenarios)} breathing scenarios\n"
        f"• Average estimation error: {np.mean([r['error_percent'] for r in all_results]):.1f}%\n"
        f"• Breathing detection confidence: {np.mean([r['confidence'] for r in all_results]):.1%}\n\n"
        "[bold yellow]⚠ IMPORTANT DISCLAIMER:[/bold yellow]\n"
        "This is an EXPERIMENTAL research feature:\n"
        "• NOT a medical device\n"
        "• NOT clinically validated\n"
        "• NOT for medical diagnosis\n"
        "• Research and demonstration only\n\n"
        "[bold]Technical Capabilities Demonstrated:[/bold]\n"
        "✓ Respiratory waveform extraction\n"
        "✓ Breathing rate estimation\n"
        "✓ Pattern classification\n"
        "✓ Stability analysis\n\n"
        "[bold]Next Steps:[/bold]\n"
        "→ Phase 4: ESP32 Hardware Integration\n"
        "→ Real-time CSI capture and processing",
        border_style="green"
    ))


if __name__ == "__main__":
    main()
