#!/usr/bin/env python3
"""Sartor LLM Wiki -- query and index layer on top of the memory substrate.

This is a thin layer that adds backlinks, tag indexes, similarity, provenance,
and structured article views on top of the existing search.py / decay.py /
embeddings.py / autodream.py stack. Nothing it produces mutates the substrate;
all indexes are derived and regenerable.

Design notes:
    - Obsidian compatibility is preserved. All content lives in .md files
      with YAML frontmatter, wikilinks, and callouts.
    - Indexes live in sartor/memory/indexes/ and are regenerated on demand.
      They're safe to delete.
    - The module works with or without embeddings available (similarity
      gracefully degrades if embeddings.py DB is missing).
    - The module works with or without git available (provenance falls back
      to frontmatter-only if git is missing).

CLI:
    python wiki.py --reindex                    # regenerate all indexes
    python wiki.py --reindex --incremental      # only changed files
    python wiki.py --backlinks TAXES            # list what references TAXES.md
    python wiki.py --tags                       # list all tags with counts
    python wiki.py --tag entity/person          # list files with this tag
    python wiki.py --similar TAXES              # top-5 similar to TAXES.md
    python wiki.py --orphans                    # files with zero incoming links
    python wiki.py --broken                     # broken wikilink targets
    python wiki.py --article TAXES              # full article view (JSON)
    python wiki.py --health                     # health summary
    python wiki.py --selftest                   # inline sanity tests

Import:
    from wiki import Wiki
    w = Wiki(Path("sartor/memory"))
    print(w.backlinks("TAXES.md"))
    view = w.article_view("TAXES.md")
"""

from __future__ import annotations

import argparse
import io
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

# Fix UnicodeEncodeError on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding=sys.stdout.encoding, errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding=sys.stderr.encoding, errors="replace")

# -----------------------------------------------------------------------------
# Constants
# -----------------------------------------------------------------------------

SKIP_DIRS = {".obsidian", ".git", "__pycache__", "node_modules", ".meta", ".index", "indexes"}
SKIP_FILE_PATTERNS = {"_index.md", "wiki-state.md", "wiki-queue.md", "wiki-health.md"}

WIKILINK_PATTERN = re.compile(r"\[\[([^\[\]|#]+?)(?:\|[^\[\]]*)?(?:#[^\[\]]*)?\]\]")
CALLOUT_PATTERN = re.compile(r"^>\s*\[!([a-zA-Z_-]+)\](.*)$", re.MULTILINE)
HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)
FRONTMATTER_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
# Match both fenced code blocks (```) and inline backtick code. Non-greedy.
FENCED_CODE_PATTERN = re.compile(r"```.*?```", re.DOTALL)
INLINE_CODE_PATTERN = re.compile(r"`[^`\n]+`")


def _strip_code_blocks(text: str) -> str:
    """Remove fenced code blocks and inline code spans.

    Used before extracting wikilinks so placeholder examples in documentation
    (e.g. `[[FILE]]` inside a code fence) don't get counted as real links.
    """
    text = FENCED_CODE_PATTERN.sub("", text)
    text = INLINE_CODE_PATTERN.sub("", text)
    return text

MEMORY_DIR = Path(__file__).resolve().parent
INDEXES_DIR = MEMORY_DIR / "indexes"
DATA_DIR = MEMORY_DIR.parent.parent / "data"  # sartor/memory/.. = Sartor-claude-network/sartor, then ../data

WIKI_HEALTH_MAX_CHARS = 1500
WIKI_QUEUE_MAX_CHARS = 1000


