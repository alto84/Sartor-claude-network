---
type: machine_operations
entity: rocinante-crons
updated: 2026-04-12
updated_by: Claude
status: active
related: [gpuserver1-crons, OPERATING-AGREEMENT, MULTI-MACHINE-MEMORY]
---

# Rocinante Cron Documentation

Rocinante's scheduled-work surface is architecturally different from gpuserver1. Instead of many independent crontab entries, Rocinante runs a **single** Windows Task Scheduler job (`SartorHeartbeat`, every 30 min) that invokes a Python dispatcher (`sartor/heartbeat.py`). The dispatcher consults a cron-style registry (`sartor/scheduled_executor.py::SCHEDULE_REGISTRY`) and runs whichever scheduled tasks are due. Individual tasks live as skill-style prompts under `.claude/scheduled-tasks/<task>/SKILL.md`.

Total surface: **1 OS-level trigger** + **9 registered Claude scheduled tasks** + **3 unregistered SKILL.md's** sitting in the filesystem + **1 ad-hoc Python helper (`run_observers.py`)** occasionally invoked inline. Also active: noise from third-party Windows tasks (Adobe, Office, NVIDIA, OneDrive, Zoom) that Rocinante does not own.

This document is authoritative for all Rocinante scheduled-work operations. Last verified: 2026-04-12.

---

## Operational Rhythm

- **Every 30 min (OS trigger)**: `SartorHeartbeat` Windows Task — invokes `heartbeat.py` which runs health checks and dispatches any due scheduled tasks
- **Every 4 hours (dispatched)**: `gpu-utilization-check` (haiku), `personal-data-gather` (sonnet)
- **Every 6 hours (dispatched)**: `self-improvement-loop` (sonnet)
- **Daily 6:30 AM (dispatched)**: `morning-briefing` (sonnet)
- **Daily 11:00 PM (dispatched)**: `nightly-memory-curation` (sonnet)
- **Weekdays 4:30 PM (dispatched)**: `market-close-summary` (sonnet)
- **Fridays 6:00 PM (dispatched)**: `weekly-financial-summary` (sonnet)
- **Sundays 3:00 AM (dispatched)**: `weekly-skill-evolution` (sonnet)
- **Sundays 9:00 AM (dispatched)**: `weekly-nonprofit-review` (sonnet)

**Critical current state**: The heartbeat log (`data/heartbeat-log.csv`) shows **every tick since 2026-04-11 returning `budget-gate,skipped`**. The budget check is blocking all scheduled work. The Windows Task itself also returns `Last Result: 1` (non-zero exit). No scheduled task has actually executed in recent history — the rhythm described above is *registered* intent, not observed behavior.

---

## OS-Level Trigger

### SartorHeartbeat (Windows Task Scheduler)
**Schedule**: Every 30 minutes, indefinitely (one-time trigger with 30-min repetition interval, started 2026-04-03 15:34)
**Task to run**: `pythonw C:\Users\alto8\Sartor-claude-network\sartor\heartbeat.py`
**Working dir**: Not set (N/A)
**Run as**: `alton` (interactive only — does NOT run when user is logged out)
**Power**: Stop on battery, no start on battery
**Execution time limit**: 10 minutes
**Installer**: `sartor/create-heartbeat-task.ps1`
**Logs**: written by `heartbeat.py` into `data/heartbeat-log.csv` and daily log
**Status**: **ENABLED but degraded** — last result 1; every recent tick hits `budget-gate,skipped`
**Owner**: Rocinante (Claude Code session)
**Last verification**: 2026-04-12 (`schtasks /query /tn SartorHeartbeat /v` confirmed active)
**Commit plan**: **Direct repo write** — appends to `data/heartbeat-log.csv` (committed operational telemetry)

**Action needed**: Diagnose why `check_budget()` returns "skipped" every tick. Either costs.json is missing/unreadable, or daily cost already exceeds the cap, or a path bug. Until this is fixed, Rocinante effectively runs zero scheduled Claude tasks.

---

## Dispatched Scheduled Tasks

The entries below all live under `.claude/scheduled-tasks/<name>/SKILL.md` and are dispatched from `heartbeat.py -> scheduled_executor.get_due_tasks()`. None has its own OS-level trigger; all depend on the SartorHeartbeat dispatcher running and the budget gate allowing execution.

