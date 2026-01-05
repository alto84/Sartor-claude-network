"""Visualize glyph outlines and polygons.

This module provides functions to visualize font glyphs, flattened polygons,
and curvature information for the StrokeStyles pipeline.
"""

import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon, PathPatch
from matplotlib.path import Path
from matplotlib.collections import LineCollection
import numpy as np
from typing import Optional, List, Tuple, Union


def plot_glyph_outline(
    glyph,
    ax: Optional[plt.Axes] = None,
    color: str = 'blue',
    linewidth: float = 2.0,
    fill: bool = True,
    alpha: float = 0.3
) -> plt.Axes:
    """Plot glyph outline from Bezier contours.

    Args:
        glyph: Glyph object with contours (from fontTools) or list of contours.
               Each contour should have points and a draw() method, or be a list of (x,y) tuples.
        ax: Matplotlib axes to plot on. If None, creates new figure.
        color: Color for the outline.
        linewidth: Width of the outline.
        fill: Whether to fill the glyph.
        alpha: Transparency for fill (0=transparent, 1=opaque).

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty glyph
    if glyph is None:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Extract contours
    contours = []
    if hasattr(glyph, 'contours'):
        contours = glyph.contours
    elif hasattr(glyph, '_glyph') and hasattr(glyph._glyph, 'contours'):
        contours = glyph._glyph.contours
    elif isinstance(glyph, (list, tuple)):
        contours = glyph

    if not contours:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Plot each contour
    for contour in contours:
        # Extract points from contour
        points = []
        if hasattr(contour, 'points'):
            points = [(p.x, p.y) if hasattr(p, 'x') else p for p in contour.points]
        elif isinstance(contour, (list, tuple)):
            points = contour

        if len(points) < 3:
            continue

        # Create polygon
        polygon = MplPolygon(
            points,
            closed=True,
            edgecolor=color,
            facecolor=color if fill else 'none',
            linewidth=linewidth,
            alpha=alpha if fill else 1.0
        )
        ax.add_patch(polygon)

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax


def plot_polygon(
    polygon: Union[np.ndarray, List],
    ax: Optional[plt.Axes] = None,
    color: str = 'blue',
    linewidth: float = 1.5,
    fill: bool = True,
    alpha: float = 0.3,
    show_vertices: bool = False
) -> plt.Axes:
    """Plot flattened polygon.

    Args:
        polygon: Polygon as numpy array of shape (N, 2) or list of (x, y) tuples.
        ax: Matplotlib axes to plot on. If None, creates new figure.
        color: Color for the polygon.
        linewidth: Width of the polygon edges.
        fill: Whether to fill the polygon.
        alpha: Transparency for fill.
        show_vertices: Whether to show vertices as points.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty or invalid polygon
    if polygon is None or len(polygon) == 0:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Convert to numpy array
    if isinstance(polygon, list):
        polygon = np.array(polygon)

    if len(polygon) < 3:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Create and add polygon patch
    patch = MplPolygon(
        polygon,
        closed=True,
        edgecolor=color,
        facecolor=color if fill else 'none',
        linewidth=linewidth,
        alpha=alpha if fill else 1.0
    )
    ax.add_patch(patch)

    # Optionally show vertices
    if show_vertices:
        ax.scatter(polygon[:, 0], polygon[:, 1], c=color, s=20, zorder=5)

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax


def plot_curvature(
    polygon: np.ndarray,
    curvatures: np.ndarray,
    ax: Optional[plt.Axes] = None,
    cmap: str = 'coolwarm'
) -> plt.Axes:
    """Plot polygon colored by curvature (red=convex, blue=concave).

    Uses a colormap to visualize curvature values along the polygon.
    Positive curvature (convex) appears in warm colors, negative (concave) in cool colors.

    Args:
        polygon: Polygon vertices as numpy array of shape (N, 2).
        curvatures: Curvature values at each vertex, shape (N,).
        ax: Matplotlib axes to plot on. If None, creates new figure.
        cmap: Colormap name for curvature visualization.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty or invalid input
    if polygon is None or curvatures is None or len(polygon) == 0 or len(curvatures) == 0:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Ensure arrays
    polygon = np.array(polygon)
    curvatures = np.array(curvatures)

    if len(polygon) < 2:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Normalize curvatures for colormap
    curvatures_norm = curvatures.copy()
    max_abs_curv = np.max(np.abs(curvatures))
    if max_abs_curv > 0:
        curvatures_norm = curvatures / max_abs_curv

    # Create line segments
    points = polygon.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)

    # Add closing segment
    closing_segment = np.array([[polygon[-1], polygon[0]]])
    segments = np.concatenate([segments, closing_segment], axis=0)

    # Extend curvatures for segments
    if len(curvatures_norm) == len(polygon):
        segment_curvatures = curvatures_norm
    else:
        segment_curvatures = np.concatenate([curvatures_norm, [curvatures_norm[0]]])

    # Create line collection with curvature colors
    lc = LineCollection(
        segments,
        array=segment_curvatures,
        cmap=cmap,
        linewidth=3,
        norm=plt.Normalize(vmin=-1, vmax=1)
    )

    ax.add_collection(lc)

    # Add colorbar
    cbar = plt.colorbar(lc, ax=ax)
    cbar.set_label('Curvature (red=convex, blue=concave)', rotation=270, labelpad=20)

    # Plot polygon outline
    polygon_closed = np.vstack([polygon, polygon[0]])
    ax.plot(polygon_closed[:, 0], polygon_closed[:, 1], 'k-', linewidth=0.5, alpha=0.3)

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax
