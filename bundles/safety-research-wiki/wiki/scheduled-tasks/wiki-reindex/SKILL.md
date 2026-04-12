---
name: wiki-reindex
description: Nightly Hermes-pattern reindex of an LLM safety research wiki. Regenerates backlinks.json, tag-index.json, orphans.json, broken-links.json, similarity.json, and the bounded state/wiki-state.md. Surfaces orphans and broken links for review. Drop into any scheduler (cron, systemd timer, Windows Task Scheduler, agent harness) that can run python.
model: sonnet
---

# Wiki Reindex — Scheduled Task

Nightly regeneration of the wiki indexes. Follows the Hermes 4-phase bounded-memory pattern (evaluate → research → implement → validate) so the wiki stays fresh without unbounded growth.

This task is deterministic. There's no judgment required. A scheduler, a cron job, or an agent harness can run it without supervision.

## Context injection (read first, every cycle)

- `indexes/_index.md` — the current index summary (shows last reindex time and counts)
- `state/wiki-state.md` — the bounded wiki health file from the last cycle
- (Optional) any broader system state file your environment maintains

## Phase 1: EVALUATE

Check whether a reindex is actually needed:

1. Find the mtime of `indexes/backlinks.json` (if it exists)
2. Find the mtime of the most recently changed `.md` file in the wiki root (excluding `indexes/`, `.git/`, `.obsidian/`)
3. If the indexes are newer than all `.md` files AND the last reindex was less than 24 hours ago, SKIP (no changes, no work to do)
4. Otherwise, proceed to Phase 3 (reindex)

Record the decision in the cycle report.

## Phase 2: RESEARCH (skip)

This task is deterministic. Skip to Phase 3.

## Phase 3: IMPLEMENT

Execute:

```bash
cd /path/to/wiki && python wiki.py --reindex
```

If embeddings are available (an `embeddings.py` module exists with a `SemanticSearch` class), `similarity.json` will be regenerated. If not, it's skipped with a warning — not an error.

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

Verify the reindex succeeded and outputs are sensible:

1. All expected index files exist:
   - `indexes/_index.md`
   - `indexes/backlinks.json`
   - `indexes/tag-index.json`
   - `indexes/orphans.json`
   - `indexes/broken-links.json`
   - (`indexes/similarity.json` if embeddings available)

2. Run the inline selftest: `python wiki.py --selftest` — must pass all 7 checks

3. Parse each JSON index to verify validity. Any file that fails to parse is a failure for this cycle.

4. Read the new `state/wiki-state.md`. Confirm it's under 1500 chars.

5. If `orphans > 0` or `broken_links > 0`, surface them in the cycle report under "Curator actions needed"

6. Run `python wiki.py --lint` to catch stale files, missing frontmatter, and ALL-CAPS urgency violations. These are soft warnings (not failures) but should be logged.

## Cycle report

Write a summary to `state/wiki-reindex-log.md` (append-only) with:

```markdown
## [YYYY-MM-DD HH:MM] cycle N

decision: [skipped | ran] — <reason>

stats:
  files_indexed: <n>
  parse_errors: <n>
  backlinks_total: <n>
  tags_total: <n>
  orphans: <n>
  broken_links: <n>
  similarity_available: <bool>

orphans: [list if any]
broken_links: [list if any]
lint_warnings: [list from --lint if any]

curator_actions_needed: [actionable items for human/curator review]
```

## Hermes bounded memory contract

The only "bounded memory" this task writes to is `state/wiki-state.md` (already written by `wiki.py` itself, capped at 1500 chars). Don't append to it. Let each cycle start with a clean snapshot.

The cycle log (`state/wiki-reindex-log.md`) is append-only and unbounded — but grows slowly (one entry per day). Archive after 90 days if size becomes a concern.

## Constraints

- Never modify `.md` files under the wiki root. This task is read-only for the substrate.
- Never delete indexes. Regeneration handles that.
- If `wiki.py --reindex` fails (e.g., syntax error in a file), write a failure report but don't try to "fix" the underlying file. Surface it for the curator.
- Rate limit: max 1 run per hour regardless of scheduler (don't thrash).
- Total runtime should be under 30 seconds for a wiki of <500 files. If it exceeds a few minutes, investigate: likely a huge file, a filesystem issue, or an embeddings call hanging.

## Failure modes and recovery

| Failure | Recovery |
|---------|----------|
| wiki.py crashes with syntax error in a source file | Log the file path, skip that file's update, continue with other files |
| Embeddings module unreachable (network error) | Skip similarity build, proceed with other indexes |
| Disk full | Abort, write failure report to a location that still has space |
| Git repo locked (operation in progress) | Skip provenance step, continue |
| Index files corrupted | Regenerate from scratch (this IS the regeneration task) |

## Scheduling recipes

**Cron (Linux/Mac):**
```
0 3 * * * cd /home/user/wiki && /usr/bin/python3 wiki.py --reindex >> state/cron.log 2>&1
```

**Windows Task Scheduler:**
Create a basic task that runs `python wiki.py --reindex` daily at 3 AM, with working directory set to the wiki root.

**systemd timer:**
Write a `wiki-reindex.service` + `wiki-reindex.timer` pair that runs the reindex daily.

**Agent harness:**
If you're running this inside an agent harness (e.g., an LLM scheduled task runner), use this SKILL.md as the task definition and configure the schedule in the harness.

## Success criteria

After each run, the cycle report should show:

- `parse_errors: 0`
- `broken_links: 0` (or a clearly-understood small set you're actively resolving)
- `files_indexed` matches your expectation (±1-2)
- Selftest passes

If any of these fail, the wiki is in an unhealthy state and needs curator attention before the next ingest.
