---
name: family-memory-fixup
description: Detailed plan to clean up the family memory layer — consolidate scattered todos, prune accreting files, separate the four layers (facts / calendar / todos / audit), and dial in the pipelines that feed the system.
type: project-plan
date: 2026-04-25
updated: 2026-04-25
updated_by: opus-4.7 (audit + plan from session)
status: proposed
volatility: medium
priority: p1
tags: [meta/plan, domain/family, household/governance]
related: [FAMILY, family/active-todos, family/family-calendar, family/INDEX, machine-self-stewardship, MEMORY-CONVENTIONS]
aliases: [Family Memory Fixup, Family Layer Cleanup]
---

# Family memory fixup — plan

## Problem statement

Five places hold family todos. Three files are accreting without pruning. The personal-data-gather pipeline appends 19 runs of debate-with-itself into a user-facing calendar file. The four-day window before Aneeta leaves for RRE has no actionable prep checklist. None of these is broken by itself; together, they make a future Claude landing in `family/` work harder than necessary to find ground truth.

## Diagnosis — the four layers are mixed

| Layer | What it should be | Where it lives now |
|---|---|---|
| **Facts** (slow-changing) | People, schools, birthdays, relationships | FAMILY.md + family/{vayu,vishala,vasu}.md, but FAMILY.md also holds events + todos + inbox-archive + gather-output |
| **Calendar** (scheduled future) | Single regenerated view, current state only | family-calendar.md, but with 19 "Latest from gather" appendices mixed in |
| **Todos** (volatile action items) | One canonical list with deadlines | Scattered across 5 files (FAMILY.md, active-todos.md, tasks/ACTIVE.md, tasks/TODAY.md, inline callouts in family-calendar.md) |
| **Audit trail** (append-only history) | Separate archive | Pasted into user-facing files |

The structural fix is to put each layer in its own file with its own update discipline.

## File sizes today

| File | Lines | Pathology |
|---|---:|---|
| `family/active-todos.md` | 847 | Canonical-but-accreting; never pruned |
| `family/family-calendar.md` | 485 | 19 gather-runs appended; debates with itself in-place |
| `FAMILY.md` | 354 | ~40% inbox-archive + gather-output, ~60% facts |
| `family/vayu.md` | 160 | Reasonable |
| `family/vasu.md` | 160 | Reasonable |
| `family/vishala.md` | 144 | Reasonable |
| `tasks/ACTIVE.md` | 32 | Stale (completed items shown as open) |
| `tasks/TODAY.md` | 21 | **23 days stale** — dated 2026-04-02 |

## Dependencies (don't break these)

These pipelines read or write the family files. Any restructuring must preserve their interfaces or update them in lockstep:

- `.claude/scheduled-tasks/personal-data-gather/SKILL.md` — writes family-calendar.md and active-todos.md
- `.claude/scheduled-tasks/nightly-memory-curation/SKILL.md` — drains inbox to FAMILY.md (this is what creates the curator-drained blocks)
- `.claude/scheduled-tasks/todo-sync/SKILL.md` — syncs callouts to Google Tasks
- `.claude/skills/morning-briefing/SKILL.md` — reads from these files for the daily briefing
- `.claude/rules/family-calendar.md` — current rules document

---

# Phase 0 — Urgent items (today through 2026-04-30)

These can't wait for the structural cleanup. Handle in parallel.

## 0.1 Verify Vayu's Apr 30 dance concert time directly with MKA

The gather pipeline returned **9:40 AM** vs **1:40 PM** across runs 8/14/15/16/17/18. Run 18 settled on 9:40 AM AM via event-metadata reasoning. **Apr 30 is a sole-parent day; being wrong by 4 hours matters.**

- **Action:** Email or call MKA to confirm the actual time of the spring dance concert on Thursday Apr 30. Five-minute task; ends six runs of automated debate.
- **Output:** Update family-calendar.md with the verified time and add `verified_by: MKA-direct, 2026-04-25` annotation.
- **Owner:** Alton (or Aneeta, briefly).

## 0.2 Sole-parent window prep (Apr 29 – May 3, 5 days)

Aneeta at RRE, overlapping Berman wifi install (3 days), Alton solo with three kids. There is no actionable prep document anywhere; the window is flagged in family-calendar.md but with no checklist.

