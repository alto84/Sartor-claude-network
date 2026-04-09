---
name: build-llm-wiki
description: Use when building an LLM-optimized wiki/knowledge-base system in a new repo, when adding backlinks and tag search on top of a markdown knowledge folder, or when porting the Sartor wiki pattern to a different environment (e.g., a work computer with no access to the source Hermes agent code). Creates a self-contained, Obsidian-compatible wiki layer in a few hundred lines of Python.
---

# Build LLM Wiki

A portable playbook for building a lightweight LLM-optimized wiki on top of any folder of markdown files. Derived from Sartor's implementation but rewritten as a from-scratch recipe — no references to Sartor's specific file paths or machinery beyond examples. **Use this skill when you're in a different environment (e.g., work machine) and you want a wiki layer without reading the original source code.**

## What you end up with

After following this skill you will have:

1. A single Python file (`wiki.py`) with a `Wiki` class and a CLI
2. A folder of generated indexes (`indexes/`) with JSON files for backlinks, tags, orphans, broken links, optional similarity
3. An `_index.md` entry point file (Obsidian-visible) that describes what's in the indexes folder
4. A bounded health file (e.g., `state/wiki-state.md`) under 1500 chars
5. Optionally: a subagent definition and a scheduled reindex task

Everything is backwards-compatible with Obsidian. The markdown files you already have don't need to change format.

## Prerequisites

- Python 3.10+ (uses `|` type syntax and dataclasses)
- A folder of markdown files that uses:
  - YAML frontmatter at the top of each file
  - Wikilinks `[[FILE]]` or `[[FILE|alias]]`
  - Optional: Obsidian callouts `> [!type]`
  - Optional: hierarchical tags `#entity/person`
- Git (optional — used for provenance)
- Stdlib only. No external dependencies required for the core.

## File format conventions (what the wiki expects)

If your markdown doesn't follow these already, establish them before the wiki layer will be useful.

### Frontmatter schema

Every wiki file starts with YAML frontmatter. Minimum required fields:

```yaml
---
type: domain          # person | domain | meta | reference | feedback
updated: 2026-04-09   # ISO date, bumped on every content change
updated_by: Claude    # author of the last change
tags: [entity/foo, status/active]
---
```

Optional but recommended:

```yaml
entity: TAXES         # canonical entity name, often matches filename
status: active        # active | pending | archived | stale
aliases: [Tax, TY2025]
related: [ALTON, BUSINESS]
next_deadline: 2026-04-15
```

### Wikilinks

- `[[FILE]]` — reference by stem (case-insensitive)
- `[[FILE|display text]]` — with display alias
- `[[FILE#Section]]` — reference a section within a file
- `[[subdir/file]]` — path-based reference for files in subdirectories

### Callouts

```markdown
> [!deadline] 2026-04-15
> Tax filing deadline

> [!decision]
> File 1040 or extend via Form 4868?

> [!fact] Authoritative claim
> Verified information with a source

> [!warning]
> Risk or caution

> [!blocker]
> Something blocking other work
```

### Tags

```yaml
tags: [entity/person, domain/career, priority/p1, status/active]
```

Use slash hierarchy for nesting. Keep the vocabulary small (5-10 prefixes max) and extend by adding new terms, not new prefixes.

## The wiki.py module

Create a single Python file that exposes:

- A `Wiki` class with methods for querying
- A `reindex()` method that regenerates all the derived indexes
- A CLI with argparse for each operation

Here's the reference implementation algorithm. Write it yourself; don't copy literally. The exact code matters less than the algorithm.

### Constants