# -----------------------------------------------------------------------------
# Lightweight YAML frontmatter parser
# -----------------------------------------------------------------------------
# We don't want to take on a YAML dependency. Parse the subset we actually use:
# scalar values, lists, simple tag/alias arrays.


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and return (metadata_dict, body_without_frontmatter).

    Supports the subset we actually use: scalar values, inline list [a, b], and
    block scalar (no multi-line strings, no nested maps). Returns empty dict
    if no frontmatter present or if parsing fails.
    """
    match = FRONTMATTER_PATTERN.match(text)
    if not match:
        return {}, text

    yaml_block = match.group(1)
    body = text[match.end():]
    meta: dict = {}

    for line in yaml_block.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        if not value:
            meta[key] = None
            continue

        # Inline list: [a, b, c]
        if value.startswith("[") and value.endswith("]"):
            items = [x.strip().strip("\"'") for x in value[1:-1].split(",") if x.strip()]
            meta[key] = items
            continue

        # Strip quotes from scalar
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]

        meta[key] = value

    return meta, body


# -----------------------------------------------------------------------------
# File discovery and parsing
# -----------------------------------------------------------------------------


@dataclass
class ParsedFile:
    """Structured view of a single memory file."""

    path: Path
    stem: str  # filename without .md
    rel_path: str  # path relative to memory_dir
    frontmatter: dict = field(default_factory=dict)
    title: str = ""
    body: str = ""
    wikilinks_out: list[str] = field(default_factory=list)
    callouts: list[tuple[str, str]] = field(default_factory=list)
    headings: list[tuple[int, str]] = field(default_factory=list)  # (level, text)
    size_chars: int = 0
    mtime: float = 0.0
    parse_error: str | None = None


def _collect_files(memory_dir: Path) -> list[Path]:
    """Recursively collect .md files, skipping excluded directories and noise."""
    files = []
    for path in sorted(memory_dir.rglob("*.md")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_FILE_PATTERNS:
            continue
        # Skip daily/ — too noisy for wiki, tracked separately
        if "daily" in path.parts:
            continue
        # Skip inbox/ — it's a write queue, not canonical content
        if "inbox" in path.parts:
            continue
        # Skip snapshots/ — point-in-time snapshots, not navigable
        if "snapshots" in path.parts:
            continue
        files.append(path)
    return files


def parse_file(path: Path, memory_dir: Path) -> ParsedFile:
    """Parse a single memory file into a ParsedFile structure."""
    pf = ParsedFile(
        path=path,
        stem=path.stem,
        rel_path=str(path.relative_to(memory_dir)).replace("\\", "/"),
    )

    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, PermissionError, OSError) as exc:
        pf.parse_error = f"read_error: {exc}"
        return pf

    pf.size_chars = len(text)
    try:
        pf.mtime = path.stat().st_mtime
    except OSError:
        pass

    # Frontmatter
    meta, body = parse_frontmatter(text)
    pf.frontmatter = meta
    pf.body = body

    # Title: first # heading in body, or fall back to stem
    title_match = re.search(r"^#\s+(.+?)\s*$", body, re.MULTILINE)
    if title_match:
        pf.title = title_match.group(1).strip()
    else:
        pf.title = pf.stem

    # Wikilinks (extracted from body with code blocks stripped, so that
    # documentation placeholders like [[FILE]] inside ``` fences don't count)
    body_no_code = _strip_code_blocks(body)
    for m in WIKILINK_PATTERN.finditer(body_no_code):
        target = m.group(1).strip()
        # Strip any subpath after #
        target = target.split("#")[0].strip()
        # Support path-based targets (e.g. [[mitigations/foo]]) -- resolve
        # against both the bare stem and any subpath component.
        if target:
            pf.wikilinks_out.append(target)

    # Callouts
    for m in CALLOUT_PATTERN.finditer(body):
        kind = m.group(1).lower()
        body_text = m.group(2).strip()
        pf.callouts.append((kind, body_text))

    # Headings (level, text)
    for m in HEADING_PATTERN.finditer(body):
        level = len(m.group(1))
        text_ = m.group(2).strip()
        pf.headings.append((level, text_))

    return pf


# -----------------------------------------------------------------------------
# Index construction
# -----------------------------------------------------------------------------


def _resolve_wikilink(target: str, stem_to_path: dict[str, str], path_to_path: dict[str, str]) -> str | None:
    """Resolve a wikilink target to a canonical rel_path.

    Tries in order:
      1. Direct stem match (ALTON -> ALTON.md)
      2. Path-based match (mitigations/dose-reduction -> .../mitigations/dose-reduction.md)
      3. Basename of path (mitigations/foo -> foo.md anywhere in the tree)
    Returns None if none of these resolve.
    """
    key = target.lower()
    # 1. Direct stem
    canonical = stem_to_path.get(key)
    if canonical:
        return canonical
    # 2. Path-based (search any rel_path ending with target.md)
    suffix = f"/{key}.md"
    for rel_lower, rel in path_to_path.items():
        if rel_lower == key + ".md" or rel_lower.endswith(suffix):
            return rel
    # 3. Basename of path segments
    if "/" in key:
        last = key.rsplit("/", 1)[-1]
        canonical = stem_to_path.get(last)
        if canonical:
            return canonical
    return None


def build_backlinks(files: list[ParsedFile]) -> dict[str, list[str]]:
    """Build reverse index: {target_rel_path: [source_rel_paths]}.

    Matching is case-insensitive (Obsidian-style). Resolves wikilinks against
    both file stems and rel_paths, to support documents that live in
    subdirectories with path-based references.
    """
    stem_to_path: dict[str, str] = {}
    for pf in files:
        # Last-write-wins if two files share a stem; caller can resolve ambiguity
        stem_to_path.setdefault(pf.stem.lower(), pf.rel_path)
    path_to_path: dict[str, str] = {pf.rel_path.lower(): pf.rel_path for pf in files}

    backlinks: dict[str, list[str]] = {pf.rel_path: [] for pf in files}

    for pf in files:
        seen_targets: set[str] = set()
        for target in pf.wikilinks_out:
            canonical_path = _resolve_wikilink(target, stem_to_path, path_to_path)
            if canonical_path and canonical_path != pf.rel_path:
                if canonical_path not in seen_targets:
                    backlinks[canonical_path].append(pf.rel_path)
                    seen_targets.add(canonical_path)

    # Sort each entry deterministically
    for k in backlinks:
        backlinks[k] = sorted(set(backlinks[k]))

    return backlinks


def build_tag_index(files: list[ParsedFile]) -> dict[str, list[str]]:
    """Build tag index: {tag: [rel_paths]}.

    Tags come from frontmatter `tags:` field (list form).
    """
    tag_index: dict[str, list[str]] = {}
    for pf in files:
        raw_tags = pf.frontmatter.get("tags") or []
        if isinstance(raw_tags, str):
            raw_tags = [raw_tags]
        for tag in raw_tags:
            tag = str(tag).strip()
            if not tag:
                continue
            tag_index.setdefault(tag, []).append(pf.rel_path)

    for k in tag_index:
        tag_index[k] = sorted(set(tag_index[k]))

    return tag_index


def find_orphans(files: list[ParsedFile], backlinks: dict[str, list[str]]) -> list[str]:
    """Files with zero incoming wikilinks. Excludes types that don't need backlinks by design.

    Excluded types: meta, reference, feedback (auto-injected behavioral rules).
    Research files are excluded from orphan detection because they're standalone
    documents, not part of the core wiki graph.
    """
    excluded_types = {"meta", "reference", "feedback"}

    orphans = []
    for pf in files:
        if pf.parse_error:
            continue
        # Skip research/ subtree — standalone documents, not meant to be graphed
        if "research" in pf.path.parts:
            continue
        # Don't flag excluded types as orphans
        ftype = str(pf.frontmatter.get("type") or "").strip()
        if ftype in excluded_types:
            continue
        if not backlinks.get(pf.rel_path):
            orphans.append(pf.rel_path)
    return sorted(orphans)


def find_broken_links(files: list[ParsedFile]) -> list[tuple[str, str]]:
    """Wikilinks whose target doesn't resolve to any file. Returns [(source, target)]."""
    stem_to_path: dict[str, str] = {}
    for pf in files:
        stem_to_path.setdefault(pf.stem.lower(), pf.rel_path)
    path_to_path: dict[str, str] = {pf.rel_path.lower(): pf.rel_path for pf in files}

    broken = []
    for pf in files:
        seen: set[str] = set()
        for target in pf.wikilinks_out:
            key = target.lower()
            if key in seen:
                continue
            seen.add(key)
            if _resolve_wikilink(target, stem_to_path, path_to_path) is None:
                broken.append((pf.rel_path, target))
    return broken


