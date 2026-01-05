"""Recover strokes from medial axis and junctions - JUNCTION-AWARE ALGORITHM.

This module implements the StrokeStyles paper's stroke recovery approach:
- Use junction types to determine branch groupings
- Apply good continuation to select path at forks
- Only terminate strokes at true terminals (endpoints + Y-junctions)
- Merge segments based on branch groupings
"""
from typing import List, Set, Tuple, Optional, Dict
import numpy as np
import networkx as nx
from scipy.spatial.distance import cdist

from strokestyles.core.stroke import Stroke, StrokeDecomposition
from strokestyles.geometry.medial_axis import MedialAxisGraph
from strokestyles.geometry.junction import Junction, JunctionType, compute_good_continuation


# =============================================================================
# UNION-FIND DATA STRUCTURE FOR SEGMENT MERGING
# =============================================================================

class UnionFind:
    """Union-Find (Disjoint Set Union) for merging stroke segments."""

    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        """Find with path compression."""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: int, y: int) -> None:
        """Union by rank."""
        px, py = self.find(x), self.find(y)
        if px == py:
            return
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1

    def connected(self, x: int, y: int) -> bool:
        """Check if x and y are in the same set."""
        return self.find(x) == self.find(y)


# =============================================================================
# BRANCH GROUPING COMPUTATION
# =============================================================================

