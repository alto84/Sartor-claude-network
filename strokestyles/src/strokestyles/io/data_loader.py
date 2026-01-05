"""Load test data and ground truth for stroke detection validation.

This module provides utilities to load:
- Test fonts (Roboto, Source Sans 3)
- CJK ground truth data from Make Me a Hanzi
- Test character manifests
- Fallback test shapes
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any

# Calculate path to data directory
# From: strokestyles/src/strokestyles/io/data_loader.py
# To: strokestyles/data/
_MODULE_DIR = Path(__file__).parent
_PACKAGE_DIR = _MODULE_DIR.parent.parent
_PROJECT_ROOT = _PACKAGE_DIR.parent
DATA_DIR = _PROJECT_ROOT / "data"

# Subdirectories
FONTS_DIR = DATA_DIR / "fonts" / "test"
GROUND_TRUTH_DIR = DATA_DIR / "ground_truth"


class DataLoaderError(Exception):
    """Raised when data cannot be loaded."""
    pass


def get_test_font_path(name: str = "Roboto-Regular.ttf") -> Path:
    """Get path to a test font.

    Args:
        name: Font filename. Options:
            - "Roboto-Regular.ttf" (default)
            - "SourceSans3-Regular.ttf"

    Returns:
        Path to the font file

    Raises:
        DataLoaderError: If font file doesn't exist
    """
    font_path = FONTS_DIR / name
    if not font_path.exists():
        raise DataLoaderError(
            f"Font not found: {font_path}\n"
            f"Available fonts: {list(FONTS_DIR.glob('*.ttf')) if FONTS_DIR.exists() else 'none'}"
        )
    return font_path


def load_test_characters() -> Dict[str, Any]:
    """Load test character manifest.

    Returns:
        Dictionary with character lists for testing:
        {
            "latin_simple": ["I", "O", ...],
            "latin_complex": ["A", "B", ...],
            "cjk_validation": {"永": {"expected_strokes": 5, ...}, ...},
            "stress_test": ["&", "@", ...]
        }

    Raises:
        DataLoaderError: If manifest file doesn't exist or is invalid
    """
    manifest_path = DATA_DIR / "test_characters.json"
    if not manifest_path.exists():
        raise DataLoaderError(f"Test character manifest not found: {manifest_path}")

    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise DataLoaderError(f"Invalid JSON in test character manifest: {e}")


def load_test_shapes() -> Dict[str, Any]:
    """Load fallback test shapes for basic validation.

    Returns:
        Dictionary with simple polygon definitions for testing

    Raises:
        DataLoaderError: If test shapes file doesn't exist or is invalid
    """
    shapes_path = FONTS_DIR / "test_shapes.json"
    if not shapes_path.exists():
        raise DataLoaderError(f"Test shapes file not found: {shapes_path}")

    try:
        with open(shapes_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise DataLoaderError(f"Invalid JSON in test shapes: {e}")


def load_cjk_ground_truth() -> Dict[str, int]:
    """Load CJK character to stroke count mapping from Make Me a Hanzi.

    Parses graphics.txt to extract stroke counts for each character.

    Returns:
        Dictionary mapping characters to stroke counts:
        {"一": 1, "木": 4, "永": 5, ...}

    Raises:
        DataLoaderError: If graphics.txt doesn't exist or is invalid
    """
    graphics_path = GROUND_TRUTH_DIR / "graphics.txt"
    if not graphics_path.exists():
        raise DataLoaderError(
            f"Make Me a Hanzi graphics not found: {graphics_path}\n"
            f"Download from: https://github.com/skishore/makemeahanzi"
        )

    stroke_counts = {}
    try:
        with open(graphics_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue

                try:
                    data = json.loads(line)
                    char = data.get('character')

                    # Try to get stroke count from various fields
                    strokes = None
                    if 'strokes' in data:
                        # Some entries have direct stroke array
                        if isinstance(data['strokes'], list):
                            strokes = len(data['strokes'])
                        elif isinstance(data['strokes'], int):
                            strokes = data['strokes']

                    # Fallback: try to extract from medians (one per stroke)
                    if strokes is None and 'medians' in data:
                        if isinstance(data['medians'], list):
                            strokes = len(data['medians'])

                    if char and strokes is not None:
                        stroke_counts[char] = strokes

                except json.JSONDecodeError:
                    # Skip malformed lines
                    continue
                except Exception as e:
                    # Log but don't fail on individual parsing errors
                    print(f"Warning: Error parsing line {line_num}: {e}")
                    continue

    except Exception as e:
        raise DataLoaderError(f"Error reading graphics.txt: {e}")

    if not stroke_counts:
        raise DataLoaderError("No stroke counts found in graphics.txt")

    return stroke_counts


def get_expected_stroke_count(char: str) -> Optional[int]:
    """Get expected stroke count for a CJK character.

    Args:
        char: A single CJK character

    Returns:
        Expected stroke count, or None if not found in ground truth
    """
    # Load from cache if available
    if not hasattr(get_expected_stroke_count, '_cache'):
        try:
            get_expected_stroke_count._cache = load_cjk_ground_truth()
        except DataLoaderError:
            get_expected_stroke_count._cache = {}

    return get_expected_stroke_count._cache.get(char)


def get_cjk_validation_characters() -> List[str]:
    """Get list of CJK characters suitable for validation.

    Returns characters from test_characters.json that have known stroke counts.

    Returns:
        List of CJK characters with ground truth data
    """
    try:
        manifest = load_test_characters()
        cjk_validation = manifest.get('cjk_validation', {})
        return list(cjk_validation.keys())
    except DataLoaderError:
        # Fallback to common validation characters
        return ["一", "木", "中", "永"]


def verify_data_integrity() -> Dict[str, bool]:
    """Verify that all required data files are present and valid.

    Returns:
        Dictionary with verification results for each data source:
        {
            "fonts": True/False,
            "test_characters": True/False,
            "test_shapes": True/False,
            "ground_truth": True/False
        }
    """
    results = {}

    # Check fonts
    try:
        get_test_font_path("Roboto-Regular.ttf")
        get_test_font_path("SourceSans3-Regular.ttf")
        results['fonts'] = True
    except DataLoaderError:
        results['fonts'] = False

    # Check test characters
    try:
        load_test_characters()
        results['test_characters'] = True
    except DataLoaderError:
        results['test_characters'] = False

    # Check test shapes
    try:
        load_test_shapes()
        results['test_shapes'] = True
    except DataLoaderError:
        results['test_shapes'] = False

    # Check ground truth
    try:
        ground_truth = load_cjk_ground_truth()
        results['ground_truth'] = len(ground_truth) > 0
    except DataLoaderError:
        results['ground_truth'] = False

    return results


if __name__ == "__main__":
    """Verify data integrity when run as script."""
    print("StrokeStyles Data Loader - Verification")
    print("=" * 50)
    print(f"Data directory: {DATA_DIR}")
    print(f"Fonts directory: {FONTS_DIR}")
    print(f"Ground truth directory: {GROUND_TRUTH_DIR}")
    print()

    results = verify_data_integrity()

    all_ok = True
    for component, ok in results.items():
        status = "✓ OK" if ok else "✗ MISSING"
        print(f"{component:20s} {status}")
        if not ok:
            all_ok = False

    print()
    if all_ok:
        print("All data sources verified successfully!")

        # Show some stats
        try:
            ground_truth = load_cjk_ground_truth()
            print(f"\nGround truth contains {len(ground_truth)} characters")

            # Show a few examples
            validation_chars = get_cjk_validation_characters()
            print(f"\nValidation characters:")
            for char in validation_chars[:5]:  # Show first 5
                strokes = get_expected_stroke_count(char)
                print(f"  {char}: {strokes} strokes")
        except Exception as e:
            print(f"\nNote: {e}")
    else:
        print("Some data sources are missing. Please run setup again.")
        exit(1)
