"""Visualize stroke decomposition results.

This module provides functions to visualize individual strokes and complete
stroke decompositions from the StrokeStyles pipeline.
"""

import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
from matplotlib.collections import PatchCollection
import numpy as np
from typing import Optional, List, Tuple
import colorsys


def generate_distinct_colors(n: int) -> List[str]:
    """Generate n visually distinct colors using HSV color space.

    Args:
        n: Number of colors to generate.

    Returns:
        List of hex color strings.
    """
    if n == 0:
        return []

    colors = []
    for i in range(n):
        hue = i / n
        rgb = colorsys.hsv_to_rgb(hue, 0.7, 0.9)
        colors.append(f'#{int(rgb[0]*255):02x}{int(rgb[1]*255):02x}{int(rgb[2]*255):02x}')
    return colors


def plot_stroke(
    stroke,
    ax: Optional[plt.Axes] = None,
    color: str = 'blue',
    alpha: float = 0.6,
    show_spine: bool = True,
    show_width: bool = True
) -> plt.Axes:
    """Plot a single stroke with its width profile.

    Args:
        stroke: Stroke object or dict with 'polygon'/'points', optional 'spine' and 'widths'.
        ax: Matplotlib axes to plot on. If None, creates new figure.
        color: Color for the stroke.
        alpha: Transparency for stroke fill.
        show_spine: Whether to show the stroke spine (medial axis).
        show_width: Whether to show width profile as circles along spine.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty stroke
    if stroke is None:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Extract stroke polygon
    polygon = None
    if isinstance(stroke, dict):
        polygon = stroke.get('polygon', stroke.get('points', None))
    elif hasattr(stroke, 'polygon'):
        polygon = stroke.polygon
    elif hasattr(stroke, 'points'):
        polygon = stroke.points

    # Plot stroke polygon
    if polygon is not None and len(polygon) > 0:
        polygon = np.array(polygon)
        patch = MplPolygon(
            polygon,
            closed=True,
            edgecolor=color,
            facecolor=color,
            linewidth=1.5,
            alpha=alpha
        )
        ax.add_patch(patch)

    # Extract and plot spine
    spine = None
    if show_spine:
        if isinstance(stroke, dict):
            spine = stroke.get('spine', stroke.get('centerline', None))
        elif hasattr(stroke, 'spine'):
            spine = stroke.spine
        elif hasattr(stroke, 'centerline'):
            spine = stroke.centerline

        if spine is not None and len(spine) > 0:
            spine = np.array(spine)
            ax.plot(spine[:, 0], spine[:, 1], 'k-', linewidth=2, alpha=0.8, label='Spine')

    # Extract and plot width profile
    widths = None
    if show_width and spine is not None:
        if isinstance(stroke, dict):
            widths = stroke.get('widths', stroke.get('radii', None))
        elif hasattr(stroke, 'widths'):
            widths = stroke.widths
        elif hasattr(stroke, 'radii'):
            widths = stroke.radii

        if widths is not None and len(widths) > 0:
            widths = np.array(widths)
            # Show width as circles at spine points
            for i, (point, width) in enumerate(zip(spine, widths)):
                if i % max(1, len(spine) // 5) == 0:  # Show every Nth circle
                    circle = plt.Circle(
                        point,
                        width / 2,
                        fill=False,
                        edgecolor='gray',
                        linestyle='--',
                        alpha=0.4
                    )
                    ax.add_patch(circle)

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax


def plot_decomposition(
    decomposition,
    ax: Optional[plt.Axes] = None,
    show_overlaps: bool = True,
    title: Optional[str] = None
) -> plt.Axes:
    """Plot complete stroke decomposition with distinct colors per stroke.

    Args:
        decomposition: Stroke decomposition object or list of strokes.
                       Can be dict with 'strokes' key or object with strokes attribute.
        ax: Matplotlib axes to plot on. If None, creates new figure.
        show_overlaps: Whether to highlight overlapping regions.
        title: Optional title for the plot.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(10, 10))

    # Handle empty decomposition
    if decomposition is None:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        if title:
            ax.set_title(title)
        return ax

    # Extract strokes
    strokes = []
    if isinstance(decomposition, (list, tuple)):
        strokes = decomposition
    elif isinstance(decomposition, dict):
        strokes = decomposition.get('strokes', [])
    elif hasattr(decomposition, 'strokes'):
        strokes = decomposition.strokes

    if not strokes:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        if title:
            ax.set_title(title)
        return ax

    # Generate distinct colors for each stroke
    colors = generate_distinct_colors(len(strokes))

    # Plot each stroke
    for i, (stroke, color) in enumerate(zip(strokes, colors)):
        plot_stroke(stroke, ax=ax, color=color, alpha=0.6, show_spine=False, show_width=False)

        # Add stroke label
        polygon = None
        if isinstance(stroke, dict):
            polygon = stroke.get('polygon', stroke.get('points', None))
        elif hasattr(stroke, 'polygon'):
            polygon = stroke.polygon
        elif hasattr(stroke, 'points'):
            polygon = stroke.points

        if polygon is not None and len(polygon) > 0:
            # Place label at centroid
            polygon = np.array(polygon)
            centroid = np.mean(polygon, axis=0)
            ax.text(
                centroid[0],
                centroid[1],
                f'S{i+1}',
                fontsize=10,
                fontweight='bold',
                ha='center',
                va='center',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=color, alpha=0.8)
            )

    # Optionally show overlaps
    if show_overlaps and len(strokes) > 1:
        # This is a simplified overlap visualization
        # A proper implementation would compute actual polygon intersections
        pass

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)

    if title:
        ax.set_title(title, fontsize=14, fontweight='bold')
    else:
        ax.set_title(f'Stroke Decomposition ({len(strokes)} strokes)', fontsize=14)

    ax.autoscale_view()

    return ax


