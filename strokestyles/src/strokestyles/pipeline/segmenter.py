"""Main segmentation pipeline - ties everything together."""
from typing import Dict, Optional, List, Any
import numpy as np
from pathlib import Path

from strokestyles.core.glyph import Glyph
from strokestyles.core.polygon import Polygon
from strokestyles.core.stroke import StrokeDecomposition
from strokestyles.pipeline.font_loader import load_font, load_glyph, get_glyph_names
from strokestyles.pipeline.flattener import flatten_glyph
from strokestyles.geometry.medial_axis import compute_medial_axis, MedialAxisType, MedialAxisGraph
from strokestyles.geometry.convexity import detect_features, CurvatureFeature
from strokestyles.geometry.junction import classify_all_junctions, Junction
from strokestyles.geometry.linking import find_links, ConcavityLink
from strokestyles.pipeline.stroke_recovery import recover_strokes, build_decomposition


def segment_glyph(
    font_path: str,
    glyph_name: str,
    flatten_tolerance: float = 0.5,
    image_size: int = 1000,
    prune_threshold: float = 0.0,
    beta_min: float = 1.5,
    curvature_threshold: float = 0.01
) -> StrokeDecomposition:
    """
    Segment a single glyph into strokes.

    Complete pipeline:
    1. Load glyph from font
    2. Flatten to polygon
    3. Compute interior medial axis
    4. Compute exterior medial axis (for concavities)
    5. Detect convex/concave features
    6. Classify junctions
    7. Find concavity links
    8. Recover strokes

    Args:
        font_path: Path to font file (TTF or OTF)
        glyph_name: Name of glyph to segment
        flatten_tolerance: Bezier flattening tolerance
        image_size: Size of rasterization grid for medial axis
        prune_threshold: Minimum branch length for medial axis
        beta_min: Minimum angle ratio for junction classification
        curvature_threshold: Minimum curvature for feature detection

    Returns:
        StrokeDecomposition with recovered strokes

    Raises:
        FileNotFoundError: If font file doesn't exist
        KeyError: If glyph name not found
        ValueError: If glyph is empty or invalid
    """
    # Step 1: Load glyph
    font = load_font(font_path)
    glyph = load_glyph(font, glyph_name)

    if glyph.is_empty():
        # Return empty decomposition
        return StrokeDecomposition(
            glyph_name=glyph_name,
            strokes=[],
            coverage=0.0
        )

    # Step 2: Flatten to polygon
    polygon = flatten_glyph(glyph, tolerance=flatten_tolerance)

    if polygon.is_empty():
        return StrokeDecomposition(
            glyph_name=glyph_name,
            strokes=[],
            coverage=0.0
        )

    # Step 3: Compute interior medial axis
    ma_interior = compute_medial_axis(
        polygon.exterior,
        image_size=image_size,
        axis_type=MedialAxisType.INTERIOR,
        prune_threshold=prune_threshold
    )

    if ma_interior.vertices.shape[0] == 0:
        # No medial axis found
        return StrokeDecomposition(
            glyph_name=glyph_name,
            strokes=[],
            coverage=0.0
        )

    # Step 4: Compute exterior medial axis (for concavities)
    # This is used to detect concave features on the outline
    ma_exterior = compute_medial_axis(
        polygon.exterior,
        image_size=image_size,
        axis_type=MedialAxisType.EXTERIOR,
        prune_threshold=prune_threshold * 2  # More aggressive pruning for exterior
    )

    # Step 5: Detect convex/concave features
    convexities, concavities = detect_features(
        polygon.exterior,
        curvature_threshold=curvature_threshold
    )

    # Step 6: Classify junctions on medial axis
    junctions = classify_all_junctions(
        ma_interior,
        polygon.exterior,
        convexities,
        concavities
    )

    # Step 7: Find concavity links
    links = find_links(
        polygon.exterior,
        concavities,
        max_distance=None  # Auto-compute from polygon size
    )

    # Step 8: Recover strokes
    strokes = recover_strokes(
        ma_interior,
        junctions,
        links,
        polygon.exterior
    )

    # Build final decomposition
    decomposition = build_decomposition(
        glyph_name=glyph_name,
        strokes=strokes,
        polygon=polygon.exterior
    )

    return decomposition


