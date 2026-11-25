"""Create final completion summary visualization"""
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path

# Phase data
phases = [
    "Phase 1\nDataset &\nVisualization",
    "Phase 2\nActivity\nClassification",
    "Phase 3\nBreathing\nAnalysis",
    "Phase 4\nESP32\nIntegration",
    "Phase 5\nBackend\nAPI",
    "Phase 6\nFrontend\nDashboard",
    "Phase 7\nNotification\nSystem",
    "Phase 8\n3D\nVisualization",
    "Phase 9\nTesting &\nQA"
]

completion = [100, 100, 100, 100, 100, 100, 100, 100, 100]
colors = ['#10b981' if c == 100 else '#f59e0b' for c in completion]

# Create figure
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))

# Top: Progress bars
y_pos = range(len(phases))
bars = ax1.barh(y_pos, completion, color=colors, edgecolor='black', linewidth=1.5)
ax1.set_yticks(y_pos)
ax1.set_yticklabels(phases, fontsize=10, fontweight='bold')
ax1.set_xlabel('Completion %', fontsize=12, fontweight='bold')
ax1.set_title('WiFi-Radar: All Phases Complete! 🎉', fontsize=16, fontweight='bold', pad=20)
ax1.set_xlim([0, 110])
ax1.grid(axis='x', alpha=0.3)

# Add completion percentages
for i, (bar, pct) in enumerate(zip(bars, completion)):
    width = bar.get_width()
    ax1.text(width + 2, bar.get_y() + bar.get_height()/2, 
            f'{pct}%', ha='left', va='center', fontweight='bold', fontsize=10)

# Bottom: Key metrics
metrics = {
    'Overall Test Accuracy': '55.35%',
    'Fall Detection Recall': '87%',
    'Breathing Detection': '95.6%',
    'Total Files Created': '70+',
    'Lines of Code': '8,000+',
    'API Endpoints': '15+',
    'Tests Passing': '12/12',
    'Documentation Words': '25,000+'
}

ax2.axis('off')
table_data = [[k, v] for k, v in metrics.items()]

table = ax2.table(cellText=table_data, 
                 colLabels=['Metric', 'Value'],
                 cellLoc='left',
                 loc='center',
                 colWidths=[0.6, 0.4])

table.auto_set_font_size(False)
table.set_fontsize(11)
table.scale(1, 2.5)

# Style table
for (i, j), cell in table.get_celld().items():
    if i == 0:
        cell.set_facecolor('#3b82f6')
        cell.set_text_props(weight='bold', color='white')
    else:
        if j == 0:
            cell.set_facecolor('#f0f0f0')
        else:
            cell.set_facecolor('#ffffff')
            cell.set_text_props(weight='bold', color='#059669')
    cell.set_edgecolor('#cccccc')
    cell.set_linewidth(1.5)

ax2.text(0.5, 0.95, 'Key Performance Metrics', 
        ha='center', va='top', fontsize=14, fontweight='bold',
        transform=ax2.transAxes)

plt.tight_layout()

output_path = Path('datasets/metadata/visualizations/all_phases_complete.png')
plt.savefig(output_path, dpi=150, bbox_inches='tight')
print(f"✓ Saved completion summary to {output_path}")
