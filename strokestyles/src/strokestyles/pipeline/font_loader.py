"""Load fonts and extract glyphs using fontTools."""
from typing import List, Optional, Dict, Tuple
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
import numpy as np

from strokestyles.core.glyph import Glyph, Point, BoundingBox
from strokestyles.core.contour import Contour, BezierSegment


def load_font(font_path: str) -> TTFont:
    """
    Load a font file (TTF or OTF).

    Args:
        font_path: Path to font file

    Returns:
        TTFont object

    Raises:
        FileNotFoundError: If font file doesn't exist
        Exception: If font file is invalid
    """
    try:
        font = TTFont(font_path)
        return font
    except FileNotFoundError:
        raise FileNotFoundError(f"Font file not found: {font_path}")
    except Exception as e:
        raise Exception(f"Failed to load font {font_path}: {e}")


def get_glyph_names(font: TTFont) -> List[str]:
    """
    Get all glyph names in the font.

    Args:
        font: TTFont object

    Returns:
        List of glyph names
    """
    try:
        return font.getGlyphOrder()
    except Exception:
        # Fallback to glyf table
        if 'glyf' in font:
            return list(font['glyf'].keys())
        return []


def load_glyph(font: TTFont, glyph_name: str) -> Glyph:
    """
    Load a single glyph from the font.

    Pipeline:
    1. Get glyph from font's glyph set
    2. Draw to RecordingPen to capture outlines
    3. Convert pen operations to BezierSegments
    4. Build Contour objects
    5. Return Glyph with all contours

    Args:
        font: TTFont object
        glyph_name: Name of glyph to load

    Returns:
        Glyph object

    Raises:
        KeyError: If glyph name not found
        ValueError: If glyph has no outline
    """
    # Get glyph set
    try:
        glyph_set = font.getGlyphSet()
    except Exception as e:
        raise ValueError(f"Failed to get glyph set: {e}")

    # Check if glyph exists
    if glyph_name not in glyph_set:
        raise KeyError(f"Glyph '{glyph_name}' not found in font")

    # Get glyph
    glyph = glyph_set[glyph_name]

    # Get advance width
    advance_width = glyph.width if hasattr(glyph, 'width') else 0.0

    # Record outline using RecordingPen
    pen = RecordingPen()
    try:
        glyph.draw(pen)
    except Exception as e:
        # Some glyphs (like space) have no outline
        return Glyph(
            name=glyph_name,
            unicode=_get_unicode(font, glyph_name),
            advance_width=advance_width,
            contours=[],
            bounds=BoundingBox(0, 0, 0, 0)
        )

    # Convert pen operations to contours
    contours = pen_to_contours(pen)

    # Compute bounding box
    if contours:
        all_points = []
        for contour in contours:
            for segment in contour.segments:
                all_points.append(segment.p0)
                if segment.p1 is not None:
                    all_points.append(segment.p1)
                if hasattr(segment, 'p2') and segment.p2 is not None:
                    all_points.append(segment.p2)
                if hasattr(segment, 'p3') and segment.p3 is not None:
                    all_points.append(segment.p3)

        bounds = BoundingBox.from_points(all_points)
    else:
        bounds = BoundingBox(0, 0, 0, 0)

    return Glyph(
        name=glyph_name,
        unicode=_get_unicode(font, glyph_name),
        advance_width=advance_width,
        contours=contours,
        bounds=bounds
    )