### 1. morning-briefing
**Schedule**: `30 6 * * *` (daily 6:30 AM local)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/morning-briefing/SKILL.md`
**Output**: `reports/daily/{date}-morning-briefing.md`
**Purpose**: Daily cross-domain briefing (Calendar, Markets, GPU, Nonprofit, Tasks)
**Status**: **NOT RUNNING** (blocked by budget gate; output files for 2026-04-03 are present but nothing newer)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** — `reports/daily/` is tracked in git (untracked files for 2026-04-03 currently staged as `??` in working tree)

### 2. personal-data-gather
**Schedule**: `0 */4 * * *` (every 4 hours)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/personal-data-gather/SKILL.md`
**Output**: daily memory files under `sartor/memory/daily/{date}.md`, updates to `USER.md`, Gmail/Calendar snapshots
**Purpose**: Persistent data collection across Gmail, Calendar, Drive — routes actionable intel into memory
**Status**: **NOT RUNNING** (blocked by budget gate)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** — writes directly into `sartor/memory/daily/` and `docs/USER.md`. This is the canonical Rocinante write path (Rocinante is the hub; inbox pattern only applies to non-hub machines).

### 3. gpu-utilization-check
**Schedule**: `0 */4 * * *` (every 4 hours)
**Model**: haiku
**SKILL**: `.claude/scheduled-tasks/gpu-utilization-check/SKILL.md`
**Output**: `data/gpu-utilization-log.csv` (append); `data/gpu-alerts.md` on issues
**Purpose**: SSH to gpuserver1, check vast.ai listing + active rentals + nvidia-smi; silent on healthy, alert on issues
**Status**: **NOT RUNNING** (blocked by budget gate)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** — both output paths are in the tracked repo

### 4. self-improvement-loop
**Schedule**: `0 */6 * * *` (every 6 hours)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/self-improvement-loop/SKILL.md` (new; untracked in git as of 2026-04-12)
**Output**: `data/SYSTEM-STATE.md`, `data/IMPROVEMENT-QUEUE.md`, `data/evolve-log/`
**Purpose**: Hermes-pattern evaluate/research/implement/validate on system performance; feeds improvement queue
**Status**: **NOT RUNNING** (blocked by budget gate; SKILL.md is also not yet committed)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** (data/ is tracked). The SKILL.md itself needs to be committed before the task is observable from git.

### 5. market-close-summary
**Schedule**: `30 16 * * 1-5` (weekdays 4:30 PM)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/market-close-summary/SKILL.md`
**Output**: `reports/daily/{date}-market-close.md`
**Purpose**: End-of-day portfolio snapshot, options expiry, after-hours earnings
**Status**: **NOT RUNNING** (blocked by budget gate)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** — `reports/daily/` is tracked

### 6. nightly-memory-curation
**Schedule**: `0 23 * * *` (daily 11:00 PM)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/nightly-memory-curation/SKILL.md` (modified in working tree)
**Output**: consolidation into `sartor/memory/` topic files via `sartor/memory/autodream.py`; decay updates via `decay.py`; regenerated `INDEX.md`
**Purpose**: AutoDream 4-phase consolidation (orient/gather/consolidate/prune), decay scoring, archive logs >90 days
**Status**: **NOT RUNNING** (blocked by budget gate)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** — Rocinante is the hub and autodream writes canonically into `sartor/memory/`. This is the correct pattern (non-hub machines use inbox; the hub is allowed to write directly).

### 7. weekly-financial-summary
**Schedule**: `0 18 * * 5` (Fridays 6:00 PM)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/weekly-financial-summary/SKILL.md`
**Output**: `reports/weekly/{date}-financial-summary.md`; appends `data/financial/weekly-earnings-log.csv`
**Purpose**: Weekly P&L rollup across GPU hosting, portfolio, nonprofit, tax liability
**Status**: **NOT RUNNING** (blocked by budget gate)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** — `reports/weekly/` and `data/financial/` are tracked; financial data is considered repo-resident per CLAUDE.md Domain 4

