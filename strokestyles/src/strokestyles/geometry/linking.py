"""Link opposing concavities to identify stroke boundaries."""
from dataclasses import dataclass
from typing import List, Tuple, Optional, TYPE_CHECKING
import numpy as np
import networkx as nx
from shapely.geometry import LineString, Polygon as ShapelyPolygon
from shapely.geometry import Point

if TYPE_CHECKING:
    from .convexity import CurvatureFeature
    from .junction import Junction


@dataclass
class ConcavityLink:
    """A link between two concavities."""
    concavity_a: int  # Index of first concavity
    concavity_b: int  # Index of second concavity
    midpoint: np.ndarray
    length: float
    good_continuation: float  # How aligned the concavities are
    is_valid: bool  # Does link stay inside polygon?


def find_links(
    polygon: np.ndarray,
    concavities: List,
    max_distance: Optional[float] = None
) -> List[ConcavityLink]:
    """
    Find valid links between opposing concavities.

    A link is valid if:
    1. The line segment stays inside the polygon
    2. The concavities face each other (dot product check)
    3. Distance is reasonable

    Args:
        polygon: Nx2 array of polygon vertices
        concavities: List of CurvatureFeature objects (concavities)
        max_distance: Maximum link distance (None = auto from polygon size)

    Returns:
        List of valid ConcavityLink objects
    """
    if len(concavities) < 2:
        return []

    # Auto-compute max distance if not provided
    if max_distance is None:
        extent = polygon.max(axis=0) - polygon.min(axis=0)
        max_distance = extent.max() * 0.5

    # Create Shapely polygon for containment checks
    poly_shape = ShapelyPolygon(polygon)

    links = []

    # Try all pairs of concavities
    for i in range(len(concavities)):
        for j in range(i + 1, len(concavities)):
            conc_a = concavities[i]
            conc_b = concavities[j]

            # Compute distance
            dist = np.linalg.norm(conc_a.position - conc_b.position)
            if dist > max_distance:
                continue

            # Check if concavities face each other
            # Get normals at each concavity
            normal_a = _get_concavity_normal(polygon, conc_a)
            normal_b = _get_concavity_normal(polygon, conc_b)

            # Direction from a to b
            direction_ab = conc_b.position - conc_a.position
            direction_ab = direction_ab / (np.linalg.norm(direction_ab) + 1e-10)

            # Check if normal_a points toward b and normal_b points toward a
            dot_a = np.dot(normal_a, direction_ab)
            dot_b = np.dot(normal_b, -direction_ab)

            if dot_a < 0.3 or dot_b < 0.3:
                # Not facing each other
                continue

            # Check if link stays inside polygon
            line = LineString([conc_a.position, conc_b.position])
            is_valid = poly_shape.contains(line) or poly_shape.covers(line)

            # Compute midpoint
            midpoint = (conc_a.position + conc_b.position) / 2

            # Compute good continuation (how parallel are the normals?)
            gc = abs(np.dot(normal_a, -normal_b))  # Opposite normals = high score

            link = ConcavityLink(
                concavity_a=i,
                concavity_b=j,
                midpoint=midpoint,
                length=dist,
                good_continuation=gc,
                is_valid=is_valid
            )

            links.append(link)

    return links


def filter_crossing_links(
    links: List[ConcavityLink],
    threshold: float = 0.4
) -> List[ConcavityLink]:
    """
    Filter links for half-junctions (crossing strokes).

    High good-continuation between link endpoints indicates crossing.

    Args:
        links: List of all links
        threshold: Minimum good-continuation to be considered crossing

    Returns:
        Filtered list of crossing links
    """
    crossing_links = []

    for link in links:
        if link.good_continuation >= threshold and link.is_valid:
            crossing_links.append(link)

    return crossing_links


def build_link_graph(
    links: List[ConcavityLink],
    junctions: List
) -> nx.Graph:
    """
    Build graph of concavities connected by links.

    Nodes represent concavities, edges represent links.

    Args:
        links: List of ConcavityLink objects
        junctions: List of Junction objects (for context)

    Returns:
        NetworkX graph
    """
    G = nx.Graph()

    # Add nodes for each unique concavity
    concavity_ids = set()
    for link in links:
        concavity_ids.add(link.concavity_a)
        concavity_ids.add(link.concavity_b)

    for conc_id in concavity_ids:
        G.add_node(conc_id)

    # Add edges for links
    for i, link in enumerate(links):
        if link.is_valid:
            G.add_edge(
                link.concavity_a,
                link.concavity_b,
                link_id=i,
                length=link.length,
                gc=link.good_continuation
            )

    return G


