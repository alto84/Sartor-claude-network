"""Comprehensive unit tests for StrokeStyles core data structures.

Tests cover:
- Point: creation, arithmetic, distance, serialization
- BoundingBox: properties, containment, intersection
- BezierSegment: evaluation, splitting, flattening
- Contour: polygon conversion, length, winding
- Polygon: area, centroid, point containment, holes
- Stroke: outline generation, length, width profiles
- StrokeDecomposition: overlap matrix, serialization
"""

import pytest
import numpy as np
from numpy.testing import assert_array_almost_equal

from strokestyles.core.glyph import Point, BoundingBox
from strokestyles.core.contour import BezierSegment, Contour
from strokestyles.core.polygon import Polygon
from strokestyles.core.stroke import Stroke, StrokeDecomposition


# =============================================================================
# Point Tests
# =============================================================================

def test_point_creation():
    """Test Point initialization."""
    p = Point(3.0, 4.0)
    assert p.x == 3.0
    assert p.y == 4.0


def test_point_to_array():
    """Test Point to numpy array conversion."""
    p = Point(1.5, 2.5)
    arr = p.to_array()
    assert_array_almost_equal(arr, np.array([1.5, 2.5]))
    assert arr.dtype == np.float64


def test_point_distance():
    """Test Point Euclidean distance calculation."""
    p1 = Point(0.0, 0.0)
    p2 = Point(3.0, 4.0)

    # 3-4-5 triangle
    distance = p1.distance_to(p2)
    assert abs(distance - 5.0) < 1e-10


def test_point_arithmetic_addition():
    """Test Point vector addition."""
    p1 = Point(1.0, 2.0)
    p2 = Point(3.0, 4.0)

    result = p1 + p2
    assert result.x == 4.0
    assert result.y == 6.0


def test_point_arithmetic_subtraction():
    """Test Point vector subtraction."""
    p1 = Point(5.0, 7.0)
    p2 = Point(2.0, 3.0)

    result = p1 - p2
    assert result.x == 3.0
    assert result.y == 4.0


def test_point_arithmetic_scalar_multiply():
    """Test Point scalar multiplication."""
    p = Point(2.0, 3.0)

    # Forward multiplication
    result1 = p * 2.5
    assert result1.x == 5.0
    assert result1.y == 7.5

    # Reverse multiplication
    result2 = 2.5 * p
    assert result2.x == 5.0
    assert result2.y == 7.5


# =============================================================================
# BoundingBox Tests
# =============================================================================

def test_bbox_properties():
    """Test BoundingBox width, height, and center properties."""
    bbox = BoundingBox(x_min=0.0, y_min=0.0, x_max=10.0, y_max=20.0)

    assert bbox.width == 10.0
    assert bbox.height == 20.0

    center = bbox.center
    assert center.x == 5.0
    assert center.y == 10.0


def test_bbox_contains():
    """Test BoundingBox point containment."""
    bbox = BoundingBox(x_min=0.0, y_min=0.0, x_max=10.0, y_max=10.0)

    # Inside
    assert bbox.contains(Point(5.0, 5.0))

    # On boundary (inclusive)
    assert bbox.contains(Point(0.0, 0.0))
    assert bbox.contains(Point(10.0, 10.0))

    # Outside
    assert not bbox.contains(Point(-1.0, 5.0))
    assert not bbox.contains(Point(11.0, 5.0))


def test_bbox_intersects():
    """Test BoundingBox intersection detection."""
    bbox1 = BoundingBox(x_min=0.0, y_min=0.0, x_max=10.0, y_max=10.0)

    # Overlapping
    bbox2 = BoundingBox(x_min=5.0, y_min=5.0, x_max=15.0, y_max=15.0)
    assert bbox1.intersects(bbox2)
    assert bbox2.intersects(bbox1)

    # Non-overlapping
    bbox3 = BoundingBox(x_min=20.0, y_min=20.0, x_max=30.0, y_max=30.0)
    assert not bbox1.intersects(bbox3)
    assert not bbox3.intersects(bbox1)


def test_bbox_from_points():
    """Test BoundingBox creation from point list."""
    points = [
        Point(1.0, 2.0),
        Point(5.0, 3.0),
        Point(2.0, 6.0),
        Point(4.0, 1.0)
    ]

    bbox = BoundingBox.from_points(points)
    assert bbox.x_min == 1.0
    assert bbox.y_min == 1.0
    assert bbox.x_max == 5.0
    assert bbox.y_max == 6.0