def compute_branch_groupings(
    junction: Junction,
    graph: nx.Graph,
    gc_threshold: float = 0.5
) -> List[Set[int]]:
    """
    Determine which branches at a junction belong to the same stroke.

    ALGORITHM: For degree-3 junctions, check if it's a TRUE T-junction or a corner.

    A TRUE T-junction has:
    - Two diagonal branches going to the same stroke (crossbar)
    - One perpendicular branch going to a DIFFERENT stroke (stem)
    - The stem branch should lead to a significant path (not just a corner)

    A CORNER (all same stroke) has:
    - All branches are part of the same stroke
    - The "stem-like" branch leads to a short path or endpoint

    Args:
        junction: Junction object with type and branch info
        graph: NetworkX graph for accessing positions
        gc_threshold: Good continuation threshold for pairing (default 0.5)

    Returns:
        List of sets, each set contains branch indices that belong to same stroke
    """
    branches = junction.connected_edges  # Neighbor vertex IDs
    directions = junction.branch_directions  # Angles in radians
    n_branches = len(branches)

    if n_branches == 0:
        return []

    if n_branches == 1:
        # Endpoint - single branch is terminal
        return [{0}]

    if n_branches == 2:
        # Degree 2: stroke continues through (corner or bend)
        return [{0, 1}]

    # Compute pairwise good continuation scores
    gc_matrix = np.zeros((n_branches, n_branches))
    for i in range(n_branches):
        for j in range(i + 1, n_branches):
            gc = compute_good_continuation(directions[i], directions[j])
            gc_matrix[i, j] = gc
            gc_matrix[j, i] = gc

    # For degree 3 (potential T-junction or corner):
    if n_branches == 3:
        # Check what each branch leads to: endpoint (degree 1) or junction (degree 3+)
        branch_info = []
        for i, neighbor in enumerate(branches):
            length, dest_degree, steps = _estimate_branch_significance(
                junction.vertex_id, neighbor, graph
            )
            branch_info.append({
                'length': length,
                'dest_degree': dest_degree,
                'steps': steps,
                'to_junction': dest_degree >= 3,
                'to_endpoint': dest_degree == 1
            })

        # Count branches going to junctions vs endpoints
        to_junction = [i for i in range(3) if branch_info[i]['to_junction']]
        to_endpoint = [i for i in range(3) if branch_info[i]['to_endpoint']]

        # TRUE T-junction pattern: one branch to junction, two to endpoints
        # The single junction-going branch is the stem (separate stroke)
        # BUT only if the stem is MUCH longer than the corner branches
        if len(to_junction) == 1 and len(to_endpoint) == 2:
            stem = to_junction[0]
            crossbar = to_endpoint

            # Check step ratio - true T-junction stem is much longer
            stem_steps = branch_info[stem]['steps']
            crossbar_max_steps = max(
                branch_info[crossbar[0]]['steps'],
                branch_info[crossbar[1]]['steps']
            )
            step_ratio = stem_steps / (crossbar_max_steps + 1)

            # Only a TRUE T-junction if stem is 10x+ longer than corners
            if step_ratio > 10:
                # Verify with good continuation: crossbar branches should be
                # diagonal/symmetric around stem
                gc_0_stem = gc_matrix[crossbar[0], stem]
                gc_1_stem = gc_matrix[crossbar[1], stem]
                gc_crossbar = gc_matrix[crossbar[0], crossbar[1]]

                # Check symmetry and geometry
                symmetry = 1.0 - abs(gc_0_stem - gc_1_stem)
                is_perpendicular = gc_crossbar < 0.5

                if symmetry > 0.5 and is_perpendicular:
                    # True T-junction: crossbar together, stem separate
                    return [{crossbar[0], crossbar[1]}, {stem}]

            # Not a true T-junction - all branches are same stroke (corner)
            return [{0, 1, 2}]

        # ALL branches go to junctions - need to use good continuation + path length
        # This handles cases like the middle of a T (junction 845)
        if len(to_junction) == 3:
            # Find pairs with SIMILAR step counts - these are likely same stroke
            # The branch with DIFFERENT step count is likely a different stroke

            steps = [branch_info[i]['steps'] for i in range(3)]

            # Find pairs with similar step counts
            step_ratios = []
            for i in range(3):
                for k in range(i + 1, 3):
                    ratio = min(steps[i], steps[k]) / (max(steps[i], steps[k]) + 1)
                    gc = gc_matrix[i, k]
                    step_ratios.append((ratio, gc, i, k))

            # Sort by step ratio (higher = more similar), then by GC
            step_ratios.sort(key=lambda x: (x[0], x[1]), reverse=True)

            # Take the pair with most similar step counts
            best_ratio, best_gc, i, k = step_ratios[0]

            if best_ratio > 0.5:
                # Found pair with similar step counts - they're likely same stroke
                remaining = set(range(3)) - {i, k}
                remaining_idx = list(remaining)[0]

                # Verify the remaining branch has different step count
                remaining_steps = steps[remaining_idx]
                pair_avg_steps = (steps[i] + steps[k]) / 2
                diff_ratio = remaining_steps / (pair_avg_steps + 1)

                if diff_ratio > 2.0 or diff_ratio < 0.5:
                    # Remaining branch is significantly different - separate stroke
                    return [{i, k}, {remaining_idx}]

            # No clear separation based on step counts - try GC
            best_gc = -1
            best_pair = None
            for i in range(3):
                for k in range(i + 1, 3):
                    if gc_matrix[i, k] > best_gc:
                        best_gc = gc_matrix[i, k]
                        best_pair = (i, k)

            if best_pair and best_gc >= 0.8:
                # High GC pair found - they continue each other
                remaining = set(range(3)) - set(best_pair)
                remaining_idx = list(remaining)[0]
                return [{best_pair[0], best_pair[1]}, {remaining_idx}]

            # No clear separation - all same stroke
            return [{0, 1, 2}]

        # Check if this looks like a corner where all branches are same stroke
        # Strategy: look for symmetric T-pattern with destination analysis
        best_symmetry = -1
        best_stem = None
        best_crossbar = None

        for stem in range(3):
            crossbar = [i for i in range(3) if i != stem]

            gc_0_stem = gc_matrix[crossbar[0], stem]
            gc_1_stem = gc_matrix[crossbar[1], stem]
            symmetry = 1.0 - abs(gc_0_stem - gc_1_stem)

            is_diagonal = (0.3 < gc_0_stem < 0.9) and (0.3 < gc_1_stem < 0.9)
            gc_crossbar = gc_matrix[crossbar[0], crossbar[1]]
            is_perpendicular = gc_crossbar < 0.3

            if is_diagonal and is_perpendicular and symmetry > best_symmetry:
                best_symmetry = symmetry
                best_stem = stem
                best_crossbar = crossbar

        # If we found a symmetric pattern
        if best_symmetry > 0.7 and best_stem is not None:
            # Check destination types
            stem_to_junction = branch_info[best_stem]['to_junction']
            crossbar_to_endpoints = (
                branch_info[best_crossbar[0]]['to_endpoint'] and
                branch_info[best_crossbar[1]]['to_endpoint']
            )

            if stem_to_junction and crossbar_to_endpoints:
                # Also check path length ratio
                # True T-junction stem should be much longer than corner branches
                stem_steps = branch_info[best_stem]['steps']
                crossbar_max_steps = max(
                    branch_info[best_crossbar[0]]['steps'],
                    branch_info[best_crossbar[1]]['steps']
                )
                step_ratio = stem_steps / (crossbar_max_steps + 1)

                if step_ratio > 10:
                    # TRUE T-junction - stem is much longer (ratio > 10)
                    # At real T-junctions, stem is typically 10-15x longer than corners
                    return [{best_crossbar[0], best_crossbar[1]}, {best_stem}]
                else:
                    # Similar lengths - probably a bar-end corner
                    # All branches are part of the same stroke
                    return [{0, 1, 2}]
            else:
                # CORNER - all branches same stroke
                return [{0, 1, 2}]

        # Try collinear pairing
        best_gc = -1
        best_pair = None
        for i in range(3):
            for j in range(i + 1, 3):
                if gc_matrix[i, j] > best_gc:
                    best_gc = gc_matrix[i, j]
                    best_pair = (i, j)

        if best_pair and best_gc >= gc_threshold:
            remaining = set(range(3)) - set(best_pair)
            remaining_idx = list(remaining)[0]

            # Check if remaining branch goes to a junction (separate stroke)
            if branch_info[remaining_idx]['to_junction']:
                # Check if pair branches go to endpoints
                pair_to_endpoints = (
                    branch_info[best_pair[0]]['to_endpoint'] and
                    branch_info[best_pair[1]]['to_endpoint']
                )
                if pair_to_endpoints:
                    # T-junction pattern
                    groups = [{best_pair[0], best_pair[1]}]
                    groups.append({remaining_idx})
                    return groups

            # Otherwise, all branches are likely same stroke
            return [{0, 1, 2}]

        # No clear pattern - check if any branch goes to junction
        if any(branch_info[i]['to_junction'] for i in range(3)):
            # Has at least one connection to another junction
            # This might be a real branching point - keep all separate
            return [{i} for i in range(3)]
        else:
            # All go to endpoints - this is a corner, all same stroke
            return [{0, 1, 2}]

    # For degree 4 (potential crossing):
    if n_branches == 4:
        pairs = []
        used = set()

        all_pairs = []
        for i in range(4):
            for j in range(i + 1, 4):
                all_pairs.append((gc_matrix[i, j], i, j))
        all_pairs.sort(reverse=True)

        for gc, i, j in all_pairs:
            if gc >= gc_threshold and i not in used and j not in used:
                pairs.append({i, j})
                used.add(i)
                used.add(j)
                if len(pairs) == 2:
                    break

        for i in range(4):
            if i not in used:
                pairs.append({i})

        return pairs if pairs else [{i} for i in range(4)]

    # For degree 5+: use greedy pairing
    return _find_best_pairs(gc_matrix, n_branches, gc_threshold)


