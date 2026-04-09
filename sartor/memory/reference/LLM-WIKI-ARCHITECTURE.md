---
type: reference
entity: LLM-WIKI-ARCHITECTURE
updated: 2026-04-09
updated_by: Claude
status: active
tags: [meta/architecture, meta/wiki, curator/spec]
aliases: [LLM Wiki, Wiki Architecture, Sartor Wiki]
related: [MEMORY-CONVENTIONS, MULTI-MACHINE-MEMORY, SELF, MACHINES]
---

# Sartor LLM Wiki — Architecture

How the wiki layer (`wiki.py`, `indexes/`, the `wiki-reader` agent, and the `wiki-reindex` scheduled task) sits on top of the existing memory substrate without disturbing it.

## What is this?

A thin query and index layer over the markdown files in `sartor/memory/`. It adds:

- **Backlinks** — automatic reverse wikilink index
- **Tag search** — queryable tag index with hierarchy
- **Semantic similarity** — "related articles" via embeddings (optional)
- **Provenance** — git log + frontmatter `updated` fields
- **Decay awareness** — surfaces tier from `decay.py` in article views
- **Orphan and broken-link detection** — for the curator to act on
- **Bounded health file** — Hermes-pattern `data/wiki-state.md` under 1500 chars

The wiki does **not** store content. All content lives in the markdown files themselves. Indexes are derived artifacts, regenerable with a single command.

## Why "LLM wiki"?

"LLM wiki" means the storage format and query layer are optimized for agents to read and write, not humans clicking through a web UI:

- **Structured frontmatter** (YAML) — agents get metadata without parsing prose
- **Deterministic wikilinks** (`[[FILE]]`) — agents traverse the graph without ambiguity
- **Callouts** (`> [!deadline]`) — urgency is scannable and grep-friendly
- **Bounded health files** — prevent context bloat
- **CLI + Python API** — every operation is scriptable from an agent

The same files also work in Obsidian for human browsing. The wiki is dual-substrate by design.

## Component map

```
sartor/memory/                     ← the substrate (pre-existing, unchanged)
├── ALTON.md, TAXES.md, ...        ← core markdown files with YAML frontmatter
├── daily/                         ← append-only session logs
├── feedback/                      ← auto-injected behavioral rules
├── reference/                     ← architecture docs (this file lives here)
├── inbox/{machine}/               ← multi-machine write queue
│
├── search.py                      ← BM25 + decay (pre-existing)
├── decay.py                       ← HOT/WARM/COLD scoring (pre-existing)
├── embeddings.py                  ← semantic search via ollama (pre-existing)
├── autodream.py                   ← nightly consolidation (pre-existing)
│
├── wiki.py                        ← NEW: query/index layer
│
└── indexes/                       ← NEW: generated derived indexes
    ├── _index.md                  ← Obsidian-visible entry point (committed)
    ├── backlinks.json             ← gitignored; regenerable
    ├── tag-index.json             ← gitignored
    ├── orphans.json               ← gitignored
    ├── broken-links.json          ← gitignored
    └── similarity.json            ← gitignored (optional)

.claude/
├── agents/
│   └── wiki-reader.md             ← NEW: query agent (bounded context)
└── scheduled-tasks/
    └── wiki-reindex/
        └── SKILL.md               ← NEW: nightly reindex task

data/
└── wiki-state.md                  ← NEW: bounded (<=1500 chars) health file

docs/superpowers/specs/
└── 2026-04-08-sartor-llm-wiki-design.md   ← the design spec
```

## How components interact

