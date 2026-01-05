"""Glyph representation and basic geometric primitives."""

from dataclasses import dataclass, field
from typing import List, Optional
import numpy as np
from numpy.typing import NDArray


@dataclass
class Point:
    """2D point with vector operations."""

    x: float
    y: float

    def to_array(self) -> NDArray[np.float64]:
        """Convert to numpy array [x, y]."""
        return np.array([self.x, self.y], dtype=np.float64)

    def distance_to(self, other: "Point") -> float:
        """Euclidean distance to another point."""
        dx = self.x - other.x
        dy = self.y - other.y
        return np.sqrt(dx * dx + dy * dy)

    def __add__(self, other: "Point") -> "Point":
        """Vector addition."""
        return Point(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Point") -> "Point":
        """Vector subtraction."""
        return Point(self.x - other.x, self.y - other.y)

    def __mul__(self, scalar: float) -> "Point":
        """Scalar multiplication."""
        return Point(self.x * scalar, self.y * scalar)

    def __rmul__(self, scalar: float) -> "Point":
        """Reverse scalar multiplication."""
        return self.__mul__(scalar)

    def __repr__(self) -> str:
        return f"Point({self.x:.2f}, {self.y:.2f})"


@dataclass
class BoundingBox:
    """Axis-aligned bounding box."""

    x_min: float
    y_min: float
    x_max: float
    y_max: float

    @property
    def width(self) -> float:
        """Width of bounding box."""
        return self.x_max - self.x_min

    @property
    def height(self) -> float:
        """Height of bounding box."""
        return self.y_max - self.y_min

    @property
    def center(self) -> Point:
        """Center point of bounding box."""
        return Point(
            (self.x_min + self.x_max) / 2.0,
            (self.y_min + self.y_max) / 2.0
        )

    def contains(self, point: Point) -> bool:
        """Check if point is inside bounding box."""
        return (self.x_min <= point.x <= self.x_max and
                self.y_min <= point.y <= self.y_max)

    def intersects(self, other: "BoundingBox") -> bool:
        """Check if this bounding box intersects another."""
        return not (self.x_max < other.x_min or
                   self.x_min > other.x_max or
                   self.y_max < other.y_min or
                   self.y_min > other.y_max)

    @staticmethod
    def from_points(points: List[Point]) -> "BoundingBox":
        """Create bounding box from list of points."""
        if not points:
            return BoundingBox(0, 0, 0, 0)

        x_coords = [p.x for p in points]
        y_coords = [p.y for p in points]

        return BoundingBox(
            x_min=min(x_coords),
            y_min=min(y_coords),
            x_max=max(x_coords),
            y_max=max(y_coords)
        )

    def __repr__(self) -> str:
        return f"BoundingBox({self.x_min:.2f}, {self.y_min:.2f}, {self.x_max:.2f}, {self.y_max:.2f})"


@dataclass
class Glyph:
    """A font glyph with contours.

    Attributes:
        name: Glyph name (e.g., 'A', 'B', 'ampersand')
        unicode: Unicode code point (optional)
        advance_width: Horizontal advance width
        contours: List of Contour objects defining the glyph shape
        bounds: Bounding box of the glyph
    """

    name: str
    unicode: Optional[int]
    advance_width: float
    contours: List["Contour"]  # Forward reference, imported from contour.py
    bounds: BoundingBox

    def num_contours(self) -> int:
        """Return number of contours."""
        return len(self.contours)

    def is_empty(self) -> bool:
        """Check if glyph has no contours."""
        return len(self.contours) == 0

    def __repr__(self) -> str:
        return f"Glyph(name='{self.name}', unicode={self.unicode}, contours={len(self.contours)})"
