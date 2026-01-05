"""Contour and Bezier curve representations."""

from dataclasses import dataclass, field
from typing import List, Tuple, TYPE_CHECKING
import numpy as np
from numpy.typing import NDArray

from .glyph import Point

if TYPE_CHECKING:
    from .polygon import Polygon


@dataclass
class BezierSegment:
    """Cubic Bezier curve segment.

    Parametric curve from p0 to p3 with control points p1 and p2.
    Uses De Casteljau algorithm for evaluation.
    """

    p0: Point  # Start point
    p1: Point  # First control point
    p2: Point  # Second control point
    p3: Point  # End point

    def evaluate(self, t: float) -> Point:
        """Evaluate curve at parameter t in [0, 1] using De Casteljau algorithm."""
        # Clamp t to valid range
        t = max(0.0, min(1.0, t))

        # De Casteljau's algorithm
        # Level 1: linear interpolation between original points
        q0 = self.p0 * (1 - t) + self.p1 * t
        q1 = self.p1 * (1 - t) + self.p2 * t
        q2 = self.p2 * (1 - t) + self.p3 * t

        # Level 2: linear interpolation between level 1 points
        r0 = q0 * (1 - t) + q1 * t
        r1 = q1 * (1 - t) + q2 * t

        # Level 3: final interpolation
        return r0 * (1 - t) + r1 * t

    def split(self, t: float) -> Tuple["BezierSegment", "BezierSegment"]:
        """Split curve at parameter t into two Bezier segments.

        Uses De Casteljau algorithm to find subdivision points.
        Returns (left_segment, right_segment).
        """
        # Clamp t to valid range
        t = max(0.0, min(1.0, t))

        # De Casteljau's algorithm for subdivision
        # Level 1
        q0 = self.p0 * (1 - t) + self.p1 * t
        q1 = self.p1 * (1 - t) + self.p2 * t
        q2 = self.p2 * (1 - t) + self.p3 * t

        # Level 2
        r0 = q0 * (1 - t) + q1 * t
        r1 = q1 * (1 - t) + q2 * t

        # Level 3 - the split point
        split_point = r0 * (1 - t) + r1 * t

        # Left segment: p0, q0, r0, split_point
        left = BezierSegment(self.p0, q0, r0, split_point)

        # Right segment: split_point, r1, q2, p3
        right = BezierSegment(split_point, r1, q2, self.p3)

        return left, right

    def flatten(self, tolerance: float = 0.5) -> List[Point]:
        """Convert Bezier curve to polyline using adaptive subdivision.

        Args:
            tolerance: Maximum allowed distance from curve to line segment

        Returns:
            List of points approximating the curve (includes start, excludes end)
        """
        points = []
        self._flatten_recursive(0.0, 1.0, tolerance, points)
        return points

    def _flatten_recursive(
        self,
        t0: float,
        t1: float,
        tolerance: float,
        points: List[Point]
    ) -> None:
        """Recursive helper for adaptive subdivision."""
        # Evaluate at endpoints
        p0 = self.evaluate(t0)
        p1 = self.evaluate(t1)

        # Evaluate at midpoint
        t_mid = (t0 + t1) / 2.0
        p_mid = self.evaluate(t_mid)

        # Linear interpolation at midpoint
        p_linear = p0 * 0.5 + p1 * 0.5

        # Check if linear approximation is good enough
        error = p_mid.distance_to(p_linear)

        if error <= tolerance:
            # Good enough - add start point
            if not points or points[-1].distance_to(p0) > 1e-6:
                points.append(p0)
        else:
            # Need to subdivide
            self._flatten_recursive(t0, t_mid, tolerance, points)
            self._flatten_recursive(t_mid, t1, tolerance, points)

    def length(self) -> float:
        """Approximate arc length using adaptive subdivision."""
        points = self.flatten(tolerance=0.1)
        points.append(self.p3)  # Add endpoint

        total_length = 0.0
        for i in range(len(points) - 1):
            total_length += points[i].distance_to(points[i + 1])

        return total_length

    def bounding_box(self) -> "BoundingBox":
        """Compute tight bounding box (approximation using control points)."""
        from .glyph import BoundingBox

        x_coords = [self.p0.x, self.p1.x, self.p2.x, self.p3.x]
        y_coords = [self.p0.y, self.p1.y, self.p2.y, self.p3.y]

        return BoundingBox(
            x_min=min(x_coords),
            y_min=min(y_coords),
            x_max=max(x_coords),
            y_max=max(y_coords)
        )


@dataclass
class Contour:
    """Closed contour made of Bezier segments.

    Represents a closed path in a glyph outline. Can be an exterior
    boundary (clockwise) or a hole (counter-clockwise).
    """

    segments: List[BezierSegment]
    is_clockwise: bool = True

    def to_polygon(self, tolerance: float = 0.5) -> "Polygon":
        """Convert contour to polygon using adaptive subdivision.

        Args:
            tolerance: Flattening tolerance for Bezier curves

        Returns:
            Polygon object with flattened points
        """
        from .polygon import Polygon

        if not self.segments:
            return Polygon(exterior=np.empty((0, 2), dtype=np.float64))

        # Flatten all segments
        all_points = []
        for segment in self.segments:
            flat_points = segment.flatten(tolerance)
            all_points.extend(flat_points)

        # Convert to numpy array
        if all_points:
            points_array = np.array(
                [[p.x, p.y] for p in all_points],
                dtype=np.float64
            )
        else:
            points_array = np.empty((0, 2), dtype=np.float64)

        # Determine if this is exterior or hole based on winding
        if self.is_clockwise:
            return Polygon(exterior=points_array)
        else:
            # Counter-clockwise contour is a hole
            return Polygon(exterior=np.empty((0, 2)), holes=[points_array])

    def length(self) -> float:
        """Compute total arc length of contour."""
        return sum(segment.length() for segment in self.segments)

    def num_segments(self) -> int:
        """Return number of Bezier segments."""
        return len(self.segments)

    def is_closed(self) -> bool:
        """Check if contour is closed (last point connects to first)."""
        if not self.segments:
            return False

        first_point = self.segments[0].p0
        last_point = self.segments[-1].p3

        return first_point.distance_to(last_point) < 1e-6

    def reverse(self) -> "Contour":
        """Return reversed contour (flips winding direction)."""
        reversed_segments = []

        for segment in reversed(self.segments):
            # Reverse segment by swapping endpoints and control points
            reversed_seg = BezierSegment(
                p0=segment.p3,
                p1=segment.p2,
                p2=segment.p1,
                p3=segment.p0
            )
            reversed_segments.append(reversed_seg)

        return Contour(
            segments=reversed_segments,
            is_clockwise=not self.is_clockwise
        )

    def __repr__(self) -> str:
        winding = "CW" if self.is_clockwise else "CCW"
        return f"Contour(segments={len(self.segments)}, {winding})"