```
                                 reads
                       ┌──────────────────────┐
                       ▼                      │
                  ┌─────────┐            ┌────┴─────┐
                  │  .md    │◄──parses──│  wiki.py │
                  │ files   │            └────┬─────┘
                  └─────────┘                 │
                       ▲                      │ reads
                       │ writes               ▼
                  ┌─────────┐            ┌─────────┐
                  │  Alton  │            │ indexes │
                  │ curator │            │ (JSON)  │
                  │  Claude │            └────┬────┘
                  └─────────┘                 │
                       ▲                      │ queries
                       │                      ▼
                       │                 ┌─────────┐
                       │                 │ wiki-   │
                       │                 │ reader  │
                       │                 │ agent   │
                       │                 └────┬────┘
                       │                      │
                       │ asks questions       │ returns answers
                       └──────────────────────┘

 nightly:
   autodream.py consolidates daily/ → .md files
          ↓
   wiki-reindex scheduled task runs wiki.py --reindex
          ↓
   indexes refresh, data/wiki-state.md updated
          ↓
   memory-curator reads wiki-state.md, acts on orphans/broken links
```

## Preservation of existing machinery

Nothing in this upgrade modifies the existing search, decay, embeddings, or autodream code. `wiki.py` imports from them as needed and falls back gracefully when they're unavailable:

| Component | Used for | Fallback if missing |
|-----------|----------|---------------------|
| `search.py` (BM25) | Not directly — wiki-reader can invoke it for full-text search | Fine; wiki.py doesn't need it |
| `decay.py` (tiers) | `article_view.decay` field, tier distribution in health summary | `decay=UNKNOWN`, feature hidden |
| `embeddings.py` (semantic) | `similarity.json` and `article_view.similar` | Similarity skipped with warning |
| `autodream.py` (consolidation) | Runs BEFORE wiki-reindex in the nightly sequence, so indexes see freshly consolidated files | Wiki indexes are stale but still valid |

## Reindex algorithm

```
1. Collect .md files (skip .obsidian, .git, __pycache__, .meta, .index, indexes, daily, inbox, snapshots)
2. Parse each file:
     a. Extract YAML frontmatter
     b. Strip code blocks from body
     c. Extract wikilinks, callouts, headings, title
3. Build backlinks:
     For each file, for each wikilink target, resolve to canonical rel_path,
     then add source → target pair to backlinks[target]
4. Build tag-index: for each file, for each tag in frontmatter.tags, add file to tag-index[tag]
5. Find orphans: files (excluding meta/reference/feedback types and research/) with no entries in backlinks
6. Find broken links: wikilinks that don't resolve to any file (stem, rel_path, or basename match)
7. (Optional) Build similarity: for each file, query embeddings.search_semantic(title + headings) for top-5 similar
8. Write all indexes to sartor/memory/indexes/
9. Write _index.md (Obsidian entry point) with summary stats
10. Write data/wiki-state.md (bounded Hermes health file)
```

Wikilink resolution tries (in order): exact stem match → rel_path suffix match → basename extraction from path-style targets. This handles both `[[ALTON]]` and path-style `[[subdir/file]]` wikilinks.

