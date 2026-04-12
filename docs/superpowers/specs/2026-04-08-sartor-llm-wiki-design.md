---
type: reference
entity: spec-llm-wiki
updated: 2026-04-08
updated_by: Claude
status: active
tags: [meta/spec, meta/wiki, curator/spec]
aliases: [LLM Wiki Spec, Wiki Design]
related: [MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY]
---

# Sartor LLM Wiki — Design Spec

> Written autonomously 2026-04-08 per explicit user directive ("you can do this yourself, don't come back to me"). Normally a design at this scale would be user-reviewed before implementation, but the user wants execution, not dialogue.

## Why

The 2026-04-07 memory system upgrade added frontmatter, callouts, and wikilinks — but the files are still just markdown in a folder. Discoverability is weak:

- 78 wikilinks exist, but relationships are unidirectional (file A says `[[B]]`; asking "what references B?" needs grep)
- Tags exist in frontmatter, but there's no tag index — "show all `entity/tax` files" needs grep
- Semantic embeddings exist (via ollama + nomic-embed-text), but "related articles for TAXES" isn't exposed
- Decay scoring exists (`decay.py`, HOT/WARM/COLD tiers), but isn't surfaced in queries
- Provenance (who edited what, when, why) is only in git — not visible inside the file view

This spec adds a thin Python layer on top of the existing substrate — **the Hermes-style bounded-memory agent pattern applied to the wiki itself**. Nothing about the existing machinery changes. This is additive.

## Non-goals

- **Not a new storage format.** Files stay as markdown with YAML frontmatter. Obsidian compatibility is preserved 100%.
- **Not a rewrite.** `search.py`, `decay.py`, `embeddings.py`, `autodream.py` all stay exactly as they are. The wiki layer wraps them.
- **Not a web UI.** The dashboard integration is a stretch goal. The core must work via CLI + Python import.
- **Not dependent on external Hermes source.** The design is derived from first principles + the existing Sartor patterns. A portable skill will document how to rebuild this from scratch without any privileged source code.
- **Not a replacement for the curator.** The curator still writes. The wiki is a reader/query layer plus a nightly indexing task.

## Design principles

1. **Single substrate.** Same markdown files work in Obsidian, grep, Python, Claude Code. No duplicate content.
2. **Indexes are derived, not authoritative.** `backlinks.json`, `tag-index.json`, `similarity.json` can be regenerated from the files at any time. Losing them loses nothing.
3. **Append, don't rewrite.** The wiki layer adds files (wiki.py, indexes/). It does not mutate existing memory files.
4. **Bounded memory contract (Hermes style).** The wiki's own state files (health, queue, recent edits) are capped in size. This prevents unbounded context growth and mirrors the existing self-improvement-loop pattern.
5. **Obsidian-first compatibility.** Every artifact the wiki produces must render correctly in Obsidian. Indexes go in a subdirectory Obsidian treats as harmless (`indexes/` with `_index.md` + JSON files). Wikilinks use `[[FILE]]` syntax. Tags use `#entity/person` syntax.
6. **Agent-accessible.** Every wiki operation has a Python function AND a CLI command. Agents can query the wiki without reading raw markdown.
7. **Preserve provenance.** Every edit to a wiki file — whether from Alton, the curator, or a personal-data-gather run — is attributable via git log + frontmatter `updated` / `updated_by` fields.

## Architecture

```
sartor/memory/                    ← the substrate (unchanged)
├── ALTON.md                      ← markdown with frontmatter + wikilinks + callouts
├── FAMILY.md
├── TAXES.md
├── ...
├── daily/                        ← append-only session logs
├── feedback/                     ← auto-injected behavioral rules
├── reference/                    ← architecture docs
├── inbox/{machine}/              ← multi-machine write queue
│
├── search.py                     ← BM25 + decay (unchanged)
├── decay.py                      ← HOT/WARM/COLD scoring (unchanged)
├── embeddings.py                 ← semantic via nomic-embed-text (unchanged)
├── autodream.py                  ← nightly consolidation (unchanged)
│
├── wiki.py                       ← NEW: thin query/index layer
│
└── indexes/                      ← NEW: derived indexes (gitignored)
    ├── _index.md                 ← Obsidian-visible human description
    ├── backlinks.json            ← {target_file: [source_file, ...]}
    ├── tag-index.json            ← {tag: [file, ...]}
    ├── similarity.json           ← {file: [(other, score), ...]}
    ├── orphans.json              ← files with zero incoming links
    └── wiki-health.md            ← bounded: tier distribution, orphan count, stale count
```

