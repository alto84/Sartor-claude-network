---
type: project-postmortem
project: codebase-cleanup-2026-05-08
sub-project: curator-drain-phase-3
status: blocked-on-curator-fix
created: 2026-05-10
created_by: Claude Opus 4.7 (1M context), tidy-pass session
audience: future Claude or Alton investigating curator behavior
related: [projects/codebase-cleanup-2026-05-08/PLAN, reference/CURATOR-BEHAVIOR, reference/memory-curator-agent]
tags: [project/cleanup, scope/curator, severity/high]
---

# Curator drain — Phase F halted on first pass

PLAN.md Phase 3 (A4) said: "dry-run first, then `--max-drain 25` capped passes, iterate until backlog clears." Risk noted: "spot-check 5-10 destinations after the first 25."

The first-25 spot-check failed. Halting; documenting; reverting.

## What happened

Sequence on 2026-05-10:

1. `python -m sartor.curator_pass --dry-run -v --max-drain 50` — preview clean: 50 would-drain, 0 conflicts, 0 errors, 192 flagged. All previews showed `[would_append]` to ALTON.md / FAMILY.md / MACHINES.md.
2. `python -m sartor.curator_pass -v --max-drain 25` — real run. 25 drained, 0 conflicts, 0 errors.
3. **Spot-check on ALTON.md**: 494 lines of curator-proposal-metadata appended verbatim to the target. Not facts. Not extracted content. Raw proposal blocks complete with `## Inbox entry: ce-xxx`, `## Source quote`, `## Match span`, `## Session reference`, `## Proposed edit` sections, and `<!-- /curator-drained -->` footers.

Every drained proposal had `Dedup status: already_landed` in its frontmatter — meaning the curator's own dedup pass had flagged the fact as already-present in the target. PLAN.md explicitly trusted this filter: *"The curator's `dedup_status: already_landed` filter handles this; trust it but spot-check 5-10 destinations after the first 25."*

The filter did NOT cause the curator to skip — entries with `dedup_status: already_landed` were appended anyway, with full metadata wrapping.

Example diff snippet (from ALTON.md, post-drain):
```
<!-- curator-drained 2026-05-11T01:39:45+00:00 from rocinante entry=ce-1776655803-ca4ca91ca288 -->
## Inbox entry: ce-1776655803-ca4ca91ca288

- Source machine: `rocinante`
- Created: 2026-04-20T03:30:03+00:00
- Operation: append
- Priority: p2
- Drained: 2026-05-11T01:39:45+00:00

# Proposed memory: entity_alton

- **Category:** `proper_noun` / `entity_alton`
- **Confidence:** 0.70
- **Dedup status:** `already_landed`
- **Suggested target:** `ALTON.md`
- **Suggested operation:** `append`
- **Entity:** `Alton`

## Source quote

> Read all Sartor memory files to get full context on Alton and his projects...

## Match span

`Alton`

## Session reference

- **session_id:** `d920f507-391d-4d21`
- **turn_timestamp:** `2026-04-16T17:36:04.738Z`
- **source_file:** `d920f507-391d-4d21-9a8c-dce4bbe1c2fe.jsonl`

## Proposed edit

Append this fact to `ALTON.md` under the section relevant to `Alton`.

<!-- /curator-drained -->
```

This is one of 25 such blocks now in ALTON.md and FAMILY.md.

## Two interpretations

**(a) Curator is broken.** The expected behavior, per PLAN.md and the dedup_status semantics, is: skip already_landed entries, OR extract just the cited fact and append it as a short statement, OR queue them for human triage. Verbatim append of the entire proposal block (including the curator's own metadata) is not useful output.

**(b) Curator is by-design "append proposal-as-document; human reads and consolidates later".** The `<!-- curator-drained -->` HTML comments suggest the curator marks its work for later sweeping. A human reading ALTON.md and seeing a wall of these blocks would be expected to delete them after confirming nothing new is captured.

I'm pretty sure interpretation (a) is correct, given the `dedup_status: already_landed` field is supposed to mean something operational. But this needs Alton's call.

## What I reverted

```
git checkout HEAD -- \
  sartor/memory/ALTON.md \
  sartor/memory/FAMILY.md \
  sartor/memory/inbox/rocinante/proposed-memories/
```

ALTON.md and FAMILY.md are back to clean. The 25 source proposals in `inbox/rocinante/proposed-memories/` are restored (the curator had emptied them during the drain).

## What I kept

`sartor/memory/inbox/.drained/2026-05-11/rocinante/` (25 files) — the curator's own bookkeeping record. Removing this might confuse a future curator pass that thinks those entries are still pending. Left in place per archive-not-collapse.

The 25 entries that were drained still exist as records in TWO places: the restored source proposals AND the .drained/ bookkeeping. On next curator pass, the curator will likely either:
- See the source proposals as fresh (since they were restored) and re-drain them, producing the same pollution, or
- Notice the .drained/ entry and skip them.

Either way: **the SartorCuratorPass scheduled task may produce more bad output**. It is currently registered (07:30 and 19:30 daily). Consider disabling it pending investigation:
```
Unregister-ScheduledTask -TaskName 'SartorCuratorPass' -Confirm:$false
# or
Disable-ScheduledTask -TaskName 'SartorCuratorPass'
```

## Recommended next moves

1. **Read `sartor/curator_pass.py`** and identify whether `dedup_status: already_landed` is intended to short-circuit append. Likely a 1-2 line fix.
2. **Read the proposed-memory schema** (`sartor/memory/reference/CURATOR-BEHAVIOR.md`) for intended drain output.
3. **Test fix** with `--dry-run`, then `--max-drain 5` on a single category.
4. **If the design is right but the implementation appends-verbatim**: add an extractor stage that pulls the cited fact and writes a one-line statement, dropping the metadata. Or skip-and-flag entries that are `already_landed`.
5. **Once curator is producing useful drains**, resume PLAN.md Phase 3 A4 with `--max-drain 25` iterations, spot-checking after each.

## Status before Phase F halt

| Backlog metric | Before drain | After my revert |
|---|---|---|
| `proposed-memories/` total | 291 leaf files | 291 (restored) |
| ALTON.md lines | 269 | 269 (reverted) |
| FAMILY.md lines | 396 | 396 (reverted) |
| `.drained/2026-05-11/` | 0 | 25 (curator bookkeeping, kept) |

Net effect of Phase F: zero, modulo the .drained/ bookkeeping record and this postmortem.

## Closing

PLAN.md's risk note was right: "trust it but spot-check." Spot-check caught it. Drain reversibility (entries land in .drained/ rather than being deleted) made the recovery clean. Investigate before the next drain.