Code blocks are stripped before wikilink extraction so documentation examples like `[[PLACEHOLDER]]` inside ``` fences don't pollute the broken-link count.

## Obsidian compatibility

Every artifact is designed to coexist cleanly with Obsidian:

| Feature | How it works in Obsidian |
|---------|--------------------------|
| YAML frontmatter | Renders in Properties sidebar |
| Wikilinks `[[FILE]]` | Clickable, populate graph view |
| Callouts `> [!deadline]` | Render with icons and styling |
| Hierarchical tags `entity/tax` | Appear in Tags pane with nesting |
| `indexes/_index.md` | Appears as a normal file in the file tree |
| `indexes/*.json` | Ignored by graph view (Obsidian only graphs wikilinks) |
| `data/wiki-state.md` | In a separate directory, out of Obsidian's scope |

**Test procedure:** open `sartor/memory/` in Obsidian. Verify:
1. Graph view renders without errors
2. `TAXES.md` shows backlinks from BUSINESS and PROJECTS in the Backlinks panel
3. Tag pane shows hierarchical tags
4. All 14 core files appear with their frontmatter in Properties

## Bounded memory contract (Hermes style)

The wiki writes one bounded memory file: `data/wiki-state.md`, capped at 1500 chars. It contains:

- Timestamp of last reindex
- File count, tag count, backlink count, orphan count, broken link count
- Tier distribution (when decay.py is available)
- Top 5 orphans
- Top 5 broken wikilinks

This file is overwritten on every reindex. It mirrors the existing `data/SYSTEM-STATE.md` / `data/IMPROVEMENT-QUEUE.md` pattern from the self-improvement-loop Hermes pattern.

## Usage

### From the CLI (interactive)

```bash
cd sartor/memory

python wiki.py --reindex                    # regenerate all indexes
python wiki.py --article TAXES               # pretty-print TAXES article view
python wiki.py --backlinks ALTON             # list files referencing ALTON
python wiki.py --tags                        # full tag index
python wiki.py --tag entity/person           # files in a tag
python wiki.py --orphans                     # list orphans
python wiki.py --broken                      # list broken wikilinks
python wiki.py --health                      # health JSON
python wiki.py --selftest                    # inline sanity tests
```

### From Python (import)

```python
from pathlib import Path
from wiki import Wiki

w = Wiki(Path("sartor/memory"))

# Who references ALTON.md?
print(w.backlinks("ALTON"))

# What's in TAXES.md structurally?
view = w.article_view("TAXES")
print(view["callouts"])  # [('deadline', '2026-04-15'), ...]
print(view["wikilinks_in"])  # ['BUSINESS.md', 'PROJECTS.md']
```

### From an agent (delegation)

Another agent or skill should delegate to `wiki-reader` instead of reading raw files:

```
Use the wiki-reader agent to assemble tax context for me. I need current
deadlines, open decisions, and the latest CPA scope.
```

The wiki-reader returns a focused answer with citations, keeping the parent agent's context window bounded.

## Maintenance

- **Daily:** `wiki-reindex` scheduled task runs, regenerates indexes, writes `data/wiki-state.md`
- **On-demand:** run `python wiki.py --reindex` after any significant memory edit session
- **Self-test:** run `python wiki.py --selftest` before committing any change to wiki.py itself
- **Broken links:** the curator reads `data/wiki-state.md` and acts on orphans/broken links

## Extension points

Where to add new features cleanly:

- **New query type** → add a method to `Wiki` class and a CLI flag in `main()`
- **New index** → add a build function, call it from `reindex()`, write to `indexes/`
- **New article_view field** → add to the dict returned by `Wiki.article_view()`
- **Web UI** → a FastAPI sub-router under `dashboard/family/` that imports `wiki.Wiki` (not implemented yet, stretch goal)

## Testing philosophy

`wiki.py` has an inline `--selftest` that runs after every significant edit. It checks:

1. Files can be parsed
2. Known backlinks resolve (TAXES should have at least one incoming)
3. Tag index resolves (ALTON should be tagged entity/person)
4. `article_view` returns all expected keys
5. `broken_links` returns a list
6. `orphans` returns a list
7. `health_summary` has `total_files`

This is TDD-lite — fast enough to run on every change, thorough enough to catch regressions.

## Portability

The wiki layer depends only on:

- Python stdlib
- (Optional) `rank_bm25` for search.py interop
- (Optional) `sqlite3` + `embeddings.py` for similarity
- (Optional) `git` CLI for provenance

Strip all optional deps and the core (backlinks, tag index, orphans, broken links, article view) still works.

## See also

- [[MEMORY-CONVENTIONS]] — YAML frontmatter, callouts, wikilinks, tag hierarchy
- [[MULTI-MACHINE-MEMORY]] — how memory syncs between Rocinante, gpuserver1, and future machines
- `.claude/agents/wiki-reader.md` — query agent that uses this wiki
- `.claude/scheduled-tasks/wiki-reindex/SKILL.md` — nightly reindex task
- `.claude/skills/build-llm-wiki/SKILL.md` — portable playbook for building this from scratch

## History

- 2026-04-08: Initial design and implementation. Written autonomously in a single session per user directive. wiki.py, indexes/, wiki-reader agent, wiki-reindex scheduled task, this doc, and the portable skill.
- 2026-04-09: Selftest passing, 43 files indexed, 0 orphans, 0 broken links after code-block exclusion and self-reference fix.