# -----------------------------------------------------------------------------
# Similarity (optional, uses embeddings.py if available)
# -----------------------------------------------------------------------------


def build_similarity(files: list[ParsedFile]) -> dict[str, list[tuple[str, float]]]:
    """Build {rel_path: [(other_rel_path, score), ...]} using embeddings.py.

    Degrades gracefully: returns empty dict if embeddings DB is missing or
    the module isn't available. This is opt-in; the wiki works without it.
    """
    try:
        from embeddings import SemanticSearch
    except ImportError:
        return {}

    try:
        ss = SemanticSearch(str(MEMORY_DIR))
    except Exception:
        return {}

    # Check if the index DB exists before trying to query
    db_path = MEMORY_DIR / ".index" / "memory.db"
    if not db_path.exists():
        return {}

    similarity: dict[str, list[tuple[str, float]]] = {}

    for pf in files:
        if pf.parse_error or pf.size_chars < 100:
            continue
        # Use the file's title as the query — we want semantic similarity by topic,
        # not just a random chunk from the file
        query = f"{pf.title}\n{' '.join(t for _, t in pf.headings[:5])}"
        try:
            results = ss.search_semantic(query, top_k=6)
        except Exception:
            continue

        # Filter out self-matches and dedup by file
        seen: set[str] = set()
        hits = []
        for r in results:
            other = r.get("file", "")
            if not other:
                continue
            # Normalize to rel_path from memory_dir
            try:
                other_rel = str(Path(other).relative_to(MEMORY_DIR)).replace("\\", "/")
            except ValueError:
                other_rel = other
            if other_rel == pf.rel_path or other_rel in seen:
                continue
            seen.add(other_rel)
            hits.append((other_rel, float(r.get("score", 0.0))))
            if len(hits) >= 5:
                break
        if hits:
            similarity[pf.rel_path] = hits

    return similarity


# -----------------------------------------------------------------------------
# Provenance via git
# -----------------------------------------------------------------------------