## Core components

### 1. `sartor/memory/wiki.py`

A single Python module with a `Wiki` class and a CLI interface. No external dependencies beyond stdlib and what Sartor already uses (`rank_bm25`, `sqlite3`).

**Public API:**

```python
class Wiki:
    def __init__(self, memory_dir: Path): ...

    # Query
    def backlinks(self, file: str) -> list[str]: ...
    def tags(self) -> dict[str, list[str]]: ...
    def files_for_tag(self, tag: str) -> list[str]: ...
    def similar(self, file: str, top_k: int = 5) -> list[tuple[str, float]]: ...
    def provenance(self, file: str) -> dict: ...
    def article_view(self, file: str) -> dict: ...
    def orphans(self) -> list[str]: ...
    def broken_links(self) -> list[tuple[str, str]]: ...
    def health_summary(self) -> dict: ...

    # Maintenance
    def reindex(self, incremental: bool = True) -> dict: ...
```

**`article_view(file)`** returns a single structured dict with everything an agent needs to reason about a file:

```python
{
    "file": "TAXES.md",
    "frontmatter": {...},           # parsed YAML
    "title": "Tax Preparation — Tax Year 2025",
    "sections": [...],               # list of (heading, body)
    "callouts": [...],               # extracted [!deadline], [!decision], etc.
    "wikilinks_out": ["ALTON", "FAMILY", "BUSINESS"],
    "wikilinks_in": ["ALTON", "BUSINESS"],  # backlinks
    "similar": [("BUSINESS.md", 0.82), ...],
    "decay_tier": "WARM",
    "decay_score": 0.42,
    "last_updated": "2026-04-07",
    "recent_git_activity": 3,        # commits in last 7 days
    "size_chars": 5321,
}
```

### 2. `sartor/memory/indexes/`

Persistent derived indexes. Generated by `wiki.py --reindex`. Regenerable from scratch. Added to `.gitignore` since they're derived state.

- **`backlinks.json`** — map of `{target: [sources]}`. Computed by scanning every file for `[[TARGET]]` patterns.
- **`tag-index.json`** — map of `{tag: [files]}`. Computed by parsing YAML frontmatter `tags:` field.
- **`similarity.json`** — map of `{file: [(other, score), ...]}` with top 5 per file. Wraps `embeddings.py` cosine similarity, cached.
- **`orphans.json`** — list of files with zero incoming backlinks. Surfaced for curator review.
- **`wiki-health.md`** — bounded file (max 1500 chars) with current health metrics: tier distribution, orphan count, stale count, broken links count, last reindex time.

### 3. `_index.md` (Obsidian-visible)

A human-readable index file at `sartor/memory/indexes/_index.md` that explains what's in the directory. This is the ONE file in `indexes/` that's not gitignored — it's the entry point if someone opens the folder in Obsidian.

### 4. `.claude/agents/wiki-reader.md`

A specialized subagent for querying the wiki. Given a question, it:
1. Uses `wiki.py` CLI (or imports it) to query backlinks, tags, similarity
2. Assembles context from high-relevance articles
3. Returns a focused answer with citations

Purpose: when another agent or skill needs wiki context, it delegates to wiki-reader instead of reading raw files. This keeps context bounded.

### 5. `.claude/scheduled-tasks/wiki-reindex/SKILL.md`

Nightly scheduled task (Hermes pattern, bounded memory):
- Phase 1 (Evaluate): check current index freshness vs. file mtimes
- Phase 2 (Research): decide whether incremental or full reindex needed
- Phase 3 (Implement): run `wiki.py --reindex`
- Phase 4 (Validate): verify indexes parse, flag any broken links or new orphans, write summary to `data/wiki-state.md` (capped at 1500 chars)

## Data flow

### Reindex flow

