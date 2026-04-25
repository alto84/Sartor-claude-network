---
name: family-conventions
description: Schema and update discipline for files under sartor/memory/family/. Specifies which file holds which layer (facts / calendar / todos / per-child / audit), who edits each, on what cadence, and how pruning works. Read this before editing any family-* file.
type: reference-conventions
date: 2026-04-25
updated: 2026-04-25
updated_by: opus-4.7 (family-memory-fixup Phase 1.1)
volatility: low
status: draft-pending-alton-ratification
tags: [meta/conventions, domain/family, household/governance]
related: [FAMILY, family/INDEX, family/family-calendar, family/active-todos, projects/family-memory-fixup, MEMORY-CONVENTIONS, .claude/rules/family-calendar]
aliases: [Family Conventions, Family Layer Schema]
---

# Family memory — conventions

**Read this before editing any file under `sartor/memory/family/` or `FAMILY.md`.**

The family memory has four layers. Each layer has its own file, its own update discipline, and its own pruning rule. Mixing the layers (events bleeding into FAMILY.md, todos bleeding into the calendar, gather-debate bleeding into user-facing files) is the failure mode this convention prevents. See `projects/family-memory-fixup.md` for the full diagnosis that led to these rules.

## The four layers

| Layer | File | What it holds | What it does NOT hold |
|---|---|---|---|
| **Facts** | `FAMILY.md` (root) + `family/{vayu,vishala,vasu}.md` | Slow-changing identity: people, relationships, schools, birthdays, locations, schedules, medical, school details | Events, todos, inbox archive, gather-run output, debate text |
| **Calendar** | `family/family-calendar.md` | Regenerated current-state view of next ~30 days | History, prior-run debates, open items needing action |
| **Todos** | `family/active-todos.md` | Single canonical list of household action items, with `date_added` and `target_date` | Closed items (those move to history), facts about people, scheduled events |
| **Audit** | `family/_history/` (directory) | Append-only audit trail: gather-run debates, inbox drains, supersession notes, decision rationale for closed items | Anything user-facing |

Each layer is queryable on its own; together they describe the household. Mixing them is the bug.

## Per-file discipline

### `FAMILY.md` (the root facts file)

- **Edited by:** the curator (`memory-curator` agent, nightly) and Alton (on changes).
- **Cadence:** changes only when a fact changes — kid changes school, someone moves, a new pet arrives. Not on every gather run.
- **Pruning:** manual when a fact becomes wrong. Old facts NOT relegated to history; the file replaces them in place.
- **Target size:** under 200 lines. If it grows past that, audit for layer leakage (events / todos / drains accreting).
- **Wikilink anchors:** prefer named sections that are stable (`## Aneeta`, `## Schools`) rather than positional. Other files reference these via `[[FAMILY#section-name]]`.

### `family/{vayu,vishala,vasu}.md` (per-child fact pages)

- **Edited by:** curator + Alton.
- **Cadence:** on change.
- **Pruning:** manual.
- **Holds:** medical history, school placement, activities, friends, allergies, things that matter for that specific kid.
- **Does NOT hold:** generic family events, the kid's calendar (that's in family-calendar.md).

### `family/family-calendar.md` (the calendar view)

- **Edited by:** `personal-data-gather` skill, ONLY. Hand-edits are overwritten on next run.
- **Cadence:** once daily (morning). NOT intra-day. The 6-runs-in-a-day pattern that produced 19 appended debates is the failure mode.
- **Discipline:** REPLACED on each run, not appended. The file is one rolling current-state view of the next 30 days, organized as week-tables (This week / Next week / Following week / Birthdays / Sole-parent windows / Warnings).
- **No-change-silent:** if a gather run finds no event added/removed/changed since the last run, the run writes nothing to this file. Heartbeat goes to a log.
- **Time-correction protocol:** if a time changes between runs, write a single annotated entry showing old → new. Don't paste the debate. If two consecutive runs disagree, flag with a `[!warning] unstable timestamp` callout and stop thrashing the file — drop a proposal to `inbox/rocinante/` for human verification.
- **Privacy filter:** Aneeta's solo work meetings are NOT in this file. Only family-wide events OR events involving children. Aneeta's work calendar is hers.
- **History:** Run-by-run debate text goes to `family/_history/family-calendar-{YYYY-MM}/runs.md`, not inline.

### `family/active-todos.md` (the canonical todo list)