def _estimate_branch_significance(
    junction_vertex: int,
    neighbor_vertex: int,
    graph: nx.Graph,
    max_depth: int = 1000
) -> Tuple[float, int, int]:
    """
    Estimate the significance of a branch by following it.

    Returns:
        (path_length, destination_degree, step_count)
        - path_length: Euclidean distance along path
        - destination_degree: degree of endpoint (1=endpoint, 3+=junction)
        - step_count: number of edges traversed
    """
    length = 0.0
    current = neighbor_vertex
    prev = junction_vertex
    steps = 0

    for _ in range(max_depth):
        steps += 1

        # Add edge length
        if prev in graph and current in graph:
            pos_prev = graph.nodes[prev]['pos']
            pos_curr = graph.nodes[current]['pos']
            length += np.linalg.norm(pos_curr - pos_prev)

        degree = graph.degree(current)

        if degree == 1 or degree >= 3:
            # Hit endpoint or junction
            return (length, degree, steps)
        else:
            # Continue along path
            neighbors = list(graph.neighbors(current))
            if prev in neighbors:
                neighbors.remove(prev)
            if not neighbors:
                return (length, degree, steps)
            prev = current
            current = neighbors[0]

    return (length, 2, steps)  # Didn't reach terminal


def _find_best_pairs(
    gc_matrix: np.ndarray,
    n_branches: int,
    gc_threshold: float
) -> List[Set[int]]:
    """Greedily find best collinear pairs."""
    pairs = []
    used = set()

    # Get all pairs sorted by GC
    all_pairs = []
    for i in range(n_branches):
        for j in range(i + 1, n_branches):
            all_pairs.append((gc_matrix[i, j], i, j))
    all_pairs.sort(reverse=True)

    # Greedily take best pairs
    for gc, i, j in all_pairs:
        if gc >= gc_threshold and i not in used and j not in used:
            pairs.append({i, j})
            used.add(i)
            used.add(j)

    # Add remaining as singles
    for i in range(n_branches):
        if i not in used:
            pairs.append({i})

    return pairs


