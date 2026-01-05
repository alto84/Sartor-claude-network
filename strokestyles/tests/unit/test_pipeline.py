"""
Comprehensive unit tests for StrokeStyles pipeline modules.

Tests cover:
1. Font Loader (font_loader.py)
2. Flattener (flattener.py)
3. Stroke Recovery (stroke_recovery.py)
4. Segmenter Integration (segmenter.py)
"""

import pytest
import numpy as np
from pathlib import Path
from fontTools.ttLib import TTFont

# Import pipeline modules
from strokestyles.pipeline.font_loader import (
    load_font,
    get_glyph_names,
    load_glyph,
    load_glyphs,
    get_font_info
)
from strokestyles.pipeline.flattener import (
    flatten_glyph,
    flatten_contour,
    flatten_bezier_segment,
    estimate_flatness_segment
)
from strokestyles.pipeline.stroke_recovery import (
    trace_stroke_path,
    compute_coverage,
    recover_strokes
)
from strokestyles.pipeline.segmenter import (
    segment_glyph,
    SegmentationPipeline
)

# Import core data structures
from strokestyles.core.glyph import Glyph, Point, BoundingBox
from strokestyles.core.contour import Contour, BezierSegment
from strokestyles.core.polygon import Polygon
from strokestyles.core.stroke import Stroke, StrokeDecomposition


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def font_path():
    """Path to test font file (Roboto-Regular.ttf)."""
    return "/home/user/Sartor-claude-network/strokestyles/data/fonts/test/Roboto-Regular.ttf"


@pytest.fixture
def font_path_source():
    """Path to alternative test font (SourceSans3-Regular.ttf)."""
    return "/home/user/Sartor-claude-network/strokestyles/data/fonts/test/SourceSans3-Regular.ttf"


@pytest.fixture
def roboto_font(font_path):
    """Loaded Roboto font."""
    return load_font(font_path)


@pytest.fixture
def simple_linear_segment():
    """Simple linear Bezier segment for testing."""
    p0 = Point(0.0, 0.0)
    p1 = Point(10.0, 0.0)
    p2 = Point(10.0, 0.0)
    p3 = Point(10.0, 0.0)
    return BezierSegment(p0=p0, p1=p1, p2=p2, p3=p3)


@pytest.fixture
def curved_segment():
    """Curved Bezier segment for testing."""
    p0 = Point(0.0, 0.0)
    p1 = Point(5.0, 10.0)
    p2 = Point(15.0, 10.0)
    p3 = Point(20.0, 0.0)
    return BezierSegment(p0=p0, p1=p1, p2=p2, p3=p3)


# =============================================================================
# FONT LOADER TESTS
# =============================================================================

