# StrokeStyles Visualization Module Usage

The visualization module provides comprehensive plotting capabilities for all stages of the StrokeStyles pipeline.

## Installation

The visualization module requires matplotlib and numpy:

```bash
pip install matplotlib numpy
```

Optional dependency for graph visualization:
```bash
pip install networkx
```

## Quick Start

```python
import sys
sys.path.insert(0, 'src')

from strokestyles.visualization import (
    plot_glyph_outline,
    plot_polygon,
    plot_curvature,
    plot_medial_axis,
    plot_junctions,
    plot_stroke,
    plot_decomposition,
    plot_pipeline_stages
)
```

## Module Structure

### 1. `glyph_viz` - Glyph and Polygon Visualization

**Functions:**
- `plot_glyph_outline(glyph, ax=None, color='blue', ...)` - Plot original glyph from Bezier curves
- `plot_polygon(polygon, ax=None, color='blue', ...)` - Plot flattened polygon
- `plot_curvature(polygon, curvatures, ax=None, cmap='coolwarm')` - Color by curvature

**Example:**
```python
import numpy as np
from strokestyles.visualization.glyph_viz import plot_polygon

# Create a simple square polygon
square = np.array([[0, 0], [1, 0], [1, 1], [0, 1]])
ax = plot_polygon(square, color='blue', fill=True, alpha=0.3)
```

### 2. `medial_viz` - Medial Axis and Junction Visualization

**Functions:**
- `plot_medial_axis(ma_graph, ax=None, ...)` - Plot medial axis graph
- `plot_skeleton_image(skeleton, distance=None, ...)` - Plot rasterized skeleton
- `plot_junctions(junctions, ax=None, ...)` - Plot classified junctions with colors
- `plot_convexities_concavities(polygon, convexities, concavities, ...)` - Plot curvature features
- `plot_links(links, ax=None, ...)` - Plot concavity links

**Junction Types and Colors:**
```python
from strokestyles.visualization.medial_viz import JUNCTION_COLORS

# Available junction types:
# - ENDPOINT (green)
# - Y_JUNCTION (red)
# - T_JUNCTION (orange)
# - L_JUNCTION (purple)
# - NULL_JUNCTION (gray)
# - HALF_JUNCTION (cyan)
# - PROTUBERANCE (magenta)
```

**Example:**
```python
from strokestyles.visualization.medial_viz import plot_junctions

junctions = [
    {'type': 'Y_JUNCTION', 'position': [0.5, 0.5]},
    {'type': 'ENDPOINT', 'position': [1.0, 1.0]}
]
ax = plot_junctions(junctions, show_labels=True)
```

### 3. `stroke_viz` - Stroke Decomposition Visualization

**Functions:**
- `plot_stroke(stroke, ax=None, ...)` - Plot single stroke with spine and width
- `plot_decomposition(decomposition, ax=None, ...)` - Plot all strokes with distinct colors
- `plot_pipeline_stages(glyph, polygon, ma_graph, junctions, decomposition)` - Multi-panel visualization
- `save_visualization(fig, output_path, dpi=150)` - Save figure to file
- `generate_distinct_colors(n)` - Generate n visually distinct colors

**Example:**
```python
from strokestyles.visualization.stroke_viz import plot_decomposition

# Strokes as list of dictionaries
strokes = [
    {'polygon': np.array([[0, 0], [1, 0], [0.5, 1]])},
    {'polygon': np.array([[1, 0], [2, 0], [1.5, 1]])}
]
ax = plot_decomposition(strokes, show_overlaps=True)
```

## Complete Pipeline Visualization

```python
import matplotlib.pyplot as plt
from strokestyles.visualization import plot_pipeline_stages, save_visualization

# Visualize all stages
fig = plot_pipeline_stages(
    glyph=my_glyph,
    polygon=my_polygon,
    ma_graph=my_medial_axis,
    junctions=my_junctions,
    decomposition=my_strokes
)

# Save to file
save_visualization(fig, 'pipeline_output.png', dpi=150)
```

## Data Format Requirements

### Polygon Format
- NumPy array of shape (N, 2) with x, y coordinates
- Or list of (x, y) tuples

### Junction Format
Each junction should be a dict or object with:
- `type`: String (e.g., 'Y_JUNCTION', 'ENDPOINT')
- `position` or `pos`: (x, y) coordinates

### Stroke Format
Each stroke should be a dict or object with:
- `polygon` or `points`: Polygon vertices
- `spine` or `centerline` (optional): Spine coordinates
- `widths` or `radii` (optional): Width values along spine

### Medial Axis Format
Can be one of:
- NetworkX graph with node 'pos' attributes
- Dict with 'nodes' and 'edges' keys
- Tuple of (nodes, edges)

## Error Handling

All functions handle edge cases gracefully:
- None or empty inputs → Empty plot with grid
- Invalid data → Logged warning, partial rendering
- Missing optional fields → Skipped without error

## Examples

See the test code in the module for complete examples of synthetic data usage.
