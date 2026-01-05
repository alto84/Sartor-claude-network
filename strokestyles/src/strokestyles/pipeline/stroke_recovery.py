"""Recover strokes from medial axis and junctions - THE MAIN ALGORITHM."""
from typing import List, Set, Tuple, Optional, Dict
import numpy as np
import networkx as nx
from scipy.spatial.distance import cdist

from strokestyles.core.stroke import Stroke, StrokeDecomposition
from strokestyles.geometry.medial_axis import MedialAxisGraph
from strokestyles.geometry.junction import Junction, JunctionType
from strokestyles.geometry.linking import ConcavityLink


def recover_strokes(
    ma_graph: MedialAxisGraph,
    junctions: List[Junction],
    links: List[ConcavityLink],
    polygon: np.ndarray
) -> List[Stroke]:
    """
    Main stroke recovery algorithm.

    Pipeline:
    1. Identify endpoints (degree 1) and junctions (degree 3+) from graph topology
    2. Trace continuous paths through medial axis between terminal nodes
    3. Handle overlaps at junction regions
    4. Assign width profiles from distance transform

    Args:
        ma_graph: MedialAxisGraph with vertices, edges, and radii
        junctions: List of classified junctions (used for junction types)
        links: List of concavity links
        polygon: Original polygon boundary

    Returns:
        List of recovered Stroke objects
    """
    if ma_graph.vertices.shape[0] == 0:
        return []

    # Build NetworkX graph for pathfinding
    G = ma_graph.to_networkx()

    # Create mapping from vertex ID to junction for type information
    vertex_to_junction = {}
    for junction in junctions:
        vertex_to_junction[junction.vertex_id] = junction

    # Find stroke paths
    strokes = []
    visited_edges = set()
    stroke_id_counter = 0

    # FIXED: Identify terminal nodes directly from graph topology
    # Endpoints: degree 1 vertices
    # Junctions: degree 3+ vertices with significant branches
    # Skip degree 2 vertices (they are just path continuations)
    endpoints = [n for n in G.nodes() if G.degree(n) == 1]

    # Compute adaptive threshold based on graph structure
    # Use median edge length as reference for "significant" branch length
    edge_lengths = []
    for e1, e2 in G.edges():
        pos1 = G.nodes[e1]['pos']
        pos2 = G.nodes[e2]['pos']
        edge_lengths.append(np.linalg.norm(pos2 - pos1))

    if edge_lengths:
        median_edge_length = np.median(edge_lengths)
        # A significant branch should be at least 3x the median edge length
        # This filters out noise while keeping real structural features
        base_min_length = median_edge_length * 3.0
    else:
        base_min_length = 1.0

    # Filter junctions: only include degree 3+ nodes with significant branches
    # This removes spurious junctions from medial axis noise
    junction_nodes = []
    for n in G.nodes():
        if G.degree(n) < 3:
            continue

        # Check if this junction has at least 3 significant branches
        # A branch is significant if it's either:
        # 1. Leads to an endpoint
        # 2. Has reasonable length (not just a tiny artifact)
        significant_branches = 0
        node_radius = G.nodes[n]['radius']
        # Use max of base threshold and local radius-based threshold
        min_branch_length = max(base_min_length, node_radius * 2.0)

        for neighbor in G.neighbors(n):
            # Trace branch until we hit another high-degree node or endpoint
            branch_length = 0.0
            current = neighbor
            prev = n
            path_nodes = [n, neighbor]

            while G.degree(current) == 2:
                neighbors = list(G.neighbors(current))
                neighbors.remove(prev)
                if not neighbors:
                    break

                next_node = neighbors[0]
                pos1 = G.nodes[current]['pos']
                pos2 = G.nodes[next_node]['pos']
                branch_length += np.linalg.norm(pos2 - pos1)

                prev = current
                current = next_node
                path_nodes.append(current)

                # Prevent infinite loops
                if len(path_nodes) > 1000:
                    break

            # Add final segment length
            pos1 = G.nodes[n]['pos']
            pos2 = G.nodes[neighbor]['pos']
            branch_length += np.linalg.norm(pos2 - pos1)

            # Check if this is a significant branch
            if G.degree(current) == 1 or branch_length >= min_branch_length:
                significant_branches += 1

        # Only treat as junction if it has at least 3 significant branches
        if significant_branches >= 3:
            junction_nodes.append(n)

    terminal_nodes = endpoints + junction_nodes

    # If no terminal nodes, the graph is likely a simple loop or line
    # In this case, pick an arbitrary starting point
    if len(terminal_nodes) == 0 and G.number_of_nodes() > 0:
        terminal_nodes = [list(G.nodes())[0]]

    # Trace strokes between terminal nodes
    for start_node in terminal_nodes:
        if start_node not in G:
            continue

        for neighbor in G.neighbors(start_node):
            edge = tuple(sorted([start_node, neighbor]))

            if edge in visited_edges:
                continue

            # Trace path from start_node through neighbor
            path, start_junction_type, end_junction_type = trace_stroke_path(
                start_node,
                neighbor,
                G,
                vertex_to_junction,
                visited_edges,
                terminal_nodes
            )

            if len(path) >= 2:
                # Extract stroke data
                spine_points = []
                widths = []

                for vertex_id in path:
                    pos = G.nodes[vertex_id]['pos']
                    radius = G.nodes[vertex_id]['radius']
                    spine_points.append(pos)
                    widths.append(radius)

                spine = np.array(spine_points, dtype=np.float64)
                widths_array = np.array(widths, dtype=np.float64)

                stroke = Stroke(
                    id=stroke_id_counter,
                    spine=spine,
                    widths=widths_array,
                    start_junction_type=start_junction_type,
                    end_junction_type=end_junction_type,
                    overlapping_stroke_ids=set()
                )

                strokes.append(stroke)
                stroke_id_counter += 1

    # Compute overlaps between strokes
    compute_overlaps(strokes, threshold=0.1)

    return strokes