def plot_pipeline_stages(
    glyph,
    polygon,
    ma_graph,
    junctions,
    decomposition,
    figsize: Tuple[int, int] = (20, 5)
) -> plt.Figure:
    """Create multi-panel visualization of all pipeline stages.

    Args:
        glyph: Original glyph object.
        polygon: Flattened polygon.
        ma_graph: Medial axis graph.
        junctions: List of classified junctions.
        decomposition: Final stroke decomposition.
        figsize: Figure size as (width, height).

    Returns:
        Matplotlib figure with all stages.
    """
    from . import glyph_viz, medial_viz

    fig, axes = plt.subplots(1, 5, figsize=figsize)

    # Stage 1: Original glyph
    glyph_viz.plot_glyph_outline(glyph, ax=axes[0], color='blue', fill=True, alpha=0.3)
    axes[0].set_title('1. Original Glyph', fontsize=12, fontweight='bold')

    # Stage 2: Flattened polygon
    if polygon is not None and len(polygon) > 0:
        glyph_viz.plot_polygon(polygon, ax=axes[1], color='green', fill=True, alpha=0.3)
    axes[1].set_title('2. Flattened Polygon', fontsize=12, fontweight='bold')

    # Stage 3: Medial axis
    if polygon is not None and len(polygon) > 0:
        glyph_viz.plot_polygon(polygon, ax=axes[2], color='gray', fill=True, alpha=0.2)
    if ma_graph is not None:
        medial_viz.plot_medial_axis(ma_graph, ax=axes[2], color='red', linewidth=2)
    axes[2].set_title('3. Medial Axis', fontsize=12, fontweight='bold')

    # Stage 4: Junctions
    if polygon is not None and len(polygon) > 0:
        glyph_viz.plot_polygon(polygon, ax=axes[3], color='gray', fill=True, alpha=0.2)
    if ma_graph is not None:
        medial_viz.plot_medial_axis(ma_graph, ax=axes[3], color='red', linewidth=1, show_radii=False)
    if junctions:
        medial_viz.plot_junctions(junctions, ax=axes[3], show_labels=True, marker_size=120)
    axes[3].set_title('4. Junction Classification', fontsize=12, fontweight='bold')

    # Stage 5: Final strokes
    plot_decomposition(decomposition, ax=axes[4], show_overlaps=True, title=None)
    axes[4].set_title('5. Stroke Decomposition', fontsize=12, fontweight='bold')

    # Adjust layout
    plt.tight_layout()

    return fig


def save_visualization(
    fig: plt.Figure,
    output_path: str,
    dpi: int = 150
) -> None:
    """Save figure to file.

    Args:
        fig: Matplotlib figure to save.
        output_path: Path to output file. Format inferred from extension.
        dpi: Dots per inch for raster formats.
    """
    if fig is None:
        raise ValueError("Figure cannot be None")

    if not output_path:
        raise ValueError("Output path cannot be empty")

    fig.savefig(output_path, dpi=dpi, bbox_inches='tight')
    print(f"Visualization saved to: {output_path}")
