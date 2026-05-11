"""Read-only wikilink-graph metrics for the inspector-wikilinks-graph audit.

Walks sartor/memory/ to compute typed-link coverage, plain-link coverage,
broken-link inventory, orphan inventory, hub/authority rankings.

Does NOT write to data/graph.jsonl or sartor/memory/indexes/.
Just prints findings to stdout for the audit writer to incorporate.
"""

import json
import re
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(r"C:\Users\alto8\Sartor-claude-network")
MEMORY_ROOT = REPO_ROOT / "sartor" / "memory"

# Skip these dirs in the same way wiki.py / extract_graph.py do
SKIP_DIRS = {".obsidian", ".git", "__pycache__", "node_modules", ".meta", ".index", "indexes", "archive"}
SKIP_FILE_PATTERNS = {"_index.md", "wiki-state.md", "wiki-queue.md", "wiki-health.md"}
# wiki.py-aligned scope: also skip these (these are out-of-scope for the core wiki)
WIKI_SCOPE_SKIP_DIRS = {"daily", "inbox", "snapshots"}

# Wikilink patterns
TYPED_WIKILINK_RE = re.compile(r"\[\[([a-z][a-z0-9_]*):([^\]|]+?)(?:\|[^\]]+)?\]\]")
PLAIN_WIKILINK_RE = re.compile(r"\[\[([^\[\]|#]+?)(?:\|[^\[\]]*)?(?:#[^\[\]]*)?\]\]")
FENCED_CODE_RE = re.compile(r"```.*?```", re.DOTALL)
INLINE_CODE_RE = re.compile(r"`[^`\n]+`")


def strip_code(text: str) -> str:
    text = FENCED_CODE_RE.sub("", text)
    text = INLINE_CODE_RE.sub("", text)
    return text


def should_skip(p: Path, *, wiki_scope: bool = False) -> bool:
    parts = p.relative_to(MEMORY_ROOT).parts
    if any(part in SKIP_DIRS for part in parts):
        return True
    if p.name in SKIP_FILE_PATTERNS:
        return True
    if wiki_scope and any(part in WIKI_SCOPE_SKIP_DIRS for part in parts):
        return True
    return False


def collect_files(*, wiki_scope: bool = False) -> list[Path]:
    files = []
    for p in MEMORY_ROOT.rglob("*.md"):
        if should_skip(p, wiki_scope=wiki_scope):
            continue
        files.append(p)
    return sorted(files)


def file_id(p: Path) -> str:
    """A canonical identifier for the file: relative path POSIX-style minus .md."""
    return p.relative_to(MEMORY_ROOT).as_posix()[:-3]  # drop .md


def basename_id(p: Path) -> str:
    return p.stem


def normalize_link_target(raw: str) -> str:
    """Normalize a wikilink target for resolution.

    - Strip whitespace
    - Strip leading ./
    - Drop .md suffix if present
    - Handle # anchors / | aliases (already stripped by regex but defensive)
    """
    raw = raw.strip()
    if raw.startswith("./"):
        raw = raw[2:]
    if raw.endswith(".md"):
        raw = raw[:-3]
    return raw


def build_lookup(files: list[Path]) -> tuple[dict[str, str], dict[str, list[str]]]:
    """Build a case-insensitive lookup from various forms to canonical file_id.

    Accepts:
    - basename (e.g., 'TAXES' -> 'TAXES')
    - relative path (e.g., 'business/solar-inference')
    - lowercased versions of both
    Also returns a basename->[fids] map so the resolver can use it for
    parent-directory-relative resolution.
    """
    lookup: dict[str, str] = {}
    basename_map: dict[str, list[str]] = defaultdict(list)
    for p in files:
        fid = file_id(p)
        bn = basename_id(p)
        # exact path
        lookup.setdefault(fid, fid)
        lookup.setdefault(fid.lower(), fid)
        # basename (last-write wins is fine, we'll detect collisions separately)
        lookup.setdefault(bn, fid)
        lookup.setdefault(bn.lower(), fid)
        basename_map[bn].append(fid)
        basename_map[bn.lower()].append(fid)
    return lookup, basename_map


def resolve_link(target: str, source_fid: str, lookup: dict[str, str], basename_map: dict[str, list[str]]) -> str | None:
    """Resolve a wikilink target to a canonical file_id.

    Tries, in order:
    1. Direct lookup (absolute repo-relative path)
    2. Source's parent dir prefix (the subdir-relative case Obsidian uses)
    3. Resolve ../ paths against source dir
    4. Basename-only fallback
    Case-insensitive throughout.
    """
    n = normalize_link_target(target)
    nl = n.lower()

    # 1. Direct
    if n in lookup:
        return lookup[n]
    if nl in lookup:
        return lookup[nl]

    # 2. Resolve relative to source dir (handles "../foo" and "subdir/foo")
    src_dir = "/".join(source_fid.split("/")[:-1]) if "/" in source_fid else ""
    if "../" in n or n.startswith("./") or "/" in n:
        # Use Path semantics
        try:
            base = Path(src_dir) if src_dir else Path()
            resolved_path = (base / n).as_posix()
            # Normalize ../ and ./
            parts: list[str] = []
            for part in resolved_path.split("/"):
                if part == "..":
                    if parts:
                        parts.pop()
                elif part and part != ".":
                    parts.append(part)
            cand = "/".join(parts)
            if cand in lookup:
                return lookup[cand]
            if cand.lower() in lookup:
                return lookup[cand.lower()]
        except Exception:
            pass

    # 3. Basename only
    base = n.split("/")[-1]
    if base in lookup:
        return lookup[base]
    if base.lower() in lookup:
        return lookup[base.lower()]

    return None


