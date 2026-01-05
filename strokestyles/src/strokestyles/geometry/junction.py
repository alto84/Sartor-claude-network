"""Classify medial axis junctions into 7 types per StrokeStyles paper."""
from dataclasses import dataclass
from enum import Enum, auto
from typing import List, Optional, Set, TYPE_CHECKING
import numpy as np
import networkx as nx

if TYPE_CHECKING:
    from .medial_axis import MedialAxisGraph
    from .convexity import CurvatureFeature


class JunctionType(Enum):
    """Seven junction types from the paper."""
    ENDPOINT = auto()       # Stroke terminus (degree 1)
    Y_JUNCTION = auto()     # Two strokes branch from overlap
    T_JUNCTION = auto()     # Stroke perpendicular to another
    L_JUNCTION = auto()     # Corner or elbow bend
    NULL_JUNCTION = auto()  # Discard non-salient branch
    HALF_JUNCTION = auto()  # Stroke crosses another (X-like)
    PROTUBERANCE = auto()   # Compound link (decorative)


@dataclass
class Junction:
    """Classified junction point."""
    vertex_id: int
    position: np.ndarray
    junction_type: JunctionType
    connected_edges: List[int]
    branch_directions: List[float]  # Angles of connected branches
    associated_features: List[int]  # Indices of convexity/concavity features


def classify_junction(
    vertex_id: int,
    graph: nx.Graph,
    polygon: np.ndarray,
    convexities: List,
    concavities: List,
    beta_min: float = 1.5
) -> Junction:
    """
    Classify a medial axis vertex into one of 7 junction types.

    Uses:
    - Vertex degree (1 = endpoint, 3+ = fork)
    - Branch directions and angles
    - Nearby convex/concave features
    - Good continuation metric

    Args:
        vertex_id: Vertex ID in graph
        graph: NetworkX graph of medial axis
        polygon: Polygon outline
        convexities: List of convex features
        concavities: List of concave features
        beta_min: Minimum angle ratio for junction classification (in radians)

    Returns:
        Classified Junction object
    """
    degree = graph.degree(vertex_id)
    position = graph.nodes[vertex_id]['pos']

    # Get connected edges and branch directions
    neighbors = list(graph.neighbors(vertex_id))
    branch_directions = []
    connected_edges = []

    for neighbor in neighbors:
        neighbor_pos = graph.nodes[neighbor]['pos']
        direction = neighbor_pos - position
        angle = np.arctan2(direction[1], direction[0])
        branch_directions.append(angle)

        # Find edge ID (we'll just use neighbor ID as proxy)
        connected_edges.append(neighbor)

    # Find nearby features
    associated_features = _find_nearby_features(
        position, convexities, concavities
    )

    # Classify based on degree
    if degree == 1:
        junction_type = JunctionType.ENDPOINT

    elif degree == 2:
        # Check if it's a smooth continuation or a bend
        angle1, angle2 = branch_directions
        gc = compute_good_continuation(angle1, angle2)

        if gc > 0.8:  # Nearly collinear
            # This is a smooth path point, classify as NULL_JUNCTION
            junction_type = JunctionType.NULL_JUNCTION
        else:
            # Sharp bend
            junction_type = JunctionType.L_JUNCTION

    elif degree == 3:
        # Y, T, or half junction
        angles = sorted(branch_directions)

        # Compute angular separations
        sep1 = _angle_diff(angles[1], angles[0])
        sep2 = _angle_diff(angles[2], angles[1])
        sep3 = _angle_diff(angles[0] + 2*np.pi, angles[2])

        separations = sorted([sep1, sep2, sep3])

        # Check for T-junction: one branch perpendicular to continuation
        # Look for 90-degree configuration
        if any(abs(sep - np.pi/2) < 0.3 for sep in separations):
            # Check if two branches continue each other
            for i in range(3):
                for j in range(i+1, 3):
                    gc = compute_good_continuation(angles[i], angles[j])
                    if gc > 0.8:  # Two branches continue
                        junction_type = JunctionType.T_JUNCTION
                        break
                else:
                    continue
                break
            else:
                # No good continuation, it's a Y-junction
                junction_type = JunctionType.Y_JUNCTION
        else:
            # Check if it's roughly symmetric (Y) or asymmetric
            max_sep = max(separations)
            min_sep = min(separations)

            if max_sep / (min_sep + 0.1) < beta_min:
                # Roughly symmetric
                junction_type = JunctionType.Y_JUNCTION
            else:
                # Asymmetric, could be T
                junction_type = JunctionType.T_JUNCTION

    elif degree == 4:
        # Half-junction (crossing) or protuberance
        angles = sorted(branch_directions)

        # Check for crossing pattern: two pairs of opposite branches
        opposite_pairs = []
        for i in range(4):
            for j in range(i+1, 4):
                gc = compute_good_continuation(angles[i], angles[j])
                if gc > 0.8:
                    opposite_pairs.append((i, j))

        if len(opposite_pairs) >= 2:
            junction_type = JunctionType.HALF_JUNCTION
        else:
            junction_type = JunctionType.PROTUBERANCE

    else:
        # Degree 5+: Protuberance or complex junction
        junction_type = JunctionType.PROTUBERANCE

    return Junction(
        vertex_id=vertex_id,
        position=position,
        junction_type=junction_type,
        connected_edges=connected_edges,
        branch_directions=branch_directions,
        associated_features=associated_features
    )