# =============================================================================
# BEST CONTINUATION SELECTION
# =============================================================================

def select_best_continuation(
    current_vertex: int,
    incoming_direction: float,
    candidates: List[int],
    graph: nx.Graph
) -> Optional[int]:
    """
    Select the neighbor with best good continuation from incoming direction.

    Args:
        current_vertex: Current vertex ID
        incoming_direction: Direction we came from (radians)
        candidates: List of candidate neighbor vertex IDs
        graph: NetworkX graph

    Returns:
        Best neighbor ID, or None if no good continuation
    """
    if not candidates:
        return None

    if len(candidates) == 1:
        return candidates[0]

    current_pos = graph.nodes[current_vertex]['pos']
    best_gc = -1
    best_neighbor = None

    for neighbor in candidates:
        neighbor_pos = graph.nodes[neighbor]['pos']
        direction = neighbor_pos - current_pos
        outgoing_angle = np.arctan2(direction[1], direction[0])

        # Good continuation: outgoing should be opposite to incoming
        gc = compute_good_continuation(incoming_direction, outgoing_angle)

        if gc > best_gc:
            best_gc = gc
            best_neighbor = neighbor

    return best_neighbor


def get_direction_to(graph: nx.Graph, from_vertex: int, to_vertex: int) -> float:
    """Get direction angle from one vertex to another."""
    pos_from = graph.nodes[from_vertex]['pos']
    pos_to = graph.nodes[to_vertex]['pos']
    direction = pos_to - pos_from
    return np.arctan2(direction[1], direction[0])


# =============================================================================
# SEGMENT TRACING
# =============================================================================

def trace_all_segments(
    graph: nx.Graph,
    junctions: Dict[int, Junction],
    terminal_nodes: Set[int]
) -> List[Tuple[List[int], int, int]]:
    """
    Trace all path segments between terminals/junctions.

    Returns list of (path, start_vertex, end_vertex) tuples.
    A segment goes from one terminal/junction to the next.
    """
    visited_edges = set()
    segments = []

    # Trace from each terminal/junction
    for start_node in terminal_nodes:
        if start_node not in graph:
            continue

        for neighbor in graph.neighbors(start_node):
            edge = tuple(sorted([start_node, neighbor]))
            if edge in visited_edges:
                continue

            # Trace path
            path = [start_node, neighbor]
            visited_edges.add(edge)

            current = neighbor
            previous = start_node

            # Follow until hitting another terminal
            while current not in terminal_nodes:
                neighbors = list(graph.neighbors(current))

                # Remove previous
                if previous in neighbors:
                    neighbors.remove(previous)

                # Filter visited
                unvisited = []
                for n in neighbors:
                    e = tuple(sorted([current, n]))
                    if e not in visited_edges:
                        unvisited.append(n)

                if not unvisited:
                    break

                if len(unvisited) > 1:
                    # Multiple choices at non-terminal - select best continuation
                    incoming_dir = get_direction_to(graph, previous, current)
                    next_v = select_best_continuation(
                        current, incoming_dir, unvisited, graph
                    )
                    if next_v is None:
                        next_v = unvisited[0]
                else:
                    next_v = unvisited[0]

                edge = tuple(sorted([current, next_v]))
                visited_edges.add(edge)
                path.append(next_v)
                previous = current
                current = next_v

            if len(path) >= 2:
                segments.append((path, path[0], path[-1]))

    return segments


# =============================================================================
# SEGMENT MERGING
# =============================================================================

