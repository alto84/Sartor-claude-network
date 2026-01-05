# StrokeStyles Replication Plan

**Paper**: "StrokeStyles: Stroke-based Segmentation and Stylization of Fonts"
**Authors**: Daniel Berio, Frederic Fol Leymarie, Paul Asente, Jose Echevarria
**Publication**: ACM Transactions on Graphics (SIGGRAPH 2022)
**DOI**: [10.1145/3505246](https://dl.acm.org/doi/10.1145/3505246)

---

## Executive Summary

This plan outlines a complete replication of the StrokeStyles paper, leveraging the Sartor Claude Network's multi-agent orchestration, memory system, and evidence-based validation frameworks. The goal is a **public GitHub repository** with a working implementation.

**Key Challenge Addressed**: The friend's frustration with chatbots being "utterly useless for implementation" especially with spatial reasoning. This plan mitigates that by:
1. Using **battle-tested libraries** for core geometry (no reinventing the wheel)
2. **Explicit test data** with ground truth (CJK stroke databases)
3. **Modular architecture** with visualization at every step
4. **Evidence-based validation** (no fabricated metrics)

---

## Part 1: Algorithm Summary

### The 7 Junction Types

| Type | Description | Example |
|------|-------------|---------|
| **Y-Junction** | Two strokes branch from overlap | Fork in "K" |
| **T-Junction** | Stroke perpendicular to another | Serif attachment |
| **L-Junction** | Corner or elbow bend | "L" corner |
| **Null-Junction** | Discard non-salient branch | Noise removal |
| **Half-Junction** | Stroke crosses another | "X" crossing |
| **Stroke-End** | Terminal of a stroke | Stroke tips |
| **Protuberance** | Compound link junction | Decorative element |

### Algorithm Pipeline

```
Font File (TTF/OTF)
       │
       ▼
┌─────────────────────┐
│ 1. Extract Outlines │  ← fontTools
│    (Bezier curves)  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 2. Flatten to       │  ← beziers.py
│    Polygons         │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 3. Compute Medial   │  ← scikit-image / OpenVoronoi
│    Axes (in + out)  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 4. Detect Features  │  ← Custom (curvature analysis)
│   (convex/concave)  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 5. Classify         │  ← Custom (paper algorithm)
│    Junctions (7)    │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 6. Compute Links    │  ← Custom (concavity pairs)
│    Between Features │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ 7. Recover Strokes  │  ← Custom (graph traversal)
│    with Overlaps    │
└──────────┬──────────┘
           ▼
  Stroke Decomposition
```

### Key Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `βmin` | 1.5 | Flared stroke end threshold |
| `good_continuation` | 0.4 | T-junction vs half-junction |
| `flatten_tolerance` | 0.5 | Bezier to polygon accuracy |
| `prune_threshold` | 0.0 | Medial axis noise removal |

---

## Part 2: Test Data

### Recommended Fonts (Open Source)

| Font | Type | License | Purpose |
|------|------|---------|---------|
| **Source Sans 3** | Sans-serif | OFL | Baseline testing |
| **Source Serif** | Serif | OFL | Serif junction testing |
| **Noto CJK** | CJK | OFL | Ground truth validation |
| **Alex Brush** | Script | OFL | Complex stroke testing |
| **League Spartan** | Geometric | OFL | Simple stroke structure |

### Ground Truth Datasets

**Critical Resource**: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)
- 9,000+ Chinese characters with stroke-order data
- Each character has **known stroke count** → validates our output
- SVG stroke decompositions for visual comparison

**Test Characters**:
```
永 (eternity) - 5 strokes - Contains all basic stroke types
木 (tree) - 4 strokes - Basic compound structure
龍 (dragon) - 16 strokes - Complex stress test
```

### Validation Strategy

| Test Type | Method | Success Criteria |
|-----------|--------|------------------|
| **CJK Stroke Count** | Compare vs Make Me a Hanzi | Count matches ±1 |
| **Latin Visual** | Manual inspection | Strokes align with intuition |
| **Paper Figures** | Reproduce Figure 3, 5, 7 | Visually similar decomposition |
| **Coverage** | IOU of strokes vs glyph | ≥ 90% coverage |

---

## Part 3: Library Stack

### Core Dependencies (All Permissive Licenses)

```bash
# Geometry & Math
pip install numpy>=1.24.0
pip install scipy>=1.10.0        # Voronoi, spatial
pip install scikit-image>=0.25.0 # Medial axis, skeletonization

# Font Processing
pip install fonttools>=4.40.0    # Font I/O
pip install freetype-py>=0.4.0   # FreeType bindings
pip install beziers              # Bezier manipulation

# Polygon Operations
pip install shapely>=2.0.0       # Polygon ops
pip install skia-pathops>=0.9.0  # Boolean ops

# Visualization
pip install matplotlib>=3.7.0
pip install plotly>=5.15.0       # Interactive
pip install svgwrite             # SVG export
```

### What Exists vs What We Build

