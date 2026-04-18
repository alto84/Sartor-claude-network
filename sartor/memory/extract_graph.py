#!/usr/bin/env python3
"""Extract typed wikilinks from the Sartor memory corpus to data/graph.jsonl.

Reads all *.md under sartor/memory/. Parses wikilinks of the form
[[rel:target]] or [[rel:target|alias]] where rel is drawn from the
allowed vocabulary defined in reference/MEMORY-CONVENTIONS.md v0.3.
Writes one JSON object per edge to data/graph.jsonl.

Python stdlib only. No dependencies.

Usage:
    python sartor/memory/extract_graph.py

Output row schema:
    {"source": "<path relative to repo root>",
     "relation": "<rel>",
     "target": "<target slug, unnormalized>",
     "line": <1-indexed line number>}
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Must match the vocabulary in reference/MEMORY-CONVENTIONS.md.
# Extending this set requires a spec edit there first.
ALLOWED_RELATIONS = {
    "works_at",
    "parent_of",
    "married_to",
    "owns",
    "invested_in",
    "located_in",
    "depends_on",
    "supersedes",
    "archived_from",
}

# Wikilink with a rel: prefix. Captures the relation and target.
# Target runs until a | (display alias) or closing ]].
# Relation is snake_case (lowercase letters, digits, underscores).
TYPED_WIKILINK_RE = re.compile(
    r"\[\[([a-z][a-z0-9_]*):([^\]|]+?)(?:\|[^\]]+)?\]\]"
)


def find_repo_root(start: Path) -> Path:
    """Walk up until we find a .git or a directory named Sartor-claude-network."""
    p = start.resolve()
    for parent in [p, *p.parents]:
        if (parent / ".git").exists():
            return parent
        if parent.name == "Sartor-claude-network":
            return parent
    # Fallback: three levels up from this file (sartor/memory/extract_graph.py).
    return Path(__file__).resolve().parents[2]


def extract_edges(md_path: Path, repo_root: Path) -> list[dict]:
    """Return edges found in one markdown file."""
    try:
        text = md_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = md_path.read_text(encoding="utf-8", errors="replace")

    edges: list[dict] = []
    source_rel = md_path.relative_to(repo_root).as_posix()

    for lineno, line in enumerate(text.splitlines(), start=1):
        for match in TYPED_WIKILINK_RE.finditer(line):
            rel = match.group(1)
            target = match.group(2).strip()
            if rel not in ALLOWED_RELATIONS:
                # Silently skip unknown relations; the spec requires them
                # to be declared before use. A stricter mode could warn.
                continue
            edges.append(
                {
                    "source": source_rel,
                    "relation": rel,
                    "target": target,
                    "line": lineno,
                }
            )
    return edges


def main() -> int:
    repo_root = find_repo_root(Path(__file__).parent)
    memory_root = repo_root / "sartor" / "memory"
    data_dir = repo_root / "data"
    out_path = data_dir / "graph.jsonl"

    if not memory_root.exists():
        print(f"memory root not found: {memory_root}", file=sys.stderr)
        return 1

    data_dir.mkdir(exist_ok=True)

    md_files = sorted(memory_root.rglob("*.md"))
    all_edges: list[dict] = []
    files_with_edges = 0

    for md in md_files:
        # Skip anything under archive/ or __pycache__; keep active corpus only.
        rel_parts = md.relative_to(memory_root).parts
        if "archive" in rel_parts or "__pycache__" in rel_parts:
            continue
        edges = extract_edges(md, repo_root)
        if edges:
            files_with_edges += 1
        all_edges.extend(edges)

    # Stable ordering: by source, then line.
    all_edges.sort(key=lambda e: (e["source"], e["line"], e["relation"], e["target"]))

    with out_path.open("w", encoding="utf-8", newline="\n") as f:
        for edge in all_edges:
            f.write(json.dumps(edge, ensure_ascii=False) + "\n")

    # Print a short summary to stdout.
    print(f"Scanned {len(md_files)} md files under {memory_root}")
    print(f"Extracted {len(all_edges)} typed edges from {files_with_edges} files")
    print(f"Wrote {out_path}")

    # Top relations by frequency.
    counts: dict[str, int] = {}
    for edge in all_edges:
        counts[edge["relation"]] = counts.get(edge["relation"], 0) + 1
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    print("\nTop relations by frequency:")
    for rel, n in ranked[:10]:
        print(f"  {rel:<16s} {n}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
