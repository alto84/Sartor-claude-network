"""Flatten Bezier contours to polygons for processing."""
from typing import List, Optional
import numpy as np

from strokestyles.core.glyph import Glyph, Point
from strokestyles.core.contour import Contour, BezierSegment
from strokestyles.core.polygon import Polygon


def flatten_glyph(glyph: Glyph, tolerance: float = 0.5) -> Polygon:
    """
    Flatten all contours in a glyph to a polygon with holes.

    The first contour is assumed to be the exterior boundary, and the rest
    are holes. This follows the TrueType/OpenType convention where clockwise
    contours are exterior and counter-clockwise are holes.

    Args:
        glyph: Glyph to flatten
        tolerance: Maximum distance from Bezier curve to flattened line

    Returns:
        Polygon with exterior and holes

    Raises:
        ValueError: If glyph is empty or has invalid contours
    """
    if glyph.is_empty():
        # Return empty polygon
        return Polygon(exterior=np.empty((0, 2), dtype=np.float64), holes=[])

    # Flatten each contour
    flattened_contours = []
    for contour in glyph.contours:
        points = flatten_contour(contour, tolerance)
        if len(points) >= 3:  # Valid polygon needs at least 3 points
            flattened_contours.append(points)

    if not flattened_contours:
        return Polygon(exterior=np.empty((0, 2), dtype=np.float64), holes=[])

    # Separate exterior and holes based on winding direction
    exterior_contours = []
    hole_contours = []

    for i, contour in enumerate(glyph.contours):
        if i < len(flattened_contours):
            points = flattened_contours[i]
            if contour.is_clockwise:
                exterior_contours.append(points)
            else:
                hole_contours.append(points)

    # Use the largest exterior contour as the main exterior
    if exterior_contours:
        # Find largest by area
        largest_idx = 0
        largest_area = 0.0

        for i, points in enumerate(exterior_contours):
            area = abs(_compute_polygon_area(points))
            if area > largest_area:
                largest_area = area
                largest_idx = i

        exterior = exterior_contours[largest_idx]

        # Add other exterior contours as additional "holes" (inverted islands)
        holes = hole_contours + [c for i, c in enumerate(exterior_contours) if i != largest_idx]
    else:
        # No clockwise contours, use first contour as exterior
        exterior = flattened_contours[0] if flattened_contours else np.empty((0, 2))
        holes = flattened_contours[1:] if len(flattened_contours) > 1 else []

    return Polygon(exterior=exterior, holes=holes)


def flatten_contour(contour: Contour, tolerance: float = 0.5) -> np.ndarray:
    """
    Flatten a contour to a polygon (Nx2 array).

    Uses adaptive subdivision based on curve flatness. Each Bezier segment
    is recursively subdivided until it's flat enough to be approximated by
    a line segment.

    Args:
        contour: Contour to flatten
        tolerance: Maximum distance from curve to line segment

    Returns:
        Nx2 array of polygon vertices
    """
    if not contour.segments:
        return np.empty((0, 2), dtype=np.float64)

    all_points = []

    for segment in contour.segments:
        # Flatten the segment
        segment_points = flatten_bezier_segment(segment, tolerance)

        # Add points (excluding last to avoid duplicates)
        all_points.extend(segment_points[:-1] if len(segment_points) > 1 else segment_points)

    if not all_points:
        return np.empty((0, 2), dtype=np.float64)

    # Convert to numpy array
    points_array = np.array([[p.x, p.y] for p in all_points], dtype=np.float64)

    return points_array


