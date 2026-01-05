"""Visualize medial axis, junctions, and features.

This module provides functions to visualize medial axes, junction classifications,
and curvature features for the StrokeStyles pipeline.
"""

import matplotlib.pyplot as plt
from matplotlib.patches import Circle
import numpy as np
from typing import Optional, List, Dict, Union
try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False


# Junction type colors mapping
JUNCTION_COLORS = {
    'ENDPOINT': 'green',
    'Y_JUNCTION': 'red',
    'T_JUNCTION': 'orange',
    'L_JUNCTION': 'purple',
    'NULL_JUNCTION': 'gray',
    'HALF_JUNCTION': 'cyan',
    'PROTUBERANCE': 'magenta',
    'STROKE_END': 'green',  # Alias
    'Y': 'red',  # Short form
    'T': 'orange',
    'L': 'purple',
}


def plot_medial_axis(
    ma_graph,
    ax: Optional[plt.Axes] = None,
    color: str = 'red',
    linewidth: float = 1.5,
    show_radii: bool = False
) -> plt.Axes:
    """Plot medial axis as graph edges.

    Args:
        ma_graph: Medial axis graph. Can be:
                  - NetworkX graph with node positions
                  - Dict with 'nodes' and 'edges' keys
                  - Tuple of (nodes, edges) where nodes is array of (x,y) positions
        ax: Matplotlib axes to plot on. If None, creates new figure.
        color: Color for the medial axis edges.
        linewidth: Width of the edges.
        show_radii: Whether to show radius circles at branch points.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty graph
    if ma_graph is None:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Extract nodes and edges based on input type
    nodes = []
    edges = []
    radii = {}

    if HAS_NETWORKX and isinstance(ma_graph, nx.Graph):
        # NetworkX graph
        pos = nx.get_node_attributes(ma_graph, 'pos')
        if not pos:
            # Try to use node coordinates directly
            pos = {node: node if isinstance(node, tuple) else (0, 0) for node in ma_graph.nodes()}

        nodes = list(pos.values())
        edges = [(pos[u], pos[v]) for u, v in ma_graph.edges()]

        # Get radii if available
        radii = nx.get_node_attributes(ma_graph, 'radius')

    elif isinstance(ma_graph, dict):
        # Dictionary with nodes and edges
        nodes = ma_graph.get('nodes', [])
        edges = ma_graph.get('edges', [])
        radii = ma_graph.get('radii', {})

    elif isinstance(ma_graph, (tuple, list)) and len(ma_graph) >= 2:
        # Tuple/list of (nodes, edges)
        nodes, edges = ma_graph[0], ma_graph[1]
        if len(ma_graph) > 2:
            radii = ma_graph[2]

    # Plot edges
    for edge in edges:
        if len(edge) >= 2:
            p1, p2 = edge[0], edge[1]
            # Handle different point formats
            if isinstance(p1, (int, float)):
                continue  # Skip if not a point
            x1, y1 = (p1[0], p1[1]) if len(p1) >= 2 else (0, 0)
            x2, y2 = (p2[0], p2[1]) if len(p2) >= 2 else (0, 0)
            ax.plot([x1, x2], [y1, y2], color=color, linewidth=linewidth)

    # Plot nodes
    if nodes:
        nodes_array = np.array([(n[0], n[1]) if len(n) >= 2 else (0, 0) for n in nodes if not isinstance(n, (int, float))])
        if len(nodes_array) > 0:
            ax.scatter(nodes_array[:, 0], nodes_array[:, 1], c=color, s=30, zorder=5)

    # Optionally show radii
    if show_radii and radii:
        for node_id, radius in radii.items():
            if isinstance(node_id, tuple) and len(node_id) >= 2:
                x, y = node_id
            elif HAS_NETWORKX and isinstance(ma_graph, nx.Graph):
                pos = nx.get_node_attributes(ma_graph, 'pos')
                if node_id in pos:
                    x, y = pos[node_id]
                else:
                    continue
            else:
                continue

            circle = Circle((x, y), radius, fill=False, edgecolor=color, linestyle='--', alpha=0.3)
            ax.add_patch(circle)

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax


def plot_skeleton_image(
    skeleton: np.ndarray,
    distance: Optional[np.ndarray] = None,
    ax: Optional[plt.Axes] = None,
    cmap: str = 'hot'
) -> plt.Axes:
    """Plot rasterized skeleton with optional distance coloring.

    Args:
        skeleton: Binary skeleton image (2D array).
        distance: Optional distance transform values at skeleton pixels.
        ax: Matplotlib axes to plot on. If None, creates new figure.
        cmap: Colormap for distance visualization.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty skeleton
    if skeleton is None or skeleton.size == 0:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Plot skeleton or distance map
    if distance is not None:
        # Mask to show only skeleton pixels
        masked_distance = np.ma.masked_where(~skeleton.astype(bool), distance)
        im = ax.imshow(masked_distance, cmap=cmap, interpolation='nearest')
        plt.colorbar(im, ax=ax, label='Distance')
    else:
        ax.imshow(skeleton, cmap='binary', interpolation='nearest')

    ax.set_aspect('equal')
    ax.axis('off')

    return ax