- **Edited by:** `personal-data-gather` (additions) + Alton (triage) + curator (closing).
- **The single source of truth for household action items.** Other files (FAMILY.md "Open Action Items", `tasks/ACTIVE.md` family section, `tasks/TODAY.md`) defer to this one. Cross-references go through wikilink, not duplication.
- **Format:** each item is a callout (`[!todo]`, `[!deadline]`, `[!waiting]`) with `date_added`, `source` (gather run / Alton / curator), `target_date` if known, and a one-line action statement.
- **Cadence:** items added as surfaced (gather, Alton, others). Triaged weekly (Sundays preferred unless Alton specifies otherwise).
- **Pruning:** at weekly triage:
  - Closed items → moved to `family/_history/triage-{YYYY-MM-DD}.md` if material (had a $ amount, contact info, or a decision rationale); otherwise deleted outright.
  - Stale items (>30 days no activity) → "still open?" prompt to Alton; he re-confirms or closes.
- **Target size:** under ~250 lines, all actionable.

### `family/_history/` (audit directory)

- **NOT user-facing.** Future Claudes and curator agents read this; principals don't unless investigating a specific past decision.
- **Structure:**
  - `_history/family-calendar-{YYYY-MM}/runs.md` — appendix of what each gather run debated
  - `_history/triage-{YYYY-MM-DD}.md` — closed-todo archive per triage session
  - `_history/inbox-drains-{YYYY-MM}.md` — curator's monthly drain log (replaces inline `<!-- curator-drained -->` blocks)
- **Pruning:** monthly archives compress in place; nothing deletes. If the directory grows large, the oldest months can be tarballed and removed from the working tree (decision pending; see Open Questions §5 in `projects/family-memory-fixup.md`).

### `tasks/ACTIVE.md` family section

- Replaced with: `See [[family/active-todos]]`. Single link, no duplication.

### `tasks/TODAY.md`

- Either deleted, or regenerated daily by the morning-briefing skill. Currently 23 days stale; if not maintained as a living view, delete it.

## Update protocol when editing family files

1. **Read this file first** (you should be doing that now).
2. **Identify the layer** of what you're editing (fact, calendar, todo, audit).
3. **Edit only the file for that layer.** If your edit straddles two layers, split it.
4. **Bump `updated:` and `updated_by:` frontmatter** on the affected file.
5. **Cross-link via wikilink** if needed; don't duplicate the content.
6. **Commit with a message that names the layer** ("FAMILY.md fact: Vasu changed pediatricians" rather than "update family").

## What this convention does NOT cover

- **Events Alton attends solo** (work travel, dinners, etc.) — these belong in his calendar, not the family layer.
- **Aneeta's professional life** in detail — `business/az-career.md`-style info if needed; family layer holds only what affects household logistics.
- **Extended family history** — recorded in `FAMILY.md` Extended Family section as facts; no event tracking unless they're attending something at the house.

## Pipelines that touch family files

These pipelines are the ones that must respect the conventions. If any of them violate the rules going forward, file a fix in `inbox/rocinante/` flagged as a convention-violation:

- `.claude/scheduled-tasks/personal-data-gather/SKILL.md` — calendar + active-todos writes
- `.claude/scheduled-tasks/nightly-memory-curation/SKILL.md` — drain target (must redirect to `_history/`, not inline into FAMILY.md)
- `.claude/scheduled-tasks/todo-sync/SKILL.md` — Google Tasks sync; reads active-todos.md, never writes back into family/family-calendar.md
- `.claude/skills/morning-briefing/SKILL.md` — read-only view across files
- `.claude/rules/family-calendar.md` — operational tone rules; should reference this file

## Validation checks (run after structural cleanup lands)

1. **Single-source todo grep:** `grep -rE "TODO|\\[ \\]|\\[!todo\\]|\\[!deadline\\]" sartor/memory/family/` returns matches in `active-todos.md` and per-child pages only.
2. **FAMILY.md size:** under 200 lines.
3. **family-calendar.md:** clean rolling tables; no "Latest from gather" inline appendices.
4. **tasks/TODAY.md:** absent or freshly regenerated today.
5. **active-todos.md:** every item has `date_added`; nothing older than 60 days without a re-confirm.
6. **morning-briefing:** runs unchanged.
7. **personal-data-gather:** no-change days produce no user-facing diff.

These are the same checks listed in `projects/family-memory-fixup.md` Phase 3.

## History

- 2026-04-25: drafted by Rocinante Opus 4.7 per family-memory-fixup §1.1. Pending Alton ratification.
