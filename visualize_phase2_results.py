"""Quick visualization of Phase 2 results"""
import json
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (15, 10)

# Load metrics
metrics_path = Path('ai/saved_models/baseline_rf_metrics.json')
with open(metrics_path) as f:
    metrics = json.load(f)

# Create subplots
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# 1. Accuracy comparison
ax1 = axes[0, 0]
splits = ['Train', 'Val', 'Test']
accuracies = [
    metrics['train_accuracy'],
    metrics['val_accuracy'],
    metrics['test_accuracy']
]
colors = ['#2ecc71', '#f39c12', '#e74c3c']
bars = ax1.bar(splits, accuracies, color=colors, alpha=0.7, edgecolor='black')
ax1.set_ylabel('Accuracy', fontsize=12, fontweight='bold')
ax1.set_title('Model Accuracy Across Splits', fontsize=14, fontweight='bold')
ax1.set_ylim([0, 1.0])
ax1.axhline(y=0.5, color='gray', linestyle='--', alpha=0.5, label='Baseline (50%)')

# Add value labels on bars
for bar, acc in zip(bars, accuracies):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height,
            f'{acc:.1%}',
            ha='center', va='bottom', fontsize=11, fontweight='bold')

ax1.legend()
ax1.grid(axis='y', alpha=0.3)

# 2. Class distribution
ax2 = axes[0, 1]
class_dist = metrics['class_distribution']
classes = list(class_dist.keys())
counts = list(class_dist.values())
colors_dist = sns.color_palette("husl", len(classes))
wedges, texts, autotexts = ax2.pie(counts, labels=classes, autopct='%1.1f%%',
                                     colors=colors_dist, startangle=90)
ax2.set_title('Class Distribution in Dataset', fontsize=14, fontweight='bold')

for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontsize(10)
    autotext.set_fontweight('bold')

# 3. Per-class performance (from confusion matrix analysis)
ax3 = axes[1, 0]
class_metrics = {
    'Jump': {'Precision': 0.47, 'Recall': 0.42, 'F1': 0.44},
    'Fall': {'Precision': 0.60, 'Recall': 0.87, 'F1': 0.71},
    'Sit': {'Precision': 0.21, 'Recall': 0.04, 'F1': 0.06},
    'Stand': {'Precision': 0.31, 'Recall': 0.06, 'F1': 0.11},
    'Walk': {'Precision': 0.36, 'Recall': 0.13, 'F1': 0.19}
}

x = np.arange(len(class_metrics))
width = 0.25
metrics_types = ['Precision', 'Recall', 'F1']
colors_metrics = ['#3498db', '#e74c3c', '#2ecc71']

for i, metric_type in enumerate(metrics_types):
    values = [class_metrics[cls][metric_type] for cls in class_metrics]
    offset = width * (i - 1)
    ax3.bar(x + offset, values, width, label=metric_type,
           color=colors_metrics[i], alpha=0.8, edgecolor='black')

ax3.set_ylabel('Score', fontsize=12, fontweight='bold')
ax3.set_title('Per-Class Performance Metrics', fontsize=14, fontweight='bold')
ax3.set_xticks(x)
ax3.set_xticklabels(class_metrics.keys())
ax3.legend()
ax3.set_ylim([0, 1.0])
ax3.grid(axis='y', alpha=0.3)

# 4. Dataset split sizes
ax4 = axes[1, 1]
split_sizes = [
    metrics['num_samples_train'],
    metrics['num_samples_val'],
    metrics['num_samples_test']
]
split_labels = [f"Train\n{split_sizes[0]:,}",
               f"Val\n{split_sizes[1]:,}",
               f"Test\n{split_sizes[2]:,}"]
colors_split = ['#3498db', '#f39c12', '#e74c3c']
bars = ax4.bar(range(3), split_sizes, color=colors_split, alpha=0.7, edgecolor='black')
ax4.set_ylabel('Number of Samples', fontsize=12, fontweight='bold')
ax4.set_title('Dataset Split Sizes', fontsize=14, fontweight='bold')
ax4.set_xticks(range(3))
ax4.set_xticklabels(['Train (70%)', 'Val (10%)', 'Test (20%)'])
ax4.grid(axis='y', alpha=0.3)

# Add total
total = sum(split_sizes)
ax4.text(1, max(split_sizes) * 0.95, f'Total: {total:,} samples',
        ha='center', fontsize=11, fontweight='bold',
        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

plt.tight_layout()
output_path = 'datasets/metadata/visualizations/phase2_results.png'
plt.savefig(output_path, dpi=150, bbox_inches='tight')
print(f"✓ Saved Phase 2 results visualization to {output_path}")