def plot_junctions(
    junctions,
    ax: Optional[plt.Axes] = None,
    show_labels: bool = True,
    marker_size: int = 100
) -> plt.Axes:
    """Plot classified junctions with colors by type.

    Args:
        junctions: List of junction objects or dicts with 'position', 'type', and optional 'id'.
        ax: Matplotlib axes to plot on. If None, creates new figure.
        show_labels: Whether to show junction type labels.
        marker_size: Size of junction markers.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty junctions
    if not junctions:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Group junctions by type
    junction_by_type = {}
    for junction in junctions:
        # Extract junction type
        if isinstance(junction, dict):
            jtype = junction.get('type', 'UNKNOWN')
            pos = junction.get('position', junction.get('pos', None))
        elif hasattr(junction, 'type'):
            jtype = junction.type if isinstance(junction.type, str) else str(junction.type)
            pos = getattr(junction, 'position', getattr(junction, 'pos', None))
        else:
            continue

        if pos is None:
            continue

        # Normalize type name
        jtype = jtype.upper().replace(' ', '_')

        if jtype not in junction_by_type:
            junction_by_type[jtype] = []
        junction_by_type[jtype].append(pos)

    # Plot each junction type
    for jtype, positions in junction_by_type.items():
        color = JUNCTION_COLORS.get(jtype, 'black')
        positions = np.array(positions)

        if len(positions) > 0:
            ax.scatter(
                positions[:, 0],
                positions[:, 1],
                c=color,
                s=marker_size,
                label=jtype.replace('_', ' '),
                edgecolors='black',
                linewidths=1,
                zorder=10,
                alpha=0.8
            )

    # Add legend
    if junction_by_type:
        ax.legend(loc='upper right', framealpha=0.9)

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax


def plot_convexities_concavities(
    polygon: np.ndarray,
    convexities,
    concavities,
    ax: Optional[plt.Axes] = None
) -> plt.Axes:
    """Plot convex (green) and concave (red) features on polygon.

    Args:
        polygon: Polygon vertices as numpy array of shape (N, 2).
        convexities: List of convex curvature features (objects or dicts with 'indices' or 'start'/'end').
        concavities: List of concave curvature features.
        ax: Matplotlib axes to plot on. If None, creates new figure.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty polygon
    if polygon is None or len(polygon) == 0:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    polygon = np.array(polygon)

    # Plot base polygon
    polygon_closed = np.vstack([polygon, polygon[0]])
    ax.plot(polygon_closed[:, 0], polygon_closed[:, 1], 'k-', linewidth=1, alpha=0.3, label='Outline')

    # Plot convexities
    for feature in (convexities or []):
        indices = _extract_indices(feature, len(polygon))
        if indices:
            points = polygon[indices]
            ax.plot(points[:, 0], points[:, 1], 'g-', linewidth=3, alpha=0.7)
            # Mark peak
            if hasattr(feature, 'peak_index'):
                peak_idx = feature.peak_index
            elif isinstance(feature, dict) and 'peak_index' in feature:
                peak_idx = feature['peak_index']
            elif len(indices) > 0:
                peak_idx = indices[len(indices) // 2]
            else:
                peak_idx = None

            if peak_idx is not None and 0 <= peak_idx < len(polygon):
                ax.scatter([polygon[peak_idx, 0]], [polygon[peak_idx, 1]], c='green', s=50, marker='o', zorder=5)

    # Plot concavities
    for feature in (concavities or []):
        indices = _extract_indices(feature, len(polygon))
        if indices:
            points = polygon[indices]
            ax.plot(points[:, 0], points[:, 1], 'r-', linewidth=3, alpha=0.7)
            # Mark valley
            if hasattr(feature, 'valley_index'):
                valley_idx = feature.valley_index
            elif isinstance(feature, dict) and 'valley_index' in feature:
                valley_idx = feature['valley_index']
            elif len(indices) > 0:
                valley_idx = indices[len(indices) // 2]
            else:
                valley_idx = None

            if valley_idx is not None and 0 <= valley_idx < len(polygon):
                ax.scatter([polygon[valley_idx, 0]], [polygon[valley_idx, 1]], c='red', s=50, marker='v', zorder=5)

    # Add legend
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], color='green', lw=3, label='Convexities'),
        Line2D([0], [0], color='red', lw=3, label='Concavities')
    ]
    ax.legend(handles=legend_elements, loc='upper right')

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax


