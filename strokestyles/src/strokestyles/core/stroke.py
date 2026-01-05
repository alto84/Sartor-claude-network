"""Stroke representation and decomposition."""

from dataclasses import dataclass, field
from typing import List, Optional, Set, Tuple, Dict, Any
import numpy as np
from numpy.typing import NDArray

from .glyph import Point


@dataclass
class Stroke:
    """A recovered stroke with width profile.

    Represents a stroke as a medial axis (spine) with varying width.
    The stroke can be reconstructed by offsetting the spine by the
    width values on both sides.

    Attributes:
        id: Unique identifier for this stroke
        spine: Nx2 array of medial axis points
        widths: N array of radius values (half-width at each spine point)
        start_junction_type: Type of junction at start (e.g., 'T', 'Y', 'X')
        end_junction_type: Type of junction at end
        overlapping_stroke_ids: IDs of strokes that overlap with this one
    """

    id: int
    spine: NDArray[np.float64]  # Nx2 medial axis points
    widths: NDArray[np.float64]  # N radii values
    start_junction_type: Optional[str] = None
    end_junction_type: Optional[str] = None
    overlapping_stroke_ids: Set[int] = field(default_factory=set)

    def __post_init__(self):
        """Validate stroke data."""
        if self.spine.ndim != 2 or self.spine.shape[1] != 2:
            raise ValueError(f"Spine must be Nx2 array, got shape {self.spine.shape}")

        if self.widths.ndim != 1:
            raise ValueError(f"Widths must be 1D array, got shape {self.widths.shape}")

        if self.spine.shape[0] != self.widths.shape[0]:
            raise ValueError(
                f"Spine and widths must have same length: "
                f"{self.spine.shape[0]} vs {self.widths.shape[0]}"
            )

    def to_outline(self) -> Tuple[NDArray[np.float64], NDArray[np.float64]]:
        """Generate left and right outline curves from spine and width profile.

        Computes normal vectors at each spine point and offsets by the
        width value to create parallel curves on both sides.

        Returns:
            Tuple of (left_outline, right_outline), each Nx2 array
        """
        n_points = self.spine.shape[0]

        if n_points < 2:
            # Degenerate case: single point
            return (self.spine.copy(), self.spine.copy())

        # Compute tangent vectors along spine
        tangents = np.zeros_like(self.spine)

        # Forward difference for first point
        tangents[0] = self.spine[1] - self.spine[0]

        # Central difference for interior points
        for i in range(1, n_points - 1):
            tangents[i] = self.spine[i + 1] - self.spine[i - 1]

        # Backward difference for last point
        tangents[-1] = self.spine[-1] - self.spine[-2]

        # Normalize tangents
        tangent_lengths = np.linalg.norm(tangents, axis=1, keepdims=True)
        tangent_lengths = np.maximum(tangent_lengths, 1e-10)  # Avoid division by zero
        tangents = tangents / tangent_lengths

        # Compute normal vectors (perpendicular to tangents)
        # Rotate tangent by 90 degrees: (x, y) -> (-y, x)
        normals = np.stack([-tangents[:, 1], tangents[:, 0]], axis=1)

        # Offset spine by width in normal direction
        widths_2d = self.widths.reshape(-1, 1)
        left_outline = self.spine + normals * widths_2d
        right_outline = self.spine - normals * widths_2d

        return (left_outline, right_outline)

    def length(self) -> float:
        """Compute arc length of spine."""
        if self.spine.shape[0] < 2:
            return 0.0

        # Compute distances between consecutive points
        deltas = np.diff(self.spine, axis=0)
        distances = np.linalg.norm(deltas, axis=1)

        return float(np.sum(distances))

    def mean_width(self) -> float:
        """Compute mean width (2 * mean radius)."""
        if self.widths.shape[0] == 0:
            return 0.0
        return float(2.0 * np.mean(self.widths))

    def width_variance(self) -> float:
        """Compute variance of width profile."""
        if self.widths.shape[0] == 0:
            return 0.0
        return float(np.var(self.widths))

    def is_constant_width(self, tolerance: float = 0.1) -> bool:
        """Check if stroke has approximately constant width.

        Args:
            tolerance: Relative tolerance (fraction of mean width)

        Returns:
            True if width variance is below tolerance
        """
        if self.widths.shape[0] < 2:
            return True

        mean_w = np.mean(self.widths)
        if mean_w < 1e-10:
            return True

        std_w = np.std(self.widths)
        return (std_w / mean_w) < tolerance

    def sample_at(self, t: float) -> Tuple[Point, float]:
        """Sample spine position and width at parameter t in [0, 1].

        Args:
            t: Parameter value (0 = start, 1 = end)

        Returns:
            Tuple of (position, width) at parameter t
        """
        if self.spine.shape[0] == 0:
            return (Point(0, 0), 0.0)

        if self.spine.shape[0] == 1:
            return (Point(self.spine[0, 0], self.spine[0, 1]), float(self.widths[0]))

        # Clamp t to [0, 1]
        t = max(0.0, min(1.0, t))

        # Find segment index
        n = self.spine.shape[0]
        segment_length = 1.0 / (n - 1)
        idx = min(int(t / segment_length), n - 2)
        local_t = (t - idx * segment_length) / segment_length

        # Linear interpolation
        pos = (1 - local_t) * self.spine[idx] + local_t * self.spine[idx + 1]
        width = (1 - local_t) * self.widths[idx] + local_t * self.widths[idx + 1]

        return (Point(pos[0], pos[1]), float(width))

    def to_dict(self) -> Dict[str, Any]:
        """Serialize stroke to dictionary."""
        return {
            'id': self.id,
            'spine': self.spine.tolist(),
            'widths': self.widths.tolist(),
            'start_junction_type': self.start_junction_type,
            'end_junction_type': self.end_junction_type,
            'overlapping_stroke_ids': list(self.overlapping_stroke_ids)
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Stroke":
        """Deserialize stroke from dictionary."""
        return cls(
            id=d['id'],
            spine=np.array(d['spine'], dtype=np.float64),
            widths=np.array(d['widths'], dtype=np.float64),
            start_junction_type=d.get('start_junction_type'),
            end_junction_type=d.get('end_junction_type'),
            overlapping_stroke_ids=set(d.get('overlapping_stroke_ids', []))
        )

    def __repr__(self) -> str:
        return (f"Stroke(id={self.id}, points={self.spine.shape[0]}, "
                f"length={self.length():.2f}, mean_width={self.mean_width():.2f})")


@dataclass
class StrokeDecomposition:
    """Complete stroke decomposition of a glyph.

    Represents the result of decomposing a glyph outline into a set
    of strokes with their overlap relationships.

    Attributes:
        glyph_name: Name of the glyph this decomposition belongs to
        strokes: List of recovered strokes
        coverage: Fraction of glyph area covered by strokes [0, 1]
    """

    glyph_name: str
    strokes: List[Stroke]
    coverage: float = 0.0

    def __post_init__(self):
        """Validate coverage."""
        if not (0.0 <= self.coverage <= 1.0):
            raise ValueError(f"Coverage must be in [0, 1], got {self.coverage}")

    def num_strokes(self) -> int:
        """Return number of strokes."""
        return len(self.strokes)

    def get_stroke_by_id(self, stroke_id: int) -> Optional[Stroke]:
        """Get stroke by ID."""
        for stroke in self.strokes:
            if stroke.id == stroke_id:
                return stroke
        return None

    def get_overlap_matrix(self) -> NDArray[np.bool_]:
        """Compute boolean matrix of stroke overlaps.

        Returns:
            NxN boolean array where entry (i, j) is True if strokes
            with IDs i and j overlap
        """
        n = len(self.strokes)
        if n == 0:
            return np.empty((0, 0), dtype=bool)

        # Create mapping from stroke ID to index
        id_to_idx = {stroke.id: i for i, stroke in enumerate(self.strokes)}

        # Initialize overlap matrix
        overlap = np.zeros((n, n), dtype=bool)

        # Fill in overlap relationships
        for i, stroke in enumerate(self.strokes):
            # Stroke overlaps with itself
            overlap[i, i] = True

            # Fill in overlaps with other strokes
            for other_id in stroke.overlapping_stroke_ids:
                if other_id in id_to_idx:
                    j = id_to_idx[other_id]
                    overlap[i, j] = True
                    overlap[j, i] = True  # Symmetric

        return overlap

    def total_stroke_length(self) -> float:
        """Compute total length of all strokes."""
        return sum(stroke.length() for stroke in self.strokes)

    def mean_stroke_width(self) -> float:
        """Compute mean width across all strokes."""
        if not self.strokes:
            return 0.0

        total_points = sum(stroke.spine.shape[0] for stroke in self.strokes)
        if total_points == 0:
            return 0.0

        weighted_sum = sum(
            np.sum(stroke.widths) for stroke in self.strokes
        )

        return float(2.0 * weighted_sum / total_points)

    def get_overlapping_pairs(self) -> List[Tuple[int, int]]:
        """Get list of (id1, id2) pairs for overlapping strokes.

        Returns:
            List of stroke ID pairs that overlap (id1 < id2)
        """
        pairs = []

        for stroke in self.strokes:
            for other_id in stroke.overlapping_stroke_ids:
                if stroke.id < other_id:
                    pairs.append((stroke.id, other_id))

        return sorted(pairs)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize decomposition to dictionary."""
        return {
            'glyph_name': self.glyph_name,
            'strokes': [stroke.to_dict() for stroke in self.strokes],
            'coverage': self.coverage
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "StrokeDecomposition":
        """Deserialize decomposition from dictionary."""
        return cls(
            glyph_name=d['glyph_name'],
            strokes=[Stroke.from_dict(s) for s in d['strokes']],
            coverage=d.get('coverage', 0.0)
        )

    def __repr__(self) -> str:
        return (f"StrokeDecomposition(glyph='{self.glyph_name}', "
                f"strokes={len(self.strokes)}, coverage={self.coverage:.2%})")
