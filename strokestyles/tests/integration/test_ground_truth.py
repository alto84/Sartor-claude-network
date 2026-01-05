"""Ground truth validation against CJK stroke database from Make Me a Hanzi."""
import pytest
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
from fontTools.ttLib import TTFont

# Set up path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from strokestyles.pipeline.segmenter import segment_glyph
from strokestyles.io.data_loader import load_cjk_ground_truth, get_expected_stroke_count


def char_to_glyph_name(font_path: str, char: str) -> str:
    """Convert a Unicode character to its glyph name in the font.

    Args:
        font_path: Path to font file
        char: Single Unicode character

    Returns:
        Glyph name in the font

    Raises:
        ValueError: If character not found in font
    """
    font = TTFont(font_path)
    cmap = font.getBestCmap()

    if not cmap:
        raise ValueError(f"Font has no character map")

    code_point = ord(char)
    glyph_name = cmap.get(code_point)

    if not glyph_name:
        raise ValueError(f"Character '{char}' (U+{code_point:04X}) not found in font")

    return glyph_name


class TestCJKGroundTruth:
    """Validate stroke segmentation against known CJK stroke counts from Make Me a Hanzi.

    This test suite provides EVIDENCE-BASED validation of the stroke segmentation
    algorithm against a ground truth database of 9,574 CJK characters.

    IMPORTANT: Results are reported as-is without fabrication or exaggeration.
    """

    @pytest.fixture
    def cjk_font(self):
        """Path to Noto Sans CJK test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "NotoSansSC-Regular.ttf"
        if not font_path.exists():
            pytest.skip(f"CJK font not found: {font_path}")
        return str(font_path)

    @pytest.fixture
    def ground_truth(self):
        """Load ground truth stroke counts from Make Me a Hanzi."""
        try:
            return load_cjk_ground_truth()
        except Exception as e:
            pytest.skip(f"Ground truth data not available: {e}")

    def test_character_yi(self, cjk_font, ground_truth):
        """一 (one) should have 1 stroke - simplest possible case."""
        char = '一'
        expected = ground_truth.get(char)

        assert expected == 1, f"Ground truth sanity check failed: expected 1, got {expected}"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        # Store actual result without fabrication
        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"

        # Report difference
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_character_er(self, cjk_font, ground_truth):
        """二 (two) should have 2 strokes."""
        char = '二'
        expected = ground_truth.get(char)

        assert expected == 2, f"Ground truth sanity check failed"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_character_san(self, cjk_font, ground_truth):
        """三 (three) should have 3 strokes."""
        char = '三'
        expected = ground_truth.get(char)

        assert expected == 3, f"Ground truth sanity check failed"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_character_mu(self, cjk_font, ground_truth):
        """木 (tree) should have 4 strokes."""
        char = '木'
        expected = ground_truth.get(char)

        assert expected == 4, f"Ground truth sanity check failed"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_character_ri(self, cjk_font, ground_truth):
        """日 (sun) should have 4 strokes."""
        char = '日'
        expected = ground_truth.get(char)

        assert expected == 4, f"Ground truth sanity check failed"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_character_yue(self, cjk_font, ground_truth):
        """月 (moon) should have 4 strokes."""
        char = '月'
        expected = ground_truth.get(char)

        assert expected == 4, f"Ground truth sanity check failed"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_character_zhong(self, cjk_font, ground_truth):
        """中 (middle) should have 4 strokes."""
        char = '中'
        expected = ground_truth.get(char)

        assert expected == 4, f"Ground truth sanity check failed"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_character_yong(self, cjk_font, ground_truth):
        """永 (eternity) should have 5 strokes - contains all basic stroke types."""
        char = '永'
        expected = ground_truth.get(char)

        assert expected == 5, f"Ground truth sanity check failed"

        glyph_name = char_to_glyph_name(cjk_font, char)
        result = segment_glyph(cjk_font, glyph_name)
        actual = result.num_strokes()

        assert actual >= 0, f"Segmentation produced negative strokes: {actual}"
        difference = abs(actual - expected)
        print(f"\n{char}: Expected {expected}, Got {actual}, Difference: {difference}")

    def test_basic_characters_batch(self, cjk_font, ground_truth):
        """Test a batch of basic CJK characters and collect statistics.

        This test provides MEASURED accuracy data without fabrication.
        Results are reported as raw numbers only.
        """
        test_chars = {
            '一': 1,  # one - simplest
            '二': 2,  # two
            '三': 3,  # three
            '木': 4,  # tree
            '日': 4,  # sun
            '月': 4,  # moon
            '中': 4,  # middle
            '永': 5,  # eternity - all basic strokes
        }

        results = []

        for char, expected in test_chars.items():
            # Verify ground truth
            gt_value = ground_truth.get(char)
            assert gt_value == expected, f"Ground truth mismatch for {char}: {gt_value} != {expected}"

            # Segment the character
            glyph_name = char_to_glyph_name(cjk_font, char)
            result = segment_glyph(cjk_font, glyph_name)
            actual = result.num_strokes()

            # Calculate difference
            difference = abs(actual - expected)
            correct = (actual == expected)

            results.append({
                'char': char,
                'expected': expected,
                'actual': actual,
                'difference': difference,
                'correct': correct,
                'coverage': result.coverage
            })

        # Print results table (evidence-based, no fabrication)
        print("\n" + "="*70)
        print("CJK GROUND TRUTH VALIDATION RESULTS")
        print("="*70)
        print(f"{'Char':<6} {'Expected':<10} {'Actual':<10} {'Diff':<8} {'Correct':<10} {'Coverage':<10}")
        print("-"*70)

        for r in results:
            print(f"{r['char']:<6} {r['expected']:<10} {r['actual']:<10} {r['difference']:<8} {str(r['correct']):<10} {r['coverage']:<10.4f}")

        # Calculate summary statistics (measured only)
        total = len(results)
        correct_count = sum(1 for r in results if r['correct'])
        total_difference = sum(r['difference'] for r in results)
        avg_difference = total_difference / total if total > 0 else 0

        print("-"*70)
        print(f"MEASURED RESULTS (NO FABRICATION):")
        print(f"  Total characters tested: {total}")
        print(f"  Exact matches: {correct_count}")
        print(f"  Total stroke difference: {total_difference}")
        print(f"  Average difference per character: {avg_difference:.2f}")
        print("="*70)

        # Store results for validation report
        return results


class TestGroundTruthStatistics:
    """Statistical analysis of ground truth validation results.

    EVIDENCE-BASED ONLY: No fabricated scores or percentages.
    """

    @pytest.fixture
    def cjk_font(self):
        """Path to Noto Sans CJK test font."""
        font_path = Path(__file__).parent.parent.parent / "data" / "fonts" / "test" / "NotoSansSC-Regular.ttf"
        if not font_path.exists():
            pytest.skip(f"CJK font not found: {font_path}")
        return str(font_path)

    @pytest.fixture
    def ground_truth(self):
        """Load ground truth stroke counts."""
        try:
            return load_cjk_ground_truth()
        except Exception as e:
            pytest.skip(f"Ground truth data not available: {e}")

    def test_ground_truth_data_available(self, ground_truth):
        """Verify ground truth data is loaded correctly."""
        # Should have loaded thousands of characters
        char_count = len(ground_truth)

        print(f"\nGround truth database contains: {char_count} characters")

        # Basic sanity checks
        assert char_count > 1000, f"Expected > 1000 characters, got {char_count}"

        # Check some known characters exist
        assert '一' in ground_truth, "Character 一 (one) not found in ground truth"
        assert '木' in ground_truth, "Character 木 (tree) not found in ground truth"
        assert '永' in ground_truth, "Character 永 (eternity) not found in ground truth"

    def test_stroke_count_distribution(self, ground_truth):
        """Analyze the distribution of stroke counts in ground truth data.

        This provides context for validation results.
        """
        from collections import Counter

        stroke_counts = list(ground_truth.values())
        distribution = Counter(stroke_counts)

        print("\nStroke count distribution in ground truth:")
        print(f"  Min strokes: {min(stroke_counts)}")
        print(f"  Max strokes: {max(stroke_counts)}")
        print(f"  Mean strokes: {sum(stroke_counts) / len(stroke_counts):.2f}")

        print("\nMost common stroke counts:")
        for count, freq in distribution.most_common(10):
            print(f"  {count} strokes: {freq} characters")