def find_stroke_boundaries(
    polygon: np.ndarray,
    concavities: List,
    links: List[ConcavityLink]
) -> List[List[int]]:
    """
    Identify stroke boundaries from concavity links.

    A stroke boundary is a chain of links that forms a path
    across the glyph, dividing it into strokes.

    Args:
        polygon: Nx2 array of polygon vertices
        concavities: List of concavities
        links: List of valid links

    Returns:
        List of stroke boundaries (each is a list of link indices)
    """
    # Build link graph
    G = build_link_graph(links, [])

    # Find connected components
    boundaries = []

    for component in nx.connected_components(G):
        if len(component) < 2:
            continue

        # Find path through component
        component_nodes = list(component)

        # Get subgraph
        subgraph = G.subgraph(component_nodes)

        # Find longest path (approximation: use endpoints)
        endpoints = [n for n in subgraph.nodes() if subgraph.degree(n) == 1]

        if len(endpoints) >= 2:
            # Find path between first two endpoints
            path = nx.shortest_path(subgraph, endpoints[0], endpoints[1])

            # Convert to link indices
            link_path = []
            for i in range(len(path) - 1):
                edge_data = G.get_edge_data(path[i], path[i+1])
                if edge_data and 'link_id' in edge_data:
                    link_path.append(edge_data['link_id'])

            if link_path:
                boundaries.append(link_path)

    return boundaries


def _get_concavity_normal(polygon: np.ndarray, concavity) -> np.ndarray:
    """
    Get the inward-pointing normal at a concavity.

    Args:
        polygon: Polygon vertices
        concavity: CurvatureFeature (concavity)

    Returns:
        Unit normal vector pointing inward
    """
    n = len(polygon)
    i = concavity.index
    i_prev = (i - 1) % n
    i_next = (i + 1) % n

    # Tangent vector
    tangent = polygon[i_next] - polygon[i_prev]
    tangent = tangent / (np.linalg.norm(tangent) + 1e-10)

    # Normal vector (rotate tangent by 90 degrees)
    # For a concavity, we want the normal pointing inward
    normal = np.array([-tangent[1], tangent[0]])

    # Verify direction: for concavity, normal should point inward
    # Use cross product to determine if we need to flip
    v1 = polygon[i] - polygon[i_prev]
    v2 = polygon[i_next] - polygon[i]
    cross = v1[0] * v2[1] - v1[1] * v2[0]

    if cross > 0:  # Left turn (convex)
        normal = -normal

    return normal


def compute_link_quality(
    link: ConcavityLink,
    polygon: np.ndarray,
    concavities: List
) -> float:
    """
    Compute a quality score for a link.

    Higher score = more likely to be a true stroke boundary.

    Args:
        link: ConcavityLink to evaluate
        polygon: Polygon vertices
        concavities: List of concavities

    Returns:
        Quality score [0, 1]
    """
    # Factors:
    # 1. Good continuation (already computed)
    # 2. Validity (inside polygon)
    # 3. Relative length (shorter is better)
    # 4. Depth of concavities (deeper is better)

    score = 0.0

    # Good continuation (weight: 0.4)
    score += 0.4 * link.good_continuation

    # Validity (weight: 0.3)
    if link.is_valid:
        score += 0.3

    # Relative length (weight: 0.15)
    extent = polygon.max(axis=0) - polygon.min(axis=0)
    max_extent = extent.max()
    relative_length = link.length / (max_extent + 1e-10)
    length_score = max(0, 1.0 - relative_length)  # Shorter is better
    score += 0.15 * length_score

    # Concavity depth (weight: 0.15)
    # Would need depth information from concavities
    # For now, use curvature magnitude as proxy
    conc_a = concavities[link.concavity_a]
    conc_b = concavities[link.concavity_b]
    avg_curvature = (abs(conc_a.curvature) + abs(conc_b.curvature)) / 2
    depth_score = min(1.0, avg_curvature / 0.1)  # Normalize to [0, 1]
    score += 0.15 * depth_score

    return score


def rank_links_by_quality(
    links: List[ConcavityLink],
    polygon: np.ndarray,
    concavities: List
) -> List[Tuple[int, float]]:
    """
    Rank links by quality score.

    Args:
        links: List of links
        polygon: Polygon vertices
        concavities: List of concavities

    Returns:
        List of (link_index, quality_score) sorted by quality (descending)
    """
    ranked = []

    for i, link in enumerate(links):
        quality = compute_link_quality(link, polygon, concavities)
        ranked.append((i, quality))

    ranked.sort(key=lambda x: x[1], reverse=True)

    return ranked


def visualize_links(
    polygon: np.ndarray,
    concavities: List,
    links: List[ConcavityLink],
    max_links: int = 10
) -> dict:
    """
    Prepare link data for visualization.

    Args:
        polygon: Polygon vertices
        concavities: List of concavities
        links: List of links
        max_links: Maximum number of links to include

    Returns:
        Dictionary with visualization data
    """
    # Rank links
    ranked = rank_links_by_quality(links, polygon, concavities)

    viz_data = {
        'polygon': polygon.tolist(),
        'concavities': [
            {
                'position': c.position.tolist(),
                'curvature': float(c.curvature)
            }
            for c in concavities
        ],
        'links': []
    }

    for i, quality in ranked[:max_links]:
        link = links[i]
        viz_data['links'].append({
            'start': concavities[link.concavity_a].position.tolist(),
            'end': concavities[link.concavity_b].position.tolist(),
            'quality': float(quality),
            'valid': link.is_valid
        })

    return viz_data