def plot_links(
    links,
    ax: Optional[plt.Axes] = None,
    color: str = 'purple',
    linestyle: str = '--'
) -> plt.Axes:
    """Plot concavity links as dashed lines.

    Args:
        links: List of link objects or dicts with 'start' and 'end' positions.
        ax: Matplotlib axes to plot on. If None, creates new figure.
        color: Color for link lines.
        linestyle: Line style for links.

    Returns:
        Matplotlib axes with the plot.
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 8))

    # Handle empty links
    if not links:
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        return ax

    # Plot each link
    for link in links:
        # Extract start and end positions
        if isinstance(link, dict):
            start = link.get('start', link.get('p1', None))
            end = link.get('end', link.get('p2', None))
        elif hasattr(link, 'start') and hasattr(link, 'end'):
            start = link.start
            end = link.end
        elif isinstance(link, (tuple, list)) and len(link) >= 2:
            start, end = link[0], link[1]
        else:
            continue

        if start is None or end is None:
            continue

        # Convert to coordinates
        if isinstance(start, (tuple, list, np.ndarray)) and len(start) >= 2:
            x1, y1 = start[0], start[1]
        else:
            continue

        if isinstance(end, (tuple, list, np.ndarray)) and len(end) >= 2:
            x2, y2 = end[0], end[1]
        else:
            continue

        ax.plot([x1, x2], [y1, y2], color=color, linestyle=linestyle, linewidth=2, alpha=0.7)

    ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.autoscale_view()

    return ax


def _extract_indices(feature, polygon_length: int) -> List[int]:
    """Extract vertex indices from a curvature feature.

    Args:
        feature: Feature object or dict.
        polygon_length: Length of the polygon for wraparound.

    Returns:
        List of vertex indices.
    """
    if hasattr(feature, 'indices'):
        return list(feature.indices)
    elif isinstance(feature, dict) and 'indices' in feature:
        return list(feature['indices'])
    elif hasattr(feature, 'start') and hasattr(feature, 'end'):
        start = feature.start
        end = feature.end
        if start <= end:
            return list(range(start, end + 1))
        else:
            # Wraparound
            return list(range(start, polygon_length)) + list(range(0, end + 1))
    elif isinstance(feature, dict) and 'start' in feature and 'end' in feature:
        start = feature['start']
        end = feature['end']
        if start <= end:
            return list(range(start, end + 1))
        else:
            return list(range(start, polygon_length)) + list(range(0, end + 1))
    return []
