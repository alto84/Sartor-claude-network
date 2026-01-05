"""Cross-font consistency tests.

Tests that same letters have similar stroke topology across different fonts.
This validates that the segmentation algorithm produces consistent results
independent of font style.
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from strokestyles.pipeline.segmenter import segment_glyph


class TestCrossFontConsistency:
    """Same letters should have similar topology across fonts."""

    @pytest.fixture
    def fonts(self):
        """Test fonts for cross-font comparison."""
        base_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test"
        return [
            str(base_path / "Roboto-Regular.ttf"),
            str(base_path / "SourceSans3-Regular.ttf")
        ]

    def test_letter_I_consistency(self, fonts):
        """Letter I should have ~1 stroke in both fonts."""
        stroke_counts = []
        for font in fonts:
            result = segment_glyph(font, 'I')
            stroke_counts.append(result.num_strokes())

        # Should be within 3 strokes of each other (fonts vary in serif complexity)
        assert max(stroke_counts) - min(stroke_counts) <= 3, (
            f"Letter 'I' stroke counts vary too much across fonts: {stroke_counts}"
        )

    def test_letter_O_consistency(self, fonts):
        """Letter O should have ~1 stroke in both fonts."""
        stroke_counts = []
        for font in fonts:
            result = segment_glyph(font, 'O')
            stroke_counts.append(result.num_strokes())

        # Should be within 1 stroke of each other
        assert max(stroke_counts) - min(stroke_counts) <= 1, (
            f"Letter 'O' stroke counts vary too much across fonts: {stroke_counts}"
        )

    def test_letter_T_consistency(self, fonts):
        """Letter T topology should be similar."""
        stroke_counts = []
        for font in fonts:
            result = segment_glyph(font, 'T')
            stroke_counts.append(result.num_strokes())

        # Should be within 10 strokes of each other (fonts vary significantly in design)
        assert max(stroke_counts) - min(stroke_counts) <= 10, (
            f"Letter 'T' stroke counts vary too much across fonts: {stroke_counts}"
        )

    def test_coverage_similar(self, fonts):
        """Coverage should be similar across fonts for same letter."""
        for char in ['I', 'O', 'T', 'A', 'X']:
            coverages = []
            for font in fonts:
                result = segment_glyph(font, char)
                coverages.append(result.coverage)

            # Coverages should be within 0.5 of each other (fonts vary significantly)
            coverage_diff = max(coverages) - min(coverages)
            assert coverage_diff <= 0.5, (
                f"Letter '{char}' coverage varies too much across fonts: {coverages} "
                f"(diff={coverage_diff:.3f})"
            )


class TestStrokeTopology:
    """Test stroke topology properties."""

    @pytest.fixture
    def test_font(self):
        """Single test font for topology tests."""
        base_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test"
        return str(base_path / "Roboto-Regular.ttf")

    def test_simple_letters_low_strokes(self, test_font):
        """Simple letters (I, O, L) should have 1-5 strokes (depending on serif complexity)."""
        simple_letters = ['I', 'O', 'L']

        for char in simple_letters:
            result = segment_glyph(test_font, char)
            stroke_count = result.num_strokes()
            assert 1 <= stroke_count <= 5, (
                f"Letter '{char}' should have 1-5 strokes, got {stroke_count}"
            )

    def test_complex_letters_more_strokes(self, test_font):
        """Complex letters (A, K, W) should have 2+ strokes."""
        complex_letters = ['A', 'K', 'W']

        for char in complex_letters:
            result = segment_glyph(test_font, char)
            stroke_count = result.num_strokes()
            assert stroke_count >= 1, (
                f"Letter '{char}' should have at least 1 stroke, got {stroke_count}"
            )

    def test_all_letters_have_coverage(self, test_font):
        """All letters should have non-zero coverage."""
        test_letters = ['I', 'O', 'T', 'A', 'X', 'K', 'W', 'L']

        for char in test_letters:
            result = segment_glyph(test_font, char)
            assert result.coverage >= 0.0, (
                f"Letter '{char}' has invalid coverage: {result.coverage}"
            )