# =============================================================================
# BezierSegment Tests
# =============================================================================

def test_bezier_evaluate_endpoints():
    """Test BezierSegment evaluation at endpoints (t=0 and t=1)."""
    bezier = BezierSegment(
        p0=Point(0.0, 0.0),
        p1=Point(1.0, 2.0),
        p2=Point(3.0, 2.0),
        p3=Point(4.0, 0.0)
    )

    # At t=0, should return p0
    p_start = bezier.evaluate(0.0)
    assert abs(p_start.x - 0.0) < 1e-10
    assert abs(p_start.y - 0.0) < 1e-10

    # At t=1, should return p3
    p_end = bezier.evaluate(1.0)
    assert abs(p_end.x - 4.0) < 1e-10
    assert abs(p_end.y - 0.0) < 1e-10


def test_bezier_evaluate_midpoint():
    """Test BezierSegment evaluation at t=0.5."""
    # Simple symmetric case
    bezier = BezierSegment(
        p0=Point(0.0, 0.0),
        p1=Point(0.0, 1.0),
        p2=Point(1.0, 1.0),
        p3=Point(1.0, 0.0)
    )

    p_mid = bezier.evaluate(0.5)
    # Midpoint should be at (0.5, 0.75) for this symmetric curve
    assert abs(p_mid.x - 0.5) < 1e-10
    assert abs(p_mid.y - 0.75) < 1e-10


def test_bezier_split():
    """Test BezierSegment splitting at t=0.5."""
    bezier = BezierSegment(
        p0=Point(0.0, 0.0),
        p1=Point(1.0, 2.0),
        p2=Point(3.0, 2.0),
        p3=Point(4.0, 0.0)
    )

    left, right = bezier.split(0.5)

    # Left segment starts at original p0
    assert abs(left.p0.x - bezier.p0.x) < 1e-10
    assert abs(left.p0.y - bezier.p0.y) < 1e-10

    # Right segment ends at original p3
    assert abs(right.p3.x - bezier.p3.x) < 1e-10
    assert abs(right.p3.y - bezier.p3.y) < 1e-10

    # Split point should be the same for both segments
    assert abs(left.p3.x - right.p0.x) < 1e-10
    assert abs(left.p3.y - right.p0.y) < 1e-10

    # Split point should match evaluate(0.5)
    p_mid = bezier.evaluate(0.5)
    assert abs(left.p3.x - p_mid.x) < 1e-10
    assert abs(left.p3.y - p_mid.y) < 1e-10


def test_bezier_flatten():
    """Test BezierSegment flattening to polyline."""
    # Straight line (degenerate Bezier)
    bezier = BezierSegment(
        p0=Point(0.0, 0.0),
        p1=Point(1.0, 0.0),
        p2=Point(2.0, 0.0),
        p3=Point(3.0, 0.0)
    )

    points = bezier.flatten(tolerance=0.1)

    # Should have at least start point
    assert len(points) >= 1

    # First point should be close to p0
    assert abs(points[0].x - 0.0) < 1e-6
    assert abs(points[0].y - 0.0) < 1e-6


def test_bezier_length():
    """Test BezierSegment length approximation."""
    # Straight line of length 4
    bezier = BezierSegment(
        p0=Point(0.0, 0.0),
        p1=Point(1.0, 0.0),
        p2=Point(2.0, 0.0),
        p3=Point(4.0, 0.0)
    )

    length = bezier.length()
    # Should be close to 4.0
    assert abs(length - 4.0) < 0.1


# =============================================================================
# Contour Tests
# =============================================================================

def test_contour_to_polygon():
    """Test Contour to Polygon conversion."""
    # Create a simple square contour
    segments = [
        BezierSegment(
            p0=Point(0.0, 0.0),
            p1=Point(1.0, 0.0),
            p2=Point(1.0, 0.0),
            p3=Point(1.0, 0.0)
        ),
        BezierSegment(
            p0=Point(1.0, 0.0),
            p1=Point(1.0, 1.0),
            p2=Point(1.0, 1.0),
            p3=Point(1.0, 1.0)
        ),
        BezierSegment(
            p0=Point(1.0, 1.0),
            p1=Point(0.0, 1.0),
            p2=Point(0.0, 1.0),
            p3=Point(0.0, 1.0)
        ),
        BezierSegment(
            p0=Point(0.0, 1.0),
            p1=Point(0.0, 0.0),
            p2=Point(0.0, 0.0),
            p3=Point(0.0, 0.0)
        )
    ]

    contour = Contour(segments=segments, is_clockwise=True)
    polygon = contour.to_polygon(tolerance=0.1)

    assert isinstance(polygon, Polygon)
    assert polygon.exterior.shape[0] > 0


