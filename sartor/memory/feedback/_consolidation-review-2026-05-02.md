---
name: consolidation-review-2026-05-02
description: Read-only scout of sartor/memory/feedback/ corpus. Flags overlap, stale, tighten, and naming candidates for Alton's review. Not a merge — Alton call.
type: review
created: 2026-05-02
created_by: rule-author (memory-agents team, Opus 4.7)
status: scout-only
tags: [meta/feedback-corpus, meta/consolidation, review/2026-05-02]
related: [search-memory-first, scope-discipline, subagent-scope-discipline, federation-grep-before-delegation]
---

# Feedback corpus consolidation review — 2026-05-02

**Scope:** Read every `.md` in `sartor/memory/feedback/`, look for overlap, staleness, tighten-opportunity, and naming-convention drift. No merges performed.

## Total count

**26 active rule files** (excluding this review document):
- 5 memory-discipline rules (the focus of recent rule-author work): search-memory-first, federation-grep-before-delegation, subagent-scope-discipline, trust-but-verify-subagent-reports, artifact-vs-fact-not-found
- 3 paper-check / family-pipeline rules (created today by family-curator): paper-checks-blindspot, gather-respects-out-of-band-closures, always-check-paper-check-vendors-before-flagging-red
- 4 working-discipline rules: scope-discipline, completeness-principle, goal-driven-execution, framework-floor-not-checklist
- 4 permissions/protections rules: feedback_agent_bypass, feedback_no_permissions, feedback_permissions_fix, feedback_protected_paths
- 3 memory-mechanics rules: feedback_memory_conventions, feedback_preserve_frontmatter, feedback_archive_not_collapse
- 2 delegation rules: feedback_objective_level_delegation, feedback_prefer_subagents
- 5 outliers / one-off domain rules: awareness-as-duty, prosecutorial-discount-on-constitutional-reframes, proactive-error-cleanup, gather-triage-2026-04-16, feedback_pricing_autonomy

## Candidates for merge / archive / tightening

| File | Concern | Suggested action |
|---|---|---|
| `feedback_no_permissions.md` (12 lines, Apr 12) | Strict subset of `feedback_agent_bypass.md` and `feedback_permissions_fix.md` — same "always pass bypassPermissions" rule, less detail | **Merge → archive.** All permission content in one canonical file. Keep `feedback_permissions_fix.md` as canonical (most detail, cites bug numbers). |
| `feedback_agent_bypass.md` (29 lines) | Overlaps `feedback_permissions_fix.md`. Distinct only in the "Open Bugs (as of 2026-04)" section. | **Merge into `feedback_permissions_fix.md`** as a "## Known bugs" section. Archive original. |
| `feedback_memory_conventions.md` (22 lines) | Pure pointer to `MEMORY-CONVENTIONS.md`. The reference doc has the spec; this file just says "follow the spec." | **Tighten or archive.** Could be a 5-line stub or absorbed into `feedback_preserve_frontmatter.md` as the "applies to all memory files" preamble. |
| `feedback_prefer_subagents.md` vs my `federation-grep-before-delegation.md` | Apparent tension: prefer-subagents says "default to delegating analysis"; mine says "for entity lookups, prefer self-grep." Not contradictory — different scopes. | **Cross-reference, don't merge.** Add a `**See also:** federation-grep-before-delegation (the exception for cheap entity lookups)` line to feedback_prefer_subagents. I will not edit it; flagging for Alton. |
| `gather-triage-2026-04-16.md` | Date-stamped triage list. Some entries are stale (Handshake "current capacity, not permanent" — 2.5 weeks ago). | **Refresh-or-archive question for Alton.** Worth one Alton check: are the unsubscribes still authoritative, or has capacity shifted? |
| `prosecutorial-discount-on-constitutional-reframes.md` (Apr 22) | Highly specific to one §20 incident. Generalization is real but narrow. | **Keep as-is.** The pattern (compliance-dressed-as-prosecution) is too important to lose. No action. |
| `feedback_archive_not_collapse.md` (created today, 56 lines) | Long. Could be tightened — the "Specific patterns to catch" + "Exceptions" sections are 70% of length and not all load-bearing. | **Tighten by ~30% in next revision.** Not urgent. Author was memory-engineer; ping them, don't edit. |
| `feedback_always_check_paper_check_vendors_before_flagging_red.md` (created today, 70 lines) | Longest file in corpus. The "Edge cases" + "Specific patterns" sections could compress. | **Tighten by ~40% in next revision.** Pattern is clear; the prose is doing too much explaining. Ping family-curator. |