def merge_segments_by_groupings(
    segments: List[Tuple[List[int], int, int]],
    junctions: Dict[int, Junction],
    graph: nx.Graph
) -> List[List[int]]:
    """
    Merge segments based on junction branch groupings.

    Uses Union-Find to determine which segments should be merged.

    Args:
        segments: List of (path, start, end) tuples
        junctions: Mapping from vertex ID to Junction
        graph: NetworkX graph

    Returns:
        List of merged stroke paths
    """
    if not segments:
        return []

    n_segments = len(segments)
    uf = UnionFind(n_segments)

    # Build index: junction_vertex -> [(segment_idx, is_start)]
    # Maps each junction to the segments connected to it
    junction_segments: Dict[int, List[Tuple[int, bool, int]]] = {}

    for seg_idx, (path, start, end) in enumerate(segments):
        if start not in junction_segments:
            junction_segments[start] = []
        # Store segment index, whether this is the start endpoint, and the next vertex
        next_vertex = path[1] if len(path) > 1 else start
        junction_segments[start].append((seg_idx, True, next_vertex))

        if end not in junction_segments:
            junction_segments[end] = []
        # For end, the "next vertex" is the previous vertex in path
        prev_vertex = path[-2] if len(path) > 1 else end
        junction_segments[end].append((seg_idx, False, prev_vertex))

    # For each junction, compute branch groupings and merge segments
    for vertex_id, junction in junctions.items():
        if vertex_id not in junction_segments:
            continue

        connected = junction_segments[vertex_id]
        if len(connected) < 2:
            continue

        # Get branch groupings for this junction
        groupings = compute_branch_groupings(junction, graph)

        # Build mapping: neighbor_vertex -> branch_index
        neighbor_to_branch = {}
        for branch_idx, neighbor in enumerate(junction.connected_edges):
            neighbor_to_branch[neighbor] = branch_idx

        # Map each segment's connection to a branch index
        segment_to_branch: Dict[int, int] = {}
        for seg_idx, is_start, next_vertex in connected:
            if next_vertex in neighbor_to_branch:
                segment_to_branch[seg_idx] = neighbor_to_branch[next_vertex]

        # For each group, union all segments that connect via branches in that group
        for group in groupings:
            # Find segments that connect to branches in this group
            segments_in_group = []
            for seg_idx, branch_idx in segment_to_branch.items():
                if branch_idx in group:
                    segments_in_group.append(seg_idx)

            # Union all segments in this group
            if len(segments_in_group) >= 2:
                first = segments_in_group[0]
                for other in segments_in_group[1:]:
                    uf.union(first, other)

    # Group segments by their root
    groups: Dict[int, List[int]] = {}
    for seg_idx in range(n_segments):
        root = uf.find(seg_idx)
        if root not in groups:
            groups[root] = []
        groups[root].append(seg_idx)

    # Merge paths within each group
    merged_strokes = []
    for group_segments in groups.values():
        if len(group_segments) == 1:
            # Single segment - use as-is
            merged_strokes.append(segments[group_segments[0]][0])
        else:
            # Multiple segments - try to chain them
            merged = _chain_segments(
                [segments[i] for i in group_segments],
                graph
            )
            merged_strokes.extend(merged)

    return merged_strokes


def _chain_segments(
    segments: List[Tuple[List[int], int, int]],
    graph: nx.Graph
) -> List[List[int]]:
    """
    Chain multiple segments into continuous paths where possible.

    Args:
        segments: List of (path, start, end) tuples
        graph: NetworkX graph

    Returns:
        List of chained paths
    """
    if len(segments) == 1:
        return [segments[0][0]]

    # Build adjacency: endpoint -> [(segment_idx, is_start)]
    endpoint_map: Dict[int, List[Tuple[int, bool]]] = {}
    for seg_idx, (path, start, end) in enumerate(segments):
        if start not in endpoint_map:
            endpoint_map[start] = []
        endpoint_map[start].append((seg_idx, True))

        if end not in endpoint_map:
            endpoint_map[end] = []
        endpoint_map[end].append((seg_idx, False))

    # Try to chain segments
    used = set()
    chains = []

    for start_idx, (path, start, end) in enumerate(segments):
        if start_idx in used:
            continue

        used.add(start_idx)
        chain = list(path)

        # Extend forward from end
        current_end = end
        while True:
            if current_end not in endpoint_map:
                break

            # Find connected segment
            next_seg = None
            for seg_idx, is_start in endpoint_map[current_end]:
                if seg_idx not in used:
                    next_seg = (seg_idx, is_start)
                    break

            if next_seg is None:
                break

            seg_idx, is_start = next_seg
            used.add(seg_idx)
            seg_path = segments[seg_idx][0]

            if is_start:
                # Segment starts at current_end - append normally
                chain.extend(seg_path[1:])
                current_end = segments[seg_idx][2]
            else:
                # Segment ends at current_end - append reversed
                chain.extend(seg_path[-2::-1])
                current_end = segments[seg_idx][1]

        # Extend backward from start
        current_start = start
        while True:
            if current_start not in endpoint_map:
                break

            # Find connected segment
            prev_seg = None
            for seg_idx, is_start in endpoint_map[current_start]:
                if seg_idx not in used:
                    prev_seg = (seg_idx, is_start)
                    break

            if prev_seg is None:
                break

            seg_idx, is_start = prev_seg
            used.add(seg_idx)
            seg_path = segments[seg_idx][0]

            if is_start:
                # Segment starts at current_start - prepend reversed
                chain = seg_path[::-1][:-1] + chain
                current_start = segments[seg_idx][2]
            else:
                # Segment ends at current_start - prepend normally
                chain = seg_path[:-1] + chain
                current_start = segments[seg_idx][1]

        chains.append(chain)

    return chains