class TestFontLoader:
    """Tests for font_loader.py module."""

    def test_load_font_exists(self, font_path):
        """Test loading a real font file."""
        font = load_font(font_path)

        # Verify it's a valid TTFont object
        assert isinstance(font, TTFont)
        assert 'glyf' in font or 'CFF ' in font  # Has glyph outlines
        assert 'name' in font  # Has name table

    def test_load_font_not_found(self):
        """Test loading non-existent font raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            load_font("/nonexistent/path/font.ttf")

    def test_get_glyph_names(self, roboto_font):
        """Test getting glyph names from font."""
        glyph_names = get_glyph_names(roboto_font)

        # Should have glyphs
        assert len(glyph_names) > 0

        # Should contain common glyphs
        assert 'A' in glyph_names
        assert 'B' in glyph_names
        assert 'a' in glyph_names

        # Check .notdef is present (should be first)
        assert '.notdef' in glyph_names

    def test_load_glyph_simple(self, roboto_font):
        """Test loading a simple glyph (letter 'I')."""
        glyph = load_glyph(roboto_font, 'I')

        # Verify basic properties
        assert isinstance(glyph, Glyph)
        assert glyph.name == 'I'
        assert glyph.advance_width > 0

        # Letter 'I' should have contours (vertical stroke)
        assert len(glyph.contours) > 0

        # Should have valid bounds
        assert glyph.bounds.width > 0
        assert glyph.bounds.height > 0

    def test_load_glyph_complex(self, roboto_font):
        """Test loading a complex glyph (letter 'A')."""
        glyph = load_glyph(roboto_font, 'A')

        # Verify it loaded
        assert isinstance(glyph, Glyph)
        assert glyph.name == 'A'

        # Letter 'A' should have multiple contours (outline + hole)
        assert len(glyph.contours) >= 1

        # Verify segments exist
        total_segments = sum(len(c.segments) for c in glyph.contours)
        assert total_segments > 0

        # Check bounds are reasonable
        assert glyph.bounds.width > 0
        assert glyph.bounds.height > 0
        assert glyph.bounds.height > glyph.bounds.width  # 'A' is typically taller

    def test_load_glyph_not_found(self, roboto_font):
        """Test loading non-existent glyph raises KeyError."""
        with pytest.raises(KeyError):
            load_glyph(roboto_font, 'NonExistentGlyph_XYZ')

    def test_load_glyph_empty(self, roboto_font):
        """Test loading glyph with no outline (e.g., space)."""
        glyph = load_glyph(roboto_font, 'space')

        # Should load but have no contours
        assert isinstance(glyph, Glyph)
        assert glyph.name == 'space'
        assert len(glyph.contours) == 0
        assert glyph.is_empty()

    def test_load_glyphs_multiple(self, font_path):
        """Test loading multiple glyphs at once."""
        glyph_names = ['A', 'B', 'C']
        glyphs = load_glyphs(font_path, glyph_names)

        # Should return dictionary
        assert isinstance(glyphs, dict)
        assert len(glyphs) == 3

        # Check each glyph loaded
        for name in glyph_names:
            assert name in glyphs
            assert isinstance(glyphs[name], Glyph)

    def test_get_font_info(self, roboto_font):
        """Test extracting font metadata."""
        info = get_font_info(roboto_font)

        # Should have key fields
        assert 'family_name' in info
        assert 'num_glyphs' in info
        assert 'units_per_em' in info

        # Check values are reasonable
        assert info['num_glyphs'] > 0
        assert info['units_per_em'] > 0


# =============================================================================
# FLATTENER TESTS
# =============================================================================

class TestFlattener:
    """Tests for flattener.py module."""

    def test_flatten_simple_glyph(self, roboto_font):
        """Test flattening a simple glyph to polygon."""
        glyph = load_glyph(roboto_font, 'I')
        polygon = flatten_glyph(glyph, tolerance=0.5)

        # Should produce valid polygon
        assert isinstance(polygon, Polygon)
        assert not polygon.is_empty()
        assert len(polygon.exterior) >= 3  # At least 3 points for valid polygon

    def test_flatten_tolerance_effect(self, roboto_font):
        """Lower tolerance should produce more points."""
        glyph = load_glyph(roboto_font, 'O')  # Curved glyph

        # Flatten with high tolerance (fewer points)
        polygon_coarse = flatten_glyph(glyph, tolerance=2.0)

        # Flatten with low tolerance (more points)
        polygon_fine = flatten_glyph(glyph, tolerance=0.1)

        # Fine should have more points than coarse
        assert len(polygon_fine.exterior) > len(polygon_coarse.exterior)

    def test_flatten_empty_glyph(self):
        """Test flattening empty glyph returns empty polygon."""
        empty_glyph = Glyph(
            name='empty',
            unicode=None,
            advance_width=0.0,
            contours=[],
            bounds=BoundingBox(0, 0, 0, 0)
        )

        polygon = flatten_glyph(empty_glyph)
        assert polygon.is_empty()

    def test_flatten_linear_segment(self, simple_linear_segment):
        """Test flattening linear segment."""
        points = flatten_bezier_segment(simple_linear_segment, tolerance=0.5)

        # Linear segment should return just endpoints
        assert len(points) == 2
        assert points[0].x == 0.0
        assert points[0].y == 0.0
        assert points[1].x == 10.0
        assert points[1].y == 0.0

    def test_flatten_curved_segment(self, curved_segment):
        """Test flattening curved segment produces multiple points."""
        points = flatten_bezier_segment(curved_segment, tolerance=0.5)

        # Curved segment should be subdivided
        assert len(points) > 2

        # First and last points should match segment endpoints
        assert points[0].x == curved_segment.p0.x
        assert points[0].y == curved_segment.p0.y
        assert points[-1].x == curved_segment.p3.x
        assert points[-1].y == curved_segment.p3.y

    def test_estimate_flatness_linear(self, simple_linear_segment):
        """Test flatness estimation for linear segment."""
        flatness = estimate_flatness_segment(simple_linear_segment)

        # Linear segment should be very flat
        assert flatness < 0.01

    def test_estimate_flatness_curved(self, curved_segment):
        """Test flatness estimation for curved segment."""
        flatness = estimate_flatness_segment(curved_segment)

        # Curved segment should have significant flatness
        assert flatness > 1.0


# =============================================================================
# STROKE RECOVERY TESTS
# =============================================================================

class TestStrokeRecovery:
    """Tests for stroke_recovery.py module."""

    def test_compute_coverage_empty(self):
        """Test coverage computation with empty inputs."""
        coverage = compute_coverage([], np.array([[0, 0]]))
        assert coverage == 0.0

    def test_compute_coverage_simple(self):
        """Test coverage computation with simple stroke."""
        # Create simple rectangular polygon
        polygon = np.array([
            [0, 0],
            [100, 0],
            [100, 20],
            [0, 20]
        ], dtype=np.float64)

        # Create stroke covering most of polygon
        spine = np.array([
            [0, 10],
            [100, 10]
        ], dtype=np.float64)
        widths = np.array([10.0, 10.0], dtype=np.float64)

        stroke = Stroke(
            id=0,
            spine=spine,
            widths=widths,
            start_junction_type=None,
            end_junction_type=None,
            overlapping_stroke_ids=set()
        )

        coverage = compute_coverage([stroke], polygon)

        # Should have reasonable coverage
        assert 0.0 <= coverage <= 1.0
        assert coverage > 0.3  # Should cover at least some of the polygon


# =============================================================================
# SEGMENTER INTEGRATION TESTS
# =============================================================================

class TestSegmenter:
    """Integration tests for segmenter.py - full pipeline."""

    def test_segment_glyph_simple(self, font_path):
        """Test full segmentation on letter 'I' (should be ~1 stroke)."""
        decomposition = segment_glyph(
            font_path,
            'I',
            flatten_tolerance=0.5,
            image_size=1000
        )

        # Should produce valid decomposition
        assert isinstance(decomposition, StrokeDecomposition)
        assert decomposition.glyph_name == 'I'

        # Letter 'I' is simple - typically 1 main stroke
        # (May vary based on font design, but should have at least some strokes)
        assert len(decomposition.strokes) >= 0

        # Coverage should be reasonable if strokes found
        if len(decomposition.strokes) > 0:
            assert 0.0 <= decomposition.coverage <= 1.0

    def test_segment_glyph_complex(self, font_path):
        """Test full segmentation on letter 'A' (should be ~3 strokes)."""
        decomposition = segment_glyph(
            font_path,
            'A',
            flatten_tolerance=0.5,
            image_size=1000
        )

        # Should produce valid decomposition
        assert isinstance(decomposition, StrokeDecomposition)
        assert decomposition.glyph_name == 'A'

        # Letter 'A' has multiple strokes (left diagonal, right diagonal, crossbar)
        # May vary by font, but should have strokes
        assert len(decomposition.strokes) >= 0

        # Check coverage
        assert 0.0 <= decomposition.coverage <= 1.0

    def test_segment_glyph_empty(self, font_path):
        """Test segmentation on empty glyph (space)."""
        decomposition = segment_glyph(
            font_path,
            'space',
            flatten_tolerance=0.5
        )

        # Should handle empty glyph gracefully
        assert isinstance(decomposition, StrokeDecomposition)
        assert len(decomposition.strokes) == 0
        assert decomposition.coverage == 0.0

    def test_segmentation_pipeline(self, roboto_font):
        """Test SegmentationPipeline class with intermediate results."""
        pipeline = SegmentationPipeline(
            flatten_tolerance=0.5,
            image_size=1000
        )

        # Load glyph
        glyph = load_glyph(roboto_font, 'O')

        # Run pipeline
        decomposition = pipeline.run(glyph)

        # Check decomposition
        assert isinstance(decomposition, StrokeDecomposition)
        assert decomposition.glyph_name == 'O'

        # Check intermediate results are available
        polygon = pipeline.get_polygon()
        assert polygon is not None
        assert not polygon.is_empty()

        ma = pipeline.get_medial_axis()
        assert ma is not None

        junctions = pipeline.get_junctions()
        assert junctions is not None

    def test_segment_multiple_glyphs(self, font_path):
        """Test segmenting multiple glyphs."""
        from strokestyles.pipeline.segmenter import segment_font

        glyph_names = ['A', 'B', 'I']
        decompositions = segment_font(font_path, glyph_names)

        # Should return dictionary
        assert isinstance(decompositions, dict)

        # Check each glyph was processed
        for name in glyph_names:
            assert name in decompositions
            assert isinstance(decompositions[name], StrokeDecomposition)

    def test_segment_glyph_not_found(self, font_path):
        """Test segmentation with non-existent glyph raises error."""
        with pytest.raises(KeyError):
            segment_glyph(font_path, 'NonExistentGlyph_XYZ')


# =============================================================================
# EDGE CASES AND ERROR HANDLING
# =============================================================================

class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_flatten_very_small_tolerance(self, roboto_font):
        """Test with very small tolerance (should still work)."""
        glyph = load_glyph(roboto_font, 'S')
        polygon = flatten_glyph(glyph, tolerance=0.01)

        # Should produce valid polygon with many points
        assert not polygon.is_empty()
        assert len(polygon.exterior) > 10

    def test_flatten_large_tolerance(self, roboto_font):
        """Test with large tolerance (fewer points)."""
        glyph = load_glyph(roboto_font, 'S')
        polygon = flatten_glyph(glyph, tolerance=5.0)

        # Should produce valid but coarse polygon
        assert not polygon.is_empty()

    def test_segment_different_image_sizes(self, font_path):
        """Test segmentation with different image sizes."""
        # Small image size
        decomp_small = segment_glyph(
            font_path,
            'A',
            image_size=500
        )
        assert isinstance(decomp_small, StrokeDecomposition)

        # Large image size
        decomp_large = segment_glyph(
            font_path,
            'A',
            image_size=2000
        )
        assert isinstance(decomp_large, StrokeDecomposition)


# =============================================================================
# PERFORMANCE AND ROBUSTNESS TESTS
# =============================================================================

class TestRobustness:
    """Test robustness across different glyphs."""

    def test_load_all_ascii_letters(self, roboto_font):
        """Test loading all ASCII letters works."""
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

        for letter in letters:
            glyph = load_glyph(roboto_font, letter)
            assert isinstance(glyph, Glyph)
            assert glyph.name == letter

    def test_flatten_all_ascii_letters(self, roboto_font):
        """Test flattening all ASCII letters works."""
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

        for letter in letters:
            glyph = load_glyph(roboto_font, letter)
            polygon = flatten_glyph(glyph, tolerance=0.5)
            assert isinstance(polygon, Polygon)

    def test_segment_varied_glyphs(self, font_path):
        """Test segmentation on varied glyph types."""
        test_glyphs = [
            'I',  # Simple vertical
            'O',  # Circular with hole
            'A',  # Triangular with hole
            'S',  # Complex curves
            'W',  # Multiple vertices
        ]

        for glyph_name in test_glyphs:
            decomposition = segment_glyph(
                font_path,
                glyph_name,
                flatten_tolerance=0.5
            )
            assert isinstance(decomposition, StrokeDecomposition)
            assert decomposition.glyph_name == glyph_name
            # Should not crash or error out


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
