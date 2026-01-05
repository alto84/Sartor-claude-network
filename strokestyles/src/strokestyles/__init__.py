"""
StrokeStyles: Stroke-based Font Segmentation

A replication of "StrokeStyles: Stroke-based Segmentation and Stylization of Fonts"
by Berio, Leymarie, Asente, and Echevarria (SIGGRAPH 2022).

This package provides tools to automatically segment font glyphs into
overlapping and intersecting strokes using medial axis analysis and
perceptually-informed junction classification.
"""

__version__ = "0.1.0"

from strokestyles.core.glyph import Glyph, Point, BoundingBox
from strokestyles.core.stroke import Stroke, StrokeDecomposition
from strokestyles.core.contour import Contour, BezierSegment
from strokestyles.core.polygon import Polygon

# TODO: Add when pipeline is implemented
# from strokestyles.pipeline.segmenter import segment_glyph, segment_font

__all__ = [
    # Core data structures
    "Glyph",
    "Point",
    "BoundingBox",
    "Stroke",
    "StrokeDecomposition",
    "Contour",
    "BezierSegment",
    "Polygon",
    # Pipeline (not yet implemented)
    # "segment_glyph",
    # "segment_font",
]
