"""Flattened polygon representation."""

from dataclasses import dataclass, field
from typing import List, Optional, TYPE_CHECKING
import numpy as np
from numpy.typing import NDArray

from .glyph import Point

if TYPE_CHECKING:
    import shapely.geometry


@dataclass
class Polygon:
    """Flattened polygon from contours.

    Represents a polygon with an exterior boundary and optional holes.
    All coordinates are stored as Nx2 numpy arrays.
    """

    exterior: NDArray[np.float64]  # Nx2 array of exterior points
    holes: List[NDArray[np.float64]] = field(default_factory=list)  # List of Mx2 arrays

    def __post_init__(self):
        """Validate polygon data."""
        if self.exterior.ndim != 2 or (self.exterior.size > 0 and self.exterior.shape[1] != 2):
            raise ValueError(f"Exterior must be Nx2 array, got shape {self.exterior.shape}")

        for i, hole in enumerate(self.holes):
            if hole.ndim != 2 or (hole.size > 0 and hole.shape[1] != 2):
                raise ValueError(f"Hole {i} must be Mx2 array, got shape {hole.shape}")

    def contains_point(self, p: Point) -> bool:
        """Check if point is inside polygon using ray casting algorithm.

        Args:
            p: Point to test

        Returns:
            True if point is inside polygon (considering holes)
        """
        # Check if in exterior
        if not self._point_in_ring(p, self.exterior):
            return False

        # Check if in any hole
        for hole in self.holes:
            if self._point_in_ring(p, hole):
                return False

        return True

    def _point_in_ring(self, p: Point, ring: NDArray[np.float64]) -> bool:
        """Ray casting algorithm for point-in-polygon test.

        Casts a horizontal ray from the point to the right and counts
        intersections with polygon edges. Odd count = inside, even = outside.
        """
        if ring.shape[0] == 0:
            return False

        x, y = p.x, p.y
        n = ring.shape[0]
        inside = False

        j = n - 1
        for i in range(n):
            xi, yi = ring[i]
            xj, yj = ring[j]

            # Check if edge crosses horizontal ray from point
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside

            j = i

        return inside

    def area(self) -> float:
        """Compute signed area using shoelace formula.

        Returns:
            Positive area for counter-clockwise exterior, negative for clockwise
        """
        exterior_area = self._ring_area(self.exterior)
        holes_area = sum(self._ring_area(hole) for hole in self.holes)

        return abs(exterior_area) - abs(holes_area)

    def _ring_area(self, ring: NDArray[np.float64]) -> float:
        """Compute signed area of a ring using shoelace formula."""
        if ring.shape[0] < 3:
            return 0.0

        # Shoelace formula: A = 0.5 * sum((x[i] * y[i+1]) - (x[i+1] * y[i]))
        x = ring[:, 0]
        y = ring[:, 1]

        # Roll to get next point
        x_next = np.roll(x, -1)
        y_next = np.roll(y, -1)

        return 0.5 * np.sum(x * y_next - x_next * y)

    def centroid(self) -> Point:
        """Compute centroid (center of mass) of polygon.

        For polygons with holes, this is the area-weighted centroid.
        """
        if self.exterior.shape[0] == 0:
            return Point(0, 0)

        # Compute centroid of exterior
        cx, cy = self._ring_centroid(self.exterior)

        # If no holes, return exterior centroid
        if not self.holes:
            return Point(cx, cy)

        # Weight by areas for polygons with holes
        exterior_area = abs(self._ring_area(self.exterior))
        total_area = exterior_area

        weighted_x = cx * exterior_area
        weighted_y = cy * exterior_area

        for hole in self.holes:
            hole_area = abs(self._ring_area(hole))
            hx, hy = self._ring_centroid(hole)

            # Subtract hole contribution
            weighted_x -= hx * hole_area
            weighted_y -= hy * hole_area
            total_area -= hole_area

        if total_area > 0:
            return Point(weighted_x / total_area, weighted_y / total_area)
        else:
            return Point(cx, cy)

    def _ring_centroid(self, ring: NDArray[np.float64]) -> tuple[float, float]:
        """Compute centroid of a single ring."""
        if ring.shape[0] == 0:
            return (0.0, 0.0)

        if ring.shape[0] == 1:
            return (float(ring[0, 0]), float(ring[0, 1]))

        # Centroid formula for polygon
        x = ring[:, 0]
        y = ring[:, 1]

        x_next = np.roll(x, -1)
        y_next = np.roll(y, -1)

        cross = x * y_next - x_next * y
        area = 0.5 * np.sum(cross)

        if abs(area) < 1e-10:
            # Degenerate polygon, use simple average
            return (float(np.mean(x)), float(np.mean(y)))

        cx = np.sum((x + x_next) * cross) / (6.0 * area)
        cy = np.sum((y + y_next) * cross) / (6.0 * area)

        return (float(cx), float(cy))

    def to_shapely(self) -> "shapely.geometry.Polygon":
        """Convert to shapely Polygon for advanced operations.

        Requires shapely library to be installed.
        """
        try:
            import shapely.geometry as geom
        except ImportError:
            raise ImportError("shapely library required for to_shapely()")

        if self.exterior.shape[0] == 0:
            return geom.Polygon()

        # Convert exterior
        exterior_coords = [(float(x), float(y)) for x, y in self.exterior]

        # Convert holes
        holes_coords = [
            [(float(x), float(y)) for x, y in hole]
            for hole in self.holes
        ]

        return geom.Polygon(shell=exterior_coords, holes=holes_coords)

    @classmethod
    def from_shapely(cls, poly: "shapely.geometry.Polygon") -> "Polygon":
        """Create Polygon from shapely Polygon.

        Args:
            poly: Shapely Polygon object

        Returns:
            Polygon instance
        """
        # Extract exterior coordinates
        exterior = np.array(poly.exterior.coords[:-1], dtype=np.float64)

        # Extract holes
        holes = [
            np.array(interior.coords[:-1], dtype=np.float64)
            for interior in poly.interiors
        ]

        return cls(exterior=exterior, holes=holes)

    def is_empty(self) -> bool:
        """Check if polygon is empty."""
        return self.exterior.shape[0] == 0

    def num_points(self) -> int:
        """Return total number of points (exterior + holes)."""
        total = self.exterior.shape[0]
        for hole in self.holes:
            total += hole.shape[0]
        return total

    def bounds(self) -> Optional["BoundingBox"]:
        """Compute bounding box."""
        from .glyph import BoundingBox

        if self.is_empty():
            return None

        # Get bounds from exterior
        x_min = float(np.min(self.exterior[:, 0]))
        y_min = float(np.min(self.exterior[:, 1]))
        x_max = float(np.max(self.exterior[:, 0]))
        y_max = float(np.max(self.exterior[:, 1]))

        # Expand to include holes
        for hole in self.holes:
            if hole.shape[0] > 0:
                x_min = min(x_min, float(np.min(hole[:, 0])))
                y_min = min(y_min, float(np.min(hole[:, 1])))
                x_max = max(x_max, float(np.max(hole[:, 0])))
                y_max = max(y_max, float(np.max(hole[:, 1])))

        return BoundingBox(x_min, y_min, x_max, y_max)

    def __repr__(self) -> str:
        return f"Polygon(exterior={self.exterior.shape[0]} pts, holes={len(self.holes)})"
