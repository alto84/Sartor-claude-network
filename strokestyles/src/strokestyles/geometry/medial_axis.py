"""Medial axis transform using scikit-image and Voronoi diagrams."""
from dataclasses import dataclass
from enum import Enum, auto
from typing import List, Tuple
import numpy as np
from skimage.morphology import medial_axis as sk_medial_axis
from skimage import draw
import networkx as nx
from scipy import ndimage


class MedialAxisType(Enum):
    """Type of medial axis computation."""
    INTERIOR = auto()  # Inside glyph
    EXTERIOR = auto()  # Outside glyph (for concavities)


@dataclass
class MedialAxisGraph:
    """Medial axis as a graph structure."""
    vertices: np.ndarray  # Nx2 positions
    edges: List[Tuple[int, int]]  # Pairs of vertex indices
    radii: np.ndarray  # Distance to boundary at each vertex
    axis_type: MedialAxisType

    def to_networkx(self) -> nx.Graph:
        """Convert to NetworkX graph."""
        G = nx.Graph()
        for i, (pos, radius) in enumerate(zip(self.vertices, self.radii)):
            G.add_node(i, pos=pos, radius=radius)
        G.add_edges_from(self.edges)
        return G

    def get_endpoints(self) -> List[int]:
        """Get degree-1 vertices (endpoints)."""
        G = self.to_networkx()
        return [node for node, degree in G.degree() if degree == 1]

    def get_junctions(self) -> List[int]:
        """Get degree-3+ vertices (junctions)."""
        G = self.to_networkx()
        return [node for node, degree in G.degree() if degree >= 3]

    def get_branches(self) -> List[List[int]]:
        """Get paths between junctions/endpoints."""
        G = self.to_networkx()
        branch_points = set(self.get_endpoints() + self.get_junctions())

        branches = []
        for start in branch_points:
            for neighbor in G.neighbors(start):
                path = [start, neighbor]
                current = neighbor
                prev = start

                # Follow path until we hit another branch point
                while current not in branch_points:
                    neighbors = list(G.neighbors(current))
                    neighbors.remove(prev)
                    if not neighbors:
                        break
                    prev = current
                    current = neighbors[0]
                    path.append(current)

                # Only add if we haven't seen this branch in reverse
                if path not in branches and path[::-1] not in branches:
                    branches.append(path)

        return branches


def compute_medial_axis(
    polygon_points: np.ndarray,
    image_size: int = 1000,
    axis_type: MedialAxisType = MedialAxisType.INTERIOR,
    prune_threshold: float = 0.0
) -> MedialAxisGraph:
    """
    Compute medial axis using rasterization + scikit-image.

    1. Rasterize polygon to binary image
    2. Compute medial axis with distance transform
    3. Extract skeleton as graph
    4. Optionally prune short branches

    Args:
        polygon_points: Nx2 array of polygon vertices
        image_size: Size of rasterization grid
        axis_type: INTERIOR or EXTERIOR
        prune_threshold: Minimum branch length (0.0 = no pruning)

    Returns:
        MedialAxisGraph with vertices, edges, and radii
    """
    if len(polygon_points) < 3:
        # Degenerate case: return empty graph
        return MedialAxisGraph(
            vertices=np.empty((0, 2)),
            edges=[],
            radii=np.empty(0),
            axis_type=axis_type
        )

    # Normalize polygon to image coordinates
    polygon = polygon_points.copy()
    min_coords = polygon.min(axis=0)
    max_coords = polygon.max(axis=0)
    extent = max_coords - min_coords

    if np.any(extent == 0):
        # Degenerate polygon (line or point)
        return MedialAxisGraph(
            vertices=np.empty((0, 2)),
            edges=[],
            radii=np.empty(0),
            axis_type=axis_type
        )

    # Scale to image size with padding
    padding = int(image_size * 0.1)
    scale = (image_size - 2 * padding) / extent.max()
    polygon_scaled = (polygon - min_coords) * scale + padding

    # Create binary image
    image = np.zeros((image_size, image_size), dtype=bool)
    rr, cc = draw.polygon(polygon_scaled[:, 1], polygon_scaled[:, 0], shape=image.shape)
    image[rr, cc] = True

    if axis_type == MedialAxisType.EXTERIOR:
        # Invert for exterior medial axis
        image = ~image

    # Compute medial axis with distance transform
    skeleton, distance = sk_medial_axis(image, return_distance=True)

    # Convert skeleton to graph
    ma_graph = skeleton_to_graph(skeleton, distance)

    # Transform coordinates back to original space
    ma_graph.vertices = (ma_graph.vertices - padding) / scale + min_coords
    ma_graph.radii = ma_graph.radii / scale
    ma_graph.axis_type = axis_type

    # Prune short branches if requested
    if prune_threshold > 0:
        ma_graph = _prune_branches(ma_graph, prune_threshold)

    return ma_graph