def git_recent_activity(file_rel_path: str, memory_dir: Path, days: int = 7) -> int:
    """Count git commits touching this file in the last N days."""
    try:
        result = subprocess.run(
            [
                "git",
                "log",
                f"--since={days} days ago",
                "--oneline",
                "--",
                str(memory_dir / file_rel_path),
            ],
            cwd=str(memory_dir),
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return 0
        return len([ln for ln in result.stdout.splitlines() if ln.strip()])
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return 0


def git_last_commit_info(file_rel_path: str, memory_dir: Path) -> dict:
    """Return {date, author, message} for the last commit touching this file."""
    try:
        result = subprocess.run(
            [
                "git",
                "log",
                "-1",
                "--pretty=format:%aI|%an|%s",
                "--",
                str(memory_dir / file_rel_path),
            ],
            cwd=str(memory_dir),
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return {}
        parts = result.stdout.strip().split("|", 2)
        if len(parts) == 3:
            return {"date": parts[0], "author": parts[1], "message": parts[2]}
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return {}


# -----------------------------------------------------------------------------
# Decay tier (optional, uses decay.py if available)
# -----------------------------------------------------------------------------


def get_decay_info(file_rel_path: str) -> dict:
    """Return {tier, score} from decay.py, or empty dict if unavailable."""
    try:
        from decay import load_scores, get_tier
    except ImportError:
        return {}

    try:
        scores = load_scores()
    except Exception:
        return {}

    # decay.py keys files by basename, but may also key by rel path
    basename = Path(file_rel_path).name
    entry = scores.get(basename) or scores.get(file_rel_path) or {}
    if not entry:
        return {}

    score = float(entry.get("score", 0.0))
    return {"tier": get_tier(score), "score": round(score, 4)}


# -----------------------------------------------------------------------------
# Main Wiki class
# -----------------------------------------------------------------------------


class Wiki:
    """Thin query and index layer over a directory of markdown memory files."""

    def __init__(self, memory_dir: Path | str | None = None):
        self.memory_dir = Path(memory_dir) if memory_dir else MEMORY_DIR
        self.indexes_dir = self.memory_dir / "indexes"
        self._parsed_cache: list[ParsedFile] | None = None
        self._backlinks_cache: dict[str, list[str]] | None = None
        self._tags_cache: dict[str, list[str]] | None = None
        self._similarity_cache: dict[str, list[tuple[str, float]]] | None = None

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def parse_all(self, force: bool = False) -> list[ParsedFile]:
        """Parse all memory files (cached across calls unless force=True)."""
        if self._parsed_cache is not None and not force:
            return self._parsed_cache
        files = [parse_file(p, self.memory_dir) for p in _collect_files(self.memory_dir)]
        self._parsed_cache = files
        return files

    # ------------------------------------------------------------------
    # Query API
    # ------------------------------------------------------------------

    def _load_index(self, name: str) -> dict | None:
        """Load a JSON index file, return None if missing."""
        path = self.indexes_dir / f"{name}.json"
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return None

    def _resolve_file(self, name: str) -> str | None:
        """Resolve a file name or stem to a rel_path.

        Tries in order: exact rel_path, stem (with or without .md), path
        suffix match (for subdirectory files like `ledgers/kids`), and
        basename extraction for path-style inputs.
        """
        files = self.parse_all()
        name_lower = name.lower()
        # 1. Exact rel_path match
        for pf in files:
            if pf.rel_path.lower() == name_lower:
                return pf.rel_path
        # 2. Stem match (case-insensitive)
        for pf in files:
            if pf.stem.lower() == name_lower:
                return pf.rel_path
        # 3. With .md suffix added
        with_md = name_lower if name_lower.endswith(".md") else name_lower + ".md"
        for pf in files:
            if pf.rel_path.lower() == with_md:
                return pf.rel_path
        # 4. Path suffix match (e.g. ledgers/kids -> any .../ledgers/kids.md)
        suffix = "/" + with_md
        for pf in files:
            if pf.rel_path.lower().endswith(suffix):
                return pf.rel_path
        # 5. Basename fallback for path-style input
        if "/" in name_lower:
            last = name_lower.rsplit("/", 1)[-1]
            for pf in files:
                if pf.stem.lower() == last:
                    return pf.rel_path
        return None

    def backlinks(self, file: str) -> list[str]:
        """Return files that reference the given file via [[wikilink]]."""
        rel = self._resolve_file(file)
        if rel is None:
            return []

        # Prefer loaded index, fall back to live computation
        idx = self._load_index("backlinks")
        if idx is not None:
            return idx.get(rel, [])

        files = self.parse_all()
        backlinks = build_backlinks(files)
        return backlinks.get(rel, [])

    def tags(self) -> dict[str, list[str]]:
        """Return full tag index: {tag: [files]}."""
        idx = self._load_index("tag-index")
        if idx is not None:
            return idx
        return build_tag_index(self.parse_all())

    def files_for_tag(self, tag: str) -> list[str]:
        """Return files carrying the given tag."""
        return self.tags().get(tag, [])

    def similar(self, file: str, top_k: int = 5) -> list[tuple[str, float]]:
        """Return top-K semantically similar files."""
        rel = self._resolve_file(file)
        if rel is None:
            return []

        idx = self._load_index("similarity")
        if idx is not None:
            entries = idx.get(rel, [])
            return [(e[0], float(e[1])) for e in entries[:top_k]]

        # Live compute (expensive)
        sim = build_similarity(self.parse_all())
        entries = sim.get(rel, [])
        return entries[:top_k]

    def orphans(self) -> list[str]:
        """Files with zero incoming wikilinks (excluding meta/reference types)."""
        idx = self._load_index("orphans")
        if idx is not None:
            return idx if isinstance(idx, list) else idx.get("orphans", [])
        files = self.parse_all()
        backlinks = build_backlinks(files)
        return find_orphans(files, backlinks)

    def broken_links(self) -> list[tuple[str, str]]:
        """Wikilinks whose targets don't exist."""
        return find_broken_links(self.parse_all())

    def provenance(self, file: str) -> dict:
        """Return provenance info: frontmatter updated fields + git log summary."""
        rel = self._resolve_file(file)
        if rel is None:
            return {}
        files = self.parse_all()
        pf = next((f for f in files if f.rel_path == rel), None)
        if pf is None:
            return {}
        fm_updated = pf.frontmatter.get("updated")
        fm_updated_by = pf.frontmatter.get("updated_by")
        git_recent = git_recent_activity(rel, self.memory_dir)
        git_last = git_last_commit_info(rel, self.memory_dir)
        return {
            "frontmatter_updated": fm_updated,
            "frontmatter_updated_by": fm_updated_by,
            "git_recent_7d": git_recent,
            "git_last_commit": git_last,
        }

    def article_view(self, file: str) -> dict:
        """Return a structured dict with everything an agent needs to reason about a file."""
        rel = self._resolve_file(file)
        if rel is None:
            return {"error": f"file not found: {file}"}
        files = self.parse_all()
        pf = next((f for f in files if f.rel_path == rel), None)
        if pf is None or pf.parse_error:
            return {"error": pf.parse_error if pf else "not found"}

        return {
            "file": pf.rel_path,
            "title": pf.title,
            "frontmatter": pf.frontmatter,
            "wikilinks_out": sorted(set(pf.wikilinks_out)),
            "wikilinks_in": self.backlinks(rel),
            "callouts": pf.callouts,
            "headings": pf.headings,
            "similar": self.similar(rel, top_k=5),
            "decay": get_decay_info(rel),
            "provenance": self.provenance(rel),
            "size_chars": pf.size_chars,
            "mtime": pf.mtime,
        }

    # ------------------------------------------------------------------
    # Lint (Karpathy LLM-Wiki third operation: periodic audit)
    # ------------------------------------------------------------------

    def lint(self) -> dict:
        """Periodic audit for contradictions, stale claims, orphans, broken links.

        Returns a dict with categorized findings. This is the "lint" operation
        from Karpathy's LLM-Wiki pattern -- a structural audit that the curator
        (or a human) can act on.
        """
        files = self.parse_all()
        backlinks = build_backlinks(files)
        orphans = find_orphans(files, backlinks)
        broken = find_broken_links(files)

        # Stale detection: files with `updated:` field > 30 days old
        stale = []
        thirty_days_ago_iso = (datetime.now(timezone.utc).date()).isoformat()
        for pf in files:
            updated = pf.frontmatter.get("updated")
            if not updated:
                continue
            try:
                updated_date = datetime.fromisoformat(str(updated)).date()
                delta_days = (datetime.now(timezone.utc).date() - updated_date).days
                if delta_days > 30:
                    stale.append({"file": pf.rel_path, "updated": str(updated), "days_ago": delta_days})
            except (ValueError, TypeError):
                continue

        # Missing frontmatter: files with no `type:` field
        missing_frontmatter = [
            pf.rel_path for pf in files
            if not pf.frontmatter.get("type") and not pf.parse_error
        ]

        # Missing required fields: files with frontmatter but no `updated:` or `tags:`
        missing_fields = []
        for pf in files:
            if not pf.frontmatter or pf.parse_error:
                continue
            missing = []
            if not pf.frontmatter.get("updated"):
                missing.append("updated")
            if "tags" not in pf.frontmatter:
                missing.append("tags")
            if missing:
                missing_fields.append({"file": pf.rel_path, "missing": missing})

        # Files with ALL-CAPS urgency (should use callouts instead)
        allcaps_urgency = []
        urgency_words = ("CRITICAL", "URGENT", "OVERDUE", "DEADLINE", "BLOCKER")
        for pf in files:
            if pf.parse_error:
                continue
            # Count ALL-CAPS urgency words outside of headings and code
            body_no_code = _strip_code_blocks(pf.body)
            for word in urgency_words:
                # Only flag standalone occurrences, not compound words
                if re.search(r"\b" + word + r"\b", body_no_code):
                    allcaps_urgency.append({"file": pf.rel_path, "word": word})
                    break

        return {
            "orphans": orphans,
            "broken_links": [list(b) for b in broken],
            "stale": sorted(stale, key=lambda x: -x["days_ago"]),
            "missing_frontmatter": missing_frontmatter,
            "missing_fields": missing_fields,
            "allcaps_urgency": allcaps_urgency,
            "total_issues": (
                len(orphans) + len(broken) + len(stale)
                + len(missing_frontmatter) + len(missing_fields) + len(allcaps_urgency)
            ),
        }

    # ------------------------------------------------------------------
    # Log (Karpathy LLM-Wiki spine file: append-only chronological ledger)
    # ------------------------------------------------------------------

    def tail_log(self, lines: int = 20) -> list[str]:
        """Return the last N entries from log.md. Each entry starts with `## [YYYY-MM-DD]`."""
        log_path = self.memory_dir / "log.md"
        if not log_path.exists():
            return []
        try:
            text = log_path.read_text(encoding="utf-8")
        except OSError:
            return []
        # Split on entry headers
        entries = re.split(r"^(?=## \[\d{4}-\d{2}-\d{2}\])", text, flags=re.MULTILINE)
        # Keep only actual entries (skip frontmatter and intro)
        entries = [e.strip() for e in entries if e.strip().startswith("## [")]
        return entries[:lines]  # most recent first (they're in reverse chron in the file)

    def health_summary(self) -> dict:
        """High-level health metrics."""
        files = self.parse_all()
        backlinks = build_backlinks(files)
        orphans = find_orphans(files, backlinks)
        broken = find_broken_links(files)
        tag_idx = build_tag_index(files)

        # Count tier distribution if decay is available
        tier_counts: dict[str, int] = {}
        for pf in files:
            info = get_decay_info(pf.rel_path)
            tier = info.get("tier", "UNKNOWN")
            tier_counts[tier] = tier_counts.get(tier, 0) + 1

        return {
            "total_files": len(files),
            "parse_errors": sum(1 for f in files if f.parse_error),
            "total_wikilinks": sum(len(set(f.wikilinks_out)) for f in files),
            "backlink_count": sum(len(v) for v in backlinks.values()),
            "orphan_count": len(orphans),
            "broken_link_count": len(broken),
            "tag_count": len(tag_idx),
            "tier_distribution": tier_counts,
            "reindexed_at": datetime.now(timezone.utc).isoformat(),
        }

    # ------------------------------------------------------------------
    # Reindex
    # ------------------------------------------------------------------

    def reindex(self, incremental: bool = False, skip_similarity: bool = False) -> dict:
        """Regenerate all indexes. Returns summary stats."""
        self.indexes_dir.mkdir(exist_ok=True)

        files = self.parse_all(force=True)

        backlinks = build_backlinks(files)
        tag_index = build_tag_index(files)
        orphans = find_orphans(files, backlinks)
        broken = find_broken_links(files)

        # Similarity is optional and expensive — skip on incremental unless flagged
        similarity = {}
        if not skip_similarity:
            try:
                similarity = build_similarity(files)
            except Exception as exc:
                print(f"similarity build failed: {exc}", file=sys.stderr)

        # Write indexes
        (self.indexes_dir / "backlinks.json").write_text(
            json.dumps(backlinks, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        (self.indexes_dir / "tag-index.json").write_text(
            json.dumps(tag_index, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        (self.indexes_dir / "orphans.json").write_text(
            json.dumps(orphans, indent=2) + "\n", encoding="utf-8"
        )
        (self.indexes_dir / "broken-links.json").write_text(
            json.dumps([list(b) for b in broken], indent=2) + "\n", encoding="utf-8"
        )
        if similarity:
            (self.indexes_dir / "similarity.json").write_text(
                json.dumps(similarity, indent=2, sort_keys=True) + "\n", encoding="utf-8"
            )

        # Write the Obsidian-visible entry point
        self._write_index_md(files, backlinks, tag_index, orphans, broken)

        # Write the Hermes-style bounded health file
        self._write_health_file(files, backlinks, orphans, broken, tag_index)

        # Invalidate cached indexes so subsequent queries hit fresh data
        self._backlinks_cache = None
        self._tags_cache = None
        self._similarity_cache = None

        return {
            "files_indexed": len(files),
            "parse_errors": sum(1 for f in files if f.parse_error),
            "backlinks_total": sum(len(v) for v in backlinks.values()),
            "tags_total": len(tag_index),
            "orphans": len(orphans),
            "broken_links": len(broken),
            "similarity_available": bool(similarity),
            "indexes_dir": str(self.indexes_dir),
        }

    def _write_index_md(
        self,
        files: list[ParsedFile],
        backlinks: dict,
        tag_index: dict,
        orphans: list[str],
        broken: list,
    ) -> None:
        """Write the Obsidian-visible entry point at indexes/_index.md."""
        lines = [
            "---",
            "type: reference",
            "entity: wiki-indexes",
            f"updated: {datetime.now(timezone.utc).date().isoformat()}",
            "updated_by: wiki.py",
            "status: active",
            "tags: [meta/indexes, meta/wiki]",
            "aliases: [Wiki Indexes, Index Directory]",
            "---",
            "",
            "# Wiki Indexes",
            "",
            "Generated by `wiki.py --reindex`. These are derived from the markdown "
            "files in `sartor/memory/` and can be regenerated at any time.",
            "",
            "## Files",
            "",
            "- `backlinks.json` — reverse index of `[[wikilink]]` references",
            "- `tag-index.json` — map of hierarchical tags to files",
            "- `similarity.json` — top-5 semantically similar files per article (if embeddings available)",
            "- `orphans.json` — files with zero incoming wikilinks (excluding meta/reference types)",
            "- `broken-links.json` — wikilinks whose targets don't resolve",
            "",
            "## Summary",
            "",
            f"- **Files indexed:** {len(files)}",
            f"- **Total wikilinks:** {sum(len(set(f.wikilinks_out)) for f in files)}",
            f"- **Total backlinks:** {sum(len(v) for v in backlinks.values())}",
            f"- **Tags:** {len(tag_index)}",
            f"- **Orphans:** {len(orphans)}",
            f"- **Broken links:** {len(broken)}",
            "",
            "## See also",
            "",
            "- [[MEMORY-CONVENTIONS]] — file format spec",
            "- [[MULTI-MACHINE-MEMORY]] — multi-machine sync",
            "- [[LLM-WIKI-ARCHITECTURE]] — how this wiki layer works",
            "",
        ]
        (self.indexes_dir / "_index.md").write_text("\n".join(lines), encoding="utf-8")

    def _write_health_file(
        self,
        files: list[ParsedFile],
        backlinks: dict,
        orphans: list[str],
        broken: list,
        tag_index: dict,
    ) -> None:
        """Write the bounded Hermes-style health file to data/wiki-state.md."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")

        tier_counts: dict[str, int] = {}
        for pf in files:
            info = get_decay_info(pf.rel_path)
            tier = info.get("tier", "UNKNOWN")
            tier_counts[tier] = tier_counts.get(tier, 0) + 1

        tier_line = ", ".join(f"{k}={v}" for k, v in sorted(tier_counts.items()))

        top_orphans = orphans[:5]
        top_broken_entries = [f"{s}->{t}" for s, t in broken[:5]]

        orphan_lines = [f"- {o}" for o in top_orphans] if top_orphans else ["- none"]
        broken_lines = [f"- {b}" for b in top_broken_entries] if top_broken_entries else ["- none"]

        lines = [
            f"# Wiki State ({now})",
            "",
            (
                f"files={len(files)} tags={len(tag_index)} "
                f"backlinks={sum(len(v) for v in backlinks.values())} "
                f"orphans={len(orphans)} broken={len(broken)}"
            ),
            "",
            f"tiers: {tier_line}",
            "",
            "## Top orphans (need incoming links)",
            *orphan_lines,
            "",
            "## Top broken wikilinks",
            *broken_lines,
            "",
        ]
        text = "\n".join(lines)
        # Bound to max chars, preserving header
        if len(text) > WIKI_HEALTH_MAX_CHARS:
            text = text[:WIKI_HEALTH_MAX_CHARS - 50] + "\n\n[truncated]\n"
        (DATA_DIR / "wiki-state.md").write_text(text, encoding="utf-8")


# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------


def _format_article(view: dict) -> str:
    """Pretty-print an article_view dict for CLI output."""
    if "error" in view:
        return f"ERROR: {view['error']}"

    lines = [
        f"# {view['title']}  [{view['file']}]",
        "",
        "## Frontmatter",
    ]
    for k, v in view["frontmatter"].items():
        lines.append(f"  {k}: {v}")

    if view.get("decay"):
        lines.append(f"\n## Decay: {view['decay'].get('tier')} ({view['decay'].get('score')})")

    if view.get("wikilinks_in"):
        lines.append(f"\n## Backlinks ({len(view['wikilinks_in'])})")
        for b in view["wikilinks_in"]:
            lines.append(f"  <- {b}")

    if view.get("wikilinks_out"):
        lines.append(f"\n## Wikilinks Out ({len(view['wikilinks_out'])})")
        for w in view["wikilinks_out"]:
            lines.append(f"  -> {w}")

    if view.get("similar"):
        lines.append(f"\n## Similar")
        for other, score in view["similar"]:
            lines.append(f"  {score:.3f}  {other}")

    if view.get("callouts"):
        lines.append(f"\n## Callouts ({len(view['callouts'])})")
        for kind, body in view["callouts"][:10]:
            snippet = body[:80].replace("\n", " ")
            lines.append(f"  [!{kind}] {snippet}")

    prov = view.get("provenance", {})
    if prov:
        lines.append(f"\n## Provenance")
        if prov.get("frontmatter_updated"):
            lines.append(f"  frontmatter_updated: {prov['frontmatter_updated']}")
        if prov.get("frontmatter_updated_by"):
            lines.append(f"  updated_by: {prov['frontmatter_updated_by']}")
        if prov.get("git_last_commit"):
            gc = prov["git_last_commit"]
            lines.append(f"  last_commit: {gc.get('date', '')[:10]} by {gc.get('author', '')}")
            lines.append(f"    '{gc.get('message', '')[:70]}'")
        lines.append(f"  git_recent_7d: {prov.get('git_recent_7d', 0)}")

    return "\n".join(lines)


def _selftest(wiki: Wiki) -> int:
    """Inline sanity tests. Returns 0 on success, nonzero on failure."""
    passed = 0
    failed = 0

    def check(name: str, ok: bool, detail: str = "") -> None:
        nonlocal passed, failed
        mark = "PASS" if ok else "FAIL"
        print(f"  [{mark}] {name}" + (f" -- {detail}" if detail else ""))
        if ok:
            passed += 1
        else:
            failed += 1

    print("\n== wiki.py selftest ==\n")

    files = wiki.parse_all(force=True)
    check("parse_all returned files", len(files) > 0, f"{len(files)} files")

    # Backlinks: TAXES should have at least one incoming (ALTON or BUSINESS reference it)
    taxes_backlinks = wiki.backlinks("TAXES")
    check("TAXES has backlinks", len(taxes_backlinks) > 0, f"{taxes_backlinks}")

    # Tag index: entity/person should include ALTON
    alton_in_person = "ALTON.md" in wiki.files_for_tag("entity/person")
    check("ALTON tagged entity/person", alton_in_person)

    # Article view
    view = wiki.article_view("TAXES")
    required_keys = {
        "file", "title", "frontmatter", "wikilinks_out", "wikilinks_in",
        "callouts", "headings", "similar", "decay", "provenance", "size_chars",
    }
    missing = required_keys - set(view.keys())
    check("article_view has all keys", not missing, f"missing={missing}")

    # Broken links should be a list (may be empty)
    broken = wiki.broken_links()
    check("broken_links returns list", isinstance(broken, list), f"{len(broken)} broken")

    # Orphans should be a list
    orphans = wiki.orphans()
    check("orphans returns list", isinstance(orphans, list), f"{len(orphans)} orphans")

    # Health summary
    health = wiki.health_summary()
    check("health_summary has total_files", "total_files" in health)

    print(f"\n{passed} passed, {failed} failed\n")
    return 0 if failed == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--memory-dir", type=Path, default=None, help="path to sartor/memory")
    parser.add_argument("--reindex", action="store_true", help="regenerate all indexes")
    parser.add_argument("--incremental", action="store_true", help="(with --reindex) incremental only")
    parser.add_argument("--skip-similarity", action="store_true", help="(with --reindex) skip similarity computation")
    parser.add_argument("--backlinks", metavar="FILE", help="show backlinks for FILE")
    parser.add_argument("--tags", action="store_true", help="list all tags with counts")
    parser.add_argument("--tag", metavar="TAG", help="list files with given tag")
    parser.add_argument("--similar", metavar="FILE", help="top-5 similar files to FILE")
    parser.add_argument("--orphans", action="store_true", help="files with zero incoming links")
    parser.add_argument("--broken", action="store_true", help="broken wikilink targets")
    parser.add_argument("--article", metavar="FILE", help="full article view (pretty-printed)")
    parser.add_argument("--article-json", metavar="FILE", help="full article view (JSON)")
    parser.add_argument("--health", action="store_true", help="health summary (JSON)")
    parser.add_argument("--lint", action="store_true", help="periodic audit for orphans, broken links, stale, missing frontmatter, ALL-CAPS urgency")
    parser.add_argument("--log", type=int, nargs="?", const=20, metavar="N", help="show last N log.md entries (default 20)")
    parser.add_argument("--selftest", action="store_true", help="run inline sanity tests")
    args = parser.parse_args()

    wiki = Wiki(args.memory_dir)

    if args.reindex:
        stats = wiki.reindex(incremental=args.incremental, skip_similarity=args.skip_similarity)
        print(json.dumps(stats, indent=2))
        return 0

    if args.selftest:
        return _selftest(wiki)

    if args.backlinks:
        rels = wiki.backlinks(args.backlinks)
        for r in rels:
            print(r)
        return 0

    if args.tags:
        t = wiki.tags()
        for tag in sorted(t.keys()):
            print(f"{tag:40s} {len(t[tag])}")
        return 0

    if args.tag:
        for f in wiki.files_for_tag(args.tag):
            print(f)
        return 0

    if args.similar:
        for other, score in wiki.similar(args.similar):
            print(f"{score:.3f}\t{other}")
        return 0

    if args.orphans:
        for o in wiki.orphans():
            print(o)
        return 0

    if args.broken:
        for src, tgt in wiki.broken_links():
            print(f"{src}\t{tgt}")
        return 0

    if args.article:
        print(_format_article(wiki.article_view(args.article)))
        return 0

    if args.article_json:
        view = wiki.article_view(args.article_json)
        # ParsedFile.path and mtime not JSON-serializable as-is; clean up
        print(json.dumps(view, indent=2, default=str))
        return 0

    if args.health:
        print(json.dumps(wiki.health_summary(), indent=2))
        return 0

    if args.lint:
        result = wiki.lint()
        print(json.dumps(result, indent=2, default=str))
        return 0 if result["total_issues"] == 0 else 1

    if args.log is not None:
        entries = wiki.tail_log(args.log)
        if not entries:
            print("(no log entries found — is sartor/memory/log.md present?)")
            return 0
        for e in entries:
            print(e)
            print()
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
