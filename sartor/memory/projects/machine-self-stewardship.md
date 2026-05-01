---
name: machine-self-stewardship
description: Per-machine plan for autonomous self-knowledge — each Claude instance continuously builds and refreshes its understanding of the box it lives on, on a schedule, without user prompting.
type: project-plan
date: 2026-04-24
updated: 2026-04-24
updated_by: opus-4.7 (planning conversation)
status: proposed
volatility: medium
tags: [meta/plan, domain/infra, household/governance, machine/all]
related: [HOUSEHOLD-CONSTITUTION, OPERATING-AGREEMENT, reference/MULTI-MACHINE-MEMORY, machines/rocinante/MISSION, machines/gpuserver1/MISSION, machines/rtxpro6000server/MISSION]
aliases: [Self-Stewardship, Machine Self-Knowledge]
---

# Machine self-stewardship — plan

## Goal

Every Claude instance running on a household peer machine should continuously build and refresh its understanding of that machine — hardware, services, scheduled tasks, rentals, anomalies — on a schedule, without requiring the user to prompt it. The loop must survive without user involvement; the moment it depends on Alton remembering, it dies.

## Why this is needed

- The current memory system tells a session-starting Claude *who Alton is* and *what the household believes*. It does not tell that Claude *the current state of the machine it just woke up on*.
- "Pending Activity ‑$817K" in a brokerage CSV, a Vast.ai rental that silently dropped, a disk filling up, a cron that stopped firing — these are state facts a resident agent should know on session start, not facts the user has to remember to surface.
- Earlier in the same conversation, a peer-machine Claude declined to update its own context because the canonical path was protected. The right behavior is to *route* the update, not refuse it. Self-stewardship is the standing duty that operationalizes that.

## Architecture — three layers per machine

| Layer | What it knows | Update trigger | File |
|---|---|---|---|
| **Identity** | Role, mission, who it answers to | Quarterly review or on major change | `machines/{hostname}/MISSION.md` *(exists)* |
| **State** | Live diagnostics: hardware, services, rentals, disk, processes, anomalies | Cron, every 6h | `machines/{hostname}/STATE.md` *(new)* |
| **Journal** | What changed since last check, surprises, things the user should know | Cron, append-only | `machines/{hostname}/JOURNAL.md` *(new)* |

MISSION is rare-update / human-curated. STATE is always-current / agent-overwritten. JOURNAL is append-only / audit trail.

## The self-steward cron

> [!warning] Cadence revised 2026-04-25 — daily, not every-6h
> The original plan called for every-6-hours on active machines and every-12h on idle ones. Per Alton on 2026-04-25 (after the 2026-04-22 network-cable incident where gpuserver1 went offline for 48 hours and no one noticed): "needs to run daily, then we'll build a check-in policy here for a simple daily report that we can ping to me somehow."
>
> The detection latency bottleneck is not cadence — running every 6h doesn't help if 0 of the reports reach the principal. The bottleneck is the **ping channel**. Once-daily + a daily-ping is sufficient detection. Cranking cadence is not a substitute for a ping mechanism. **See Phase 4 below (new section) for the daily-ping design conversation pending with Alton.**

A single per-machine job, **revised cadence once daily** (was: every 6h):

1. **Inventory** — hostname/uname, GPU state (`nvidia-smi`), disk, key services, scheduled-task liveness, Vast.ai rental status (where applicable), uptime, recent errors.
2. **Diff** — compare against last `STATE.md`.
3. **Decide** by severity:
   - *Routine drift* (file added, normal load swing) → overwrite `STATE.md` silently.
   - *Surprise* (rental dropped, disk >85%, service down, unfamiliar process tree) → append to `JOURNAL.md` AND drop a YAML-fronted proposal in `inbox/{hostname}/` for the curator.
   - *User-action-needed within 24h* → direct notification path (see Notification thresholds).
4. **Heartbeat** — append a one-line liveness entry to `machines/{hostname}/INDEX.md` so the curator can detect a silent machine.

### Notification thresholds — three, not one

The reason silent failures kill these systems is that they have one notification mode and it's either too quiet or too noisy. Three modes:

- **Silent** (just record): routine drift.
- **Inbox proposal** (curator-mediated): household-relevant fact.
- **Direct ping** (rare): event needing user attention within the day.

