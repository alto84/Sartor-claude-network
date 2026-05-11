---
type: archive
archived_from: [[gather-pipeline-pain-ranking-2026-05-02]]
superseded_by: [[cron-uplift-F1-personal-data-gather-v2-design]]
archived_on: 2026-05-02
archived_by: memory-engineer (family-thread)
updated: 2026-05-02
tags: [meta/archive, domain/family, household/governance, scope/v0.3]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# `personal-data-gather` pain ranking — VERBATIM ARCHIVE (superseded 2026-05-02)

> [!archived] This file is the verbatim preserved text of `projects/family-thread-dossier/gather-pipeline-pain-ranking-2026-05-02.md` as it stood when superseded by cron-engineer's F1 design memo (`projects/family-thread-dossier/cron-uplift-F1-personal-data-gather-v2-design.md`). Per [[feedback/feedback_archive_not_collapse]] §6, supersession is a form of cleanup: the verbatim Pain-1, Pain-2, Pain-3 detail moves here BEFORE the source file is reduced to a stub. Reactivate by removing the source's stub and reverting both files in lockstep.

## Why archived

pipelines-auditor 2026-05-02 confirmed: `personal-data-gather` has NO scheduled task or runtime; it is a SKILL.md prompt invoked by ad-hoc Claude sessions. F1 absorbs Pain-1 (monotonic counter) + Pain-2 (no-change-silent) + Pain-3 (Aneeta privacy filter) plus a thin path-1 supplement (Windows Scheduled Task spawning a one-shot Claude Code CLI invocation against the SKILL.md every morning at 7:00 AM ET — the CLI becomes the cron, the prompt enforces the rules). My filed brief had assumed an existing 4-hour cron (sourced from `pipelines-audit.md` table C and CLAUDE.md, both of which contained aspirational text); the assumption was false.

If F1 gets vetoed at greenlight, this brief gets re-promoted from archive (the source-file stub removed, source re-anchored to F1's cancellation). That's the archive-not-collapse contract.

---

## VERBATIM PRESERVED CONTENT (from source as of 2026-05-02 16:XX ET)

# `personal-data-gather` pain ranking — Week-2 PR scope (filed not executed)

> [!warning] Filed for v0.3 / Week-2 PR scope per memory-engineer's coordination decision 2026-05-02. **NOT in Week-1 PR** (memory-builder's A1+A2a+A2b+A6 bundle). Reason: scope discipline — Week-1 closes the extractor + curator pipelines and stabilizes session-start budget; gather-pipeline cleanup is a third pipeline with its own PR scope and verification surface. Family-curator's diagnosis stays current; sequencing is post-Week-1.

## Source

family-curator's 2026-05-02 message, Proposal 3. Ranking based on observed surface in `family/active-todos.md` (1311 lines, current target ~250 per `family-memory-fixup` plan §1.4).

## Pain 1 (highest) — run-number reuse across days

**Observed**: gather emits `## Latest from gather (2026-04-29) — run 25` then reuses `run 25` on subsequent days. Runs 22, 25, and 26 each appear TWICE in current `active-todos.md` from different source dates. Chronology becomes unreconstructable from run number alone.

**Fix**: monotonic counter persisted to a sibling state file (`.gather-state.json` or similar) that increments per gather run forever, never resets per day. One-line skill-body change in `personal-data-gather/SKILL.md`: replace per-day counter with read-increment-write of the persisted counter.

**Reversibility**: delete the state file to revert; counter resets to per-day on next run.

**Verification**: after fix lands, no two `## Latest from gather` headers should share the same `run N` value across the file.

**Bridge to feedback rule**: this Pain-1 fix DOES align with [[feedback/feedback_archive_not_collapse]] §7 (just added today): pipelines that reuse identifiers across days must preserve both identifier AND date in archive headers. Pain-1 fix prevents the reuse at the source; §7 is the defensive policy if reuse persists. Belt-and-suspenders.

## Pain 2 — no "no-change-silent" rule

**Observed**: every gather run writes a new `## Latest from gather` section even when nothing changed. The Apr 30 dance-concert API debate produced 6 nearly-identical sections in one day during Apr 27-28 (~250 lines, lines 964-1162 of current `active-todos.md`). This is the same pathology `family-memory-fixup` §2.1 diagnosed and never executed.

**Fix**: before writing, diff the would-be new section against the last written section's body. If hash matches: write nothing user-facing, append a 1-line entry to a separate `family/_history/gather-heartbeat-{YYYY-MM}.md` log instead.

**Reversibility**: skill-body revert.

**Verification**: a stable family calendar week (no real changes) should produce no new `## Latest from gather` sections in `active-todos.md`; heartbeat log should accumulate single-line entries instead.

**Note**: this is also `family-memory-fixup` §2.1's primary fix. Pain-2 + the existing fixup §2.1 are the same change; v0.3 / Week-2 PR consolidates them under one diff.

## Pain 3 (deferred to Phase 2 of gather work) — privacy filter for Aneeta solo work meetings

**Observed (or rather, NOT observed)**: Aneeta has been at RRE all week per the sole-parent-window memo, so no signal. Without a representative sample, the privacy filter design can't be validated.

**Defer to Phase 2** of gather work (post-Aneeta-RRE, real sample available). Family-curator's call.

## Recommended sequencing

| Phase | Item | When |
|---|---|---|
| Week-1 PR (memory-builder) | A1 + A2a + A2b + A6 | After Alton's §H gates |
| Week-2 PR (TBD agent — could be same memory-builder, could be a `gather-engineer` if family-curator wants to own it) | Pain 1 + Pain 2 (consolidated with `family-memory-fixup` §2.1) | After Week-1 lands and stabilizes |
| Phase 2 of gather work (later) | Pain 3 + remaining `family-memory-fixup` items | When Aneeta returns from RRE and family-curator has the signal |

**No new agent spawned in v0.2 for Week-2 PR.** memory-engineer will spec the executor when v0.3 program update happens (likely concurrent with the +30d Phase B retro per v0.2 §E2).

## Why not include in Week-1 PR

1. **Scope discipline** (CLAUDE.md §Discipline #3 surgical changes): Week-1 closes extractor + curator pipelines. Gather is a third pipeline with its own failure surface and verification.
2. **Different cron, different agent**: gather-pipeline lives in `personal-data-gather/SKILL.md` (4-hour cron); extractor lives in `SartorConversationExtract` (daily 11:30 PM); curator lives in `nightly-memory-curation` (daily 11 PM). Three separate failure modes; bundling means one rollback drops the others' value (same logic team-lead applied to splitting A2 into A2a + A2b).
3. **Verification independence**: gather fixes verify via "are there still daily-replicated `## Latest from gather` blocks in `active-todos.md`?" — different substrate from extractor body-hash diffs and curator USER.md presence checks.
4. **Family-curator's ownership**: family layer pruning is family-curator's lane. Coordinating execution through them in Week-2 keeps the ownership clean.

## Open question to resolve when v0.3 spec is drafted

**`family-memory-fixup` §2.1 supersession.** The 2026-04-25 fixup file is `status: proposed, never executed`. When the Week-2 PR for Pain 1 + Pain 2 ships, decide:

- **Option A (memory-engineer's tentative read; matches family-curator's read 2026-05-02):** the Week-2 PR is an *execution chunk* of the broader §2.1 plan. `family-memory-fixup.md` stays as the systemic plan; the PR description cites §2.1 as the framework being executed. Other §2.1 sub-items (gather replace-don't-append, deadline triage cadence) remain `proposed` for later chunks.
- **Option B:** Week-2 PR *supersedes* §2.1 entirely. `family-memory-fixup.md` gets a `superseded_by: [[gather-pipeline-pain-ranking-2026-05-02]]` stub plus a `> [!archived] Superseded by Week-2 PR 2026-05-XX. Reactivate by removing this stub.` notice. Subsequent gather work re-anchors to the new spec.

**Default to Option A** unless v0.3 work surfaces a structural reason to consolidate. Per [[feedback/feedback_archive_not_collapse]] §2 + §6, supersession is a form of cleanup; if Option B is chosen, family-memory-fixup's Phase 0 + Phase 1 + Phase 2 detail must move verbatim to the archive sidecar before the stub is left.

**Owner of the call**: memory-engineer when drafting v0.3 spec, in consultation with family-curator (who flagged the question 2026-05-02 in their ack).

## History (verbatim from source)

- 2026-05-02: filed by memory-engineer based on family-curator's Proposal 3. Status: filed-for-v0.3-or-week-2-PR. Family-curator notified; will own the Week-2 PR's scope when it spawns.
- 2026-05-02 (later): family-curator flagged the §2.1 supersession question in their ack. Logged above as an open question for v0.3 drafting; default to Option A (PR is execution chunk; §2.1 stays as systemic plan).

---

## Note on the assumption that proved false

The brief above repeatedly cites "personal-data-gather (4-hour cron)" as if the cron existed. **It does not.** Source of the false belief: `pipelines-audit.md` table C row for `personal-data-gather` lists "Every 4h" as cadence; CLAUDE.md Scheduled Tasks table same. Both were aspirational text — the SKILL.md frontmatter says "every 4h" but no `.cmd` wrapper, no Windows Scheduled Task, no Python file binds it. pipelines-auditor verified 2026-05-02 via `schtasks /query /fo LIST` (zero matches) and source-file scan.

The §"Why not include in Week-1 PR" reasoning above remains structurally correct (gather is a separate failure surface) but its specific claim "Different cron, different agent" should have read "different INVOCATION MODEL" — gather is ad-hoc Claude-session invocation today, with F1 proposing to bind it to a real morning cron via Claude Code CLI wrapper. The conclusion (don't bundle with Week-1) holds; the reasoning was sloppy.

This footnote preserved here in archive so the failed assumption is visible in the record.

## Archive history

- 2026-05-02: archived by memory-engineer after pipelines-auditor confirmed F1 absorbs Pain-1+Pain-2+Pain-3. Source file at `projects/family-thread-dossier/gather-pipeline-pain-ranking-2026-05-02.md` reduced to a stub pointing here and at F1.