### 8. weekly-nonprofit-review
**Schedule**: `0 9 * * 0` (Sundays 9:00 AM)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/weekly-nonprofit-review/SKILL.md`
**Output**: `reports/weekly/{date}-nonprofit-review.md`
**Purpose**: Sante Total compliance scan, deadlines, upcoming board events
**Status**: **NOT RUNNING** (blocked by budget gate)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write**

### 9. weekly-skill-evolution
**Schedule**: `0 3 * * 0` (Sundays 3:00 AM)
**Model**: sonnet
**SKILL**: `.claude/scheduled-tasks/weekly-skill-evolution/SKILL.md`
**Output**: `data/skill-proposals/{skill-name}-{date}.md`; `data/skill-evolution-log.md`; updates to `docs/skill-improvement-queue.md`
**Purpose**: Draft improvements to under-performing skills (proposals only; never auto-applies)
**Status**: **NOT RUNNING** (blocked by budget gate)
**Last verification**: 2026-04-12
**Commit plan**: **Direct repo write** — proposals are tracked, requiring human review before application

---

## Unregistered Scheduled Tasks (filesystem-only)

Three SKILL.md files exist under `.claude/scheduled-tasks/` but are NOT in `SCHEDULE_REGISTRY` in `scheduled_executor.py`. They will never be dispatched by `heartbeat.py`:

### 10. todo-sync
**Intended schedule**: nightly (after wiki-reindex, per SKILL.md)
**SKILL**: `.claude/scheduled-tasks/todo-sync/SKILL.md`
**Purpose**: Extract `> [!deadline]`, `> [!blocker]`, `> [!todo]` callouts from wiki, create/update Google Tasks via MCP
**Status**: **ORPHANED** — not in registry, never dispatched
**Commit plan**: **Needs-migration** — either add to registry or archive. Output would be external (Google Tasks API) with local state in `data/todo-sync-state.md`.

### 11. wiki-reindex
**Intended schedule**: nightly (per SKILL.md)
**SKILL**: `.claude/scheduled-tasks/wiki-reindex/SKILL.md`
**Purpose**: Regenerate `sartor/memory/indexes/*.json` (backlinks, tag-index, similarity, orphans, broken-links) and bounded `data/wiki-state.md`
**Status**: **ORPHANED** — not in registry, never dispatched
**Commit plan**: **Needs-migration** — add to registry. Outputs write directly into `sartor/memory/indexes/` and `data/wiki-state.md` (both tracked).

### 12. self-improvement-loop SKILL.md
**Registered but untracked in git**: The SKILL.md file is `??` in git status. The task IS in `SCHEDULE_REGISTRY` but the file is not yet committed, so running it from a clean checkout would fail with FileNotFoundError.

---

## Ad-hoc Helper Scripts (not scheduled)

These run inline from `heartbeat.py` or manually, not via their own OS trigger:

- **`sartor/run_observers.py`** — invoked inline by `heartbeat.py` when available. Runs sentinel/auditor observer checks and appends to `data/observer-log.jsonl`. Untracked in git.
- **`sartor/trajectory.py`** — inline logger for `heartbeat.py` post-execution. Untracked in git.
- **`sartor/costs.py`** — budget tracker read by `heartbeat.py::check_budget()`. Modified in working tree (uncommitted).
- **`sartor/memory/autodream.py`** — invoked by `nightly-memory-curation` task (not directly scheduled).
- **`sartor/memory/decay.py`** — invoked by `nightly-memory-curation` task.
- **`sartor/memory/embeddings.py`** — untracked; unclear invocation path.
- **`sartor/memory/search.py`** — ad-hoc CLI only; modified in working tree.

---

## Commit Plan Summary

| Pattern | Count | Tasks |
|---|---|---|
| **Direct repo write** | 10 | SartorHeartbeat (heartbeat-log.csv), morning-briefing, personal-data-gather, gpu-utilization-check, self-improvement-loop, market-close-summary, nightly-memory-curation, weekly-financial-summary, weekly-nonprofit-review, weekly-skill-evolution |
| **Inbox pattern** | 0 | (Rocinante is the hub; inbox pattern is for non-hub machines writing into `sartor/memory/inbox/{host}/` for the curator to drain) |
| **Generated quarantine** | 0 | Rocinante has no gitignored log dir equivalent to gpuserver1's `/tmp/` logs |
| **Local only** | 0 | |
| **Needs migration** | 2 | todo-sync (orphaned in fs), wiki-reindex (orphaned in fs) |
| **Needs investigation** | 1 | budget-gate failure blocking everything |

### Direct Repo Write (10 tasks)

All registered Rocinante scheduled tasks write directly into tracked paths — `data/`, `reports/`, `sartor/memory/`, `docs/`. This is **correct for the hub machine**: Rocinante has GitHub credentials and is the authoritative writer per [[MULTI-MACHINE-MEMORY]]. Non-hub machines must use inbox pattern; Rocinante does not.

Target state: matches current design. No migration required once the budget-gate blocker is resolved.

### Needs Migration (2 tasks)

**todo-sync** and **wiki-reindex** exist as SKILL.md files but are not registered in `SCHEDULE_REGISTRY`. Either:
- **Option A**: add them to the registry with explicit cron expressions (`0 22 * * *` for wiki-reindex, `30 22 * * *` for todo-sync after it)
- **Option B**: delete the SKILL.md files and mark the tasks as retired

Recommendation: **Option A** — both tasks have substantive SKILL.md content and clear purpose. The registry needs to be kept in sync with the filesystem; an ongoing consistency check should flag any SKILL.md without a registry entry.

### Needs Investigation (1 blocker)

**budget-gate failure**: `data/heartbeat-log.csv` shows every tick since 2026-04-11 returning `budget-gate,skipped`. Root cause is unknown without reading `sartor/costs.py::check_budget()` and `sartor/costs.json`. This is P0 — it renders the entire scheduled-task system inoperative.

---

## Self-Management Cadence

### Heartbeat Monitoring

Rocinante's equivalent of gpuserver1's `~/sartor-heartbeat.json` is `data/heartbeat-log.csv`, which is append-only and committed to the repo. Every SartorHeartbeat tick writes a row regardless of whether any scheduled task actually ran. The budget gate itself writes `budget-gate,skipped` rows, which is how we know the dispatcher is alive but degraded.

Categories tracked in the CSV:
- `budget-gate` (every 30 min, expected)
- `morning-briefing` (daily, expected 6:30 AM)
- `personal-data-gather` (every 4h)
- `gpu-utilization-check` (every 4h)
- `self-improvement-loop` (every 6h)
- `nightly-memory-curation` (daily 11 PM)
- `market-close-summary` (weekdays 4:30 PM)
- `weekly-financial-summary` (Fri 6 PM)
- `weekly-nonprofit-review` (Sun 9 AM)
- `weekly-skill-evolution` (Sun 3 AM)

gpuserver1 pulls this CSV every 4h via `gather_mirror.sh` and can detect Rocinante staleness without SSH.

### Failure Detection

Current state: failures are written to the heartbeat CSV with `status=skipped` or `status=failed`. No escalation path — there is no inbox under `sartor/memory/inbox/rocinante/` because Rocinante is the hub and would be writing to its own inbox.

Target state: critical failures (budget-gate blocking all tasks for >4h, Windows Task returning non-zero for >2 consecutive runs) should write a YAML-fronted incident report to `sartor/memory/reference/incidents/` for Alton to surface in the next session.

### Escalation

Rocinante cannot "escalate to itself." Escalation is effectively: surface in the next interactive Claude Code session by writing to `docs/MEMORY.md` or `sartor/memory/feedback/`, which gets auto-injected at session start.

---

## Known Issues

### 1. Budget gate skipping every tick (P0)
**Symptom**: All heartbeat-log rows since 2026-04-11 show `budget-gate,skipped`
**Impact**: No scheduled Claude task has executed in recent history
**Root cause**: Unknown — needs inspection of `sartor/costs.py::check_budget()` and `sartor/costs.json`
**Resolution**: Read costs.py + costs.json, determine whether budget cap is misconfigured, daily spend is inflated, or the check itself is buggy

### 2. Windows Task Last Result = 1
**Symptom**: `schtasks /query /tn SartorHeartbeat /v` shows `Last Result: 1`
**Impact**: Windows believes each tick is failing, even though the CSV shows it runs
**Root cause**: Unknown — likely `heartbeat.py` is returning non-zero when budget-gated
**Resolution**: Make budget-gate skip a `return 0` (not a failure) so Windows Task Scheduler reports success

### 3. SartorHeartbeat is "Interactive only"
**Symptom**: `Logon Mode: Interactive only` — the task only runs when `alton` is logged in
**Impact**: If Rocinante is logged out (or the user session is locked for some task types), the heartbeat silently stops
**Resolution**: Re-register with `-RunLevel Highest` and a stored password, or switch to `SYSTEM` principal. **Requires Alton's explicit approval** (security posture change)

### 4. todo-sync and wiki-reindex orphaned
**Symptom**: SKILL.md files exist but are not in SCHEDULE_REGISTRY
**Impact**: These tasks never run
**Resolution**: Add entries to `sartor/scheduled_executor.py::SCHEDULE_REGISTRY` and commit. See Commit Plan Summary above.

### 5. self-improvement-loop SKILL.md not committed
**Symptom**: `??` in git status; file exists on disk but not tracked
**Impact**: Clean checkouts would fail; audit trail is broken
**Resolution**: Commit the SKILL.md in the next cleanup wave

### 6. No machines/rocinante/ directory before this document
**Symptom**: `sartor/memory/machines/` contained only `gpuserver1/` until this writeup
**Impact**: There was no canonical place for Rocinante-owned operational docs
**Resolution**: This document creates `sartor/memory/machines/rocinante/CRONS.md`. Future Rocinante-specific operational knowledge (MISSION, hardware inventory, post-mortems) should also live here.

---

## Open Questions

1. **Is the budget gate intentionally blocking all tasks, or is it a bug?** If costs.json shows a low daily cap that's easily exceeded, the tasks may be working as designed but over-budgeted. If the daily spend counter is stuck at a stale value from a prior session, it's a bug.

2. **Should Rocinante have an inbox for itself?** Per [[MULTI-MACHINE-MEMORY]], inbox is for non-hub machines writing to the hub. Rocinante is the hub, but for incident escalation (failures that need Alton's attention) a `sartor/memory/inbox/rocinante/alerts/` would let the next session surface problems via the normal curator drain instead of inventing a new path.

3. **Should scheduled tasks inherit the SartorHeartbeat "Interactive only" limitation, or should they run as SYSTEM?** Running as SYSTEM breaks the user-context assumption in MCP tools (Gmail/Calendar OAuth tokens are per-user). Leaving as interactive-only makes the system fragile when Alton locks the screen.

4. **Should Rocinante run self-improvement-loop, or is that a gpuserver1 responsibility?** gpuserver1's MISSION mentions local-LLM log analysis. There may be redundancy between `self-improvement-loop` on Rocinante (Claude-driven) and `sartor-evolve.sh` on gpuserver1 (local-LLM-driven).

5. **Where should the rocinante-side equivalent of `~/sartor-heartbeat.json` live?** gpuserver1 has a single JSON file with last-run timestamps for 5 P0 categories. Rocinante's `data/heartbeat-log.csv` is more granular but harder to parse for staleness. A parsed `data/rocinante-heartbeat.json` would mirror the gpuserver1 pattern.

6. **What is the relationship between SartorHeartbeat and `.claude/scheduled-tasks/`?** The SKILL.md files are written as if they'll be invoked by Claude Code directly (they contain natural-language instructions), but `scheduled_executor.py` is a Python dispatcher. Is there a missing adapter that actually launches a Claude Code session per dispatched task? If yes, where does that adapter live, and is it working? (The absence of any `reports/daily/*-morning-briefing.md` dated after 2026-04-03 suggests the pipeline is broken end-to-end, not just budget-gated.)

7. **Dispatch target for Claude Code sessions**: `heartbeat.py` has an `execute_task()` function but I have not confirmed whether it spawns `claude-code` as a subprocess with the SKILL.md content piped in, or whether it's a no-op. This is the highest-value open question — it determines whether fixing the budget gate would actually restore the system or whether a deeper rewrite is needed.

---

## Maintenance Notes

**This file is authoritative for Rocinante scheduled-task operations.** When adding, modifying, or removing tasks:

1. Update this file first (bump `updated:` frontmatter)
2. Update `sartor/scheduled_executor.py::SCHEDULE_REGISTRY` if adding/removing a dispatched task
3. Update `sartor/create-heartbeat-task.ps1` if changing the OS-level trigger
4. Re-run `schtasks /query /tn SartorHeartbeat /v` to verify state
5. Commit the changes (Rocinante has credentials; no inbox drain required)

**Last full audit**: 2026-04-12 (this document creation)
**Next audit due**: 2026-05-12 (monthly cadence, mirroring gpuserver1)

---

## Appendix: Relationship to gpuserver1's CRONS.md

gpuserver1 runs 15 independent cron entries, each a separate shell script. Rocinante runs 1 OS-level trigger that dispatches 9 cron-style registry entries, each a Claude-skill prompt. The two machines are structurally dissimilar:

| Axis | gpuserver1 | Rocinante |
|---|---|---|
| Scheduler | cron (Linux) | Task Scheduler (Windows) |
| Trigger count | 15 entries | 1 entry |
| Task language | bash + Python | Claude skill prompts (markdown) |
| Runtime | crontab-launched subshells | Single Python dispatcher |
| Hub role | Non-hub (writes to inbox) | Hub (writes directly) |
| Git credentials | None (cannot push) | Full (pushes from here) |
| Failure escalation | Local logs + inbox | heartbeat-log CSV + next session injection |
| Observable from gpuserver1 | N/A | heartbeat-log.csv (pulled every 4h) |
| Observable from Rocinante | heartbeat-log.csv (pushed every 4h) | Local only |

The two machines communicate via `data/heartbeat-log.csv` as a shared bulletin board. Either side can detect the other's staleness by reading this CSV. Rocinante's registry-driven architecture is more maintainable but has a single point of failure (the dispatcher). gpuserver1's per-cron architecture is more resilient but harder to document and audit — which is why gpuserver1's CRONS.md is longer.