def segment_font(
    font_path: str,
    glyph_names: Optional[List[str]] = None,
    **kwargs
) -> Dict[str, StrokeDecomposition]:
    """
    Segment all glyphs in a font.

    Args:
        font_path: Path to font file
        glyph_names: List of glyph names to segment (None = all)
        **kwargs: Additional arguments passed to segment_glyph

    Returns:
        Dictionary mapping glyph names to StrokeDecomposition

    Raises:
        FileNotFoundError: If font file doesn't exist
    """
    font = load_font(font_path)

    if glyph_names is None:
        glyph_names = get_glyph_names(font)

    decompositions = {}

    for glyph_name in glyph_names:
        try:
            decomposition = segment_glyph(font_path, glyph_name, **kwargs)
            decompositions[glyph_name] = decomposition
        except (KeyError, ValueError) as e:
            print(f"Warning: Failed to segment glyph '{glyph_name}': {e}")
            continue

    return decompositions


class SegmentationPipeline:
    """
    Configurable segmentation pipeline with intermediate results.

    Allows access to intermediate processing steps for debugging
    and visualization.

    Example:
        pipeline = SegmentationPipeline(
            flatten_tolerance=0.5,
            image_size=1000
        )
        decomposition = pipeline.run(glyph)

        # Access intermediate results
        polygon = pipeline.get_polygon()
        ma = pipeline.get_medial_axis()
        junctions = pipeline.get_junctions()
    """

    def __init__(self, **config):
        """
        Initialize pipeline with configuration.

        Args:
            **config: Configuration parameters (see segment_glyph)
        """
        self.config = {
            'flatten_tolerance': 0.5,
            'image_size': 1000,
            'prune_threshold': 0.0,
            'beta_min': 1.5,
            'curvature_threshold': 0.01
        }
        self.config.update(config)

        # Storage for intermediate results
        self.intermediate_results = {}

    def run(self, glyph: Glyph) -> StrokeDecomposition:
        """
        Run full pipeline on a glyph.

        Args:
            glyph: Glyph to segment

        Returns:
            StrokeDecomposition

        Stores intermediate results for later access.
        """
        self.intermediate_results = {}

        if glyph.is_empty():
            return StrokeDecomposition(
                glyph_name=glyph.name,
                strokes=[],
                coverage=0.0
            )

        # Step 1: Flatten
        polygon = flatten_glyph(glyph, tolerance=self.config['flatten_tolerance'])
        self.intermediate_results['polygon'] = polygon

        if polygon.is_empty():
            return StrokeDecomposition(
                glyph_name=glyph.name,
                strokes=[],
                coverage=0.0
            )

        # Step 2: Medial axis
        ma_interior = compute_medial_axis(
            polygon.exterior,
            image_size=self.config['image_size'],
            axis_type=MedialAxisType.INTERIOR,
            prune_threshold=self.config['prune_threshold']
        )
        self.intermediate_results['medial_axis_interior'] = ma_interior

        ma_exterior = compute_medial_axis(
            polygon.exterior,
            image_size=self.config['image_size'],
            axis_type=MedialAxisType.EXTERIOR,
            prune_threshold=self.config['prune_threshold'] * 2
        )
        self.intermediate_results['medial_axis_exterior'] = ma_exterior

        if ma_interior.vertices.shape[0] == 0:
            return StrokeDecomposition(
                glyph_name=glyph.name,
                strokes=[],
                coverage=0.0
            )

        # Step 3: Feature detection
        convexities, concavities = detect_features(
            polygon.exterior,
            curvature_threshold=self.config['curvature_threshold']
        )
        self.intermediate_results['convexities'] = convexities
        self.intermediate_results['concavities'] = concavities

        # Step 4: Junction classification
        junctions = classify_all_junctions(
            ma_interior,
            polygon.exterior,
            convexities,
            concavities
        )
        self.intermediate_results['junctions'] = junctions

        # Step 5: Concavity linking
        links = find_links(
            polygon.exterior,
            concavities,
            max_distance=None
        )
        self.intermediate_results['links'] = links

        # Step 6: Stroke recovery
        strokes = recover_strokes(
            ma_interior,
            junctions,
            links,
            polygon.exterior
        )
        self.intermediate_results['strokes'] = strokes

        # Build decomposition
        decomposition = build_decomposition(
            glyph_name=glyph.name,
            strokes=strokes,
            polygon=polygon.exterior
        )

        self.intermediate_results['decomposition'] = decomposition

        return decomposition

    def get_polygon(self) -> Optional[Polygon]:
        """Get flattened polygon."""
        return self.intermediate_results.get('polygon')

    def get_medial_axis(self) -> Optional[MedialAxisGraph]:
        """Get interior medial axis graph."""
        return self.intermediate_results.get('medial_axis_interior')

    def get_medial_axis_exterior(self) -> Optional[MedialAxisGraph]:
        """Get exterior medial axis graph."""
        return self.intermediate_results.get('medial_axis_exterior')

    def get_features(self) -> tuple[Optional[List[CurvatureFeature]], Optional[List[CurvatureFeature]]]:
        """Get convex and concave features."""
        convexities = self.intermediate_results.get('convexities')
        concavities = self.intermediate_results.get('concavities')
        return convexities, concavities

    def get_junctions(self) -> Optional[List[Junction]]:
        """Get classified junctions."""
        return self.intermediate_results.get('junctions')

    def get_links(self) -> Optional[List[ConcavityLink]]:
        """Get concavity links."""
        return self.intermediate_results.get('links')

    def get_strokes(self) -> Optional[List]:
        """Get recovered strokes."""
        return self.intermediate_results.get('strokes')

    def to_dict(self) -> Dict[str, Any]:
        """
        Export pipeline state to dictionary.

        Returns:
            Dictionary with configuration and results
        """
        result = {
            'config': self.config.copy(),
            'has_results': bool(self.intermediate_results)
        }

        if self.intermediate_results:
            decomposition = self.intermediate_results.get('decomposition')
            if decomposition:
                result['decomposition'] = decomposition.to_dict()

        return result


