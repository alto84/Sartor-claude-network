---
name: wiki-reindex
description: Nightly Hermes-pattern reindex of the Sartor LLM wiki. Regenerates backlinks.json, tag-index.json, similarity.json, orphans.json, broken-links.json, and the bounded data/wiki-state.md. Surfaces orphans and broken links for curator attention.
model: sonnet
---

# Wiki Reindex — Scheduled Task

Nightly regeneration of the Sartor LLM wiki indexes. Follows the Hermes 4-phase bounded-memory pattern (evaluate → research → implement → validate) so the wiki stays fresh without unbounded growth.

## Context injection (read first, every cycle)

- `sartor/memory/indexes/_index.md` — the current index summary
- `data/wiki-state.md` — the bounded wiki health file from the last cycle
- `data/SYSTEM-STATE.md` — overall system health (may mention wiki-related issues)

## Phase 1: EVALUATE

Check whether a reindex is actually needed:

1. Find the mtime of `sartor/memory/indexes/backlinks.json` (if it exists)
2. Find the mtime of the most recently changed .md file under `sartor/memory/` (excluding daily/, inbox/, snapshots/)
3. If the indexes are newer than all .md files AND the last reindex was less than 24 hours ago, SKIP (no changes, no work to do)
4. Otherwise, proceed to Phase 3 (reindex). There's no "research" phase because the work is deterministic.

Record the evaluation decision in the cycle report.

## Phase 2: RESEARCH (skip — deterministic task)

This task has no judgment calls. Skip to Phase 3.

## Phase 3: IMPLEMENT (run reindex)

Execute:

```bash
cd sartor/memory && python wiki.py --reindex
```

If embeddings are available (the `.index/memory.db` SQLite file exists), similarity.json will be regenerated. If not, it will be skipped with a warning — not an error.

Capture the JSON stats output, which looks like:

```json
{
  "files_indexed": 43,
  "parse_errors": 0,
  "backlinks_total": 173,
  "tags_total": 26,
  "orphans": 0,
  "broken_links": 0,
  "similarity_available": true
}
```

## Phase 4: VALIDATE

Verify the reindex succeeded and the outputs are sensible:

1. All expected index files exist:
   - `sartor/memory/indexes/_index.md`
   - `sartor/memory/indexes/backlinks.json`
   - `sartor/memory/indexes/tag-index.json`
   - `sartor/memory/indexes/orphans.json`
   - `sartor/memory/indexes/broken-links.json`
   - (`sartor/memory/indexes/similarity.json` if embeddings available)

2. Run the inline selftest: `python wiki.py --selftest` — must pass all 7 checks

3. Parse each JSON index to verify it's valid. Any file that fails to parse is a failure for this cycle.

4. Read the new `data/wiki-state.md`. Confirm it's under 1500 chars.

5. If `orphans > 0` or `broken_links > 0`, surface them in the cycle report under "Curator actions needed"

## Cycle report

Write a summary to `data/evolve-log/{date}-wiki-reindex.md` with:

```markdown
# Wiki Reindex — {timestamp}

## Decision
- [skipped | ran]: {reason}

## Stats
files_indexed: {n}
parse_errors: {n}
backlinks_total: {n}
tags_total: {n}
orphans: {n}
broken_links: {n}
similarity_available: {bool}

## Orphans (if any)
- {file}

## Broken links (if any)
- {source} -> {target}

## Curator actions needed
- [any orphans or broken links as actionable items]
```

## Hermes bounded memory contract

The only "bounded memory" this task writes to is `data/wiki-state.md` (already written by wiki.py, capped at 1500 chars). Don't append anywhere else. Let the next cycle start with a clean slate.

## Constraints

- Never modify .md files under `sartor/memory/`. This task is read-only for the substrate.
- Never delete indexes. Regeneration handles that.
- If `wiki.py --reindex` fails (e.g., syntax error in a file), write a failure report but don't try to "fix" the underlying file. Surface it for the curator.
- Rate limit: max 1 run per hour regardless of scheduler (don't thrash).
- Log to `data/evolve-log/{date}-wiki-reindex.md`, not to daily/.

## Related
- [[LLM-WIKI-ARCHITECTURE]] — how the wiki layer is built
- [[MEMORY-CONVENTIONS]] — conventions the wiki enforces
- `self-improvement-loop/SKILL.md` — the parent Hermes pattern this task borrows from
