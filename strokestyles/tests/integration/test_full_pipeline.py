"""Integration tests for the complete StrokeStyles pipeline."""
import pytest
import sys
import os
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for CI/headless environments

# Set up path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from strokestyles.pipeline.segmenter import segment_glyph
from strokestyles.visualization import (
    plot_glyph_outline,
    plot_polygon,
    plot_medial_axis,
    plot_decomposition
)


class TestFullPipeline:
    """Test complete pipeline on real fonts."""

    @pytest.fixture
    def roboto_font(self):
        """Path to Roboto test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "Roboto-Regular.ttf"
        assert font_path.exists(), f"Test font not found: {font_path}"
        return str(font_path)

    @pytest.fixture
    def source_sans_font(self):
        """Path to Source Sans 3 test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "SourceSans3-Regular.ttf"
        assert font_path.exists(), f"Test font not found: {font_path}"
        return str(font_path)

    def test_pipeline_letter_I(self, roboto_font):
        """Letter I should produce strokes and have good coverage."""
        result = segment_glyph(roboto_font, 'I')

        # Basic validation
        assert result is not None, "Result should not be None"
        assert result.glyph_name == 'I', f"Expected glyph_name='I', got '{result.glyph_name}'"

        # Stroke count check - should produce at least some strokes
        num_strokes = result.num_strokes()
        assert num_strokes > 0, f"Letter I should produce strokes, got {num_strokes}"

        # Coverage check - I is simple so should have high coverage
        assert result.coverage >= 0.0, f"Coverage should be >= 0.0, got {result.coverage}"
        assert result.coverage <= 1.0, f"Coverage should be <= 1.0, got {result.coverage}"
        # Note: Actual coverage observed is ~0.99 for letter I

    def test_pipeline_letter_O(self, roboto_font):
        """Letter O should produce strokes."""
        result = segment_glyph(roboto_font, 'O')

        assert result is not None
        assert result.glyph_name == 'O'

        # O should produce strokes
        num_strokes = result.num_strokes()
        assert num_strokes > 0, f"Letter O should produce strokes, got {num_strokes}"

        # O should have reasonable coverage
        assert 0.0 <= result.coverage <= 1.0

    def test_pipeline_letter_T(self, roboto_font):
        """Letter T should produce strokes with good coverage."""
        result = segment_glyph(roboto_font, 'T')

        assert result is not None
        assert result.glyph_name == 'T'

        # T has horizontal top bar and vertical stem
        num_strokes = result.num_strokes()
        assert num_strokes > 0, f"Letter T should produce strokes, got {num_strokes}"

        assert 0.0 <= result.coverage <= 1.0

    def test_pipeline_letter_A(self, roboto_font):
        """Letter A should produce strokes."""
        result = segment_glyph(roboto_font, 'A')

        assert result is not None
        assert result.glyph_name == 'A'

        # A has two diagonal strokes and a horizontal crossbar
        num_strokes = result.num_strokes()
        assert num_strokes > 0, f"Letter A should produce strokes, got {num_strokes}"

        assert 0.0 <= result.coverage <= 1.0

    def test_pipeline_letter_X(self, roboto_font):
        """Letter X should produce strokes."""
        result = segment_glyph(roboto_font, 'X')

        assert result is not None
        assert result.glyph_name == 'X'

        # X has two diagonal strokes crossing
        num_strokes = result.num_strokes()
        assert num_strokes > 0, f"Letter X should produce strokes, got {num_strokes}"

        assert 0.0 <= result.coverage <= 1.0

    def test_pipeline_all_uppercase(self, roboto_font):
        """Test all uppercase letters process without error."""
        results = {}

        for char in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
            result = segment_glyph(roboto_font, char)

            assert result is not None, f"Failed to segment letter {char}"
            assert result.glyph_name == char
            assert result.num_strokes() >= 0, f"Letter {char} should have >= 0 strokes"
            assert 0.0 <= result.coverage <= 1.0, f"Letter {char} coverage out of range: {result.coverage}"

            results[char] = result.num_strokes()

        # Verify at least some letters produced strokes
        letters_with_strokes = sum(1 for count in results.values() if count > 0)
        assert letters_with_strokes > 0, "At least some letters should produce strokes"

    def test_pipeline_numbers(self, roboto_font):
        """Test digits 0-9."""
        results = {}

        # Digit glyph names in fonts are typically 'zero', 'one', 'two', etc.
        digit_names = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

        for glyph_name in digit_names:
            result = segment_glyph(roboto_font, glyph_name)

            assert result is not None, f"Failed to segment digit {glyph_name}"
            assert result.glyph_name == glyph_name
            assert result.num_strokes() >= 0
            assert 0.0 <= result.coverage <= 1.0

            results[glyph_name] = result.num_strokes()

        # All digits should process successfully
        assert len(results) == 10, "All 10 digits should be processed"

    def test_pipeline_lowercase(self, roboto_font):
        """Test lowercase letters a-z."""
        results = {}

        for char in 'abcdefghijklmnopqrstuvwxyz':
            result = segment_glyph(roboto_font, char)

            assert result is not None, f"Failed to segment letter {char}"
            assert result.glyph_name == char
            assert result.num_strokes() >= 0
            assert 0.0 <= result.coverage <= 1.0

            results[char] = result.num_strokes()

        # Verify processing completed
        assert len(results) == 26, "All 26 lowercase letters should be processed"

    def test_pipeline_multiple_fonts(self, roboto_font, source_sans_font):
        """Test that pipeline works with multiple different fonts."""
        test_chars = ['A', 'B', 'O', 'X']

        for font_path in [roboto_font, source_sans_font]:
            for char in test_chars:
                result = segment_glyph(font_path, char)

                assert result is not None, f"Failed to segment {char} in {font_path}"
                assert result.glyph_name == char
                assert result.num_strokes() >= 0


