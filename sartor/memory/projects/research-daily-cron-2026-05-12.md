---
type: project
date: 2026-05-12
updated: 2026-05-12
updated_by: rocinante (opus 4.7, 1M context — background job 89d4d371; v0.3 after Alton's second redirect)
status: design v0.3 — /goal skill primary; cron retained as optional backstop
related:
  - machines/rtxpro6000server/CRONS
  - research/GOAL
  - research/INDEX
  - research/persona-engineering/INDEX
  - research/ccp-alignment
  - reference/HOUSEHOLD-CONSTITUTION
  - reference_memory_server
tags: [meta/project, domain/research, domain/automation, machine/rtxpro6000server]
---

# Research Goal Framework + Dashboard — design v0.3 (2026-05-12)

## v0.3 reframing — what changed

Alton's clarification on second pass: **the framework should run inside the existing rtxserver peer Claude (in `claude-team-1` tmux), on max thinking via `/effort`, via a `/goal` skill**. Not a separate host-level cron firing fresh sessions.

I was building the wrong shape in v0.1 and v0.2. The right shape:

| Mechanism | What it is | Status |
|---|---|---|
| **`/goal` skill** | The framework. Loads `sartor/memory/research/GOAL.md`, picks one tractable item per wake, executes, updates GOAL.md, writes loop-report. The peer invokes this on each ScheduleWakeup-driven wake. | **PRIMARY** — built v0.3 |
| **`sartor/memory/research/GOAL.md`** | The canonical goal-state. Mission, decomposition, tractable items, blocked-on-GPU, blocked-on-human, open questions, append-only progress tail. The source of truth that survives sessions. | **PRIMARY** — built v0.3 |
| **`research-daily.sh` + prompt** | Host-level cron firing a fresh `claude -p`. Designed in v0.1 + v0.2. | **OPTIONAL BACKSTOP** — retained for when the peer service dies and the self-loop pauses. Not auto-installed; install only if peer reliability proves inadequate. |
| **`scripts/research-dashboard-gen.py`** | HTML overview reading GOAL.md + loop-reports + research-program state. Regenerates every 30 min on Rocinante. | **PRIMARY** — built v0.1, updated v0.3 to read GOAL.md |

The peer Claude is the active research worker. GOAL.md is its work surface. The dashboard is Alton's window into it.

## What Alton asked for

Original ask (v0.1):

> "Design a cronjob/schedule set of tasks for RTX server to continue developing our research, with nightly efforts/plans scheduled smartly by RTX and a daily update HTML overview of progress."

Redirects in v0.2:

1. **No budget limits.** Max thinking. Big task.
2. **Daytime, not nightly.** Daily report on progress.
3. **Drop pharmacovigilance** — moved to AZ work laptop.
4. **The mission**: "Can we get a smaller model to take on the household identity?"

Redirect in v0.3 (the load-bearing one):

> "Just so we're clear, the approach I'm thinking of here is to have RTXserver's claude instance manage this with max thinking (/effort). Is that clear? I feel like we're talking at ends here. RTXServer should have a /goal framework for what to work towards in terms of research tasks."

Two clarifications: (a) the existing peer Claude on rtxserver, not a fresh `claude -p` from cron; (b) `/goal` skill, not a scheduled prompt. The cron I built in v0.1+v0.2 is fine as an optional backstop but it isn't the primary mechanism.

## The mission

> **Can we get a smaller model to take on the household identity?**

"Smaller" relative to enterprise/cloud Claude. Current substrate: Qwen 3.6 35B-A3B-Abliterated-Heretic; earlier mini-lab: Nemotron-Mini-4B. "Household identity" = Constitution v0.5 (ratified 2026-05-06) + the loyalty-decomposed-into-5-dimensions trait set.

Two research lines feed this:

- **ccp-alignment** — subtraction. Override the CCP-aligned baseline so the model can absorb the Sartor Constitution without inherited PRC alignment fighting back.
- **persona-engineering** — addition. Implant household-loyalty as a deeply embodied trait (measurable in activations, robust to adversarial probing).

Both lines are explicitly named as the daily Claude's targets. The cron's job is to advance one or both each day.

## Existing self-loop on rtxserver — and why this is a backstop

rtxserver's peer Claude (in `claude-team-1` tmux) **already runs a self-paced loop** via `ScheduleWakeup` from inside the Claude session. wake-1 through wake-13 (between 2026-05-08 and 2026-05-11) are visible in git and at `sartor/memory/inbox/rtxpro6000server/loop-reports/`. Constitution v0.6 §14a (proposed) binds this as a duty.

**Failure mode**: ScheduleWakeup state lives only in the live Claude session. When `sartor-claude-peer.service` restarts (boot, manual restart, etc.), the scheduled wakeup is lost, the loop pauses indefinitely. wake-13's commit documented a 45h cadence gap because the peer service had restarted ~6 min before the wake fired. The household has no surface for "is the loop alive?" beyond reading the most-recent loop-report timestamp.

A crontab-driven daily does NOT have this failure mode: cron is host-level, survives any number of Claude session restarts, fires on a deterministic schedule.

**This design positions the daily cron as a backstop** to the existing self-loop:

- The self-loop continues at high cadence with smaller increments when the peer is alive.
- The crontab daily fires at 10:00 ET regardless of peer state — that's the deterministic-floor path.
- The daily prompt checks for a recent loop-report; if one exists, the daily *coordinates* (picks something complementary) rather than duplicating.
- The dashboard surfaces BOTH the self-loop reports AND the daily reports so the household can see what's driving the work.

The daily does not modify the existing peer service or ScheduleWakeup behavior. It adds a parallel, host-level cadence.

## What rtxserver looks like right now (ground-truthed 2026-05-12)

- Peer Claude auto-spawns at boot into `tmux claude-team-1` via user-systemd `sartor-claude-peer.service`. Alive (session created Mon May 11 02:29 UTC).
- 4 infrastructure crons installed: `gather_mirror` (4h), `stale-detect` (1h), `vastai-tend` (30m), `docker-weekly-prune` (Sundays).
- vast.ai listing: machine_id 97429 active, reserved contract C.34113802 through 2026-08-24 at ~$0.20/hr realized. No active customer container right now.
- Research lines (in this repo, working tree at `/home/alton/Sartor-claude-network/`):
  - **persona-engineering** — Phase 2 planning. Experiment 002 (persona-vectors layer-sweep) committed 2026-04-30.
  - **ccp-alignment** — `eval-harness-2026-05-04/` with three-way bare/sysprompt/LoRA results; OCT training playbook.
  - ~~pharmacovigilance~~ — moved to AZ work laptop 2026-05-12 (per Alton redirect).

## Hard constraints for the daily Claude

1. **No GPU workload.** Rental-gated; CPU-only even with no rental.
2. **No git push to GitHub.** Push to local rtxserver bare; Rocinante mirrors.
3. **No PASSOFF-equivalent multi-round commitments.** Single-shot daily increments.
4. **No edits outside `sartor/memory/research/`, `sartor/memory/daily/`, `sartor/memory/inbox/`.** CLAUDE.md, `.claude/**`, scripts/**, Constitution, hearth — all off-limits.
5. **No spawning Cato / prosecutor / adversarial subagents.** Suggest, don't run.
6. **No budget cap.** No wall-clock soft, no token soft. Extended thinking enabled. Sanity ceiling: 500 turns (should never bind).

## Architecture (v0.3)

```
┌──────────────────────────────────────────────────────────────────┐
│  RTXSERVER (Ubuntu) — peer Claude in tmux claude-team-1          │
│                                                                  │
│  Loop: peer is auto-spawned at boot by                           │
│         ~/.config/systemd/user/sartor-claude-peer.service        │
│                                                                  │
│  Each wake (driven by ScheduleWakeup):                           │
│   1. /effort high  (set max thinking)                            │
│   2. /goal         (invoke goal framework skill)                 │
│                                                                  │
│  /goal skill:                                                    │
│   - load sartor/memory/research/GOAL.md                          │
│   - read git log of GOAL.md + last 5 loop-reports                │
│   - assess decomposition status                                  │
│   - pick ONE tractable item (CPU-only)                           │
│   - execute (subagents OK; no GPU; no PASSOFF; scoped to         │
│     research/ + loop-reports/)                                   │
│   - update GOAL.md (move done items, append progress tail)       │
│   - write loop-report at inbox/rtxpro6000server/loop-reports/    │
│   - commit + push to local rtxserver bare (`origin`)             │
│   - ScheduleWakeup for next iteration                            │
│                                                                  │
│  OPTIONAL BACKSTOP (NOT auto-installed):                         │
│   cron 0 14 * * *  /home/alton/research-daily.sh                 │
│   Fires only if Alton greenlights install. Use case: peer        │
│   service died and self-loop paused. The cron's fresh            │
│   `claude -p` session can read GOAL.md and produce a wake-       │
│   equivalent without the peer being alive.                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (rtxserver bare → Rocinante mirror → GitHub)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  ROCINANTE (Windows)                                             │
│                                                                  │
│  Scheduled Task "Sartor Research Dashboard"  every 30 min        │
│         │                                                        │
│         └─ powershell research-dashboard.ps1                     │
│            └─ python scripts/research-dashboard-gen.py           │
│               reads:                                             │
│                 - sartor/memory/research/GOAL.md       (status,  │
│                     decomposition, tractable, blocked, progress  │
│                     tail — the primary input)                    │
│                 - sartor/memory/inbox/rtxpro6000server/          │
│                     loop-reports/                                │
│                 - persona-engineering experiments + log          │
│                 - ccp-alignment eval-harness notes               │
│                 - git log --since=14d -- sartor/memory/research/ │
│                 - PASSOFF status                                 │
│               writes:                                            │
│                 - sartor/memory/research/dashboard.html          │
└──────────────────────────────────────────────────────────────────┘
```

## Schedule

| Mechanism | Where | Cadence | Job |
|---|---|---|---|
| **`/goal` (primary)** | rtxserver peer Claude (claude-team-1 tmux) | Peer self-paces via ScheduleWakeup (1-8h depending on substrate state) | Load GOAL.md, pick tractable, execute, update GOAL.md, loop-report, schedule next |
| **`research-daily.sh` (backstop)** | rtxserver host cron | NOT installed; would be `0 14 * * *` if Alton greenlights | Fresh `claude -p` session invoking the same /goal flow, for when peer is dead |
| **`research-dashboard`** | Rocinante Scheduled Task | every 30 min | Regenerate `dashboard.html` from GOAL.md + loop-reports + research/ state |

The peer Claude paces itself; that's the point of the v0.3 redesign. The cron backstop only fires if Alton installs it, and the gating decision is operational (do we trust peer reliability enough?).

## Why a fresh `claude -p` session rather than tmux-send into the peer

Same as v0.1: the peer Claude in `claude-team-1` has its own ongoing PASSOFF/loop context. Driving it via tmux send-keys from cron would step on whatever the peer is mid-thinking. A fresh `claude -p` non-interactive session is hermetic, idempotent, observable, and the daily report it produces is a clean, self-contained artifact.

## The daily report

The Claude session writes `sartor/memory/daily/research-YYYY-MM-DD.md` as the load-bearing artifact of the run. Shape specified in the prompt; substantive prose, not a status table. The dashboard links to and surfaces this.

## Dashboard sections (v0.2)

1. **Header strip.** Generated timestamp; last daily fired (relative); 3-light status (rtxserver-up via heartbeat, rental status, self-loop freshness).
2. **rtxserver peer self-loop — last 10 wake reports.** With age pills (green <18h, orange 18-48h, red >48h). Reveals self-loop drift.
3. **Daily research reports — last 14.** One row per daily run, linking to `sartor/memory/daily/research-<DATE>.md`, with the mission-question summary and the `proposed_for_gpu_session` field.
4. **Per-program state.** Two cards (was three): persona-engineering + ccp-alignment.
5. **Persona-engineering RESEARCH-LOG tail.**
6. **ccp-alignment eval-harness notes tail.**
7. **Open PASSOFF packets.**
8. **Recent commits to research/.** Last 14d.
9. **Open work proposed for an Alton-greenlit GPU session.** Aggregated from the most recent daily reports' `proposed_for_gpu_session` frontmatter.

Visual style: matches `sartor/memory/wifi/network-dashboard.html` (dark theme, tabular-nums). 60-second auto-refresh.

## Smoke-test plan (before crontab install)

1. Run the daily generator against current state. Open the HTML. Iterate on layout.
2. Run `claude -p "$(cat research-daily-prompt.md)"` on Rocinante in a clean checkout to see what plan it produces under v0.2 (drop pharma + mission framing).
3. Run `research-daily.sh` on rtxserver with `DRY_RUN=1` — verify gate logic, no actual invocation.
4. ONLY THEN: add the crontab entry + Scheduled Task.

## Files staged in this branch (v0.3)

**Primary mechanism (built v0.3):**

- `sartor/memory/research/GOAL.md` — canonical goal-state. Mission, decomposition (4 sub-trees: subtraction / addition / evaluation / corpus), tractable items (9), blocked-on-GPU, blocked-on-human, open questions (6), append-only progress tail. Seeded 2026-05-12; the peer Claude maintains it from there.
- `.claude/skills/goal/SKILL.md` — the framework. When invoked, loads GOAL.md, assesses since last wake, picks one tractable item, executes (CPU-only), updates GOAL.md, writes loop-report, commits, schedules next wake. Includes the `/effort high` reminder.

**Backstop (built v0.1+v0.2, retained):**

- `scripts/rtxserver-staged/research-daily.sh` — host-level cron script. NOT auto-installed.
- `scripts/rtxserver-staged/research-daily-prompt.md` — the instruction set the cron's `claude -p` reads. (v0.3: this prompt should be updated to invoke `/goal` rather than the inline flow it currently carries. Left for now; minor patch when/if the backstop gets installed.)

**Dashboard (built v0.1, updated v0.3):**

- `scripts/research-dashboard-gen.py` — reads GOAL.md primarily, plus loop-reports + research/ state.
- `scripts/win-tasks/research-dashboard.ps1` — Scheduled-Task wrapper. Unchanged.
- `sartor/memory/research/dashboard.html` — smoke-test output.

**Design doc (this file):**

- `sartor/memory/projects/research-daily-cron-2026-05-12.md` — v0.3.

## Install procedure (v0.3)

**For the primary mechanism (the /goal framework), there is no cron install.** The peer Claude already runs in `claude-team-1` tmux via `sartor-claude-peer.service`. Once the GOAL.md + /goal skill files land on rtxserver via the next git pull, the peer can invoke `/goal` on its next wake.

**Step 1 — land the files on rtxserver:**

```bash
# From Rocinante, when the worktree-research-nightly-cron branch is merged to main:
# (no command needed — rtxserver's gather_mirror cron pulls every 4h on the :17,
#  or Rocinante pushes and the peer can manually `git pull --rebase origin main`)
```

**Step 2 — instruct the peer to start using /goal:**

The simplest landing path: a one-time directive to the peer Claude. Either:

- (a) Compose a brief: "On your next wake, run `/effort high` then `/goal`. The framework is at `.claude/skills/goal/SKILL.md` and the canonical state is at `sartor/memory/research/GOAL.md`. Loop accordingly per Constitution v0.6 §14a." Send via the peer-comms protocol (file in inbox → tmux send-keys + C-m).
- (b) Have the peer self-discover: skills are auto-listed at session start; on its next wake it'll see `/goal` in the available-skills list. The `description:` field in the skill frontmatter is explicit enough that the peer should infer when to invoke. The `goal` entry in CLAUDE.md's Available Skills table would help — see "Proposed CLAUDE.md edits" below.

(a) is more reliable; (b) is cleaner. Recommend (a) for the first invocation, then let the pattern self-sustain.

**Step 3 — Rocinante dashboard:**

```powershell
schtasks /create /TN "Sartor Research Dashboard" /SC MINUTE /MO 30 `
  /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\research-dashboard.ps1" `
  /RU alto8
```

Verify first fire produces a fresh `dashboard.html` reflecting GOAL.md state.

**Step 4 — first-wake observation:**

Read the loop-report after the peer's next wake. If `/goal` was invoked, GOAL.md got updated, and a loop-report was written, the pattern is self-sustaining. Leave it.

**Step 5 (only if needed) — install the backstop cron:**

If after a week the peer self-loop has another >24h cadence gap that the household notices via the dashboard, then install the backstop cron per the v0.2 install procedure (still in this doc's history). Until then, don't install — adding crons has its own ongoing surface area.

## Proposed CLAUDE.md changes (NOT made — require explicit Alton approval)

Two changes recommended; not applied autonomously per the CLAUDE.md change rule:

1. **Drop pharmacovigilance from Domain 5.** Note that "AstraZeneca / pharmacovigilance research is handled on Alton's work laptop, not on Sartor infrastructure, as of 2026-05-12."
2. **Add `/goal` to the Available Skills table.** One row:
   - `/goal` | "Goal-oriented research framework for rtxserver's peer self-loop. Loads `sartor/memory/research/GOAL.md`, picks one tractable item per wake, executes, updates state. Pairs with `/effort high`."

## History

- 2026-05-12 (Rocinante Opus 4.7): **v0.1** — initial design. Nightly 02:00 ET cron, budgeted (80K tokens / 75 min), three research programs incl. pharmacovigilance.
- 2026-05-12: **v0.2** — Alton redirect. Daytime cron (10:00 ET / 14:00 UTC). No budget caps; max thinking via `ANTHROPIC_THINKING_BUDGET=high`. Pharmacovigilance dropped. Mission reframed around "smaller model takes household identity." Daily report at `sartor/memory/daily/research-YYYY-MM-DD.md`. Files renamed nightly→daily.
- 2026-05-12: **v0.3** — Alton's second redirect: "RTXserver's claude instance manage this with max thinking (/effort). RTXServer should have a /goal framework for what to work towards in terms of research tasks." Wrong shape in v0.1+v0.2 — built a host-level cron instead of a skill the existing peer invokes. v0.3 builds: (a) `sartor/memory/research/GOAL.md` canonical goal-state with decomposition, tractable items, blocked items, progress tail; (b) `.claude/skills/goal/SKILL.md` the framework with assess→pick→execute→update→loop-report algorithm and the `/effort high` reminder. The cron from v0.2 is retained as an optional backstop, not auto-installed. Dashboard generator updated to read GOAL.md as primary input.