```
1. wiki.py --reindex
2. For each .md file under memory/ (excluding SKIP_DIRS):
     a. Parse frontmatter, extract tags, wikilinks_out, title
     b. Store in in-memory dict
3. Build backlinks: for each (file, wikilinks_out), add each link target → file
4. Build tag-index: for each (file, tags), add each tag → file
5. Build similarity (if embeddings.py DB is fresh): for each file, query top-5 similar via cosine sim
6. Compute orphans: files with no entries in backlinks map
7. Compute broken links: wikilinks_out references to targets that don't exist as files
8. Compute health summary: tier distribution from decay.py, orphan count, stale count
9. Write all indexes to sartor/memory/indexes/
10. Update _index.md with timestamp and counts
```

### Query flow (example: `wiki.py --article TAXES`)

```
1. Load indexes (or warn if stale)
2. Read TAXES.md, parse frontmatter + sections + callouts
3. Look up TAXES in backlinks.json → wikilinks_in
4. Look up TAXES in tag-index.json → tags for faceting
5. Look up TAXES in similarity.json → top-5 similar
6. Query decay.py for TAXES tier and score
7. Query git log for recent activity count
8. Assemble article_view dict
9. Print formatted summary OR return JSON
```

### Agent query flow (example: "who is in Alton's family?")

```
1. Main agent delegates to wiki-reader subagent
2. wiki-reader runs: wiki.py --tag entity/person
3. wiki-reader runs: wiki.py --article FAMILY
4. wiki-reader assembles: frontmatter + relevant sections + backlinks context
5. wiki-reader returns focused answer with file:line citations
6. Main agent never loads full raw markdown
```

## Obsidian compatibility checklist

- [x] Markdown files remain primary source. All content lives in `.md`.
- [x] YAML frontmatter syntax is Obsidian-native.
- [x] Wikilinks use `[[FILE]]` and `[[FILE|alias]]` — Obsidian-native.
- [x] Callouts use `> [!type]` — Obsidian-native.
- [x] Tags use `#hierarchy/subtag` — Obsidian-native.
- [x] `indexes/` directory has a `.md` file at its root (`_index.md`) so Obsidian sees it as a normal folder.
- [x] JSON files in `indexes/` are ignored by Obsidian's graph view (it only graphs wikilinks).
- [x] No file modifications to existing memory files — additive only.
- [x] `.obsidian/` config is untouched.