def pen_to_contours(pen: RecordingPen) -> List[Contour]:
    """
    Convert RecordingPen operations to Contour objects.

    RecordingPen records operations as:
    - ('moveTo', ((x, y),))
    - ('lineTo', ((x, y),))
    - ('curveTo', ((x1, y1), (x2, y2), (x3, y3)))  # Cubic Bezier
    - ('qCurveTo', (...))  # Quadratic Bezier
    - ('closePath', ())

    Args:
        pen: RecordingPen with recorded drawing operations

    Returns:
        List of Contour objects
    """
    contours = []
    current_segments = []
    start_point = None
    current_point = None

    for operation, args in pen.value:
        if operation == 'moveTo':
            # Start new contour
            if current_segments:
                # Close previous contour
                contours.append(Contour(segments=current_segments, is_clockwise=True))
                current_segments = []

            start_point = Point(args[0][0], args[0][1])
            current_point = start_point

        elif operation == 'lineTo':
            if current_point is None:
                continue

            end_point = Point(args[0][0], args[0][1])

            # Create linear Bezier segment
            segment = BezierSegment(
                p0=current_point,
                p1=end_point,
                p2=end_point,  # For linear, control points = endpoints
                p3=end_point
            )
            current_segments.append(segment)
            current_point = end_point

        elif operation == 'curveTo':
            if current_point is None:
                continue

            # Cubic Bezier curve
            if len(args) >= 3:
                p1 = Point(args[0][0], args[0][1])
                p2 = Point(args[1][0], args[1][1])
                p3 = Point(args[2][0], args[2][1])

                segment = BezierSegment(
                    p0=current_point,
                    p1=p1,
                    p2=p2,
                    p3=p3
                )
                current_segments.append(segment)
                current_point = p3

        elif operation == 'qCurveTo':
            if current_point is None:
                continue

            # Quadratic Bezier curve(s)
            # qCurveTo can have multiple control points for TrueType-style curves
            points = [Point(pt[0], pt[1]) for pt in args]

            if len(points) == 2:
                # Single quadratic: p0, p1 (control), p2 (end)
                p1 = points[0]
                p2 = points[1]

                # Convert quadratic to cubic Bezier
                # Cubic control points: p0, p1', p2', p3
                # p1' = p0 + 2/3 * (p1 - p0)
                # p2' = p3 + 2/3 * (p1 - p3)
                p1_cubic = Point(
                    current_point.x + 2/3 * (p1.x - current_point.x),
                    current_point.y + 2/3 * (p1.y - current_point.y)
                )
                p2_cubic = Point(
                    p2.x + 2/3 * (p1.x - p2.x),
                    p2.y + 2/3 * (p1.y - p2.y)
                )

                segment = BezierSegment(
                    p0=current_point,
                    p1=p1_cubic,
                    p2=p2_cubic,
                    p3=p2
                )
                current_segments.append(segment)
                current_point = p2

            else:
                # Multiple quadratic curves (TrueType style)
                # Convert each to cubic
                for i in range(len(points)):
                    if i == len(points) - 1:
                        # Last point is the end point
                        p1 = points[i-1] if i > 0 else points[0]
                        p2 = points[i]

                        p1_cubic = Point(
                            current_point.x + 2/3 * (p1.x - current_point.x),
                            current_point.y + 2/3 * (p1.y - current_point.y)
                        )
                        p2_cubic = Point(
                            p2.x + 2/3 * (p1.x - p2.x),
                            p2.y + 2/3 * (p1.y - p2.y)
                        )

                        segment = BezierSegment(
                            p0=current_point,
                            p1=p1_cubic,
                            p2=p2_cubic,
                            p3=p2
                        )
                        current_segments.append(segment)
                        current_point = p2
                    else:
                        # Intermediate control point
                        if i < len(points) - 1:
                            # On-curve point is midpoint between control points
                            p1 = points[i]
                            p2 = Point(
                                (points[i].x + points[i+1].x) / 2,
                                (points[i].y + points[i+1].y) / 2
                            )

                            p1_cubic = Point(
                                current_point.x + 2/3 * (p1.x - current_point.x),
                                current_point.y + 2/3 * (p1.y - current_point.y)
                            )
                            p2_cubic = Point(
                                p2.x + 2/3 * (p1.x - p2.x),
                                p2.y + 2/3 * (p1.y - p2.y)
                            )

                            segment = BezierSegment(
                                p0=current_point,
                                p1=p1_cubic,
                                p2=p2_cubic,
                                p3=p2
                            )
                            current_segments.append(segment)
                            current_point = p2

        elif operation == 'closePath':
            # Close the contour
            if current_segments:
                # Determine winding direction
                is_clockwise = _compute_winding(current_segments) > 0

                contours.append(Contour(segments=current_segments, is_clockwise=is_clockwise))
                current_segments = []
                current_point = None
                start_point = None

    # Add any remaining segments
    if current_segments:
        is_clockwise = _compute_winding(current_segments) > 0
        contours.append(Contour(segments=current_segments, is_clockwise=is_clockwise))

    return contours