def trace_stroke_path(
    start_vertex: int,
    next_vertex: int,
    graph: nx.Graph,
    junctions: Dict[int, Junction],
    visited: Set[Tuple[int, int]],
    terminal_nodes: List[int]
) -> Tuple[List[int], Optional[str], Optional[str]]:
    """
    Trace a path through the medial axis graph.

    Follows the medial axis from start_vertex through next_vertex until
    hitting another terminal node (endpoint or significant junction).

    Args:
        start_vertex: Starting vertex ID
        next_vertex: First vertex to visit
        graph: NetworkX graph of medial axis
        junctions: Mapping from vertex ID to Junction
        visited: Set of visited edges (as sorted tuples)
        terminal_nodes: List of terminal vertex IDs (endpoints/junctions)

    Returns:
        (path_vertices, start_junction_type, end_junction_type)
    """
    path = [start_vertex, next_vertex]

    # Mark edge as visited
    visited.add(tuple(sorted([start_vertex, next_vertex])))

    # Get start junction type
    start_junction_type = None
    if start_vertex in junctions:
        start_junction_type = junctions[start_vertex].junction_type.name

    # Trace until we hit another terminal node
    current = next_vertex
    previous = start_vertex

    while current not in terminal_nodes or current == start_vertex:
        # Get unvisited neighbors
        neighbors = list(graph.neighbors(current))

        # Remove previous vertex
        if previous in neighbors:
            neighbors.remove(previous)

        # Filter out visited edges
        unvisited_neighbors = []
        for neighbor in neighbors:
            edge = tuple(sorted([current, neighbor]))
            if edge not in visited:
                unvisited_neighbors.append(neighbor)

        if not unvisited_neighbors:
            # Dead end
            break

        if len(unvisited_neighbors) > 1:
            # Hit a junction, stop
            break

        # Continue to next vertex
        next_v = unvisited_neighbors[0]
        edge = tuple(sorted([current, next_v]))
        visited.add(edge)

        path.append(next_v)
        previous = current
        current = next_v

    # Get end junction type
    end_junction_type = None
    if current in junctions:
        end_junction_type = junctions[current].junction_type.name

    return path, start_junction_type, end_junction_type


def compute_overlaps(strokes: List[Stroke], threshold: float = 0.1) -> None:
    """
    Compute overlap relationships between strokes.

    Two strokes overlap if their outlines are close to each other,
    indicating they share a common region (e.g., at a junction).

    Args:
        strokes: List of strokes to analyze
        threshold: Distance threshold for overlap detection

    Modifies strokes in place by setting overlapping_stroke_ids.
    """
    for i, stroke_a in enumerate(strokes):
        for j, stroke_b in enumerate(strokes):
            if i >= j:
                continue

            if compute_overlap(stroke_a, stroke_b, threshold):
                stroke_a.overlapping_stroke_ids.add(stroke_b.id)
                stroke_b.overlapping_stroke_ids.add(stroke_a.id)