def flatten_bezier_segment(segment: BezierSegment, tolerance: float = 0.5) -> List[Point]:
    """
    Flatten a single Bezier segment to a list of points.

    Uses adaptive subdivision: recursively splits the curve until each piece
    is flat enough.

    Args:
        segment: BezierSegment to flatten
        tolerance: Maximum flatness error

    Returns:
        List of Points approximating the curve
    """
    # Check if segment is linear (all control points are collinear)
    if _is_linear(segment, tolerance):
        # Return just endpoints
        return [segment.p0, segment.p3]

    # Check flatness
    flatness = estimate_flatness_segment(segment)

    if flatness <= tolerance:
        # Flat enough, return endpoints
        return [segment.p0, segment.p3]

    # Not flat enough, subdivide
    left, right = segment.split(0.5)

    # Recursively flatten both halves
    left_points = flatten_bezier_segment(left, tolerance)
    right_points = flatten_bezier_segment(right, tolerance)

    # Combine (avoiding duplicate midpoint)
    return left_points[:-1] + right_points


def estimate_flatness_segment(segment: BezierSegment) -> float:
    """
    Estimate flatness of a Bezier segment.

    Returns the maximum distance from control points to the line connecting
    the segment's endpoints.

    Args:
        segment: BezierSegment to evaluate

    Returns:
        Maximum distance from control points to baseline
    """
    p0 = np.array([segment.p0.x, segment.p0.y])
    p1 = np.array([segment.p1.x, segment.p1.y])
    p2 = np.array([segment.p2.x, segment.p2.y])
    p3 = np.array([segment.p3.x, segment.p3.y])

    return estimate_flatness(p0, p1, p2, p3)


def estimate_flatness(
    p0: np.ndarray,
    p1: np.ndarray,
    p2: np.ndarray,
    p3: np.ndarray
) -> float:
    """
    Estimate flatness of cubic Bezier curve.

    Returns max distance from control points to line p0-p3.

    Args:
        p0: Start point (2D)
        p1: First control point (2D)
        p2: Second control point (2D)
        p3: End point (2D)

    Returns:
        Maximum distance from control points to baseline
    """
    # Vector from p0 to p3
    baseline = p3 - p0
    baseline_length = np.linalg.norm(baseline)

    if baseline_length < 1e-10:
        # Degenerate case: endpoints are the same
        # Return max distance between any pair of points
        dist1 = np.linalg.norm(p1 - p0)
        dist2 = np.linalg.norm(p2 - p0)
        return max(dist1, dist2)

    # Normalize baseline
    baseline_normalized = baseline / baseline_length

    # Compute perpendicular distance from p1 and p2 to baseline
    dist1 = _point_to_line_distance(p1, p0, baseline_normalized)
    dist2 = _point_to_line_distance(p2, p0, baseline_normalized)

    return max(dist1, dist2)


def _point_to_line_distance(
    point: np.ndarray,
    line_origin: np.ndarray,
    line_direction: np.ndarray
) -> float:
    """
    Compute perpendicular distance from point to line.

    Args:
        point: Point to measure from (2D)
        line_origin: Point on line (2D)
        line_direction: Normalized direction vector (2D)

    Returns:
        Perpendicular distance
    """
    # Vector from line origin to point
    to_point = point - line_origin

    # Project onto line direction
    projection = np.dot(to_point, line_direction)

    # Perpendicular component
    perpendicular = to_point - projection * line_direction

    return np.linalg.norm(perpendicular)


def _is_linear(segment: BezierSegment, tolerance: float) -> bool:
    """
    Check if a Bezier segment is effectively linear.

    Args:
        segment: BezierSegment to check
        tolerance: Maximum deviation from linearity

    Returns:
        True if segment is linear within tolerance
    """
    # Check if all points are collinear
    p0 = np.array([segment.p0.x, segment.p0.y])
    p1 = np.array([segment.p1.x, segment.p1.y])
    p2 = np.array([segment.p2.x, segment.p2.y])
    p3 = np.array([segment.p3.x, segment.p3.y])

    # Check if p1 and p2 are on the line from p0 to p3
    baseline = p3 - p0
    baseline_length = np.linalg.norm(baseline)

    if baseline_length < 1e-10:
        return True

    baseline_normalized = baseline / baseline_length

    dist1 = _point_to_line_distance(p1, p0, baseline_normalized)
    dist2 = _point_to_line_distance(p2, p0, baseline_normalized)

    return max(dist1, dist2) < tolerance