def compute_good_continuation(angle1: float, angle2: float) -> float:
    """
    Measure how well two directions continue each other.

    Returns 0.0 (perpendicular) to 1.0 (collinear).

    Args:
        angle1: First direction in radians
        angle2: Second direction in radians

    Returns:
        Good continuation score [0, 1]
    """
    # Normalize angles to [-pi, pi]
    angle1 = np.arctan2(np.sin(angle1), np.cos(angle1))
    angle2 = np.arctan2(np.sin(angle2), np.cos(angle2))

    # For good continuation, we want angles to be opposite (differ by pi)
    # Compute difference and check if it's close to pi
    diff = abs(angle1 - angle2)
    diff = min(diff, 2*np.pi - diff)  # Handle wraparound

    # Perfect continuation is when diff = pi
    # Map [0, pi] -> [1, 0] for similarity
    # diff = 0 (same direction) -> 0 (bad continuation)
    # diff = pi (opposite) -> 1 (perfect continuation)
    # diff = pi/2 (perpendicular) -> 0.5

    gc = abs(np.cos(diff))  # cos(0) = 1, cos(pi/2) = 0, cos(pi) = -1

    return abs(gc)  # Take absolute value to get [0, 1]


def classify_all_junctions(
    ma_graph: "MedialAxisGraph",
    polygon: np.ndarray,
    convexities: List,
    concavities: List
) -> List[Junction]:
    """
    Classify all junctions in a medial axis graph.

    Args:
        ma_graph: MedialAxisGraph to analyze
        polygon: Polygon outline
        convexities: List of convex features
        concavities: List of concave features

    Returns:
        List of classified Junction objects
    """
    G = ma_graph.to_networkx()

    junctions = []
    for vertex_id in G.nodes():
        junction = classify_junction(
            vertex_id, G, polygon, convexities, concavities
        )
        junctions.append(junction)

    return junctions


def _find_nearby_features(
    position: np.ndarray,
    convexities: List,
    concavities: List,
    max_distance: float = 50.0
) -> List[int]:
    """
    Find features near a junction point.

    Args:
        position: Junction position
        convexities: List of convex features
        concavities: List of concave features
        max_distance: Maximum distance to consider

    Returns:
        List of feature indices (negative for concavities, positive for convexities)
    """
    nearby = []

    for i, feature in enumerate(convexities):
        dist = np.linalg.norm(feature.position - position)
        if dist < max_distance:
            nearby.append(i)  # Positive index for convexity

    for i, feature in enumerate(concavities):
        dist = np.linalg.norm(feature.position - position)
        if dist < max_distance:
            nearby.append(-i - 1)  # Negative index for concavity

    return nearby


def _angle_diff(a1: float, a2: float) -> float:
    """
    Compute the smallest angle difference between two angles.

    Args:
        a1: First angle in radians
        a2: Second angle in radians

    Returns:
        Smallest difference in [0, pi]
    """
    diff = abs(a1 - a2)
    diff = diff % (2 * np.pi)
    if diff > np.pi:
        diff = 2 * np.pi - diff
    return diff


def get_junction_signature(junction: Junction) -> str:
    """
    Get a string signature describing the junction topology.

    Args:
        junction: Junction to describe

    Returns:
        String like "D3-Y" for degree-3 Y-junction
    """
    degree = len(junction.branch_directions)
    jtype = junction.junction_type.name[0]  # First letter
    return f"D{degree}-{jtype}"


def filter_null_junctions(junctions: List[Junction]) -> List[Junction]:
    """
    Remove NULL_JUNCTION entries (non-salient points).

    Args:
        junctions: List of all junctions

    Returns:
        Filtered list without NULL_JUNCTIONs
    """
    return [j for j in junctions if j.junction_type != JunctionType.NULL_JUNCTION]


def group_junctions_by_type(junctions: List[Junction]) -> dict:
    """
    Group junctions by their type.

    Args:
        junctions: List of junctions

    Returns:
        Dictionary mapping JunctionType to list of junctions
    """
    groups = {jtype: [] for jtype in JunctionType}

    for junction in junctions:
        groups[junction.junction_type].append(junction)

    return groups