```python
SKIP_DIRS = {".obsidian", ".git", "__pycache__", "node_modules", ".index", "indexes"}
SKIP_FILE_PATTERNS = {"_index.md", "wiki-state.md"}

# Match wikilinks: [[target]] or [[target|alias]] or [[target#anchor]]
WIKILINK_PATTERN = r"\[\[([^\[\]|#]+?)(?:\|[^\[\]]*)?(?:#[^\[\]]*)?\]\]"

# Match fenced code blocks (```...```) so we can strip them before
# extracting wikilinks — prevents documentation examples like [[FILE]]
# from being counted as real links.
FENCED_CODE_PATTERN = r"```.*?```"  # re.DOTALL
INLINE_CODE_PATTERN = r"`[^`\n]+`"

# Match YAML frontmatter
FRONTMATTER_PATTERN = r"^---\s*\n(.*?)\n---\s*\n"  # re.DOTALL

# Match markdown headings and callouts
HEADING_PATTERN = r"^(#{1,6})\s+(.+?)\s*$"  # re.MULTILINE
CALLOUT_PATTERN = r"^>\s*\[!([a-zA-Z_-]+)\](.*)$"  # re.MULTILINE
```

### File collection

```python
def collect_files(memory_dir):
    files = []
    for path in memory_dir.rglob("*.md"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_FILE_PATTERNS:
            continue
        # Skip append-only log folders (they're high-churn and don't need wiki)
        if "daily" in path.parts or "inbox" in path.parts or "snapshots" in path.parts:
            continue
        files.append(path)
    return sorted(files)
```

### Lightweight YAML parser

You don't need PyYAML. Parse the subset you actually use: scalar key:value, inline lists `[a, b, c]`, quoted strings.

```python
def parse_frontmatter(text):
    match = re.match(FRONTMATTER_PATTERN, text, re.DOTALL)
    if not match:
        return {}, text
    yaml_block = match.group(1)
    body = text[match.end():]
    meta = {}
    for line in yaml_block.splitlines():
        if ":" not in line or line.strip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            items = [x.strip().strip("\"'") for x in value[1:-1].split(",") if x.strip()]
            meta[key] = items
        elif (value.startswith('"') and value.endswith('"')) or \
             (value.startswith("'") and value.endswith("'")):
            meta[key] = value[1:-1]
        else:
            meta[key] = value or None
    return meta, body
```

### Parsing a file

Produce a dataclass with: path, stem, rel_path, frontmatter, title, body, wikilinks_out, callouts, headings, size_chars, mtime, parse_error.

**Critical step:** strip code blocks from the body BEFORE extracting wikilinks. Otherwise documentation examples like `[[PLACEHOLDER]]` inside ``` fences will show as broken links.

```python
def parse_file(path, memory_dir):
    text = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)

    # Strip code blocks before wikilink extraction
    body_no_code = re.sub(FENCED_CODE_PATTERN, "", body, flags=re.DOTALL)
    body_no_code = re.sub(INLINE_CODE_PATTERN, "", body_no_code)

    wikilinks = []
    for m in re.finditer(WIKILINK_PATTERN, body_no_code):
        target = m.group(1).strip().split("#")[0].strip()
        if target:
            wikilinks.append(target)

    # ...extract title, callouts, headings similarly
    return ParsedFile(...)
```

### Wikilink resolution

A wikilink target like `[[FOO]]` should resolve to a canonical rel_path. Try in order:

1. **Exact stem match** — `FOO` → `FOO.md` at any path
2. **Path suffix match** — `subdir/foo` → any file whose rel_path ends with `/foo.md`
3. **Basename of path** — `subdir/foo` → the basename `foo` matches any stem

```python
def resolve_wikilink(target, stem_to_path, path_to_path):
    key = target.lower()
    if key in stem_to_path:
        return stem_to_path[key]
    suffix = f"/{key}.md"
    for rel_lower, rel in path_to_path.items():
        if rel_lower == key + ".md" or rel_lower.endswith(suffix):
            return rel
    if "/" in key:
        last = key.rsplit("/", 1)[-1]
        if last in stem_to_path:
            return stem_to_path[last]
    return None
```

### Building indexes

Three essential indexes; two optional.

**Backlinks (essential):**

```python
def build_backlinks(files):
    stem_to_path = {pf.stem.lower(): pf.rel_path for pf in files}
    path_to_path = {pf.rel_path.lower(): pf.rel_path for pf in files}
    backlinks = {pf.rel_path: [] for pf in files}
    for pf in files:
        seen = set()
        for target in pf.wikilinks_out:
            canonical = resolve_wikilink(target, stem_to_path, path_to_path)
            if canonical and canonical != pf.rel_path and canonical not in seen:
                backlinks[canonical].append(pf.rel_path)
                seen.add(canonical)
    return {k: sorted(set(v)) for k, v in backlinks.items()}
```

**Tag index (essential):**

```python
def build_tag_index(files):
    tags = {}
    for pf in files:
        raw = pf.frontmatter.get("tags") or []
        if isinstance(raw, str):
            raw = [raw]
        for tag in raw:
            tag = str(tag).strip()
            if tag:
                tags.setdefault(tag, []).append(pf.rel_path)
    return {k: sorted(set(v)) for k, v in tags.items()}
```

**Orphans (essential):**

```python
def find_orphans(files, backlinks):
    excluded_types = {"meta", "reference", "feedback"}
    orphans = []
    for pf in files:
        ftype = str(pf.frontmatter.get("type") or "").strip()
        if ftype in excluded_types:
            continue
        if not backlinks.get(pf.rel_path):
            orphans.append(pf.rel_path)
    return sorted(orphans)
```

**Broken links (essential):**

```python
def find_broken_links(files):
    stem_to_path = {pf.stem.lower(): pf.rel_path for pf in files}
    path_to_path = {pf.rel_path.lower(): pf.rel_path for pf in files}
    broken = []
    for pf in files:
        seen = set()
        for target in pf.wikilinks_out:
            if target.lower() in seen:
                continue
            seen.add(target.lower())
            if resolve_wikilink(target, stem_to_path, path_to_path) is None:
                broken.append((pf.rel_path, target))
    return broken
```

**Similarity (optional):** requires an embeddings system. If you have one (e.g., ollama + nomic-embed-text, or OpenAI embeddings, or sentence-transformers), wrap it. If not, skip this — the wiki still works.

```python
def build_similarity(files, embedder_fn):
    """embedder_fn: callable(str) -> list[float] for embedding"""
    # For each file, embed the title + top 5 headings, store in a vector index,
    # then for each file query the top-5 nearest neighbors excluding self.
    # Use cosine similarity.
    # Return {rel_path: [(other, score), ...]}
```

### Provenance (git-based)

Use `git log` to get last commit info and recent activity count. Wrap in a try/except so it degrades gracefully if git isn't available.

```python
def git_recent_activity(file_rel_path, memory_dir, days=7):
    try:
        result = subprocess.run(
            ["git", "log", f"--since={days} days ago", "--oneline", "--",
             str(memory_dir / file_rel_path)],
            cwd=str(memory_dir), capture_output=True, text=True, timeout=10
        )
        return len([ln for ln in result.stdout.splitlines() if ln.strip()])
    except Exception:
        return 0
```

### The `Wiki` class

Wrap everything in a class so callers don't need to know about internals:

```python
class Wiki:
    def __init__(self, memory_dir):
        self.memory_dir = Path(memory_dir)
        self.indexes_dir = self.memory_dir / "indexes"

    def parse_all(self): ...
    def backlinks(self, file) -> list[str]: ...
    def tags(self) -> dict[str, list[str]]: ...
    def files_for_tag(self, tag) -> list[str]: ...
    def similar(self, file, top_k=5) -> list[tuple[str, float]]: ...
    def orphans(self) -> list[str]: ...
    def broken_links(self) -> list[tuple[str, str]]: ...
    def provenance(self, file) -> dict: ...
    def article_view(self, file) -> dict: ...
    def health_summary(self) -> dict: ...
    def reindex(self) -> dict: ...
```

The `article_view(file)` method is the most important single function. It should return a dict with everything an agent needs to reason about the file:

```python
{
    "file": rel_path,
    "title": extracted_title,
    "frontmatter": parsed_dict,
    "wikilinks_out": sorted_list,
    "wikilinks_in": backlinks_list,
    "callouts": [(type, body), ...],
    "headings": [(level, text), ...],
    "similar": [(other, score), ...],
    "provenance": {
        "frontmatter_updated": ...,
        "git_recent_7d": ...,
        "git_last_commit": {...},
    },
    "size_chars": int,
}
```

### The bounded health file

Write a capped-size markdown file (e.g., `state/wiki-state.md` under 1500 chars) with the current health snapshot. This mirrors the Hermes bounded memory pattern — a fixed-size file that gets overwritten each run. Useful for agents to read on context injection without blowing up their token budget.

```markdown
# Wiki State (2026-04-09T02:30:00+00:00)

files=43 tags=26 backlinks=173 orphans=0 broken=0

tiers: ACTIVE=12, WARM=20, COLD=11

## Top orphans
- (none)

## Top broken wikilinks
- (none)
```

Hard-enforce the char cap in code. If you exceed it, truncate with a marker.

## Scheduled reindex task

Create a scheduled task (cron, systemd timer, or whatever your environment uses) that runs `wiki.py --reindex` once a day. The task should:

1. Check whether any .md file has changed since the last reindex (mtime comparison)
2. If nothing changed, skip
3. Otherwise, reindex
4. Write a cycle report to `state/wiki-reindex-log.md`

Keep this simple. The reindex itself is deterministic; there's no judgment call.

## Query subagent (optional)

Define a subagent whose job is to query the wiki for other agents. This keeps the parent agent's context window bounded.

```markdown
---
name: wiki-reader
description: Query the LLM wiki efficiently. Uses wiki.py CLI to assemble focused context without loading raw markdown files.
---

When you get a question:
1. Identify the target entity/topic
2. Use wiki.py --article, --tag, --backlinks, --similar CLI
3. Return a focused answer with file:line citations

Never read raw markdown files. Never write to memory. Stay under 400 words.
```

## Testing

### Inline selftest

Put a `--selftest` flag on `wiki.py` that runs 5-7 quick sanity checks against whatever memory folder you point it at. Assert:

1. `parse_all()` returns >0 files
2. A known file with known backlinks returns them correctly
3. `files_for_tag()` returns at least one known file for a known tag
4. `article_view()` returns all expected keys
5. `orphans()` and `broken_links()` return lists (may be empty)
6. `health_summary()` has a `total_files` key

Run this on every edit to `wiki.py` before committing. Fast (< 1 sec), catches regressions.

### Integration test

Run `wiki.py --reindex` against the real memory folder. Verify:
- All expected index files exist in `indexes/`
- Non-trivial counts (backlinks > 0, tags > 0)
- No parse errors
- `broken_links` and `orphans` are either 0 or understandable

### Obsidian compat test

Open the memory folder in Obsidian and check:
1. Graph view still renders
2. Backlinks panel on a file matches `wiki.py --backlinks FILE`
3. Tag pane shows all hierarchical tags
4. No errors in Obsidian developer console

## Obsidian compatibility checklist

Every artifact must pass these:

- [ ] All content lives in `.md` files with YAML frontmatter. No parallel storage format.
- [ ] Wikilinks use `[[FILE]]` syntax (Obsidian-native).
- [ ] Callouts use `> [!type]` syntax (Obsidian-native).
- [ ] Tags use `#hierarchy/subtag` (Obsidian-native).
- [ ] The `indexes/` directory has a visible `_index.md` file at its root so Obsidian sees the folder.
- [ ] JSON files in `indexes/` are ignored by Obsidian's graph view (it only graphs wikilinks).
- [ ] No modifications to existing .md files — wiki layer is additive only.
- [ ] `.obsidian/` config is untouched.

## Hermes bounded memory contract

If your system uses the Hermes 4-phase self-improvement pattern (evaluate → research → implement → validate with bounded memory), this wiki layer plugs in cleanly:

- **wiki-state.md** (bounded): the current wiki health snapshot
- **wiki-queue.md** (bounded, optional): the curator's next actions on the wiki
- Both overwritten, not appended. Size-capped.
- Read at the start of every cycle. Written at the end.

## Gotchas and lessons

- **Code blocks must be stripped before wikilink extraction.** Otherwise documentation examples like `[[PLACEHOLDER]]` inside ``` fences inflate your broken-link count. This one catch saved me ~130 false positives.
- **Path-style wikilinks need special handling.** `[[subdir/file]]` doesn't match by stem; resolver must try stem, rel_path suffix, and basename fallback.
- **Meta/reference/feedback files shouldn't be flagged as orphans.** They don't need incoming backlinks by design.
- **Section anchors (`[[FILE#Section]]`) are not separate files.** The resolver must strip the `#` and resolve only the file portion.
- **Decay tiers are optional.** If your decay system isn't in place or has a corrupt state file, fall back to `UNKNOWN` gracefully rather than crashing.
- **Git provenance must be wrapped in try/except.** Git unavailable is not a wiki failure.
- **YAML parsing must be forgiving.** Use a minimal parser instead of adding PyYAML as a dependency. The subset you need is tiny.

## Minimal working version (phase 1)

If you need something working in 30 minutes:

1. `wiki.py` with just `parse_all()`, `backlinks()`, `build_backlinks()`, `find_broken_links()`, and a CLI with `--backlinks FILE` and `--reindex`
2. `indexes/backlinks.json` output
3. No tag index, no similarity, no provenance, no health file yet

You can add the rest later. Backlinks alone is already a major upgrade over "grep for [[".

## Full version (phase 2)

Add these in order:

1. Tag index
2. Orphan detection
3. Broken link detection
4. Article view dict
5. Health summary
6. Bounded wiki-state.md
7. Provenance via git
8. `_index.md` entry point
9. CLI flags for each query type
10. Inline selftest

## Bonus (phase 3)

1. Semantic similarity via embeddings (if you have an embeddings system)
2. Web UI (FastAPI sub-router)
3. Graph visualization (d3.js or similar)
4. Article templates for new-file creation
5. Auto-fix suggestions for broken links

## Done criteria

You're done when:

1. `python wiki.py --selftest` passes all checks
2. `python wiki.py --reindex` produces `backlinks.json`, `tag-index.json`, `orphans.json`, `broken-links.json`, and `_index.md`
3. `python wiki.py --article FOO` returns a structured view for a known file
4. Opening the memory folder in Obsidian still works (no errors, graph view renders, backlinks panel shows expected results)
5. The wiki code is under 1000 lines and has zero external dependencies for the core (similarity + provenance are optional deps)

## Anti-patterns to avoid

- **Don't store wiki content in a database.** Markdown files stay canonical. Indexes are derived.
- **Don't require a server or daemon.** Everything is CLI or library. Works offline.
- **Don't parse with a heavyweight markdown library.** Regex is fine for the subset you need (frontmatter, wikilinks, callouts, headings).
- **Don't build a web UI first.** CLI + Python API is the interface. Web UI is a stretch goal.
- **Don't couple to a specific embedding model.** Make similarity a pluggable `embedder_fn` parameter.
- **Don't modify existing memory files.** The wiki layer is read-mostly. If you find a bug in a file, report it; don't auto-fix.

## When this skill applies

Use this skill when:

- Building a personal knowledge base for an LLM agent
- Porting an existing Obsidian vault to work with LLM agents
- Setting up a second environment (e.g., work machine) that needs the same wiki features without copying proprietary source
- Replacing a legacy "grep my notes" workflow with something queryable
- Needing a wiki that works in Obsidian AND in agent CLI flows simultaneously

Don't use this skill for:

- Public-facing documentation sites (use Docusaurus, MkDocs, Hugo)
- Heavily multi-user wikis (use MediaWiki, BookStack)
- Content that needs WYSIWYG editing (use Notion, Confluence)
- Systems where the markdown files are tiny (< 20 files) and grep is sufficient

## Final assembly order

1. Establish the file format conventions in your memory folder (frontmatter, wikilinks, callouts, tags)
2. Write `wiki.py` phase 1 (backlinks only)
3. Test with `--selftest`
4. Add tag index, orphans, broken links
5. Add article view and health summary
6. Add bounded wiki-state file
7. Add provenance via git (optional)
8. Add similarity via embeddings (optional)
9. Wire up a scheduled reindex task
10. Define a wiki-reader subagent
11. Run Obsidian compatibility check
12. Commit and use
