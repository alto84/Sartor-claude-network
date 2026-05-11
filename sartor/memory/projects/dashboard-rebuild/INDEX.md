---
entity: dashboard-rebuild
type: project
status: phase-0-framed
phase: 0
created: 2026-05-02
updated: 2026-05-02
owner: dashboard-keeper
direct_report: dashboard-engineer
methodology: complex-project skill
related: [family-thread-dossier/dashboard-status, family-thread-dossier/family-dashboard-2026-05-02, family-thread-dossier/pipelines-audit, feedback/paper-checks-blindspot]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# Dashboard Rebuild — Phase 0 Frame

## Problem

Alton has no canonical "where I look right now" surface. Three dashboard artifacts exist; none serve their stated purpose today:

1. **MERIDIAN v0.2** is built and QA-passed but **dark** (no listener on port 5055, no auto-start). It also reads `tasks/TODAY.md` — which is **30 days stale** — and does NOT read the canonical family layer at `family/active-todos.md` or `family/family-calendar.md` that the family-thread session has spent the day curating.
2. **Morning Briefing** scheduled task reports exit 0 daily but writes nothing (output dir + log dir both missing). Silent failure since at least 2026-04-12.
3. **Sartor Network Dashboard** (Flask/SocketIO sibling under `sartor-dashboard-backend/`) is superseded and likely broken (depends on `chrome-automation` skill archived 2026-04-19).

Compounding: today (2026-05-02) the family-thread learned that **paper checks, in-person meetings, and phone calls are invisible to the gather pipeline**. Four items closed out-of-band today (Wohelo $12.9K, 185 Davis $2.2K, Bill the heating guy, Lucent Solar engineer met) would have been re-flagged RED tomorrow without an explicit override channel. See [[feedback/paper-checks-blindspot]].

## Why now

- The family-thread session (this thread) has produced two extremely high-value artifacts today: `family-dashboard-2026-05-02.md` (curated v2 with 56 open items, 5 RED) and the `paper-checks-blindspot` feedback rule. These artifacts have nowhere to live for Alton's daily glance.
- Stale `TODAY.md` and dark MERIDIAN mean Alton's existing muscle memory ("check the dashboard") yields nothing useful.
- Alton said in chat (2026-05-02) that he'd like the dashboard alive and integrated into his day; this is the moment of explicit invitation.

## Success criteria

The project is done when ALL of:

1. **Canonical surface chosen** and Alton can name it ("MERIDIAN at http://localhost:5055" or another decided home).
2. **The chosen surface is alive** without Alton having to start it manually each day. (Mechanism TBD — auto-start on login, scheduled task, NSSM service — decided in Phase 2.)
3. **The chosen surface reads the canonical family layer** — at minimum `family/active-todos.md`, `family/family-calendar.md`, FAMILY.md, and the most recent `family-dashboard-YYYY-MM-DD.md` snapshot if one exists. NOT `tasks/TODAY.md` unless it has been explicitly revived.
4. **Out-of-band quick-resolve interaction works.** Alton can mark an item "I just did X" without opening a file or waiting for the next gather run. Mechanism: a button per item that appends a one-line resolution to `family/active-todos.md` under today's `## YYYY-MM-DD Alton check-in` block.
5. **Morning briefing produces a real artifact tomorrow at 6:30 AM** that lands somewhere readable, with a fail-loud wrapper.
6. **`tasks/TODAY.md` decision applied** (retire OR revive into the briefing pipeline) and references updated.
7. **Sartor Network Dashboard decision applied** (archive OR delete — needs greenlight, see "Greenlight gates" below).
8. **All artifacts of this project committed** to `sartor/memory/projects/dashboard-rebuild/` with phase-boundary commits per the complex-project skill.

## Scope