def test_contour_length():
    """Test Contour total length calculation."""
    # Two straight segments forming a line of total length 2
    segments = [
        BezierSegment(
            p0=Point(0.0, 0.0),
            p1=Point(0.5, 0.0),
            p2=Point(0.5, 0.0),
            p3=Point(1.0, 0.0)
        ),
        BezierSegment(
            p0=Point(1.0, 0.0),
            p1=Point(1.5, 0.0),
            p2=Point(1.5, 0.0),
            p3=Point(2.0, 0.0)
        )
    ]

    contour = Contour(segments=segments)
    length = contour.length()

    assert abs(length - 2.0) < 0.1


def test_contour_reverse():
    """Test Contour reversal (winding flip)."""
    segments = [
        BezierSegment(
            p0=Point(0.0, 0.0),
            p1=Point(1.0, 0.0),
            p2=Point(1.0, 0.0),
            p3=Point(1.0, 0.0)
        )
    ]

    contour = Contour(segments=segments, is_clockwise=True)
    reversed_contour = contour.reverse()

    # Winding should be flipped
    assert reversed_contour.is_clockwise == False

    # Should have same number of segments
    assert len(reversed_contour.segments) == len(contour.segments)


# =============================================================================
# Polygon Tests
# =============================================================================

def test_polygon_area_square():
    """Test Polygon area for a known square."""
    # 10x10 square
    exterior = np.array([
        [0.0, 0.0],
        [10.0, 0.0],
        [10.0, 10.0],
        [0.0, 10.0]
    ], dtype=np.float64)

    polygon = Polygon(exterior=exterior)
    area = polygon.area()

    # Area should be 100.0
    assert abs(area - 100.0) < 1e-10


def test_polygon_centroid():
    """Test Polygon centroid calculation."""
    # Unit square centered at origin
    exterior = np.array([
        [-1.0, -1.0],
        [1.0, -1.0],
        [1.0, 1.0],
        [-1.0, 1.0]
    ], dtype=np.float64)

    polygon = Polygon(exterior=exterior)
    centroid = polygon.centroid()

    # Centroid should be at origin
    assert abs(centroid.x - 0.0) < 1e-10
    assert abs(centroid.y - 0.0) < 1e-10


def test_polygon_contains_point():
    """Test Polygon point containment using ray casting."""
    # Unit square
    exterior = np.array([
        [0.0, 0.0],
        [1.0, 0.0],
        [1.0, 1.0],
        [0.0, 1.0]
    ], dtype=np.float64)

    polygon = Polygon(exterior=exterior)

    # Inside
    assert polygon.contains_point(Point(0.5, 0.5))

    # Outside
    assert not polygon.contains_point(Point(2.0, 2.0))
    assert not polygon.contains_point(Point(-1.0, 0.5))


def test_polygon_with_holes():
    """Test Polygon with holes (donut shape)."""
    # Outer square
    exterior = np.array([
        [0.0, 0.0],
        [10.0, 0.0],
        [10.0, 10.0],
        [0.0, 10.0]
    ], dtype=np.float64)

    # Inner square (hole)
    hole = np.array([
        [3.0, 3.0],
        [7.0, 3.0],
        [7.0, 7.0],
        [3.0, 7.0]
    ], dtype=np.float64)

    polygon = Polygon(exterior=exterior, holes=[hole])

    # Point in outer ring but not in hole
    assert polygon.contains_point(Point(1.0, 1.0))

    # Point in hole
    assert not polygon.contains_point(Point(5.0, 5.0))

    # Area should be outer - inner = 100 - 16 = 84
    area = polygon.area()
    assert abs(area - 84.0) < 1e-10


