---
type: stub
entity: gather-pipeline-pain-ranking
status: superseded
superseded_by: [[cron-uplift-F1-personal-data-gather-v2-design]]
archive: [[_archive/gather-pipeline-pain-ranking-2026-05-02]]
date: 2026-05-02
updated: 2026-05-02
updated_by: memory-engineer (family-thread)
related: [feedback_archive_not_collapse, family-memory-fixup]
tags: [meta/stub, scope/v0.3]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# `personal-data-gather` pain ranking — SUPERSEDED 2026-05-02

> [!archived] **Superseded by cron-engineer's F1 design memo** at `projects/family-thread-dossier/cron-uplift-F1-personal-data-gather-v2-design.md`. Verbatim Pain-1, Pain-2, Pain-3 detail preserved at `projects/family-thread-dossier/_archive/gather-pipeline-pain-ranking-2026-05-02.md` per [[feedback/feedback_archive_not_collapse]] §6. Reactivate by removing this stub AND removing F1's design (lockstep revert) if F1 is vetoed at greenlight.

## Why superseded

pipelines-auditor 2026-05-02 verified that `personal-data-gather` has **no scheduled task or runtime** — invocation is ad-hoc Claude sessions reading the SKILL.md prompt. The brief above was filed assuming a 4-hour cron that does not exist (CLAUDE.md and `pipelines-audit.md` table C contained aspirational text both being corrected as part of HEARTH §3.A3 reverse-truth-rate work).

cron-engineer's F1 absorbs the brief's Pain-1 (monotonic counter), Pain-2 (no-change-silent), Pain-3 (Aneeta privacy filter), AND adds the missing path-1 supplement (Windows Scheduled Task spawning a one-shot Claude Code CLI invocation against the SKILL.md every morning at 7:00 AM ET). F1 lands at `.claude/scheduled-tasks/personal-data-gather/SKILL.md` plus a new wrapper.cmd plus the new scheduled task; pre-greenlight design only at present.

## What lives where now

| Concern | Canonical location |
|---|---|
| Pain-1 / Pain-2 / Pain-3 detail (verbatim) | `_archive/gather-pipeline-pain-ranking-2026-05-02.md` |
| F1 design (current spec) | `cron-uplift-F1-personal-data-gather-v2-design.md` |
| `family-memory-fixup` §2.1 supersession question | Open in F1 design; family-curator has lane |
| `family/active-todos.md` 1311-line target ~250 | Still family-curator's lane; downstream of F1 landing |

## History

- 2026-05-02: filed by memory-engineer.
- 2026-05-02: superseded by F1; verbatim detail archived; this file collapsed to stub per archive-not-collapse rule. Operation done in lockstep (archive written first; stub second).
