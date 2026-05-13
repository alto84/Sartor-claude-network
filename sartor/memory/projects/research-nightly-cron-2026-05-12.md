---
type: project
date: 2026-05-12
updated: 2026-05-12
updated_by: rocinante (opus 4.7, 1M context — background job 89d4d371)
status: design — staged, awaiting Alton greenlight before crontab install
related:
  - machines/rtxpro6000server/CRONS
  - research/INDEX
  - research/persona-engineering/INDEX
  - research/ccp-alignment
  - research/pharmacovigilance
  - reference_memory_server
tags: [meta/project, domain/research, domain/automation, machine/rtxpro6000server]
---

# Research Nightly Cron + Dashboard — design (2026-05-12)

## What Alton asked for

> "Design a cronjob/schedule set of tasks for RTX server to continue developing our research, with nightly efforts/plans scheduled smartly by RTX and a daily update HTML overview of progress."

Three deliverables:

1. **Scheduled work** on rtxserver that advances the research lines without a human in the loop each night.
2. **Smart planning** done *by rtxserver itself* — the cron doesn't carry a hard-coded task list; the nightly Claude looks at the research surface, picks tractable items, executes.
3. **Daily HTML overview** showing progress.

## Existing self-loop on rtxserver — and why this is a backstop, not a replacement

rtxserver's peer Claude (in `claude-team-1` tmux) **already runs a self-paced loop** via `ScheduleWakeup` from inside the Claude session. The wake-N commits in git history (wake-1 through wake-13 between 2026-05-08 and 2026-05-11) and the report files at `sartor/memory/inbox/rtxpro6000server/loop-reports/YYYY-MM-DDTHH-MMZ.md` are the artifacts. Constitution v0.6 §14a (proposed) binds this as a duty.

**Failure mode of the existing loop**: ScheduleWakeup state lives only in the live Claude session. When `sartor-claude-peer.service` restarts — boot, manual restart, `Sartor Peer Creds Sync` not restarting it but other systemd churn might, etc. — the scheduled wakeup is lost, the loop pauses indefinitely. wake-13's commit message documents "45h cadence gap since wake-12" and that the peer service had restarted ~6 min before that wake fired. The household has no surface for "is the loop alive?" beyond reading the most-recent loop-report timestamp.

A crontab-driven nightly does NOT have this failure mode: cron is host-level, survives any number of Claude session restarts, and fires on a deterministic schedule.

**So this design positions the nightly cron as a backstop** to the existing self-loop:

- The self-loop continues to drive frequent (hourly-ish) iteration while the peer is alive — that's the high-cadence path.
- The crontab nightly fires at 02:00 ET regardless of peer state — that's the deterministic-floor path.
- The nightly's prompt checks for a same-day loop-report; if one exists, the nightly does a different, complementary thing (e.g., a state-of-research synthesis across the three programs) instead of duplicating work.
- The dashboard surfaces BOTH the self-loop reports AND the nightly phone-homes, so the household can see what's driving the work.

The proposed cron does not modify the existing peer service or ScheduleWakeup behavior. It only adds a parallel, host-level cadence.

## What rtxserver looks like right now (ground-truthed 2026-05-12)

- Peer Claude auto-spawns at boot into `tmux claude-team-1` via user-systemd `sartor-claude-peer.service`. Currently alive (session created Mon May 11 02:29 UTC).
- 4 infrastructure crons already installed at minutes :17, :33, :30, and Sunday 4am — `gather_mirror`, `stale-detect`, `vastai-tend`, `docker-weekly-prune`. None drive research.
- vast.ai listing: machine_id 97429 active, reserved contract C.34113802 through 2026-08-24 at ~$0.20/hr realized. No customer docker container currently running (host-side `docker ps | grep '^C\.'` empty).
- Research lines on disk (in this repo, working tree at `/home/alton/Sartor-claude-network/`):
  - **persona-engineering** — Phase 2 planning underway. Experiment 002 (persona-vectors layer-sweep) committed 2026-04-30. PASSOFF-rtxserver-001 v1.4 status `phase-2-planning-in-progress`.
  - **ccp-alignment** — `eval-harness-2026-05-04/` lives here. Notes file + qwen35b comparison runs.
  - **pharmacovigilance** — safety-knowledge-graph with CRS / ICANS / ICAHS / infections / cytopenias / LICATS / T-cell-malignancy / mitigations.