def test_polygon_bounds():
    """Test Polygon bounding box calculation."""
    exterior = np.array([
        [1.0, 2.0],
        [5.0, 3.0],
        [4.0, 7.0],
        [2.0, 6.0]
    ], dtype=np.float64)

    polygon = Polygon(exterior=exterior)
    bounds = polygon.bounds()

    assert bounds is not None
    assert bounds.x_min == 1.0
    assert bounds.x_max == 5.0
    assert bounds.y_min == 2.0
    assert bounds.y_max == 7.0


# =============================================================================
# Stroke Tests
# =============================================================================

def test_stroke_creation():
    """Test Stroke initialization and validation."""
    spine = np.array([
        [0.0, 0.0],
        [1.0, 0.0],
        [2.0, 0.0]
    ], dtype=np.float64)

    widths = np.array([1.0, 1.5, 2.0], dtype=np.float64)

    stroke = Stroke(id=1, spine=spine, widths=widths)

    assert stroke.id == 1
    assert stroke.spine.shape == (3, 2)
    assert stroke.widths.shape == (3,)


def test_stroke_creation_validation():
    """Test Stroke validation errors."""
    # Mismatched spine and widths
    spine = np.array([[0.0, 0.0], [1.0, 0.0]], dtype=np.float64)
    widths = np.array([1.0], dtype=np.float64)

    with pytest.raises(ValueError):
        Stroke(id=1, spine=spine, widths=widths)


def test_stroke_length():
    """Test Stroke length calculation."""
    # Straight horizontal stroke of length 2
    spine = np.array([
        [0.0, 0.0],
        [1.0, 0.0],
        [2.0, 0.0]
    ], dtype=np.float64)

    widths = np.array([1.0, 1.0, 1.0], dtype=np.float64)
    stroke = Stroke(id=1, spine=spine, widths=widths)

    length = stroke.length()
    assert abs(length - 2.0) < 1e-10


def test_stroke_to_outline():
    """Test Stroke outline generation from spine and widths."""
    # Horizontal stroke
    spine = np.array([
        [0.0, 0.0],
        [1.0, 0.0]
    ], dtype=np.float64)

    widths = np.array([0.5, 0.5], dtype=np.float64)
    stroke = Stroke(id=1, spine=spine, widths=widths)

    left, right = stroke.to_outline()

    # Check shapes
    assert left.shape == (2, 2)
    assert right.shape == (2, 2)

    # For horizontal stroke, left should be above, right below
    # Normal vector is (0, 1) for horizontal tangent (1, 0)
    assert left[0, 1] > spine[0, 1]  # Left is offset upward
    assert right[0, 1] < spine[0, 1]  # Right is offset downward


def test_stroke_mean_width():
    """Test Stroke mean width calculation."""
    spine = np.array([
        [0.0, 0.0],
        [1.0, 0.0],
        [2.0, 0.0]
    ], dtype=np.float64)

    widths = np.array([1.0, 2.0, 3.0], dtype=np.float64)  # Mean = 2.0
    stroke = Stroke(id=1, spine=spine, widths=widths)

    mean_width = stroke.mean_width()
    # Mean width = 2 * mean radius = 2 * 2.0 = 4.0
    assert abs(mean_width - 4.0) < 1e-10


def test_stroke_serialization():
    """Test Stroke to_dict and from_dict."""
    spine = np.array([[0.0, 0.0], [1.0, 0.0]], dtype=np.float64)
    widths = np.array([1.0, 1.5], dtype=np.float64)

    stroke = Stroke(
        id=42,
        spine=spine,
        widths=widths,
        start_junction_type='T',
        overlapping_stroke_ids={1, 2}
    )

    # Serialize
    data = stroke.to_dict()
    assert data['id'] == 42
    assert data['start_junction_type'] == 'T'
    assert set(data['overlapping_stroke_ids']) == {1, 2}

    # Deserialize
    stroke2 = Stroke.from_dict(data)
    assert stroke2.id == stroke.id
    assert_array_almost_equal(stroke2.spine, stroke.spine)
    assert_array_almost_equal(stroke2.widths, stroke.widths)
    assert stroke2.overlapping_stroke_ids == stroke.overlapping_stroke_ids


# =============================================================================
# StrokeDecomposition Tests
# =============================================================================