def main() -> None:
    import sys
    wiki_scope = "--wiki-scope" in sys.argv
    files = collect_files(wiki_scope=wiki_scope)
    n_files = len(files)
    scope_label = "wiki-core (excluding daily/inbox/snapshots/archive/indexes)" if wiki_scope else "broad (excluding archive/indexes only)"
    print(f"# Scope: {scope_label}")
    print(f"# Total .md files: {n_files}\n")

    lookup, basename_map = build_lookup(files)
    # collision diagnostics: basenames that map to multiple files
    collisions = {bn: fids for bn, fids in basename_map.items() if len(set(fids)) > 1}
    print(f"# Basename collisions (same stem, multiple files): {len(collisions)}")
    for bn, fids in sorted(collisions.items())[:15]:
        unique = sorted(set(fids))
        print(f"  {bn}: {unique}")
    print()

    # Per-file outbound links (typed and plain)
    typed_out = defaultdict(set)  # file_id -> set of (rel, target)
    plain_out = defaultdict(set)  # file_id -> set of target_raw
    typed_targets_by_file = defaultdict(set)  # for hub-counting (just the target portion)
    plain_targets_by_file = defaultdict(set)
    files_with_typed = 0
    files_with_plain = 0
    total_typed_edges = 0
    total_plain_edges = 0
    broken_links = []  # list of (source_fid, target_raw)
    inbound = defaultdict(set)  # file_id -> set of source_fids

    for p in files:
        fid = file_id(p)
        try:
            text = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = p.read_text(encoding="utf-8", errors="replace")
        text = strip_code(text)

        # typed
        for m in TYPED_WIKILINK_RE.finditer(text):
            rel, tgt = m.group(1), m.group(2)
            typed_out[fid].add((rel, tgt.strip()))
            typed_targets_by_file[fid].add(tgt.strip())
            total_typed_edges += 1

        # plain (also catches typed because the typed pattern's "rel:target" matches as the bracket-1)
        for m in PLAIN_WIKILINK_RE.finditer(text):
            raw = m.group(1).strip()
            # If raw starts with "rel:" treat target as the post-colon
            if ":" in raw and TYPED_WIKILINK_RE.search(f"[[{raw}]]"):
                rel_part, tgt_part = raw.split(":", 1)
                target_for_resolve = tgt_part.strip()
                plain_targets_by_file[fid].add(target_for_resolve)
            else:
                target_for_resolve = raw
                plain_targets_by_file[fid].add(target_for_resolve)
            plain_out[fid].add(target_for_resolve)
            total_plain_edges += 1

            # Resolve the target
            resolved = resolve_link(target_for_resolve, fid, lookup, basename_map)
            if resolved is None:
                broken_links.append((fid, target_for_resolve))
            else:
                inbound[resolved].add(fid)

        if typed_out[fid]:
            files_with_typed += 1
        if plain_out[fid]:
            files_with_plain += 1

    # Coverage metrics
    print("## Coverage")
    print(f"Files with at least one TYPED wikilink:  {files_with_typed} / {n_files}  "
          f"({100*files_with_typed/n_files:.1f}%)")
    print(f"Files with at least one PLAIN wikilink:  {files_with_plain} / {n_files}  "
          f"({100*files_with_plain/n_files:.1f}%)")
    print(f"Total typed edges: {total_typed_edges}")
    print(f"Total plain edges: {total_plain_edges}")
    print()

    # Broken links
    print(f"## Broken links: {len(broken_links)}")
    for src, tgt in broken_links[:200]:
        print(f"  {src}  ->  [[{tgt}]]")
    if len(broken_links) > 200:
        print(f"  ... and {len(broken_links) - 200} more")
    print()

    # Orphans: files with zero inbound from anywhere
    orphan_files = [file_id(p) for p in files if file_id(p) not in inbound]
    print(f"## Orphans: {len(orphan_files)} of {n_files} files have ZERO inbound wikilinks")
    for fid in orphan_files[:60]:
        print(f"  {fid}")
    if len(orphan_files) > 60:
        print(f"  ... and {len(orphan_files) - 60} more")
    print()

    # Hubs: highest in-degree
    in_deg = [(fid, len(srcs)) for fid, srcs in inbound.items()]
    in_deg.sort(key=lambda x: -x[1])
    print("## Top 15 hubs (highest in-degree)")
    for fid, n in in_deg[:15]:
        print(f"  {n:4d}  {fid}")
    print()

    # Authorities: highest out-degree (plain)
    out_deg = [(fid, len(tgts)) for fid, tgts in plain_targets_by_file.items()]
    out_deg.sort(key=lambda x: -x[1])
    print("## Top 15 authorities (highest unique-target out-degree, plain)")
    for fid, n in out_deg[:15]:
        print(f"  {n:4d}  {fid}")
    print()

    # Files with TYPED links specifically
    print("## Files containing typed wikilinks")
    for fid, edges in sorted(typed_out.items()):
        if edges:
            relset = sorted({r for r, _ in edges})
            print(f"  {fid}  -- relations: {relset}  edges: {len(edges)}")

    print()

    # Histogram of plain target frequency (top 30 most-referenced raw targets)
    target_freq: dict[str, int] = defaultdict(int)
    for fid, tgts in plain_targets_by_file.items():
        for t in tgts:
            target_freq[t] += 1
    print("## Top 30 most-referenced wikilink TARGETS (raw, by # of distinct source files)")
    ranked = sorted(target_freq.items(), key=lambda kv: -kv[1])[:30]
    for tgt, n in ranked:
        # Use a synthetic source for resolution check
        resolved = resolve_link(tgt, "", lookup, basename_map)
        flag = "" if resolved else "  [BROKEN-globally]"
        print(f"  {n:4d}  [[{tgt}]]{flag}")


if __name__ == "__main__":
    main()