### In scope
- MERIDIAN cleanup, rewiring, and operationalization
- Morning-briefing fix (dirs + wrapper hardening + verify tomorrow's run)
- `tasks/TODAY.md` decision and execution
- Sartor Network Dashboard archival decision and execution
- Out-of-band quick-resolve interaction in MERIDIAN (button → append to active-todos)
- Daily snapshot from this project's dossier into MERIDIAN

### Out of scope (defer to follow-up projects)
- Mobile / PWA polish
- Completely new visual redesign — the Hermes upgrade (April 2026) is the current visual baseline
- Mercury banking integration (separate task #6)
- Any change to the `personal-data-gather` cron itself (the gather pipeline's append-don't-replace pathology is documented in `pipelines-audit.md` §C and family-memory-fixup; out of scope for THIS project)

## Constraints

- **Edits in `.claude/` are restricted to `agents/`, `commands/`, `skills/` subdirs** (per MEMORY.md).
- Greenlight required for: deleting any file, modifying any scheduled task, starting a service that opens a port, modifying any `.claude/skills/` or `.claude/agents/` file. Greenlight comes from team-lead, who relays to Alton when user-facing.
- The `personal-data-gather` cron writes `family/active-todos.md` every 4h with the documented append-don't-replace pathology. Any quick-resolve mechanism MUST tolerate this — i.e., resolutions append-at-top under a `## YYYY-MM-DD Alton check-in` block (the proven 2026-04-16 / 2026-05-02 pattern), not in-place edit of items the gather may rewrite.
- Per [[feedback/paper-checks-blindspot]], the dashboard MUST soften RED-flagged paper-check / in-person items to "is this still open or already in the mail?" not "you must act today."

## Greenlight gates (cannot self-approve)

Per the complex-project skill, the orchestrator (me) cannot approve its own enthusiasm. The following decisions require explicit team-lead → Alton greenlight in chat before any irreversible action:

1. **G1 — Auto-start mechanism for MERIDIAN.** Options: (a) Windows Scheduled Task at logon, (b) Startup folder shortcut, (c) NSSM-style always-on service. Tradeoffs documented in Phase 2 design.
2. **G2 — `tasks/TODAY.md` retire vs. revive.** Both are reasonable; the call is Alton's because it touches his historical workflow.
3. **G3 — Sartor Network Dashboard archive vs. delete.** Archive is the safer default; delete is irreversible.
4. **G4 — Quick-resolve interaction shape.** Touches Alton's workflow; he should sign off on the UX before build.
5. **G5 — Modifying `SartorMorningBriefing` scheduled task** (any change beyond creating directories the wrapper needs).

## Phase plan (complex-project skill)

| Phase | Owner | Status | Output |
|---|---|---|---|
| 0 — Frame | dashboard-keeper (me) + team-lead | **DONE 2026-05-02** | This file |
| 1 — Explore | dashboard-engineer (3 parallel diagnoses) | Next | EXPLORE-01-meridian.md, EXPLORE-02-briefing.md, EXPLORE-03-sartor-network.md |
| 2 — Design / Plan | dashboard-keeper (me, synthesizing Phase 1) | Pending | DESIGN.md with options + tradeoffs at each greenlight gate |
| 2.5 — Greenlight (G1–G5) | team-lead → Alton | Pending | Chat-message acks recorded inline in DESIGN.md |
| 3 — Build | dashboard-engineer | Pending | Code patches, scheduled-task changes, fixed wrapper |
| 4 — Adversarial Review | standalone Agent (NEVER dashboard-engineer) | Pending | REVIEW-01.md memo |
| 5 — Revise | dashboard-keeper (me, NOT dashboard-engineer) | Pending | Patches with charge attribution; review memo updated inline |
| 6 — Re-Review | standalone Agent (fresh context) | Pending | REVIEW-02.md memo |
| 7 — Final greenlight | team-lead → Alton | Pending | Authorization to fire |
| 8 — Validate | dashboard-engineer | Pending | Tomorrow's 6:30 briefing produced, MERIDIAN responding on 5055, quick-resolve roundtrip verified end-to-end |
| 9 — Loop or close | dashboard-keeper | Pending | Either Phase-5 patches for residual issues OR project closure |

## Pre-registered validation criteria (Phase 8)

When we get to Phase 8, "validated" means ALL of:

- `curl http://localhost:5055/api/greeting` returns 200 from a fresh PowerShell session not started by hand (proves auto-start works).
- `Sartor-claude-network/sartor/memory/inbox/rocinante/morning-briefing/2026-05-03.md` (or wherever the wrapper writes) exists and is non-empty after 6:30 AM 2026-05-03, with the today-block of `family/active-todos.md` referenced inside.
- MERIDIAN homepage shows at least one item from today's `family-dashboard-2026-05-02.md` (or whatever day's dossier is current).
- Clicking a quick-resolve button on a known test item appends a line under `## 2026-05-XX Alton check-in` in `family/active-todos.md` within 2 seconds, with no double-append on second click.
- The `SartorMorningBriefing` scheduled task's wrapper script returns the python module's exit code (not always 0) — verifiable by deliberately breaking the python module and observing the task report a non-zero `LastTaskResult`.
- `tasks/TODAY.md` is either deleted with all references removed, OR contains today's date as its most recent modification.

"Ambiguous" means: 4 or 5 of the above pass and the failing ones are not in the critical path (e.g., the quick-resolve button works but the per-item softening for paper-check vendors hasn't yet been wired). Loop back to Phase 5.

"Failed" means: <4 pass, OR auto-start fails, OR tomorrow's briefing doesn't materialize. Loop back to Phase 2 with new design constraints.

## Cast (who's involved)

- **dashboard-keeper** (me) — orchestrator, frame author, Phase 5 reviser, escalation point to team-lead
- **dashboard-engineer** (direct report) — Phase 1 explore, Phase 3 build, Phase 8 validation
- **team-lead** — relays to Alton, holds greenlight authority on G1–G5
- **Alton** — principal, gives chat-message greenlights
- **TBD outside reviewer** — to be spawned via Agent in Phase 4, NEVER a member of the build team. Persona TBD when Phase 3 ships; likely a "skeptical sysadmin" or "careful UX critic" depending on what the build foregrounds.

## Files referenced

- [[family-thread-dossier/dashboard-status]] — the audit that kicked off this project
- [[family-thread-dossier/family-dashboard-2026-05-02]] — the day's curated dossier; what MERIDIAN should surface
- [[family-thread-dossier/pipelines-audit]] — the full inventory of skills/agents/crons
- [[feedback/paper-checks-blindspot]] — the soften-the-red rule
- `C:\Users\alto8\Sartor-claude-network\dashboard\family\server.py` — MERIDIAN backend (currently reads TODAY.md not active-todos)
- `C:\Users\alto8\Sartor-claude-network\sartor\morning_briefing.py` — briefing module (silently failing)
- `C:\Users\alto8\Sartor-claude-network\scripts\morning-briefing-run.cmd` — wrapper that swallows errors

## History

- 2026-05-02 evening: Phase 0 framed. dashboard-engineer spawned and reporting in. Next move: dispatch three Phase 1 explore tasks in parallel.