# =============================================================================
# MAIN JUNCTION-AWARE RECOVERY (SIMPLE ENDPOINT-TO-ENDPOINT)
# =============================================================================

def recover_strokes_junction_aware(
    ma_graph: MedialAxisGraph,
    junctions: List[Junction],
    links: List,
    polygon: np.ndarray
) -> List[Stroke]:
    """
    Simplified stroke recovery: trace endpoint-to-endpoint paths.

    The key insight is that strokes connect endpoints of the medial axis.
    At junctions (degree 3+), use good continuation to decide which
    endpoint-to-endpoint path to follow.

    This is a simpler approach that groups all edges into maximal paths,
    then merges paths that share junctions based on good continuation.

    Args:
        ma_graph: MedialAxisGraph with vertices, edges, and radii
        junctions: List of classified junctions
        links: List of concavity links (used for overlap detection)
        polygon: Original polygon boundary

    Returns:
        List of recovered Stroke objects
    """
    if ma_graph.vertices.shape[0] == 0:
        return []

    # Build NetworkX graph
    G = ma_graph.to_networkx()

    if G.number_of_nodes() == 0:
        return []

    # Create junction lookup by vertex ID
    vertex_to_junction: Dict[int, Junction] = {}
    for junction in junctions:
        vertex_to_junction[junction.vertex_id] = junction

    # Find all endpoints (degree 1)
    endpoints = [n for n in G.nodes() if G.degree(n) == 1]

    # If no endpoints (closed loop), pick arbitrary start
    if len(endpoints) == 0:
        endpoints = list(G.nodes())[:1]

    # Simple approach: trace paths from endpoints through junctions
    # A stroke goes from endpoint to endpoint, choosing best continuation at junctions
    visited_edges: Set[Tuple[int, int]] = set()
    stroke_paths: List[List[int]] = []

    for start_node in endpoints:
        for neighbor in G.neighbors(start_node):
            edge = tuple(sorted([start_node, neighbor]))
            if edge in visited_edges:
                continue

            # Trace path to next endpoint
            path = _trace_to_endpoint(G, start_node, neighbor, visited_edges)

            if len(path) >= 2:
                stroke_paths.append(path)

    # Handle remaining unvisited edges (closed loops or disconnected parts)
    for u, v in G.edges():
        edge = tuple(sorted([u, v]))
        if edge not in visited_edges:
            path = _trace_to_endpoint(G, u, v, visited_edges)
            if len(path) >= 2:
                stroke_paths.append(path)

    # POST-PROCESSING: Merge short strokes into longer ones
    # Strokes that share an endpoint with good continuation should be merged
    stroke_paths = _merge_collinear_strokes(stroke_paths, G)

    # Convert to Stroke objects
    strokes = []
    for stroke_id, path in enumerate(stroke_paths):
        if len(path) < 2:
            continue

        # Extract spine points and widths
        spine_points = []
        widths = []

        for vertex_id in path:
            if vertex_id in G:
                pos = G.nodes[vertex_id]['pos']
                radius = G.nodes[vertex_id]['radius']
                spine_points.append(pos)
                widths.append(radius)

        if len(spine_points) < 2:
            continue

        spine = np.array(spine_points, dtype=np.float64)
        widths_array = np.array(widths, dtype=np.float64)

        # Determine junction types at endpoints
        start_junction_type = None
        end_junction_type = None

        start_v = path[0]
        end_v = path[-1]

        if start_v in vertex_to_junction:
            start_junction_type = vertex_to_junction[start_v].junction_type.name

        if end_v in vertex_to_junction:
            end_junction_type = vertex_to_junction[end_v].junction_type.name

        stroke = Stroke(
            id=stroke_id,
            spine=spine,
            widths=widths_array,
            start_junction_type=start_junction_type,
            end_junction_type=end_junction_type,
            overlapping_stroke_ids=set()
        )

        strokes.append(stroke)

    # Compute overlaps
    compute_overlaps(strokes, threshold=0.1)

    return strokes