def _compute_winding(segments: List[BezierSegment]) -> float:
    """
    Compute signed area to determine winding direction.

    Positive = clockwise, negative = counter-clockwise.

    Args:
        segments: List of Bezier segments

    Returns:
        Signed area
    """
    area = 0.0

    for segment in segments:
        # Use shoelace formula on endpoints
        x1, y1 = segment.p0.x, segment.p0.y

        # Get endpoint (handle different segment types)
        if hasattr(segment, 'p3') and segment.p3 is not None:
            x2, y2 = segment.p3.x, segment.p3.y
        elif hasattr(segment, 'p2') and segment.p2 is not None:
            x2, y2 = segment.p2.x, segment.p2.y
        else:
            x2, y2 = segment.p1.x, segment.p1.y

        area += (x2 - x1) * (y2 + y1)

    return area


def _get_unicode(font: TTFont, glyph_name: str) -> Optional[int]:
    """
    Get Unicode code point for a glyph.

    Args:
        font: TTFont object
        glyph_name: Glyph name

    Returns:
        Unicode code point or None
    """
    try:
        cmap = font.getBestCmap()
        if cmap:
            for code_point, name in cmap.items():
                if name == glyph_name:
                    return code_point
    except Exception:
        pass

    return None


def load_glyphs(
    font_path: str,
    glyph_names: Optional[List[str]] = None
) -> Dict[str, Glyph]:
    """
    Load multiple glyphs from a font file.

    Args:
        font_path: Path to font file
        glyph_names: List of glyph names to load (None = all glyphs)

    Returns:
        Dictionary mapping glyph names to Glyph objects

    Raises:
        FileNotFoundError: If font file doesn't exist
    """
    font = load_font(font_path)

    if glyph_names is None:
        glyph_names = get_glyph_names(font)

    glyphs = {}

    for glyph_name in glyph_names:
        try:
            glyph = load_glyph(font, glyph_name)
            glyphs[glyph_name] = glyph
        except (KeyError, ValueError) as e:
            # Skip glyphs that can't be loaded
            print(f"Warning: Skipping glyph '{glyph_name}': {e}")
            continue

    return glyphs


def get_font_info(font: TTFont) -> Dict[str, any]:
    """
    Extract metadata from font.

    Args:
        font: TTFont object

    Returns:
        Dictionary with font metadata
    """
    info = {
        'family_name': None,
        'style_name': None,
        'version': None,
        'num_glyphs': 0,
        'units_per_em': 1000
    }

    try:
        if 'name' in font:
            name_table = font['name']
            # Family name (ID 1)
            for record in name_table.names:
                if record.nameID == 1:
                    info['family_name'] = record.toUnicode()
                    break
            # Style name (ID 2)
            for record in name_table.names:
                if record.nameID == 2:
                    info['style_name'] = record.toUnicode()
                    break
            # Version (ID 5)
            for record in name_table.names:
                if record.nameID == 5:
                    info['version'] = record.toUnicode()
                    break

        if 'head' in font:
            info['units_per_em'] = font['head'].unitsPerEm

        info['num_glyphs'] = font['maxp'].numGlyphs if 'maxp' in font else 0

    except Exception as e:
        print(f"Warning: Error extracting font info: {e}")

    return info