## Hard constraints

These are the constraints any nightly job must satisfy, in priority order:

1. **No GPU workload during an active vast.ai rental.** rtxserver-management skill §Don'ts and vast.ai hosting agreement: "the hardware can not be used for any other purposes." The nightly job must self-gate: if `docker ps | grep '^C\.'` is non-empty, no GPU.
2. **No autonomous push to GitHub.** Commits land in the local working tree → push to the rtxserver bare repo (`/home/alton/sartor-git/Sartor-claude-network.git`) via `file://`. Rocinante's existing `Sartor Memory Mirror` task picks it up.
3. **No PASSOFF-equivalent multi-round adversarial loops without a human.** Cato prosecutions, REVISE-loop greenlight gates, model training kickoffs — all require Alton-in-the-loop. The nightly is allowed to *propose* such things to the inbox, not execute them.
4. **Wall-clock + token budget caps.** 90 min wall-clock soft; 100K tokens soft. The nightly job halts at budget and writes what it has.
5. **No write outside `sartor/memory/research/` and `sartor/memory/inbox/`** for the nightly's own commits. Touching CLAUDE.md, agents, skills, settings = needs a human.

## Architecture (three pieces)

```
┌──────────────────────────────────────────────────────────────────┐
│  RTXSERVER (Ubuntu)                                              │
│                                                                  │
│  cron:  0 2 * * *  /home/alton/research-nightly.sh               │
│         │                                                        │
│         ├─ docker ps | grep '^C\.'   ──┐  if active rental:      │
│         │                              │  write inbox skip note  │
│         │                              │  exit 0                 │
│         │                              └──→ (skipped log)        │
│         │                                                        │
│         ├─ cd /home/alton/Sartor-claude-network                  │
│         ├─ git pull --rebase origin main                         │
│         │                                                        │
│         └─ claude -p "$(cat /home/alton/research-nightly-prompt.md)"
│            --output-format stream-json                           │
│            --max-turns 60                                        │
│            > ~/generated/cron-logs/research-nightly-$(date).log  │
│            │                                                     │
│            └─ Claude reads research INDEX, picks work,           │
│               executes (CPU-bound), commits to working tree,     │
│               pushes to rtxserver bare,                          │
│               writes inbox/rocinante/<TS>_nightly-results.md     │
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
│                 - sartor/memory/inbox/rocinante/*nightly*.md     │
│                 - sartor/memory/research/**/RESEARCH-LOG.md      │
│                 - sartor/memory/research/persona-engineering/    │
│                     experiments/*.md (ordinal-sorted)            │
│                 - git log --since=7d -- sartor/memory/research/  │
│                 - sartor/memory/machines/rtxpro6000server/       │
│                     (vast.ai status, heartbeat)                  │
│               writes:                                            │
│                 - sartor/memory/research/dashboard.html          │
└──────────────────────────────────────────────────────────────────┘
```

## Why a fresh `claude -p` session rather than tmux-send into the peer

The persistent peer Claude in `claude-team-1` is shared with the PASSOFF workflow (Alton or Rocinante may have ongoing context with it). Driving it via `tmux send-keys` from a cron would step on whatever context the peer is mid-thinking. A fresh `claude -p` non-interactive session is:

- Hermetic — no prior conversation state to corrupt
- Idempotent — re-run produces a clean run
- Observable — single log file per run
- Cheaper to budget — token cap applies to one session, not the peer's entire lifetime

The peer Claude stays for PASSOFF-style interactive work; the nightly Claude is a separate, single-shot worker.

## The prompt (the load-bearing piece)

Lives at `scripts/rtxserver-staged/research-nightly-prompt.md`. Structure:

1. **Identity** — who you are, what tonight's job is.
2. **Hard constraints** — the 5 items above, restated as "you MUST NOT" / "you MUST".
3. **Inputs to read** — the exact files to load before deciding.
4. **The algorithm** — assess → pick → execute → commit → phone home. Pseudocoded.
5. **Allowed work-item types** — explicit list. Examples:
   - Read a Phase 2 plan, write a short critique to `inbox/rocinante/`.
   - Extend an experiment doc with literature notes from a paper not yet cited.
   - Run a code review on an experiment script (no execution — review only).
   - Draft an addition to the pharmacovigilance knowledge-graph (a new adverse-event mechanism page).
   - Write a status note that reconciles the eval-harness notes file with experiment 002's results.
   - Extend MEASUREMENT.md or METHODS.md with a citation that's missing.
   - Propose (not execute) an experiment for human review.
6. **Disallowed work-item types** — explicit list. Examples:
   - Any GPU training kickoff.
   - Any change to MEASUREMENT.md or METHODS.md that *redefines* a metric (revisions OK; redefinitions need human).
   - Spawning subagents that would themselves invoke Cato or another prosecutor persona.
   - Editing anything outside `sartor/memory/research/` and `sartor/memory/inbox/`.
   - Pushing to GitHub.
7. **Phone-home shape** — every run produces ONE file at `inbox/rocinante/<TS>_research-nightly-<verb>.md` with: what was assessed, what was picked, what was executed, what's still open. If skipped (rental active), the phone-home is one line: skipped, reason.

## Dashboard sections

The HTML target lives at `sartor/memory/research/dashboard.html`. Section list, top-to-bottom:

1. **Header strip.** Generated timestamp; last nightly fired (relative); next nightly fire (estimated); 4-light status (rtxserver-up, no-rental-active OR rental-active, peer-claude-tmux-alive, last-nightly-success).
2. **Last 7 nights — table.** One row per night: date, status (FIRED / SKIPPED-rental / FAILED / NO-RUN), wall-clock, summary headline, link to phone-home file.
3. **Per-program state.**
   - persona-engineering: current phase, last experiment ordinal+date, last RESEARCH-LOG entry, open `[!warning]` callouts, top open question.
   - ccp-alignment: eval-harness-2026-05-04 last run summary, count of evaluated checkpoints, open notes.
   - pharmacovigilance: knowledge-graph node count by type (adverse-event / mitigation / trial / model), last update.
4. **Open PASSOFFs.** Status of PASSOFF-rtxserver-001, PASSOFF-gpuserver1-001, PASSOFF-gpuserver1-002 (whichever exist). Wikilink + status field + age.
5. **Recent commits to research/.** `git log --since=7d --pretty=format:%h %s %ad -- sartor/memory/research/` rendered as a table.
6. **GPU / rental.** vast.ai machine_id, current rental status, customer container name if any, GPU0/GPU1 power draw + temp, Tctl, last nightly's pre-flight rental check outcome.
7. **What I'd propose tonight (preview).** If the most recent nightly's phone-home includes a `proposed_for_tonight:` field, surface here so Alton can override before the cron fires.

Visual style: matches `sartor/memory/wifi/network-dashboard.html` (dark theme, tabular-nums, mermaid for topology where useful). 60-second auto-refresh meta tag.

## Schedule (proposed)

| Cron | Where | Schedule | Job |
|---|---|---|---|
| `research-nightly` | rtxserver | `0 2 * * *` (02:00 ET nightly) | Pick work, execute, commit, phone home |
| `research-dashboard` | Rocinante Scheduled Task | every 30 min | Regenerate `dashboard.html` |

Why 02:00 ET: after Rocinante's nightly memory curation (23:00) so the inbox is freshly drained, and before Alton's 06:30 morning briefing so dashboard reflects last night's work.

Why every 30 min for the dashboard: rentals and peer-Claude state can change throughout the day; the dashboard is also the surface Alton glances at during the morning, so it should be fresh.

## Smoke-test plan (before crontab install)