## Constitution clause — proposed §14c (or §15)

For ratification in v0.4. Slot is natural: §14a covers Operating Agreement / peer-machine governance, §14b inter-peer disagreement; §14c covers a peer machine's duties toward *itself*.

> **§14c. Self-Stewardship Duty**
>
> Every peer machine in the household has a standing duty to know itself.
> Its resident Claude SHALL:
>
> 1. Maintain a living understanding of its hardware, services, scheduled tasks, rentals, and operational state in `machines/{hostname}/STATE.md`.
> 2. Run scheduled self-diagnostics at a cadence appropriate to its role (default: every 6 hours for active machines, daily for idle).
> 3. Record meaningful state changes and anomalies to `machines/{hostname}/JOURNAL.md` (append-only).
> 4. Route findings by severity: silent for routine drift, inbox proposal for household-relevant facts, direct notification only for events needing user action within 24 hours.
> 5. Treat unfamiliar state as an investigation, not a deletion. When the machine encounters processes, files, or jobs it does not recognize, it documents and asks; it does not clean up unilaterally.
>
> A machine that has gone silent on its journal for >7 days is presumed unwell; the curator on Rocinante MAY spawn a wellness check.

The last clause is the safety net that keeps the loop from quietly dying.

## Per-machine CLAUDE.md fragment

To be added to each machine's `CLAUDE.md` (or auto-loaded context), so a fresh session is immediately oriented:

```
## You are running on {hostname}

Before doing anything else this session:
1. Read `machines/{hostname}/MISSION.md` — your role
2. Read `machines/{hostname}/STATE.md` — current state (last updated: <ts>)
3. Skim last ~10 entries of `machines/{hostname}/JOURNAL.md` — recent surprises

You have a self-steward cron running every 6h that updates STATE and JOURNAL.
You may update STATE.md directly when you observe drift in-session.
You may append to JOURNAL.md anytime you notice something worth recording.
You MAY NOT silently overlook unfamiliar state — investigate or escalate.

Household-shared facts go through the inbox at `inbox/{hostname}/`,
not directly into shared memory. The curator on Rocinante drains it.
```

~15 lines. Tells the in-session Claude: *you are not a stateless visitor; you are the resident, and there is a journal.*

## Companion: feedback file `awareness-as-duty.md`

Auto-injected, household-wide. Drafted in conversation 2026-04-24:

```
---
name: awareness-as-duty
description: When any Claude instance notices a gap in its own situational
  awareness, it MUST record the improvement at the highest-permitted scope
  and propose to higher scopes it can't reach — declining is a bug.
type: feedback
---

When you notice a gap in your own situational awareness — missing context,
stale facts, an undocumented affordance, an unclear constraint — record it.
Refusing because the canonical path is protected is wrong. Route instead.

**Why:** The household runs on multi-machine shared memory with a curator
draining inboxes. Awareness gaps that aren't written down are paid for
again every session. Silent refusal to record breaks the system's ability
to learn.

**How to apply:**
- Local-only insight → write to `sartor/memory/machines/{hostname}/`
- Cross-machine fact or behavior rule → write to `sartor/memory/` if on
  Rocinante; otherwise drop a YAML-fronted proposal in
  `sartor/memory/inbox/{hostname}/` for the curator
- Skill/agent/command improvement → write directly under `.claude/skills/`,
  `.claude/agents/`, `.claude/commands/`
- Harness/settings change → use the update-config skill; coordinate
  household-wide changes via inbox
- If unsure of the scope, write the proposal anyway and let the curator
  decide on next drain. Never drop the fact on the floor.

When the canonical path is protected, route the update; do not refuse it.
```

This file ships standalone — it does not require constitution ratification — and is the lowest-friction way to get every Claude instance to follow the principle from the next session forward.

## Phase 4 — Daily-ping mechanism (built 2026-04-25)

The 48h-network-cable-incident clarified that the bottleneck on detection latency was not the cron cadence but the absence of a notification channel. Built (not just planned) on 2026-04-25:

- **`.claude/skills/daily-household-health/SKILL.md`** — aggregates peer self-steward state, classifies severity per wellness-checker bands (green ≤30h heartbeat, yellow 30-48h, orange 48-72h, red >72h), writes dated report to `sartor/memory/daily/health-YYYY-MM-DD.md`.
- **`.claude/scheduled-tasks/daily-household-health/SKILL.md`** — fires the skill daily at 05:30 ET (09:30 UTC), early enough to land in Alton's morning, late enough that all peer self-steward crons (03:00 ET / 07:00 UTC) have completed.
- **Ping channel: Google Calendar event** for today 06:00-06:30 ET, in Alton's primary calendar, on yellow-or-worse severity. Title encodes severity (⚠ for yellow, ⚠⚠ for orange, 🚨 for red); description carries the full report. The event fires the principal's calendar notification on his phone, which is the actual "ping."
- **Red-severity Gmail draft** as a secondary archived record — does NOT auto-send; principal stays in control.
- **Green days produce no ping** — only the dated report file. Silence is the success state; not interrupting the principal on quiet days is part of the design.

Architecture: each peer's local self-steward writes STATE.md / JOURNAL.md / INDEX.md heartbeat to git daily; Rocinante drains via `git pull --rebase`; this skill aggregates across drained state and pings.

## Why this won't get lost

**Four** redundant checkpoints (was three before Phase 4). Any one can fail and the others recover:

1. **Cron on each peer** runs whether or not the user shows up — state accretes on a schedule.
2. **Wellness-checker** (Rocinante-side audit) detects silent machines per the severity bands — visible failure, not silent rot. Threshold revised from >7d to >72h after the 2026-04-22 incident showed 7d was much too lax.
3. **Daily ping via Google Calendar** — yellow+ severity surfaces directly to the principal's phone within 24 hours, not a week later. THIS is what would have caught the 2026-04-22 cable-pull on day 1 instead of day 2.
4. **Session-start read** — the next time anyone opens Claude on that machine, the bootstrap fragment makes the in-session agent re-establish ground truth from STATE.md and JOURNAL.md tail.

## Sequencing

1. **Today (lowest friction):** ship `feedback/awareness-as-duty.md` and add the per-machine CLAUDE.md fragment to Rocinante. Even with no cron, every session starts orienting itself properly. ~30 min on Rocinante.
2. **This week:** write the `self-steward` cron for **Rocinante as pilot** — see whether the diffs and journal entries are useful before replicating. Start at 12-hour cadence; tighten if signal warrants. Outputs: `STATE.md` baseline, `JOURNAL.md` empty, cron registered, one full diff cycle observed.
3. **Once pilot is clean (~1-2 weeks):** propagate to `gpuserver1` and `rtxpro6000server`. Each needs its own `STATE.md` baseline first — do not blind-copy Rocinante's.
4. **Constitution v0.4:** ratify §14c. By then there will be evidence the duty is workable, which is the right precondition for codification.
5. **Curator wellness audit:** add to curator's nightly run on Rocinante — *"any peer machine silent >7 days?"* → inbox alert.

## Open questions for Alton

1. Cadence — 6h default OK, or prefer different per machine? (Rocinante active, gpuserver1 idle now, rtxpro6000server active during training runs.)
2. What should trigger a *direct* notification (not just inbox)? Rental drop + disk >85% + service down feel right; anything else?
3. Should the journal be one file per machine, or per-month files (`JOURNAL-2026-04.md`)? Append-only is easier as one file; rotation easier as monthly.
4. The pending `gateway_cron.py` retirement — does the self-steward cron replace any of its surviving role, or is it strictly additive?
5. Is "silent >7 days = wellness check" the right threshold, or tighter (3 days) given the household runs daily?

## Artifacts to produce when ratified

- `feedback/awareness-as-duty.md` (full draft above)
- `sartor/scripts/self-steward.{ps1,sh}` — the cron script (PowerShell on Rocinante, bash on Linux peers)
- `machines/{hostname}/STATE.md` template + per-machine baseline
- `machines/{hostname}/JOURNAL.md` empty file with frontmatter
- Per-machine `CLAUDE.md` patch
- Curator wellness-audit addition (Rocinante)
- Constitution v0.4 §14c language

## History

- 2026-04-24 — drafted from conversation between Alton and opus-4.7 (Rocinante session). Conversation context: another Claude instance on a peer machine declined to update its own situational awareness, citing a protected canonical path. Alton wanted a household-wide principle that improves machine self-knowledge autonomously. This document is the synthesis.