**Test:** After implementation, open `sartor/memory/` in Obsidian. Verify:
1. Graph view still renders
2. Backlinks panel works (Obsidian's native backlinks, should match our `backlinks.json` for top-level .md files)
3. Tags panel shows all our tags
4. No parsing errors in Obsidian console

## Preservation of existing machinery

| Component | Preserved how | Interaction with wiki.py |
|-----------|---------------|---------------------------|
| `search.py` (BM25 + decay) | Unchanged | `wiki.py` imports it for hybrid search in `wiki-reader` flows |
| `decay.py` (tier scoring) | Unchanged | `wiki.py` queries `get_tier(file)` for `article_view` |
| `embeddings.py` (semantic) | Unchanged | `wiki.py` uses `search_hybrid()` and adds cosine-sim cache for `similarity.json` |
| `autodream.py` (nightly consolidation) | Unchanged | Runs before wiki-reindex scheduled task, so the wiki indexes see freshly consolidated files |
| `memory-curator` (agent) | Unchanged | Reads wiki-health.md to see orphans and act on them |
| Multi-machine inbox | Unchanged | Inbox entries land in memory/ as usual; next reindex picks them up |
| Conventions spec | Unchanged | `wiki.py` enforces frontmatter schema at query time, reports violations |

## Bounded memory contract (Hermes-style)

The wiki has its own bounded memory files:

- **`data/wiki-state.md`** (max 1500 chars) — current health snapshot: tier distribution, orphan count, stale count, last reindex time, top 3 broken links
- **`data/wiki-queue.md`** (max 1000 chars) — prioritized actions for the curator to address: "BUSINESS.md is orphan, consider adding backlinks from ALTON" etc.

These mirror the existing `SYSTEM-STATE.md` / `IMPROVEMENT-QUEUE.md` pattern.

## Error handling

- **Missing embeddings DB** — `similarity.json` is skipped with a warning. Everything else still works.
- **Broken YAML frontmatter** — file is skipped, error logged to `data/wiki-errors.log`, broken files listed in health summary.
- **Broken wikilink** — not a fatal error. Listed in `broken_links()` output.
- **Large file (>100 KB)** — processed but flagged. Likely a daily log or snapshot, not a core wiki file.
- **Missing index file** — `wiki.py` regenerates on next reindex. No manual intervention needed.
- **Git unavailable** — `provenance()` returns frontmatter data only, skips git log.

## Testing plan

1. **Unit-ish sanity tests (inline in wiki.py under `if __name__ == "__main__"`):**
   - `backlinks("TAXES.md")` returns at least one entry (ALTON or BUSINESS reference TAXES)
   - `files_for_tag("entity/person")` returns [ALTON.md]
   - `similar("TAXES.md")` returns non-empty list IF embeddings DB exists
   - `orphans()` returns a list (may be empty if everything is linked)
   - `article_view("TAXES.md")` returns dict with all 12 expected keys

2. **Integration test:**
   - Run `wiki.py --reindex` on real memory/ folder
   - Verify all 5 index files are created
   - Verify at least 10 wikilinks captured in backlinks.json
   - Verify all 14 core files appear in tag-index.json

3. **Obsidian compat test:**
   - Manual: open memory/ in Obsidian (user does this post-implementation)
   - Verify graph view loads
   - Verify backlinks panel works on TAXES.md
   - Verify no YAML parse errors

4. **Regression test:**
   - Run existing `search.py --hybrid "tax"` — should still work unchanged
   - Run existing `decay.py --health` — should still work unchanged
   - Run existing `autodream.py --dry-run` — should still work unchanged

## AZ/work portable skill requirements

The final deliverable is `.claude/skills/build-llm-wiki/SKILL.md` — a skill that a different Claude Code instance (at AZ, in a different repo, with no access to Sartor's Hermes source) can follow to build an equivalent wiki.

**The skill must:**
1. Describe the file format conventions from scratch (YAML frontmatter fields, callout vocabulary, wikilink syntax, tag hierarchy)
2. Provide a reference algorithm for backlink generation (language-agnostic pseudocode)
3. Provide a reference algorithm for tag index generation
4. Describe the semantic similarity computation (embeddings + cosine) but note it's optional (the wiki works without it)
5. Define the bounded-memory health file format (wiki-state.md)
6. Define the query API contract (what an `article_view` should return)
7. Include a testing checklist
8. Include an Obsidian compat checklist
9. NOT reference any Sartor-specific file paths or machinery beyond as examples
10. Be self-contained — a Claude Code instance with zero prior context should be able to implement the wiki after reading this skill

## What this spec does NOT cover (deferred)

- Web UI for browsing the wiki (MERIDIAN dashboard integration) — stretch goal
- Graph visualization of backlinks — stretch goal
- LLM-driven article summarization — later iteration
- Auto-merging of inbox entries by the curator — out of scope (curator already does this)
- Article edit logging via hooks — nice-to-have, not critical
- Schema validation for frontmatter via JSON schema — nice-to-have

## Decision log

- **Why not use Obsidian's built-in JS plugins?** Need the wiki to be queryable from agents via CLI + Python. Obsidian plugins are browser-only and require the app to be running.
- **Why JSON indexes instead of SQLite?** Simpler, human-inspectable, git-diffable if we decide to track them. Performance is not the bottleneck at ~50 files.
- **Why not just use grep?** Backlinks work but tag faceting and similarity need real data structures. Also, the bounded-memory contract needs a single file per concern.
- **Why indexes/ as a subdirectory instead of .index/ (hidden)?** Obsidian's behavior on hidden directories varies by platform. A regular directory with `_index.md` is more portable.
- **Why reindex nightly instead of on-commit?** Nightly is simpler and matches the existing autodream / consolidation rhythm. On-commit would couple to git hooks which vary per machine.
- **Why skip the `.gitignore` for `_index.md`?** It's the entry point — commit it so new machines see the structure.

## History

- 2026-04-08: Initial spec. Written autonomously after codebase audit. Based on kepano/obsidian-skills patterns + Hermes-style bounded memory contract + Sartor's existing machinery.
