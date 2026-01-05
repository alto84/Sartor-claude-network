"""Visualization module for StrokeStyles.

This module provides comprehensive visualization capabilities for all stages
of the StrokeStyles pipeline, from glyph outlines to final stroke decomposition.

Submodules:
    glyph_viz: Visualize glyphs, polygons, and curvature
    medial_viz: Visualize medial axes, junctions, and features
    stroke_viz: Visualize strokes and decomposition results
"""

from strokestyles.visualization.glyph_viz import (
    plot_glyph_outline,
    plot_polygon,
    plot_curvature
)

from strokestyles.visualization.medial_viz import (
    plot_medial_axis,
    plot_skeleton_image,
    plot_junctions,
    plot_convexities_concavities,
    plot_links,
    JUNCTION_COLORS
)

from strokestyles.visualization.stroke_viz import (
    plot_stroke,
    plot_decomposition,
    plot_pipeline_stages,
    save_visualization,
    generate_distinct_colors
)

__all__ = [
    # Glyph visualization
    'plot_glyph_outline',
    'plot_polygon',
    'plot_curvature',
    # Medial axis visualization
    'plot_medial_axis',
    'plot_skeleton_image',
    'plot_junctions',
    'plot_convexities_concavities',
    'plot_links',
    'JUNCTION_COLORS',
    # Stroke visualization
    'plot_stroke',
    'plot_decomposition',
    'plot_pipeline_stages',
    'save_visualization',
    'generate_distinct_colors',
]

__version__ = '0.1.0'