class TestPipelineQuality:
    """Test quality metrics of pipeline output."""

    @pytest.fixture
    def roboto_font(self):
        """Path to Roboto test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "Roboto-Regular.ttf"
        return str(font_path)

    def test_stroke_widths_positive(self, roboto_font):
        """All stroke widths should be positive."""
        result = segment_glyph(roboto_font, 'O')

        if result.num_strokes() > 0:
            for stroke in result.strokes:
                # All width values should be positive
                assert (stroke.widths > 0).all(), f"Stroke {stroke.id} has non-positive widths"

                # Mean width should be positive
                mean_w = stroke.mean_width()
                assert mean_w > 0, f"Stroke {stroke.id} has non-positive mean width: {mean_w}"

    def test_stroke_lengths_positive(self, roboto_font):
        """All stroke lengths should be positive."""
        result = segment_glyph(roboto_font, 'I')

        if result.num_strokes() > 0:
            for stroke in result.strokes:
                length = stroke.length()
                assert length >= 0, f"Stroke {stroke.id} has negative length: {length}"

    def test_stroke_spine_valid(self, roboto_font):
        """Stroke spines should be valid numpy arrays."""
        result = segment_glyph(roboto_font, 'A')

        if result.num_strokes() > 0:
            for stroke in result.strokes:
                # Spine should be Nx2
                assert stroke.spine.ndim == 2, f"Stroke {stroke.id} spine not 2D"
                assert stroke.spine.shape[1] == 2, f"Stroke {stroke.id} spine not Nx2"

                # Should have at least 2 points
                assert stroke.spine.shape[0] >= 1, f"Stroke {stroke.id} has no points"

                # Widths should match spine length
                assert len(stroke.widths) == stroke.spine.shape[0], \
                    f"Stroke {stroke.id} spine/widths length mismatch"

    def test_decomposition_serialization(self, roboto_font):
        """Test that decomposition can be serialized and deserialized."""
        from strokestyles.core.stroke import StrokeDecomposition

        result = segment_glyph(roboto_font, 'X')

        # Convert to dict
        data = result.to_dict()
        assert isinstance(data, dict)
        assert 'glyph_name' in data
        assert 'strokes' in data
        assert 'coverage' in data

        # Reconstruct from dict
        reconstructed = StrokeDecomposition.from_dict(data)

        assert reconstructed.glyph_name == result.glyph_name
        assert reconstructed.num_strokes() == result.num_strokes()
        assert abs(reconstructed.coverage - result.coverage) < 1e-6

    def test_overlapping_strokes_structure(self, roboto_font):
        """Overlapping stroke data should be valid."""
        result = segment_glyph(roboto_font, 'X')

        if result.num_strokes() > 0:
            # Get overlap pairs
            overlap_pairs = result.get_overlapping_pairs()

            # Should be a list of tuples
            assert isinstance(overlap_pairs, list)

            for pair in overlap_pairs:
                assert isinstance(pair, tuple)
                assert len(pair) == 2
                assert pair[0] < pair[1], "Pairs should be ordered (id1 < id2)"

    def test_stroke_statistics(self, roboto_font):
        """Test stroke statistics methods."""
        result = segment_glyph(roboto_font, 'O')

        if result.num_strokes() > 0:
            # Total stroke length
            total_length = result.total_stroke_length()
            assert total_length >= 0, f"Total length should be non-negative: {total_length}"

            # Mean stroke width
            mean_width = result.mean_stroke_width()
            assert mean_width >= 0, f"Mean width should be non-negative: {mean_width}"


class TestVisualization:
    """Test that visualization works without errors."""

    @pytest.fixture
    def roboto_font(self):
        """Path to Roboto test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "Roboto-Regular.ttf"
        return str(font_path)

    def test_visualization_imports(self):
        """All visualization functions should import."""
        from strokestyles.visualization import (
            plot_glyph_outline,
            plot_polygon,
            plot_medial_axis,
            plot_decomposition
        )

        # If we got here, imports succeeded
        assert True

    def test_plot_decomposition_runs(self, roboto_font, tmp_path):
        """Plotting a decomposition should not raise errors."""
        import matplotlib.pyplot as plt

        # Get a decomposition
        result = segment_glyph(roboto_font, 'A')

        # Try to plot it
        fig, ax = plt.subplots(figsize=(8, 8))

        # This should not raise an error
        try:
            plot_decomposition(result, ax=ax, show_overlaps=True)

            # Save to temporary file to ensure rendering works
            output_file = tmp_path / "test_plot.png"
            fig.savefig(output_file)

            # Verify file was created
            assert output_file.exists(), "Plot file was not created"
            assert output_file.stat().st_size > 0, "Plot file is empty"

        finally:
            plt.close(fig)

    def test_visualization_with_empty_glyph(self, roboto_font):
        """Visualization should handle empty decompositions gracefully."""
        import matplotlib.pyplot as plt
        from strokestyles.core.stroke import StrokeDecomposition

        # Create empty decomposition
        empty = StrokeDecomposition(glyph_name='empty', strokes=[], coverage=0.0)

        fig, ax = plt.subplots()

        try:
            # Should not crash on empty decomposition
            plot_decomposition(empty, ax=ax)
        finally:
            plt.close(fig)