def compute_overlap(
    stroke_a: Stroke,
    stroke_b: Stroke,
    threshold: float = 0.1
) -> bool:
    """
    Check if two strokes overlap.

    Strokes overlap if their spine points are close to each other,
    or if their endpoints are within each other's width.

    Args:
        stroke_a: First stroke
        stroke_b: Second stroke
        threshold: Distance threshold (relative to average width)

    Returns:
        True if strokes overlap
    """
    # Compute threshold based on average width
    avg_width_a = np.mean(stroke_a.widths) * 2
    avg_width_b = np.mean(stroke_b.widths) * 2
    dist_threshold = max(avg_width_a, avg_width_b) * threshold

    # Check if endpoints are close
    endpoints_a = [stroke_a.spine[0], stroke_a.spine[-1]]
    endpoints_b = [stroke_b.spine[0], stroke_b.spine[-1]]

    for ep_a in endpoints_a:
        for ep_b in endpoints_b:
            dist = np.linalg.norm(ep_a - ep_b)
            if dist < dist_threshold:
                return True

    # Check if spine points are close
    # Sample points from each stroke
    sample_a = stroke_a.spine[::max(1, len(stroke_a.spine) // 10)]
    sample_b = stroke_b.spine[::max(1, len(stroke_b.spine) // 10)]

    # Compute pairwise distances
    distances = cdist(sample_a, sample_b)
    min_dist = np.min(distances)

    return min_dist < dist_threshold


def build_decomposition(
    glyph_name: str,
    strokes: List[Stroke],
    polygon: np.ndarray
) -> StrokeDecomposition:
    """
    Build final decomposition with coverage metric.

    Args:
        glyph_name: Name of glyph
        strokes: List of recovered strokes
        polygon: Original polygon boundary

    Returns:
        StrokeDecomposition with coverage computed
    """
    coverage = compute_coverage(strokes, polygon)

    return StrokeDecomposition(
        glyph_name=glyph_name,
        strokes=strokes,
        coverage=coverage
    )


def compute_coverage(strokes: List[Stroke], polygon: np.ndarray) -> float:
    """
    Compute what fraction of the glyph is covered by strokes.

    Uses rasterization to compare the area covered by stroke outlines
    to the area of the original polygon.

    Args:
        strokes: List of strokes
        polygon: Original polygon boundary

    Returns:
        Coverage fraction [0, 1]
    """
    if len(strokes) == 0 or len(polygon) == 0:
        return 0.0

    try:
        from skimage import draw
        from scipy.ndimage import binary_fill_holes

        # Determine rasterization size
        poly_min = polygon.min(axis=0)
        poly_max = polygon.max(axis=0)
        extent = poly_max - poly_min

        if np.any(extent == 0):
            return 0.0

        # Use 1000x1000 grid
        grid_size = 1000
        padding = int(grid_size * 0.1)
        scale = (grid_size - 2 * padding) / extent.max()

        # Rasterize original polygon
        poly_scaled = (polygon - poly_min) * scale + padding
        poly_mask = np.zeros((grid_size, grid_size), dtype=bool)

        rr, cc = draw.polygon(poly_scaled[:, 1], poly_scaled[:, 0], shape=poly_mask.shape)
        poly_mask[rr, cc] = True
        poly_mask = binary_fill_holes(poly_mask)

        # Rasterize stroke outlines
        stroke_mask = np.zeros((grid_size, grid_size), dtype=bool)

        for stroke in strokes:
            # Get left and right outlines
            left_outline, right_outline = stroke.to_outline()

            # Scale outlines
            left_scaled = (left_outline - poly_min) * scale + padding
            right_scaled = (right_outline - poly_min) * scale + padding

            # Create closed polygon from outlines
            # left forward + right backward
            outline_poly = np.vstack([left_scaled, right_scaled[::-1]])

            # Rasterize
            rr, cc = draw.polygon(outline_poly[:, 1], outline_poly[:, 0], shape=stroke_mask.shape)
            stroke_mask[rr, cc] = True

        stroke_mask = binary_fill_holes(stroke_mask)

        # Compute coverage
        poly_area = np.sum(poly_mask)
        stroke_area = np.sum(stroke_mask)

        if poly_area == 0:
            return 0.0

        coverage = min(1.0, stroke_area / poly_area)

        return coverage

    except ImportError:
        # Fallback if scikit-image not available
        # Estimate based on stroke lengths and widths
        total_stroke_area = 0.0
        for stroke in strokes:
            # Approximate stroke area as length * mean_width
            length = stroke.length()
            width = stroke.mean_width()
            total_stroke_area += length * width

        # Approximate polygon area
        polygon_area = _compute_polygon_area(polygon)

        if polygon_area == 0:
            return 0.0

        coverage = min(1.0, total_stroke_area / abs(polygon_area))
        return coverage


def _compute_polygon_area(points: np.ndarray) -> float:
    """
    Compute signed area of polygon using shoelace formula.

    Args:
        points: Nx2 array of polygon vertices

    Returns:
        Signed area
    """
    if len(points) < 3:
        return 0.0

    x = points[:, 0]
    y = points[:, 1]

    # Shoelace formula
    area = 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)

    return abs(area)


def refine_stroke_endpoints(
    strokes: List[Stroke],
    junctions: List[Junction],
    polygon: np.ndarray
) -> None:
    """
    Refine stroke endpoints to align with junction positions.

    Adjusts the first and last points of each stroke to match the
    exact positions of junctions, improving visual quality.

    Args:
        strokes: List of strokes to refine
        junctions: List of junctions
        polygon: Polygon boundary

    Modifies strokes in place.
    """
    # Build mapping from vertex IDs to junction positions
    junction_positions = {}
    for junction in junctions:
        junction_positions[junction.vertex_id] = junction.position

    # For each stroke, check if endpoints are near junctions
    for stroke in strokes:
        # Check start point
        start = stroke.spine[0]
        for junction in junctions:
            dist = np.linalg.norm(start - junction.position)
            if dist < stroke.widths[0] * 2:
                # Snap to junction position
                stroke.spine[0] = junction.position
                break

        # Check end point
        end = stroke.spine[-1]
        for junction in junctions:
            dist = np.linalg.norm(end - junction.position)
            if dist < stroke.widths[-1] * 2:
                # Snap to junction position
                stroke.spine[-1] = junction.position
                break


def smooth_stroke_widths(stroke: Stroke, window_size: int = 5) -> None:
    """
    Smooth width profile using moving average.

    Args:
        stroke: Stroke to smooth
        window_size: Size of smoothing window

    Modifies stroke in place.
    """
    if len(stroke.widths) < window_size:
        return

    # Apply moving average
    smoothed = np.convolve(
        stroke.widths,
        np.ones(window_size) / window_size,
        mode='same'
    )

    # Preserve endpoints
    smoothed[0] = stroke.widths[0]
    smoothed[-1] = stroke.widths[-1]

    stroke.widths = smoothed


def resample_stroke(stroke: Stroke, num_points: int) -> Stroke:
    """
    Resample stroke to a fixed number of points.

    Uses linear interpolation along the spine with uniform spacing
    in arc length.

    Args:
        stroke: Stroke to resample
        num_points: Target number of points

    Returns:
        New stroke with resampled spine and widths
    """
    if len(stroke.spine) < 2:
        return stroke

    # Compute cumulative arc length
    diffs = np.diff(stroke.spine, axis=0)
    segment_lengths = np.linalg.norm(diffs, axis=1)
    cumulative_length = np.concatenate([[0], np.cumsum(segment_lengths)])
    total_length = cumulative_length[-1]

    if total_length == 0:
        # Degenerate stroke
        return stroke

    # Sample at uniform arc length intervals
    sample_lengths = np.linspace(0, total_length, num_points)

    # Interpolate positions and widths
    new_spine = []
    new_widths = []

    for target_length in sample_lengths:
        # Find segment containing this arc length
        idx = np.searchsorted(cumulative_length, target_length) - 1
        idx = max(0, min(idx, len(stroke.spine) - 2))

        # Interpolate within segment
        seg_start_length = cumulative_length[idx]
        seg_length = segment_lengths[idx]

        if seg_length > 0:
            t = (target_length - seg_start_length) / seg_length
            t = np.clip(t, 0, 1)
        else:
            t = 0

        # Interpolate position
        pos = (1 - t) * stroke.spine[idx] + t * stroke.spine[idx + 1]
        new_spine.append(pos)

        # Interpolate width
        width = (1 - t) * stroke.widths[idx] + t * stroke.widths[idx + 1]
        new_widths.append(width)

    return Stroke(
        id=stroke.id,
        spine=np.array(new_spine, dtype=np.float64),
        widths=np.array(new_widths, dtype=np.float64),
        start_junction_type=stroke.start_junction_type,
        end_junction_type=stroke.end_junction_type,
        overlapping_stroke_ids=stroke.overlapping_stroke_ids.copy()
    )