- **Action:** Create `family/sole-parent-window-2026-04-29.md` with a concrete checklist:
  - Meal plan or grocery delivery for 5 days
  - Confirm Amarkanth pickup help on Apr 29 / 30 / May 1 (Vayu MKA dismissal + Vasu Goddard)
  - Backup childcare for Vayu Wed 4/29 soccer practice 5:30–6:15
  - Vasu picture-day logistics: Apr 30, May 1, May 4 (three consecutive school days)
  - Vayu dance concert Thu 4/30 (9:40 AM, after MKA verification) — leave Goddard drop by 9:15
  - Berman tech access plan during sole-parent days (someone home 9 AM each day)
  - Backup: contact list for emergencies (school nurse, pediatrician, neighbor)
  - Aneeta's RRE contact info — destination address, phone reachability windows
- **Owner:** opus-4.7 to draft, Alton to review/edit.
- **Deadline:** today or tomorrow.

## 0.3 Clarify Aneeta's ACE Partners meeting

The 2026-04-20 Teams call with Hashan Alwis (ACE Partners, MD search firm) was flagged in gather as "may be a competing offer or lateral exploration." It's buried in family-calendar.md. Either it's a real career signal that belongs in FAMILY.md under Aneeta's career section, or it's nothing.

- **Action:** Alton asks Aneeta directly. One sentence: "Was the ACE Partners call about anything we should track?"
- **Output if yes:** Add to FAMILY.md → Aneeta career section with one-line context. Add to active-todos.md if action needed.
- **Output if no:** Add a feedback memory: "ACE Partners-style recruiter calls on Aneeta's calendar are not career signals; do not surface unless Aneeta flags."
- **Owner:** Alton.

## 0.4 Reconfirm Cougar Pride Day status

Run 19 (today) showed Family calendar finally updated to Sunday Apr 26, 11 AM–3 PM, Van Brunt Field. Cross-reference: MKA email Apr 22 + corrected calendar entry. **No action needed — flagged only because it was 6 runs of discrepancy.**

---

# Phase 1 — Structural cleanup (1–2 days, can be incremental)

## 1.1 Establish layer ownership

Write `family/CONVENTIONS.md` (new file, ~50 lines) specifying:

- **FAMILY.md** holds slow-changing facts only: people, relationships, schools, birthdays, location, schedules. NO events, NO todos, NO inbox archive, NO gather output.
- **family/{vayu,vishala,vasu}.md** are per-child fact pages: medical, school, activities. Same discipline.
- **family/family-calendar.md** is a regenerated view of the next 30 days. Replaced not appended. Single current-state table. No history inline.
- **family/active-todos.md** is the SINGLE canonical todo list for household action items. Triaged weekly; closed items go to a closed/ archive or are deleted.
- **family/_history/** (new dir) holds gather-run debates and audit trails. Not user-facing.
- **tasks/ACTIVE.md** Family section becomes a single line linking to active-todos.md. No duplication.
- **tasks/TODAY.md** is regenerated daily by the morning-briefing skill, or deleted if not actively maintained.

Each layer has explicit update discipline:

| Layer | Edited by | Cadence | Pruning |
|---|---|---|---|
| Facts | Curator + Alton | On change | Manual when wrong |
| Per-child | Curator + Alton | On change | Manual when wrong |
| Calendar | personal-data-gather | Daily | Auto-replace; past events drop after 7 days |
| Todos | gather + Alton | As surfaced | Weekly triage; closed items archive |
| Audit | gather + curator | Continuous | Move to monthly archive after 30 days |

## 1.2 Prune FAMILY.md (~60% size reduction)

Move OUT of FAMILY.md:
- **"Open Action Items" section (lines ~103–118)** → consolidate into `family/active-todos.md`.
- **"Upcoming Events" section (lines ~90–101)** → already covered in family-calendar.md; delete from FAMILY.md.
- **"Summer Plans" → Wohelo subsection** → move to `family/vishala.md` (Wohelo is Vishala-specific) and active-todos.md (the payment item).
- **All `<!-- curator-drained -->` blocks (lines ~146–344)** → move to `family/_history/inbox-drains-2026-04.md`. The curator should be pointed at a `_drains.md` sibling file going forward, not at FAMILY.md itself.
- **"Latest from gather" sections (lines 348–354)** → already covered in family-calendar.md; delete here.

KEEP in FAMILY.md:
- Frontmatter
- Key facts (family of 5, household structure)
- Family Members (Aneeta, Vayu, Vishala, Vasu) — fact-only blocks
- Pets
- Location
- Schedules (school, commute, cleaners)
- Important Dates (birthdays, anniversary)
- Schools
- Extended Family
- Related links
- History (frontmatter audit)

Target final size: ~150 lines. Easy to grep, easy to read.

## 1.3 Reset family-calendar.md

Delete all 19 "Latest from gather" sections. Keep the clean current-state tables (This week, Next week, Following week, Birthdays). Add a header link to `family/_history/family-calendar-2026-04/` for the archived debates.

Move the deleted gather sections to `family/_history/family-calendar-2026-04/runs.md` (one file per month, append-only). This preserves the audit trail without polluting the user-facing view.

Update the personal-data-gather skill to:
- **Replace, don't append** the calendar tables on each run.
- **Write only deltas** to the history file (no-change runs write nothing user-facing).
- **Keep one rolling section** at the bottom for "changes in last 7 days" — automatically aged out.

## 1.4 Triage active-todos.md (847 → ~250 lines)

The file has accreted everything-ever-flagged. Pass through:
- **Resolve `[!done]` items:** delete from this file; if outcome was material, append a one-line note to the appropriate child page or FAMILY.md.
- **Move closed/declined items** (the Apr 16 triage block) to `family/_history/triage-2026-04-16.md` for record.
- **Surface stale items:** any `[!todo]` with no activity in 30+ days gets a "still open?" prompt to Alton; either re-confirm or close.
- **Add date_added and target_date frontmatter to each callout** so aging can be detected programmatically going forward.

Target final size: ~250 lines, all actionable.

## 1.5 Reconcile tasks/ACTIVE.md and delete tasks/TODAY.md

- **tasks/TODAY.md:** delete. It's 23 days stale and not maintained. If a daily view is wanted, regenerate it from active-todos.md + family-calendar.md as part of morning-briefing.
- **tasks/ACTIVE.md:**
  - Family section → replace contents with: `See family/active-todos.md`. Single link.
  - GPU Business / Taxes / Nonprofit / Career / Infrastructure sections → review each for completed items still showing open. Mark or delete.

---

# Phase 2 — Pipeline discipline (1 week)

## 2.1 Update personal-data-gather

- **Cadence:** drop from intra-day (6 runs on 2026-04-24) to **once daily**, morning. Family calendar doesn't change at the rate the gather is running; the pipeline is generating noise > signal.
- **No-change-silent rule:** if no event added/removed/changed since last run, the run writes nothing to user-facing files. Heartbeat goes to a log, not to the calendar file.
- **Time-correction protocol:** if a time changes, write a single annotated entry. Don't append a debate. If two consecutive runs disagree, the gather flags an "unstable timestamp" callout and stops thrashing the file. The Apr 30 dance concert flip-flop is the worked example of what to prevent.
- **Privacy boundary:** explicitly filter Aneeta's solo Teams meetings from family-calendar.md. Only events on the family calendar OR involving children appear in the family view. Aneeta's work calendar belongs to Aneeta.
- **Output discipline:** new items go to active-todos.md as `[!todo]` callouts with date_added, source, and proposed deadline. Calendar additions go to family-calendar.md as table rows.

## 2.2 Update nightly-memory-curation

- **Drain target change:** drains for FAMILY-relevant entities go to `family/_history/inbox-drains-{YYYY-MM}.md`, not inlined into FAMILY.md.
- The curator surfaces a one-line summary of what was drained to the daily log; the full drain payload lives in the history file.
- Rationale: keeps user-facing files clean; preserves provenance for audit.

## 2.3 Add a weekly family-pruning pass

- **What:** Sundays. Curator (or Alton) reviews active-todos.md, marks closed items, ages stale ones, archives the week's `_history/` additions.
- **Where:** add to scheduled-tasks. Trigger: Sundays 5 PM ET (or whenever the existing weekly cadence runs).
- **Output:** brief report — N items closed, M items stale, K added this week. Posted to daily log.

## 2.4 Update `.claude/rules/family-calendar.md`

Today the rule file is generic. Augment with the layer separation discipline so any Claude landing on family files knows the conventions before editing:

- "FAMILY.md is fact-only; do not add events or todos there."
- "family-calendar.md is regenerated; do not hand-edit individual events."
- "active-todos.md is the single canonical todo list."
- "Audit/history goes to family/_history/, never to user-facing files."

---

# Phase 3 — Validation (after Phase 1 + 2 land)

How we know the cleanup worked:

1. **Single-grep todo test:** `grep -r "TODO\|\\[ \\]\|\\[!todo\\]\|\\[!deadline\\]" sartor/memory/family/` returns hits in active-todos.md and only there. (Plus per-child pages where a kid-specific item naturally lives.)
2. **FAMILY.md size:** under 200 lines.
3. **family-calendar.md:** clean current-state tables + birthdays + warnings; no "Latest from gather" sections in the user-facing view.
4. **tasks/TODAY.md:** absent or freshly regenerated today.
5. **active-todos.md:** all items have date_added; no items older than 60 days without a re-confirm.
6. **morning-briefing:** runs unchanged, produces same or better output.
7. **personal-data-gather:** no-change days produce no user-facing diff.

---

# Risks and unknowns

- **Morning-briefing skill** may depend on the current FAMILY.md structure (e.g., reading "Open Action Items"). Verify before pruning by grepping the skill's templates. If broken, update both in lockstep.
- **todo-sync** may write callouts back to specific files. Check before reorganizing.
- **The curator's drain target** is configured somewhere (probably in `nightly-memory-curation/SKILL.md` or memory-curator agent definition). Need to update the configured path when redirecting to `_history/`.
- **Wikilinks across the wiki** point to specific anchors in FAMILY.md (e.g., `[[FAMILY#Aneeta]]`). Pruning section names risks breaking links. Run a grep for all `[[FAMILY` and `[[family/` references before deleting sections; rewrite anchors as needed.
- **Aneeta** hasn't been involved in any of these conventions. If she ever opens these files, the structure should be self-explanatory; the CONVENTIONS.md doc helps.

---

# Sequencing — concrete order of operations

| Day | Item | Owner |
|---|---|---|
| **Today (Apr 25)** | 0.1 Verify Apr 30 concert time with MKA | Alton |
| Today | 0.2 Draft sole-parent-window-2026-04-29.md | opus-4.7 |
| Today | 0.3 Ask Aneeta about ACE Partners | Alton |
| Today / tomorrow | 1.1 Write family/CONVENTIONS.md | opus-4.7 |
| Tomorrow | 1.2 Prune FAMILY.md (move events + todos + drains out, keep facts) | opus-4.7 with Alton review |
| Tomorrow | 1.3 Reset family-calendar.md (move 19 gather sections to _history/) | opus-4.7 |
| Day 3 | 1.4 Triage active-todos.md (resolve done, surface stale, add dates) | opus-4.7 with Alton triage |
| Day 3 | 1.5 Delete tasks/TODAY.md, simplify tasks/ACTIVE.md | opus-4.7 |
| **This week** | 2.1 Update personal-data-gather (cadence + no-change-silent + privacy filter) | opus-4.7 |
| This week | 2.2 Redirect curator drains to _history/ | opus-4.7 |
| This week | 2.3 Add weekly pruning pass to scheduled tasks | opus-4.7 |
| This week | 2.4 Update .claude/rules/family-calendar.md | opus-4.7 |
| **End of week** | 3 Validation (run all 7 checks) | opus-4.7 reports to Alton |

Phase 0 items run in parallel with Phase 1; they don't depend on the cleanup landing first.

---

# Open questions for Alton

1. **Is the active-todos.md "weekly review" cadence (Sundays) the right one?** Or do you want a different rhythm — e.g., Friday evening before the weekend?
2. **For declined/closed items:** delete entirely, or always archive to `_history/`? I'd default to archive for anything with $ amounts, contact info, or a decision rationale; delete for trivial trip events.
3. **Aneeta's privacy boundary:** explicit filter "events with only Aneeta = exclude from family calendar." Sound right? Or do you want her individual work meetings visible to you in the family view?
4. **Who maintains the weekly triage?** A scheduled task that calls a Claude agent, or a manual review by you? Both work; defaults differ.
5. **Should `family/_history/` be in git, or `.gitignore`'d?** Audit trails compress; if it's in git, the repo grows. If ignored, history is local-only. I'd lean in-git with monthly archives but no strong opinion.

---

# Artifacts to produce when ratified

- `family/CONVENTIONS.md` — the schema doc
- `family/sole-parent-window-2026-04-29.md` — Phase 0 deliverable
- `family/_history/` directory with monthly archive files
- Updated FAMILY.md (pruned)
- Updated family-calendar.md (reset)
- Updated active-todos.md (triaged)
- Updated tasks/ACTIVE.md (de-duped)
- Deleted tasks/TODAY.md (or regenerated)
- Updated .claude/scheduled-tasks/personal-data-gather/SKILL.md
- Updated .claude/scheduled-tasks/nightly-memory-curation/SKILL.md
- Updated .claude/rules/family-calendar.md
- Optional: new weekly pruning task in .claude/scheduled-tasks/

## History

- 2026-04-25 — drafted by opus-4.7 (Rocinante session) after a deep-look audit of family-related files. Conversation context: Alton asked "what do you see in terms of family memory/indexing, to-dos" and then "come up with a detailed plan to fix this." This is the synthesis.