def skeleton_to_graph(skeleton: np.ndarray, distance: np.ndarray) -> MedialAxisGraph:
    """
    Convert skeleton image to graph structure.

    Args:
        skeleton: Binary skeleton image
        distance: Distance transform values

    Returns:
        MedialAxisGraph with vertices and edges extracted from skeleton
    """
    # Find skeleton pixels
    skeleton_coords = np.argwhere(skeleton)

    if len(skeleton_coords) == 0:
        return MedialAxisGraph(
            vertices=np.empty((0, 2)),
            edges=[],
            radii=np.empty(0),
            axis_type=MedialAxisType.INTERIOR
        )

    # Create coordinate to vertex ID mapping
    coord_to_id = {}
    vertices = []
    radii = []

    for i, (y, x) in enumerate(skeleton_coords):
        coord_to_id[(y, x)] = i
        vertices.append([x, y])  # Store as (x, y)
        radii.append(distance[y, x])

    vertices = np.array(vertices, dtype=float)
    radii = np.array(radii, dtype=float)

    # Find edges by checking 8-connectivity
    edges = []
    for y, x in skeleton_coords:
        current_id = coord_to_id[(y, x)]

        # Check 8 neighbors
        for dy in [-1, 0, 1]:
            for dx in [-1, 0, 1]:
                if dy == 0 and dx == 0:
                    continue

                ny, nx = y + dy, x + dx
                if (ny, nx) in coord_to_id:
                    neighbor_id = coord_to_id[(ny, nx)]
                    if current_id < neighbor_id:  # Avoid duplicate edges
                        edges.append((current_id, neighbor_id))

    return MedialAxisGraph(
        vertices=vertices,
        edges=edges,
        radii=radii,
        axis_type=MedialAxisType.INTERIOR
    )


def _prune_branches(graph: MedialAxisGraph, threshold: float) -> MedialAxisGraph:
    """
    Prune short branches from medial axis.

    Args:
        graph: MedialAxisGraph to prune
        threshold: Minimum branch length

    Returns:
        Pruned MedialAxisGraph
    """
    G = graph.to_networkx()

    # Find branches to remove
    changed = True
    while changed:
        changed = False
        endpoints = [node for node, degree in G.degree() if degree == 1]

        for endpoint in endpoints:
            # Measure branch length from endpoint
            neighbors = list(G.neighbors(endpoint))
            if not neighbors:
                G.remove_node(endpoint)
                changed = True
                continue

            length = 0.0
            current = endpoint
            prev = None
            path = [current]

            while True:
                neighbors = list(G.neighbors(current))
                if prev is not None:
                    neighbors.remove(prev)

                if len(neighbors) != 1:
                    break

                next_node = neighbors[0]
                pos1 = G.nodes[current]['pos']
                pos2 = G.nodes[next_node]['pos']
                length += np.linalg.norm(pos2 - pos1)

                prev = current
                current = next_node
                path.append(current)

            # Remove branch if too short
            if length < threshold:
                for node in path[:-1]:  # Keep junction point
                    if node in G:
                        G.remove_node(node)
                changed = True

    # Rebuild graph from NetworkX
    if G.number_of_nodes() == 0:
        return MedialAxisGraph(
            vertices=np.empty((0, 2)),
            edges=[],
            radii=np.empty(0),
            axis_type=graph.axis_type
        )

    # Create new vertex mapping
    node_to_new_id = {node: i for i, node in enumerate(G.nodes())}

    vertices = []
    radii = []
    for node in G.nodes():
        vertices.append(G.nodes[node]['pos'])
        radii.append(G.nodes[node]['radius'])

    edges = [(node_to_new_id[u], node_to_new_id[v]) for u, v in G.edges()]

    return MedialAxisGraph(
        vertices=np.array(vertices),
        edges=edges,
        radii=np.array(radii),
        axis_type=graph.axis_type
    )
