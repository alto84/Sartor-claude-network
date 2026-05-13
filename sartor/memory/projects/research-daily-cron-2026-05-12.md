---
type: project
date: 2026-05-12
updated: 2026-05-12
updated_by: rocinante (opus 4.7, 1M context — background job 89d4d371; v0.2 after Alton redirect)
status: design v0.2 — staged, awaiting Alton greenlight before crontab install
related:
  - machines/rtxpro6000server/CRONS
  - research/INDEX
  - research/persona-engineering/INDEX
  - research/ccp-alignment
  - reference/HOUSEHOLD-CONSTITUTION
  - reference_memory_server
tags: [meta/project, domain/research, domain/automation, machine/rtxpro6000server]
---

# Research Daily Cron + Dashboard — design v0.2 (2026-05-12)

## What Alton asked for

Original ask (v0.1):

> "Design a cronjob/schedule set of tasks for RTX server to continue developing our research, with nightly efforts/plans scheduled smartly by RTX and a daily update HTML overview of progress."

Redirects in v0.2:

1. **No budget limits.** Max thinking. Big task. Use as many tokens as needed.
2. **Daytime, not nightly.** Research scheduled during the day; daily report on progress.
3. **Drop pharmacovigilance** — that line has moved to Alton's AZ work laptop.
4. **The mission**: "Can we get a smaller model to take on the household identity?"

v0.2 absorbs all four redirects. The cadence renamed nightly → daily, the prompt rebuilt around the mission question, budget caps removed, pharmacovigilance dropped from the prompt's read list and the dashboard's per-program cards.

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

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  RTXSERVER (Ubuntu)                                              │
│                                                                  │
│  cron: 0 14 * * *  /home/alton/research-daily.sh                 │
│        (= 10:00 ET, daytime)                                     │
│        │                                                         │
│        ├─ docker ps | grep '^C\.'   ──┐ if active rental:        │
│        │                              │ inbox skip note, exit    │
│        │                              └→ (skipped log)           │
│        │                                                         │
│        ├─ ANTHROPIC_THINKING_BUDGET=high                         │
│        ├─ git pull --rebase origin main                          │
│        │                                                         │
│        └─ claude -p "$(cat research-daily-prompt.md)"            │
│           --max-turns 500 (sanity ceiling, not budget)           │
│           NO wall-clock timeout                                  │
│           │                                                      │
│           └─ Claude: assess, pick, execute, write daily report,  │
│              push to rtxserver bare                              │
│              writes: sartor/memory/daily/research-YYYY-MM-DD.md  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (rtxserver bare → Rocinante mirror task → GitHub)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  ROCINANTE (Windows)                                             │
│                                                                  │
│  Scheduled Task "Sartor Research Dashboard"  every 30 min        │
│         │                                                        │
│         └─ powershell research-dashboard.ps1                     │
│            └─ python scripts/research-dashboard-gen.py           │
│               reads:                                             │
│                 - sartor/memory/daily/research-*.md  (the daily  │
│                     reports — the load-bearing artifact)         │
│                 - sartor/memory/inbox/rocinante/*research-daily* │
│                     (cron-side phone-homes)                      │
│                 - sartor/memory/inbox/rtxpro6000server/          │
│                     loop-reports/ (peer self-loop output)        │
│                 - persona-engineering experiments + log          │
│                 - ccp-alignment eval-harness notes               │
│                 - git log --since=14d -- sartor/memory/research/ │
│                 - PASSOFF status                                 │
│               writes:                                            │
│                 - sartor/memory/research/dashboard.html          │
└──────────────────────────────────────────────────────────────────┘
```

## Schedule

| Cron | Where | Schedule | Job |
|---|---|---|---|
| `research-daily` | rtxserver | `0 14 * * *` (= 10:00 ET / 14:00 UTC daily) | Substantive research increment + daily report |
| `research-dashboard` | Rocinante Scheduled Task | every 30 min | Regenerate `dashboard.html` |

Why 10:00 ET: middle of Alton's work day, runs while he can glance at the dashboard mid-day, leaves the night free for the peer self-loop's smaller-cadence wakes.

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

## Files staged in this branch

- `sartor/memory/projects/research-daily-cron-2026-05-12.md` — this doc (renamed from `-nightly-`)
- `scripts/rtxserver-staged/research-daily.sh` — cron script (renamed; v0.2 no caps, daytime, max thinking)
- `scripts/rtxserver-staged/research-daily-prompt.md` — instruction set (v0.2)
- `scripts/research-dashboard-gen.py` — dashboard generator (v0.2, pharma dropped, daily reports linked)
- `scripts/win-tasks/research-dashboard.ps1` — Scheduled-Task wrapper (unchanged)
- `sartor/memory/research/dashboard.html` — sample output of the generator

## Install procedure (manual, after Alton greenlight)

1. **Rocinante side.**
   - `schtasks /create /TN "Sartor Research Dashboard" /SC MINUTE /MO 30 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\research-dashboard.ps1" /RU alto8`
   - Verify first fire produces a fresh `dashboard.html`.
2. **rtxserver side.**
   - `scp scripts/rtxserver-staged/research-daily.sh alton@rtxserver:/home/alton/research-daily.sh`
   - `scp scripts/rtxserver-staged/research-daily-prompt.md alton@rtxserver:/home/alton/research-daily-prompt.md`
   - `ssh alton@rtxserver 'chmod +x /home/alton/research-daily.sh'`
   - `ssh alton@rtxserver 'DRY_RUN=1 /home/alton/research-daily.sh'` — verify gate logic
   - `ssh alton@rtxserver 'crontab -e'` add: `0 14 * * * /home/alton/research-daily.sh >> /home/alton/generated/cron-logs/research-daily.log 2>&1`
   - Update `sartor/memory/machines/rtxpro6000server/CRONS.md` (cron count 4→5).
3. **First-day observation.** Watch the 10:00 ET fire. Read `sartor/memory/daily/research-<DATE>.md` in the afternoon. If the assessment and pick look sane, leave running.

## Proposed CLAUDE.md change (NOT made — requires explicit Alton approval)

CLAUDE.md "Domain 5: Personal Research" currently lists pharmacovigilance-adjacent items implicitly. Recommend a small edit to note: "AstraZeneca / pharmacovigilance research is handled on Alton's work laptop, not on Sartor infrastructure, as of 2026-05-12." Surfacing here per the CLAUDE.md change-rule; not applied autonomously.

## History

- 2026-05-12 (Rocinante Opus 4.7, background job 89d4d371): **v0.1** — initial design. Nightly 02:00 ET cron, budgeted (80K tokens / 75 min), three research programs incl. pharmacovigilance.
- 2026-05-12 (Rocinante Opus 4.7, background job 89d4d371): **v0.2** — Alton redirect. Daytime cron (10:00 ET / 14:00 UTC). No budget caps; max thinking via `ANTHROPIC_THINKING_BUDGET=high`. Pharmacovigilance dropped (moved to AZ work laptop). Mission reframed around "smaller model takes household identity." Daily report file at `sartor/memory/daily/research-YYYY-MM-DD.md` is now the load-bearing artifact (was: phone-home in inbox). Files renamed nightly→daily.