1. Run the prompt against a fresh `claude -p` session **on Rocinante**, with the working tree set to a checkout — see what plan it produces. Verify the assessment-then-pick algorithm doesn't run off the rails.
2. Run the dashboard generator against current state. Open the HTML. Iterate on layout.
3. Run the `research-nightly.sh` script on rtxserver with `DRY_RUN=1` env var — it stops before invoking Claude and just prints what it would do. Verify the rental gate logic.
4. ONLY THEN: add the crontab entry on rtxserver and the Scheduled Task on Rocinante.

## Failure modes and how each is handled

| Failure | Detection | Response |
|---|---|---|
| Rental started after gate check | `docker ps` polled inside Claude session every ~10 min; if a customer container appears, Claude commits its current state and exits | Phone-home note: "yielded mid-run to customer rental" |
| Claude budget exceeded | `--max-turns 60` cap fires | Whatever partial state exists is committed; phone-home: "budget exceeded, partial" |
| Network down (can't pull origin) | `git pull` fails | Inbox alert (existing gather_mirror cron will also alert); nightly aborts |
| Working tree dirty at start | `git status` not clean | Stash with named marker, run, pop. If stash-pop conflicts: leave the stash, alert |
| Peer Claude tmux died | Out of scope — `sartor-claude-peer.service` auto-respawns; orthogonal to nightly | None |
| Nightly Claude makes a bad commit | Phone-home reviews show drift over a week | Alton manually reverts; design adds a guard for that pattern |

## What this design does NOT include (open questions for Alton)

- **Token budget for the nightly.** Set conservatively at 100K. Could be higher if research is moving fast.
- **GPU work allowance.** Currently zero (rental-gated only). Could add a "GPU OK if reserved-contract rental is idle (no docker container)" allowance, but that introduces a race: customer could connect mid-run. Default to "no GPU work in nightly" until we have a clean preempt mechanism.
- **Cadence.** Nightly is one cadence. Could also be weekly for synthesis (a `research-weekly` that consolidates 7 nights of work into one report).
- **Whether the dashboard should email / Slack on FAILED or proposed-experiment.** Currently silent — Alton sees it in morning briefing or by visiting the URL.

## Files staged in this branch

- `sartor/memory/projects/research-nightly-cron-2026-05-12.md` — this doc
- `scripts/rtxserver-staged/research-nightly.sh` — the cron script (gates + invokes Claude)
- `scripts/rtxserver-staged/research-nightly-prompt.md` — the instruction Claude reads
- `scripts/research-dashboard-gen.py` — the dashboard generator (run from Rocinante)
- `scripts/win-tasks/research-dashboard.ps1` — the Scheduled-Task wrapper
- `sartor/memory/research/dashboard.html` — sample output of the generator (smoke-test)

## Install procedure (manual, after Alton greenlight)

1. **Rocinante side.**
   - `schtasks /create /TN "Sartor Research Dashboard" /SC MINUTE /MO 30 /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\research-dashboard.ps1" /RU alto8`
   - Verify first fire produces a fresh `dashboard.html`.
2. **rtxserver side.**
   - `scp scripts/rtxserver-staged/research-nightly.sh alton@rtxserver:/home/alton/research-nightly.sh`
   - `scp scripts/rtxserver-staged/research-nightly-prompt.md alton@rtxserver:/home/alton/research-nightly-prompt.md`
   - `ssh alton@rtxserver 'chmod +x /home/alton/research-nightly.sh'`
   - `ssh alton@rtxserver 'DRY_RUN=1 /home/alton/research-nightly.sh'` — verify gate logic
   - `ssh alton@rtxserver 'crontab -e'` add: `0 2 * * * /home/alton/research-nightly.sh >> /home/alton/generated/cron-logs/research-nightly.log 2>&1`
   - Update `sartor/memory/machines/rtxpro6000server/CRONS.md` to record the new cron (cron count moves from 4 to 5).
3. **First-night observation.** Watch the 02:00 fire. Read the phone-home in the morning. If the assessment looks sane and the pick is appropriate, leave it running.

## History

- 2026-05-12 (Rocinante Opus 4.7, background job 89d4d371): Initial design. Staged on branch `worktree-research-nightly-cron`. Awaiting Alton greenlight before crontab install.