## Suggested groupings

The corpus naturally clusters into **8 buckets**. A future directory-split (per memory-improvement-program v0.2 §A6, mentioned in two of today's files) would route them as:

```
feedback/
├── memory-discipline/   (5: search-memory-first, federation-grep, subagent-scope, trust-but-verify, artifact-vs-fact)
├── family/              (3: paper-checks-blindspot, gather-respects-OOB-closures, always-check-vendors)
├── working-discipline/  (4: scope, completeness, goal-driven, framework-floor)
├── permissions/         (4: agent_bypass, no_permissions, permissions_fix, protected_paths)
├── memory-mechanics/    (3: memory_conventions, preserve_frontmatter, archive_not_collapse)
├── delegation/          (2: objective_level, prefer_subagents)
├── domain-pricing/      (1: pricing_autonomy)
└── outliers/            (4: awareness-as-duty, prosecutorial-discount, proactive-error, gather-triage)
```

The existing flat structure is fine for now (auto-injection works), but if/when the v0.2 §A6 split lands the buckets above are a clean target.

## Naming convention split

**13 files use `feedback_<snake_case>.md`** (older convention, mostly pre-April).
**13 files use `<kebab-case>.md`** (newer convention, post-April-25).

Three of today's `feedback_<snake>` files (paper-checks, gather-respects, archive-not-collapse, always-check) have **kebab-case `name:` field in frontmatter but snake-case filename** — mixed convention. The frontmatter name is canonical for the auto-injection mechanism; the filename is human-facing.

**Recommendation:** Adopt kebab-case for all new files (the post-April convention). Don't rename existing files — `git mv` would break wikilinks elsewhere in the wiki and the cost-benefit is not there. Just stop using the `feedback_` prefix for new work.

## Cross-link health

Most files have `See also:` or `related:` cross-references. A few gaps:

- `awareness-as-duty.md` doesn't cross-link to `proactive-error-cleanup` despite obvious thematic kinship (both about not-letting-signal-drop).
- `framework-floor-not-checklist.md` and `goal-driven-execution.md` reference each other; clean.
- The 5 memory-discipline rules cross-link in a tight clique — good.
- The 3 paper-check rules cross-link in a tight clique — good.

## Open question for Alton

**Does Alton want a quarterly cleanup-pass cadence on this corpus, or is this one-shot scouting?**

If quarterly: the next pass would be ~2026-08-02. Worth a `/schedule` agent. The work is read-mostly (~30-45 min) and benefits from fresh-eyes review of corpus drift.

If one-shot: Alton triages this review at his convenience and the rule-author idles until new audit findings arrive.

The scout vote: **quarterly is worth it.** Three of today's findings (the `feedback_no_permissions` strict-subset, the snake/kebab split, the cross-link gaps) are the kind of thing that compounds invisibly across months.

## Total candidates flagged

- **2** for merge-and-archive: `feedback_no_permissions`, `feedback_agent_bypass` → into `feedback_permissions_fix`
- **1** for tighten-or-archive: `feedback_memory_conventions`
- **1** for cross-reference (no edit): `feedback_prefer_subagents` ↔ `federation-grep-before-delegation`
- **1** for Alton refresh-check: `gather-triage-2026-04-16`
- **2** for in-place tightening (next revision, by original author): `feedback_archive_not_collapse`, `feedback_always_check_paper_check_vendors_before_flagging_red`

**6 candidates total. All read-only flags. No merges performed.**