def test_decomposition_creation():
    """Test StrokeDecomposition initialization."""
    strokes = [
        Stroke(id=1, spine=np.array([[0.0, 0.0]], dtype=np.float64),
               widths=np.array([1.0], dtype=np.float64)),
        Stroke(id=2, spine=np.array([[1.0, 1.0]], dtype=np.float64),
               widths=np.array([1.0], dtype=np.float64))
    ]

    decomp = StrokeDecomposition(
        glyph_name='A',
        strokes=strokes,
        coverage=0.95
    )

    assert decomp.glyph_name == 'A'
    assert decomp.num_strokes() == 2
    assert decomp.coverage == 0.95


def test_decomposition_overlap_matrix():
    """Test StrokeDecomposition overlap matrix generation."""
    stroke1 = Stroke(
        id=1,
        spine=np.array([[0.0, 0.0]], dtype=np.float64),
        widths=np.array([1.0], dtype=np.float64),
        overlapping_stroke_ids={2}
    )

    stroke2 = Stroke(
        id=2,
        spine=np.array([[1.0, 1.0]], dtype=np.float64),
        widths=np.array([1.0], dtype=np.float64),
        overlapping_stroke_ids={1}
    )

    decomp = StrokeDecomposition(glyph_name='A', strokes=[stroke1, stroke2])
    overlap_matrix = decomp.get_overlap_matrix()

    # Should be 2x2 symmetric matrix
    assert overlap_matrix.shape == (2, 2)

    # Diagonal should be True (stroke overlaps with itself)
    assert overlap_matrix[0, 0] == True
    assert overlap_matrix[1, 1] == True

    # Off-diagonal should show overlap
    assert overlap_matrix[0, 1] == True
    assert overlap_matrix[1, 0] == True


def test_decomposition_serialization():
    """Test StrokeDecomposition to_dict and from_dict."""
    strokes = [
        Stroke(id=1, spine=np.array([[0.0, 0.0]], dtype=np.float64),
               widths=np.array([1.0], dtype=np.float64))
    ]

    decomp = StrokeDecomposition(
        glyph_name='A',
        strokes=strokes,
        coverage=0.85
    )

    # Serialize
    data = decomp.to_dict()
    assert data['glyph_name'] == 'A'
    assert data['coverage'] == 0.85
    assert len(data['strokes']) == 1

    # Deserialize
    decomp2 = StrokeDecomposition.from_dict(data)
    assert decomp2.glyph_name == decomp.glyph_name
    assert decomp2.coverage == decomp.coverage
    assert decomp2.num_strokes() == decomp.num_strokes()


def test_decomposition_get_stroke_by_id():
    """Test StrokeDecomposition stroke lookup by ID."""
    stroke1 = Stroke(id=10, spine=np.array([[0.0, 0.0]], dtype=np.float64),
                     widths=np.array([1.0], dtype=np.float64))
    stroke2 = Stroke(id=20, spine=np.array([[1.0, 1.0]], dtype=np.float64),
                     widths=np.array([1.0], dtype=np.float64))

    decomp = StrokeDecomposition(glyph_name='A', strokes=[stroke1, stroke2])

    # Find existing
    found = decomp.get_stroke_by_id(10)
    assert found is not None
    assert found.id == 10

    # Not found
    not_found = decomp.get_stroke_by_id(999)
    assert not_found is None


def test_decomposition_overlapping_pairs():
    """Test StrokeDecomposition overlapping pairs extraction."""
    stroke1 = Stroke(
        id=1,
        spine=np.array([[0.0, 0.0]], dtype=np.float64),
        widths=np.array([1.0], dtype=np.float64),
        overlapping_stroke_ids={2, 3}
    )

    stroke2 = Stroke(
        id=2,
        spine=np.array([[1.0, 1.0]], dtype=np.float64),
        widths=np.array([1.0], dtype=np.float64),
        overlapping_stroke_ids={1}
    )

    stroke3 = Stroke(
        id=3,
        spine=np.array([[2.0, 2.0]], dtype=np.float64),
        widths=np.array([1.0], dtype=np.float64),
        overlapping_stroke_ids={1}
    )

    decomp = StrokeDecomposition(glyph_name='A', strokes=[stroke1, stroke2, stroke3])
    pairs = decomp.get_overlapping_pairs()

    # Should have pairs (1,2) and (1,3)
    assert (1, 2) in pairs
    assert (1, 3) in pairs
    assert len(pairs) == 2
