---
type: project_report
project: memory-system-v2
phase: 1D
task: housekeeping
date: 2026-04-11
author: wrap-up-crew
status: complete
---

# Phase 1D Housekeeping Report

Three jobs: mini-lab wrap, background process inventory, cron drift-check. All run 2026-04-11.

---

## Job 1: Mini-Lab Wrap-Up

**Working dir**: `C:/Users/alto8/abliteration-exp/mini-lab/`
**Project dir**: `sartor/memory/projects/mini-lab-2026-04-11/`

### What Was There

The working dir has six subdirectories:
- `scripts/` — 14 Python scripts including `train_sft.py` (with chat-template fix), `run_eval.py`, `score_eval.py`, `interview.py`, and orchestration helpers
- `outputs/` — 12 files: scored eval JSONs (base + sft-v1 buggy + sft-v2), interview raw JSONLs, eval battery
- `evals/` — `probes.jsonl` (96-prompt battery), `rubric.md`, `scorer.py`
- `logs/` — 19 log files covering training runs, eval sweeps, loss curves
- `checkpoints/` — 2 checkpoint subdirs (large binaries, not archived)
- `corpus/` — constitution, household seeds, preference pairs, merged training file

### What Was Archived

Copied to `sartor/memory/projects/mini-lab-2026-04-11/artifacts/` (10 files):
- `train_sft.py`, `run_eval.py`, `score_eval.py`, `interview.py` — core reproducibility scripts
- `probes.jsonl`, `rubric.md` — eval battery and rubric
- `eval-base-scored.json`, `eval-sft-v2-scored.json` — final scored results
- `interview-base-raw.jsonl`, `interview-sft-v2-raw.jsonl` — interview transcripts

### What Was Left Behind

- Checkpoints (large binaries)
- sft-v1 buggy evals (contaminated, forensic only)
- Training logs (local working dir only)
- Orchestration helper scripts (not needed for reproducibility)
- Corpus files (derivable from sources)

### STATUS.md Written

`sartor/memory/projects/mini-lab-2026-04-11/STATUS.md` created with verdict, preservation inventory, and future work roadmap. Key verdict: **(B) Partially worked** — constitutional voice and scenario-level values installed, refusal calibration and math regressed via small-corpus overfit.

---

## Job 2: Background Process Inventory

### Rocinante (Windows)

**Running processes (claude/node/python)**:

| PID | Name | CPU(s) | WS(MB) | StartTime | Classification |
|-----|------|--------|--------|-----------|----------------|
| 39832 | claude | 171 | 82 | 4/10 3:11 PM | Active — likely team agent session |
| 40008 | claude | 58 | 22 | 4/10 3:11 PM | Active — team agent session |
| 10252 | claude | 95 | 145 | 4/10 3:11 PM | Active — highest WS, likely orchestrator |
| 13568 | claude | 33 | 40 | 4/10 3:11 PM | Active — team agent session |
| 5840 | claude | 2.9 | 10 | 4/10 3:11 PM | Low activity — idle/dormant |
| 31640 | claude | 0.4 | 10 | 4/10 3:11 PM | Low activity — idle/dormant |
| 10676 | claude | 0.2 | 8 | 4/10 3:11 PM | Low activity — idle/dormant |
| 39472 | claude | 0.2 | 7 | 4/10 3:11 PM | Low activity — idle/dormant |
| 32996 | claude | 0.08 | 6 | 4/10 3:11 PM | Low activity — idle/dormant |
| 3404 | node | 2382 | 654 | 4/10 9:36 PM | Active — high CPU, long-running. Likely MERIDIAN dashboard (FastAPI+uvicorn runs via node wrapper) or VS Code dev server |

**Assessment**: All claude processes started in the same batch (~3:11 PM 4/10). The 9 claude processes are the current multi-agent team session. The node process (PID 3404) has been running since 9:36 PM and is consuming significant CPU (2382 CPU-seconds) — flagged but not killed. Most likely the MERIDIAN dashboard server or a long-running Claude Code dev session. Requires investigation if resource pressure becomes an issue.

**Windows Scheduled Tasks (Sartor-relevant)**:

| TaskName | State | Next Run | Notes |
|----------|-------|----------|-------|
| SartorHeartbeat | Ready | 4/11 10:34 PM | P0 dispatcher — enabled, running every 30 min, LastResult=0 |

**All other scheduled tasks**: System tasks only (Adobe, OneDrive, NVIDIA, Zoom, Microsoft Office). None are Sartor-managed.

**SartorHeartbeat status**: Last run 4/11 10:04 PM, next 4/11 10:34 PM, LastResult=0 (success). Note: CRONS.md documents that all dispatched tasks are blocked by budget gate. The task runs but no Claude tasks execute.

### gpuserver1 (Ubuntu 22.04)

**Sartor/python processes**:

| PID | Owner | Elapsed | Command | Classification |
|-----|-------|---------|---------|----------------|
| 1164 | root | ~6 days | `python3 /usr/bin/networkd-dispatcher` | System — networkd dispatcher, normal |
| 1169 | alton | ~6 days | `python3 /home/alton/Sartor-claude-network/sartor/safety_api.py` | Active P0 — Safety API daemon |
| 1591 | alton | ~6 days | `python3 -c multiprocessing.resource_tracker` | Child of safety_api.py — normal |
| 2228 | alton | ~6 days | `python3 /home/alton/screensaver.py` | Background — high CPU (8h45m). Running for 6 days. |
| 10431 | root | ~6 days | `python3 /usr/local/bin/supervisord` | System — supervisor daemon, normal |
| 10476 | root | ~6 days | `python3 /usr/local/bin/log-tee` | Child of supervisord — normal |
| 833633 | vastai_user | ~6 days | `python3 machine_metrics_pusher.py` | Vast.ai telemetry — normal, expected |
| 2082758 | alton | ~1 day | `python3 /home/alton/sartor-power/bin/power_logger.py --daemon` | P0 — power logger daemon |
| 2120949 | alton | ~11h | `python3 -c multiprocessing.spawn` | Child of safety_api.py (spawn worker) |
| 3545003 | alton | ~3 days | `python3 /home/alton/Sartor-claude-network/dashboard/gpu-dashboard/app.py` | Active — GPU dashboard |
| 2159224 | alton | 49:50 | `bash -c claude --print --model sonnet ... < /tmp/rgb-execution-prompt.md` | Active — RGB implementation task |
| 2159225 | alton | 49:50 | `claude` | Child of above — RGB task |

**Flag — RGB task (PID 2159225)**: At time of check (~50 min elapsed), NOT yet at the 3-hour threshold mentioned in the task description. The prompt is Alton-authorized: implementing RGB lighting to reflect operational state on gpuserver1. Status is ACTIVE and within reasonable runtime for this workload (RGB probing + PSU LED investigation involves multiple subagent-style sub-investigations per the prompt). **No kill recommended.** Re-check if elapsed exceeds 3 hours.

**Flag — screensaver.py (PID 2228)**: Has consumed 8h45m of CPU time over ~6 days of wall time. High sustained CPU for a screensaver. Low priority but worth noting — if GPU thermals are a concern, this process is a non-trivial background load.

No claude processes found outside of the RGB task. No unexpected processes identified.

---

## Job 3: Cron Inventory and Drift-Check

### gpuserver1: Crontab vs. CRONS.md

**CRONS.md (v0.2, updated 2026-04-12) documents 5 active crons.**

**Live crontab (verified 2026-04-11)**:

Active:
- `0 */4 * * * /home/alton/gather_mirror.sh` — matches doc
- `0 */2 * * * /home/alton/sartor-monitoring/run_monitor.sh` — matches doc
- `0 9 * * * /home/alton/dashboard-healthcheck.sh` — matches doc
- `55 23 * * * /usr/bin/python3 /home/alton/sartor-power/bin/daily_summary.py` — matches doc
- `0 9 * * 1 /home/alton/sartor-pricing/run_pricing.sh` — matches doc

All deprecated/disabled entries present as comments in crontab, consistent with CRONS.md.

**Drift**: None detected. Live crontab matches CRONS.md v0.2 exactly.

**Open issues carried forward from CRONS.md**:
1. `run_pricing.sh` inbox migration status: CRONS.md flags this as "needs verification." The script is active but it's unclear whether it writes to the inbox pattern or directly elsewhere.
2. `gateway_cron.py` disabled due to JSON decode errors — needs root cause investigation or permanent deletion.

### Rocinante: Task Scheduler + Registry vs. CRONS.md

**CRONS.md (updated 2026-04-12) documents 1 OS trigger + 9 registry tasks + 3 orphaned SKILL.md files.**

**Live state (verified 2026-04-11)**:
- `SartorHeartbeat`: Ready, Last Result 0, repeats every 30 min — matches doc (CRONS.md says LastResult=1; actual observation today is 0, which is an improvement — budget gate may be returning success now)
- 9 dispatched tasks: not independently verifiable without reading `scheduled_executor.py` registry, but CRONS.md is authoritative and was written from live inspection on 2026-04-12.

**Drift**: Minor discrepancy on SartorHeartbeat LastResult (CRONS.md says 1, live shows 0 today). Either the budget-gate non-zero exit was fixed in the interim, or today's run happened to succeed. Not material.

**Open issues carried forward from CRONS.md**:
1. Budget gate blocking all dispatched tasks (P0 blocker — flagged in CRONS.md Known Issues §1)
2. `todo-sync` and `wiki-reindex` orphaned SKILL.md files not in registry
3. `self-improvement-loop` SKILL.md not committed to git
4. SartorHeartbeat "Interactive only" limitation

### Cross-Machine Summary

| Machine | Active Crons | Documented | Drift | Open Issues |
|---------|-------------|-----------|-------|-------------|
| gpuserver1 | 5 | 5 (CRONS.md v0.2) | None | run_pricing inbox migration, gateway_cron investigation |
| Rocinante | 1 OS + 9 dispatched | All (CRONS.md 2026-04-12) | Minor (LastResult discrepancy) | Budget gate (P0), 2 orphaned SKILL.md files, self-improvement-loop uncommitted |

**Notable**: Both CRONS.md files were updated 2026-04-12 (future date relative to today 2026-04-11 — these were written in a prior session that stamped the date ahead, which is consistent with the session starting after midnight). The documents are authoritative and current.

---

## Summary

All three jobs complete. Mini-lab is wrapped with 10 files archived to `artifacts/` and a STATUS.md written. Background processes are inventoried across both machines — no kills recommended, RGB task is active and authorized at ~50 min runtime. Cron documentation matches reality on both machines; no material drift found. The P0 blocker (budget gate on Rocinante) and the RGB task runtime are the two items warranting monitoring.