def _merge_collinear_strokes(
    stroke_paths: List[List[int]],
    G: nx.Graph,
    gc_threshold: float = 0.6
) -> List[List[int]]:
    """
    Merge strokes that share endpoints and have good continuation.

    This post-processing step reduces over-segmentation by joining
    short stroke segments that are collinear.
    """
    if len(stroke_paths) <= 1:
        return stroke_paths

    # Build endpoint index: endpoint_vertex -> [(path_idx, is_start)]
    endpoint_map: Dict[int, List[Tuple[int, bool]]] = {}
    for path_idx, path in enumerate(stroke_paths):
        start, end = path[0], path[-1]
        if start not in endpoint_map:
            endpoint_map[start] = []
        endpoint_map[start].append((path_idx, True))

        if end not in endpoint_map:
            endpoint_map[end] = []
        endpoint_map[end].append((path_idx, False))

    # Find paths to merge using Union-Find
    n = len(stroke_paths)
    uf = UnionFind(n)

    # For each shared endpoint, check if paths should be merged
    for vertex, connections in endpoint_map.items():
        if len(connections) < 2:
            continue

        # Check pairs of paths meeting at this vertex
        for i in range(len(connections)):
            for j in range(i + 1, len(connections)):
                path_idx_a, is_start_a = connections[i]
                path_idx_b, is_start_b = connections[j]

                if uf.connected(path_idx_a, path_idx_b):
                    continue

                path_a = stroke_paths[path_idx_a]
                path_b = stroke_paths[path_idx_b]

                # Get directions at the shared endpoint
                if is_start_a:
                    # Path A starts at vertex, direction is from path_a[1] to path_a[0]
                    if len(path_a) >= 2:
                        dir_a = get_direction_to(G, path_a[1], path_a[0])
                    else:
                        continue
                else:
                    # Path A ends at vertex, direction is from path_a[-2] to path_a[-1]
                    if len(path_a) >= 2:
                        dir_a = get_direction_to(G, path_a[-2], path_a[-1])
                    else:
                        continue

                if is_start_b:
                    # Path B starts at vertex, outgoing direction
                    if len(path_b) >= 2:
                        dir_b = get_direction_to(G, path_b[0], path_b[1])
                    else:
                        continue
                else:
                    # Path B ends at vertex, we want the direction ALONG the stroke
                    # from the endpoint backward, so reversed
                    if len(path_b) >= 2:
                        dir_b = get_direction_to(G, path_b[-1], path_b[-2])
                    else:
                        continue

                # Compute good continuation between the two paths
                gc = compute_good_continuation(dir_a, dir_b)

                if gc >= gc_threshold:
                    # Merge these paths
                    uf.union(path_idx_a, path_idx_b)

    # Group paths by their union-find root
    groups: Dict[int, List[int]] = {}
    for path_idx in range(n):
        root = uf.find(path_idx)
        if root not in groups:
            groups[root] = []
        groups[root].append(path_idx)

    # Merge paths within each group
    merged_paths = []
    for group_indices in groups.values():
        if len(group_indices) == 1:
            merged_paths.append(stroke_paths[group_indices[0]])
        else:
            # Chain the paths together
            group_paths = [stroke_paths[i] for i in group_indices]
            chained = _chain_path_list(group_paths)
            merged_paths.extend(chained)

    return merged_paths