| Component | Library Available? | Status |
|-----------|-------------------|--------|
| Bezier flattening | ✅ beziers.py | Use library |
| Medial axis | ✅ scikit-image | Use library |
| Voronoi (points) | ✅ scipy | Use library |
| Voronoi (segments) | ⚠️ OpenVoronoi | Evaluate |
| Convexity detection | ❌ None | **Build** |
| Junction classification | ❌ None | **Build** |
| Concavity linking | ❌ None | **Build** |
| Stroke recovery | ❌ None | **Build** |

**No public StrokeStyles implementation exists** - we're building the first open-source version.

---

## Part 4: Project Architecture

```
strokestyles/
├── src/strokestyles/
│   ├── core/           # Data structures (Glyph, Contour, Stroke)
│   ├── geometry/       # Algorithms (medial_axis, junction, linking)
│   ├── pipeline/       # End-to-end processing
│   ├── visualization/  # Debug viz at each step
│   ├── agents/         # Sartor multi-agent integration
│   └── validation/     # Evidence-based metrics
├── tests/
│   ├── unit/           # Per-module tests
│   ├── integration/    # Full pipeline tests
│   └── benchmarks/     # Performance tests
├── notebooks/          # Interactive exploration
├── data/
│   ├── fonts/          # Test fonts
│   └── ground_truth/   # Make Me a Hanzi, paper figures
└── scripts/            # CLI tools
```

### Sartor Integration Points

| Sartor Feature | StrokeStyles Usage |
|----------------|-------------------|
| **Memory System** | Cache medial axes (expensive to compute) |
| **Multi-Agent** | Parallel glyph processing |
| **Evidence Validation** | Anti-fabrication compliance |
| **Coordinator** | Batch font processing |

---

## Part 5: Development Phases

### Phase 1: Foundation (Core Geometry)
- [ ] Bezier → Polygon flattening
- [ ] Interior medial axis via scikit-image
- [ ] Exterior medial axis for concavities
- [ ] Basic visualization
- [ ] Unit tests for geometry

**Deliverable**: Pipeline that shows medial axis of any glyph

### Phase 2: Feature Detection
- [ ] Curvature computation along outline
- [ ] Convexity/concavity segmentation
- [ ] Curvilinear Shape Features (CSF)
- [ ] Tests against known shapes

**Deliverable**: Annotated glyph with convex/concave regions marked

### Phase 3: Junction Classification
- [ ] Implement 7 junction types
- [ ] Fork/terminal detection on medial axis
- [ ] Junction scoring and selection
- [ ] Ground truth comparison

**Deliverable**: Classified junctions on test characters

### Phase 4: Stroke Recovery
- [ ] Concavity linking algorithm
- [ ] Junction graph construction
- [ ] Path tracing for stroke extraction
- [ ] Overlap detection and marking

**Deliverable**: Complete stroke decomposition

### Phase 5: Sartor Integration
- [ ] Memory bridge for caching
- [ ] Batch coordinator for parallel processing
- [ ] StrokeStyles skill definition
- [ ] Performance benchmarks

**Deliverable**: Parallel font processing via Sartor agents

### Phase 6: Validation & Release
- [ ] Reproduce paper figures
- [ ] CJK validation vs Make Me a Hanzi
- [ ] Documentation
- [ ] Public GitHub release

**Deliverable**: Public repository with working implementation

---

## Part 6: Key Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Spatial reasoning bugs** | High | Visualization at every step, unit tests |
| **Voronoi edge cases** | Medium | Fallback to raster-based medial axis |
| **Junction misclassification** | Medium | Ground truth dataset, tunable thresholds |
| **Paper details unclear** | Medium | Check AutoGraff thesis, contact authors |
| **Performance issues** | Low | Sartor parallel processing, caching |

---

## Part 7: Success Criteria

### Minimum Viable Product
1. ✅ Process any TTF/OTF font
2. ✅ Extract strokes from Latin alphabet (A-Z)
3. ✅ Visualization of decomposition
4. ✅ CJK stroke count matches ground truth ±1

### Stretch Goals
1. Reproduce all paper figures exactly
2. Support Arabic/Devanagari scripts
3. Interactive web demo
4. Stroke stylization (apply styles to extracted strokes)

---

## Part 8: Resources

### Primary Sources
- [Paper PDF](https://research.gold.ac.uk/id/eprint/31944/1/strokestyles-opt.pdf)
- [ACM Digital Library](https://dl.acm.org/doi/10.1145/3505246)
- [AutoGraff Thesis](https://www.enist.org/autograff_thesis.pdf) (more detail)

### Test Data
- [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) (CJK ground truth)
- [Google Fonts](https://github.com/google/fonts)
- [Adobe Source Fonts](https://github.com/adobe-fonts)

### Libraries
- [fontTools](https://fonttools.readthedocs.io/)
- [scikit-image](https://scikit-image.org/)
- [beziers.py](https://github.com/simoncozens/beziers.py)
- [OpenVoronoi](https://github.com/aewallin/openvoronoi)

---

## Approval Checklist

Before proceeding to implementation, please confirm:

- [ ] Architecture looks reasonable
- [ ] Test data sources are acceptable
- [ ] Library choices are appropriate
- [ ] Development phases are prioritized correctly
- [ ] Any additional requirements?

---

*Generated by Sartor Multi-Agent Orchestration*
*Date: 2026-01-05*