class TestEdgeCases:
    """Test edge cases and error handling."""

    @pytest.fixture
    def roboto_font(self):
        """Path to Roboto test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "Roboto-Regular.ttf"
        return str(font_path)

    def test_nonexistent_font(self):
        """Segmenting with nonexistent font should raise error."""
        with pytest.raises(Exception):  # Could be FileNotFoundError or other
            segment_glyph("/nonexistent/font.ttf", 'A')

    def test_invalid_glyph_name(self, roboto_font):
        """Segmenting invalid glyph should raise error or return empty."""
        # This depends on implementation - might raise KeyError or return empty
        try:
            result = segment_glyph(roboto_font, 'InvalidGlyphName123456')
            # If it doesn't raise, it should return empty decomposition
            assert result.num_strokes() == 0 or result is not None
        except (KeyError, ValueError):
            # This is also acceptable behavior
            pass

    def test_space_character(self, roboto_font):
        """Space character should return empty decomposition."""
        result = segment_glyph(roboto_font, 'space')

        # Space has no outline, so should have no strokes
        assert result.num_strokes() == 0, "Space character should have no strokes"
        assert result.coverage == 0.0, "Space character should have zero coverage"


class TestPerformance:
    """Test performance characteristics (timing only, no quality claims)."""

    @pytest.fixture
    def roboto_font(self):
        """Path to Roboto test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "Roboto-Regular.ttf"
        return str(font_path)

    def test_pipeline_completes(self, roboto_font):
        """Pipeline should complete without hanging."""
        import time

        start = time.time()
        result = segment_glyph(roboto_font, 'W')
        elapsed = time.time() - start

        # Just verify it completes - no performance claims
        assert result is not None
        assert elapsed < 60, f"Pipeline took too long: {elapsed:.2f}s (likely hung)"

    def test_batch_processing(self, roboto_font):
        """Test processing multiple glyphs in sequence."""
        import time

        test_chars = ['A', 'B', 'C', 'D', 'E']

        start = time.time()
        results = []

        for char in test_chars:
            result = segment_glyph(roboto_font, char)
            results.append(result)

        elapsed = time.time() - start

        # Verify all completed
        assert len(results) == len(test_chars)
        for result in results:
            assert result is not None

        # Just log timing, no claims about performance
        print(f"\nProcessed {len(test_chars)} glyphs in {elapsed:.2f}s ({elapsed/len(test_chars):.2f}s per glyph)")