def _chain_path_list(paths: List[List[int]]) -> List[List[int]]:
    """
    Chain multiple paths into continuous sequences where possible.
    """
    if len(paths) == 1:
        return paths

    # Build endpoint adjacency
    endpoint_map: Dict[int, List[Tuple[int, bool]]] = {}
    for path_idx, path in enumerate(paths):
        start, end = path[0], path[-1]
        if start not in endpoint_map:
            endpoint_map[start] = []
        endpoint_map[start].append((path_idx, True))
        if end not in endpoint_map:
            endpoint_map[end] = []
        endpoint_map[end].append((path_idx, False))

    # Chain paths
    used = set()
    chains = []

    for start_idx, path in enumerate(paths):
        if start_idx in used:
            continue

        used.add(start_idx)
        chain = list(path)

        # Extend forward from end
        current_end = path[-1]
        while current_end in endpoint_map:
            next_conn = None
            for path_idx, is_start in endpoint_map[current_end]:
                if path_idx not in used:
                    next_conn = (path_idx, is_start)
                    break
            if not next_conn:
                break

            path_idx, is_start = next_conn
            used.add(path_idx)
            next_path = paths[path_idx]

            if is_start:
                # Next path starts here - append forward
                chain.extend(next_path[1:])
                current_end = next_path[-1]
            else:
                # Next path ends here - append reversed
                chain.extend(next_path[-2::-1])
                current_end = next_path[0]

        # Extend backward from start
        current_start = path[0]
        while current_start in endpoint_map:
            prev_conn = None
            for path_idx, is_start in endpoint_map[current_start]:
                if path_idx not in used:
                    prev_conn = (path_idx, is_start)
                    break
            if not prev_conn:
                break

            path_idx, is_start = prev_conn
            used.add(path_idx)
            prev_path = paths[path_idx]

            if is_start:
                # Path starts here - prepend reversed
                chain = prev_path[::-1][:-1] + chain
                current_start = prev_path[-1]
            else:
                # Path ends here - prepend forward
                chain = prev_path[:-1] + chain
                current_start = prev_path[0]

        chains.append(chain)

    return chains


def _trace_to_endpoint(
    G: nx.Graph,
    start: int,
    first_neighbor: int,
    visited_edges: Set[Tuple[int, int]]
) -> List[int]:
    """
    Trace from start through first_neighbor until reaching an endpoint (degree 1).

    At junctions (degree 3+), uses good continuation to pick the best path.
    Always continues through degree-2 nodes.

    This creates endpoint-to-endpoint paths that form complete strokes.
    """
    path = [start, first_neighbor]

    # Mark first edge visited
    edge = tuple(sorted([start, first_neighbor]))
    visited_edges.add(edge)

    current = first_neighbor
    previous = start

    max_iterations = 10000  # Safety limit

    for _ in range(max_iterations):
        degree = G.degree(current)

        # Check if we reached an endpoint
        if degree == 1:
            # Endpoint - stop here
            break

        # Get available neighbors (not the one we came from)
        neighbors = list(G.neighbors(current))
        if previous in neighbors:
            neighbors.remove(previous)

        # Filter out already visited edges
        unvisited_neighbors = []
        for n in neighbors:
            e = tuple(sorted([current, n]))
            if e not in visited_edges:
                unvisited_neighbors.append(n)

        if not unvisited_neighbors:
            # Dead end or all visited - stop here
            break

        if len(unvisited_neighbors) == 1:
            # Only one way forward - continue
            next_node = unvisited_neighbors[0]
        else:
            # Junction with multiple options - use good continuation
            incoming_dir = get_direction_to(G, previous, current)
            best_gc = -1
            best_neighbor = None

            for neighbor in unvisited_neighbors:
                neighbor_pos = G.nodes[neighbor]['pos']
                current_pos = G.nodes[current]['pos']
                direction = neighbor_pos - current_pos
                outgoing_angle = np.arctan2(direction[1], direction[0])
                gc = compute_good_continuation(incoming_dir, outgoing_angle)

                if gc > best_gc:
                    best_gc = gc
                    best_neighbor = neighbor

            next_node = best_neighbor

        # Mark edge as visited and continue
        edge = tuple(sorted([current, next_node]))
        visited_edges.add(edge)
        path.append(next_node)
        previous = current
        current = next_node

    return path


# =============================================================================
# LEGACY RECOVER_STROKES (calls junction-aware version)
# =============================================================================

def recover_strokes(
    ma_graph: MedialAxisGraph,
    junctions: List[Junction],
    links: List,
    polygon: np.ndarray
) -> List[Stroke]:
    """
    Main stroke recovery algorithm - now uses junction-aware approach.

    This is a wrapper that calls the junction-aware implementation.

    Args:
        ma_graph: MedialAxisGraph with vertices, edges, and radii
        junctions: List of classified junctions
        links: List of concavity links
        polygon: Original polygon boundary

    Returns:
        List of recovered Stroke objects
    """
    return recover_strokes_junction_aware(ma_graph, junctions, links, polygon)


# =============================================================================
# OVERLAP COMPUTATION
# =============================================================================

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


# =============================================================================
# DECOMPOSITION BUILDING
# =============================================================================

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


# =============================================================================
# STROKE REFINEMENT UTILITIES
# =============================================================================

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