def subdivide_bezier(
    p0: np.ndarray,
    p1: np.ndarray,
    p2: np.ndarray,
    p3: np.ndarray,
    tolerance: float
) -> List[np.ndarray]:
    """
    Recursively subdivide Bezier curve until flat enough.

    Args:
        p0: Start point (2D)
        p1: First control point (2D)
        p2: Second control point (2D)
        p3: End point (2D)
        tolerance: Flatness threshold

    Returns:
        List of points approximating the curve
    """
    # Check flatness
    flatness = estimate_flatness(p0, p1, p2, p3)

    if flatness <= tolerance:
        # Flat enough, return endpoints
        return [p0, p3]

    # Subdivide using de Casteljau's algorithm
    # First level
    q0 = p0
    q1 = 0.5 * (p0 + p1)
    q2 = 0.5 * (p1 + p2)
    q3 = 0.5 * (p2 + p3)

    # Second level
    r0 = q0
    r1 = 0.5 * (q1 + q2)
    r2 = 0.5 * (q2 + q3)

    # Third level (midpoint)
    s = 0.5 * (r1 + r2)

    # Recursively subdivide left and right halves
    left_points = subdivide_bezier(r0, q1, r1, s, tolerance)
    right_points = subdivide_bezier(s, r2, q3, p3, tolerance)

    # Combine (avoiding duplicate midpoint)
    return left_points[:-1] + right_points


def _compute_polygon_area(points: np.ndarray) -> float:
    """
    Compute signed area of polygon using shoelace formula.

    Args:
        points: Nx2 array of polygon vertices

    Returns:
        Signed area (positive for CCW, negative for CW)
    """
    if len(points) < 3:
        return 0.0

    x = points[:, 0]
    y = points[:, 1]

    # Shoelace formula
    area = 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)

    return area


def simplify_polygon(points: np.ndarray, tolerance: float = 1.0) -> np.ndarray:
    """
    Simplify polygon using Douglas-Peucker algorithm.

    Removes points that contribute less than the tolerance to the shape.

    Args:
        points: Nx2 array of polygon vertices
        tolerance: Maximum distance for point removal

    Returns:
        Simplified Nx2 array
    """
    if len(points) <= 3:
        return points

    # Douglas-Peucker algorithm
    def douglas_peucker(pts, epsilon):
        if len(pts) <= 2:
            return pts

        # Find point with maximum distance from line
        line_start = pts[0]
        line_end = pts[-1]

        max_dist = 0.0
        max_idx = 0

        for i in range(1, len(pts) - 1):
            dist = _perpendicular_distance(pts[i], line_start, line_end)
            if dist > max_dist:
                max_dist = dist
                max_idx = i

        # If max distance is greater than epsilon, recursively simplify
        if max_dist > epsilon:
            # Recursively simplify both sides
            left = douglas_peucker(pts[:max_idx+1], epsilon)
            right = douglas_peucker(pts[max_idx:], epsilon)

            # Combine (avoiding duplicate point at max_idx)
            return np.vstack([left[:-1], right])
        else:
            # All points are close to line, return endpoints
            return np.array([line_start, line_end])

    simplified = douglas_peucker(points, tolerance)
    return simplified


def _perpendicular_distance(point: np.ndarray, line_start: np.ndarray, line_end: np.ndarray) -> float:
    """
    Compute perpendicular distance from point to line segment.

    Args:
        point: Point to measure from (2D)
        line_start: Start of line segment (2D)
        line_end: End of line segment (2D)

    Returns:
        Perpendicular distance
    """
    line_vec = line_end - line_start
    line_length = np.linalg.norm(line_vec)

    if line_length < 1e-10:
        # Degenerate line
        return np.linalg.norm(point - line_start)

    # Project point onto line
    t = np.dot(point - line_start, line_vec) / (line_length ** 2)
    t = np.clip(t, 0, 1)

    projection = line_start + t * line_vec

    return np.linalg.norm(point - projection)
