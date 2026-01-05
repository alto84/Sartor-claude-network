"""Detect convex and concave regions on polygon outline."""
from dataclasses import dataclass
from typing import List, Tuple
import numpy as np


@dataclass
class CurvatureFeature:
    """A convex or concave feature on the outline."""
    index: int  # Index in polygon
    position: np.ndarray  # (x, y)
    curvature: float  # Positive = convex, negative = concave
    is_convex: bool
    extent: Tuple[int, int]  # Start/end indices of feature region


def compute_curvature(polygon: np.ndarray, window: int = 5) -> np.ndarray:
    """
    Compute discrete curvature at each vertex using Menger curvature.

    k = 4 * area(triangle) / (a * b * c)
    Sign from cross product (positive = convex, negative = concave)

    Args:
        polygon: Nx2 array of polygon vertices
        window: Number of vertices before/after to use for curvature

    Returns:
        Array of curvature values (positive = convex, negative = concave)
    """
    n = len(polygon)
    if n < 3:
        return np.zeros(n)

    curvature = np.zeros(n)

    for i in range(n):
        # Get points before and after current point
        i_prev = (i - window) % n
        i_next = (i + window) % n

        p_prev = polygon[i_prev]
        p_curr = polygon[i]
        p_next = polygon[i_next]

        # Compute Menger curvature
        # Area of triangle using cross product
        v1 = p_curr - p_prev
        v2 = p_next - p_curr
        cross = v1[0] * v2[1] - v1[1] * v2[0]
        area = abs(cross) / 2.0

        # Side lengths
        a = np.linalg.norm(p_curr - p_prev)
        b = np.linalg.norm(p_next - p_curr)
        c = np.linalg.norm(p_next - p_prev)

        # Avoid division by zero
        if a * b * c < 1e-10:
            curvature[i] = 0.0
            continue

        # Menger curvature
        k = 4 * area / (a * b * c)

        # Sign from cross product (positive = left turn = convex)
        curvature[i] = k if cross > 0 else -k

    return curvature


def detect_features(
    polygon: np.ndarray,
    curvature_threshold: float = 0.01
) -> Tuple[List[CurvatureFeature], List[CurvatureFeature]]:
    """
    Detect convex and concave features.

    Args:
        polygon: Nx2 array of polygon vertices
        curvature_threshold: Minimum absolute curvature to be considered a feature

    Returns:
        (convexities, concavities) - Lists of CurvatureFeature objects
    """
    curvature = compute_curvature(polygon)
    n = len(polygon)

    convexities = []
    concavities = []

    # Find local extrema
    for i in range(n):
        k = curvature[i]

        if abs(k) < curvature_threshold:
            continue

        # Check if local extremum
        i_prev = (i - 1) % n
        i_next = (i + 1) % n

        k_prev = curvature[i_prev]
        k_next = curvature[i_next]

        is_local_max = k > k_prev and k > k_next
        is_local_min = k < k_prev and k < k_next

        if not (is_local_max or is_local_min):
            continue

        # Find extent of feature region
        extent_start = i
        extent_end = i

        # Expand backward while same sign
        j = i_prev
        while abs(curvature[j]) >= curvature_threshold and np.sign(curvature[j]) == np.sign(k):
            extent_start = j
            j = (j - 1) % n
            if j == i:  # Wrapped around
                break

        # Expand forward while same sign
        j = i_next
        while abs(curvature[j]) >= curvature_threshold and np.sign(curvature[j]) == np.sign(k):
            extent_end = j
            j = (j + 1) % n
            if j == i:  # Wrapped around
                break

        feature = CurvatureFeature(
            index=i,
            position=polygon[i].copy(),
            curvature=k,
            is_convex=k > 0,
            extent=(extent_start, extent_end)
        )

        if k > 0:
            convexities.append(feature)
        else:
            concavities.append(feature)

    return convexities, concavities


def find_salient_concavities(
    concavities: List[CurvatureFeature],
    min_curvature: float = 0.05
) -> List[CurvatureFeature]:
    """
    Filter to most salient concavities for stroke boundary detection.

    Args:
        concavities: List of all detected concavities
        min_curvature: Minimum absolute curvature for saliency

    Returns:
        Filtered list of salient concavities
    """
    # Filter by minimum curvature
    salient = [c for c in concavities if abs(c.curvature) >= min_curvature]

    # Sort by curvature magnitude
    salient.sort(key=lambda c: abs(c.curvature), reverse=True)

    return salient


def get_feature_normal(polygon: np.ndarray, feature: CurvatureFeature) -> np.ndarray:
    """
    Compute the inward normal direction at a feature point.

    Args:
        polygon: Nx2 array of polygon vertices
        feature: CurvatureFeature to compute normal for

    Returns:
        Unit normal vector pointing inward
    """
    n = len(polygon)
    i = feature.index
    i_prev = (i - 1) % n
    i_next = (i + 1) % n

    # Tangent vector
    tangent = polygon[i_next] - polygon[i_prev]
    tangent = tangent / (np.linalg.norm(tangent) + 1e-10)

    # Normal vector (rotate tangent by 90 degrees)
    normal = np.array([-tangent[1], tangent[0]])

    # For concavities, normal should point inward
    # For convexities, normal should point outward
    # Determine correct direction using cross product
    v1 = polygon[i] - polygon[i_prev]
    v2 = polygon[i_next] - polygon[i]
    cross = v1[0] * v2[1] - v1[1] * v2[0]

    if cross < 0:  # Concave (right turn)
        # Normal already points inward
        pass
    else:  # Convex (left turn)
        # Flip normal to point outward
        normal = -normal

    return normal


def compute_feature_depth(polygon: np.ndarray, feature: CurvatureFeature) -> float:
    """
    Compute the depth of a concavity.

    Depth is measured as the perpendicular distance from the feature point
    to the line connecting the extent endpoints.

    Args:
        polygon: Nx2 array of polygon vertices
        feature: CurvatureFeature to measure

    Returns:
        Depth value (0 if extent is invalid)
    """
    if feature.extent[0] == feature.extent[1]:
        return 0.0

    # Get endpoints of extent
    p1 = polygon[feature.extent[0]]
    p2 = polygon[feature.extent[1]]

    # Get feature point
    p = feature.position

    # Compute perpendicular distance to line p1-p2
    line_vec = p2 - p1
    line_len = np.linalg.norm(line_vec)

    if line_len < 1e-10:
        return 0.0

    # Project point onto line
    t = np.dot(p - p1, line_vec) / (line_len ** 2)
    t = np.clip(t, 0, 1)
    projection = p1 + t * line_vec

    # Distance from point to projection
    depth = np.linalg.norm(p - projection)

    return depth