def batch_segment(
    font_path: str,
    output_dir: str,
    glyph_names: Optional[List[str]] = None,
    **kwargs
) -> None:
    """
    Segment multiple glyphs and save results to files.

    Args:
        font_path: Path to font file
        output_dir: Directory to save results
        glyph_names: List of glyph names (None = all)
        **kwargs: Additional arguments for segment_glyph

    Creates JSON files with decomposition data for each glyph.
    """
    import json
    from pathlib import Path

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    decompositions = segment_font(font_path, glyph_names, **kwargs)

    for glyph_name, decomposition in decompositions.items():
        # Sanitize glyph name for filename
        safe_name = glyph_name.replace('/', '_').replace('\\', '_')
        output_file = output_path / f"{safe_name}.json"

        # Save to JSON
        with open(output_file, 'w') as f:
            json.dump(decomposition.to_dict(), f, indent=2)

        print(f"Saved {glyph_name} -> {output_file}")


def load_decomposition(filepath: str) -> StrokeDecomposition:
    """
    Load a StrokeDecomposition from JSON file.

    Args:
        filepath: Path to JSON file

    Returns:
        StrokeDecomposition object
    """
    import json

    with open(filepath, 'r') as f:
        data = json.load(f)

    return StrokeDecomposition.from_dict(data)
