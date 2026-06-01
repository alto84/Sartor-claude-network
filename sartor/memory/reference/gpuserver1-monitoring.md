---
type: reference
entity: gpuserver1-monitoring
updated: 2026-06-01
updated_by: Claude
status: retired
tags: [domain/gpu-business, domain/infra, meta/architecture]
aliases: [gpuserver1 monitoring, Claude Code monitoring loop, sartor-monitoring]
related: [gpuserver1-delegation, MULTI-MACHINE-MEMORY, MACHINES, BUSINESS]
---

# gpuserver1 Recurring Monitoring System

> **RETIRED 2026-06-01.** This Claude-driven 2-hour sweep is permanently retired (dormant since 2026-04-12; formally retired by Alton on 2026-06-01). Superseded by `fleet-node-monitor.sh` — a systemd-user timer running every 5 min on both hosts, emitting structured NDJSON with correct rental semantics (`current_rentals_running`, never misreads a running `C.*` as orphaned), graded health, P1/P2 inbox alerts, at zero per-run cost. The crontab line has been removed; the artifacts are archived on gpuserver1 at `~/sartor-monitoring.retired/` with a tombstone. This document is retained for historical rationale only. **Do not revive** — if a narrative digest is ever wanted, build a deterministic daily rollup over `sartor/memory/fleet-log/*.ndjson` instead of an unattended LLM sweep. Everything below describes the system as it operated 2026-04-11 → 2026-04-12.

Claude Code-driven health monitoring for the GPU hosting business. Designed to run every 2 hours on gpuserver1 (dormant since 2026-04-12 — the `run_monitor.sh` cron was commented out in the EX-5 consolidation and the sweep folded into the host-local `fleet-node-monitor` systemd timer; re-enable per the Cron section if a narrative Claude sweep is wanted again). Emits a narrative report to the inbox, no git credentials required on the server.

> **Rental detection — read this before triaging containers.** A running Docker container named `C.<instance_id>` is an *active paying customer rental*, not an orphan. `vastai show instances` lists client-side rentals only and is ALWAYS empty on this host; an empty result does NOT mean the machine is idle. The authoritative host-side check is `docker ps --format '{{.Names}}' | grep '^C\.'`. A `C.*` container often holds a live `ssh*.vast.ai` reverse tunnel and a running workload even when the GPU reads 0% between jobs. Never call a `C.*` container "orphaned" and never recommend killing one. `C.34113802` is the active reserved contract through 2026-08-24.

## Architecture

```
cron (every 2h at :00)
  -> /home/alton/sartor-monitoring/run_monitor.sh
       -> flock (non-blocking)
       -> timeout 600s
       -> claude --print --model sonnet --dangerously-skip-permissions \
                 --allowed-tools "Bash,Read,Write,Edit,Glob,Grep,Task" \
                 < monitor_brief.md
       -> writes report to inbox/gpuserver1/monitoring/YYYY-MM-DD_HHMM_monitor.md
  -> logs to sartor-monitoring/logs/run_<ts>.log (30-day retention)

Rocinante curator (separate schedule)
  -> drains inbox -> commits -> pushes to GitHub
```

Design choices:

- **Claude Code, not a bash script.** The agent can triage anomalies, spawn a subagent for investigation, and write narrative prose a human can skim in the morning. A dumb script can't do that.
- **Sonnet for the outer run, Haiku for any spawned investigator.** Never Opus. Sonnet at ~5k input + 3k output per run is sustainable.
- **Additive to the existing `vastai-tend.sh`.** The old script is untouched. It keeps writing to `~/.vastai-alert` at `:30` even hours. This new system runs at `:00` even hours and reads the alert file as one of several inputs.
- **No git on gpuserver1.** Reports land in the inbox; Rocinante's curator is the only git authority. There is already a `0 */4` cron on gpuserver1 that does `git pull --quiet` — we rely on that to keep the repo fresh but never push.
- **Single-session stateless runs.** Each invocation reads the brief and exits. No conversation history. All context is in the brief file.

## File layout

### On gpuserver1

| Path | Purpose |
|------|---------|
| `/home/alton/sartor-monitoring/monitor_brief.md` | The prompt fed to `claude -p`. Edit this to change what gets monitored. |
| `/home/alton/sartor-monitoring/run_monitor.sh` | Runner script invoked by cron. Handles lockfile, timeout, log rotation. |
| `/home/alton/sartor-monitoring/logs/run_<UTC-ts>.log` | Per-run stdout/stderr log. Pruned at 30 days. |
| `/home/alton/sartor-monitoring/logs/skipped.log` | Appended when flock detected a running job. Truncated at 1 MB. |
| `/home/alton/sartor-monitoring/run.lock` | flock file. Safe to delete if stale (no running job). |

### Report destination (both machines)

`/home/alton/Sartor-claude-network/sartor/memory/inbox/gpuserver1/monitoring/<YYYY-MM-DD>_<HHMM>_monitor.md`

On Rocinante this appears as:
`C:\Users\alto8\Sartor-claude-network\sartor\memory\inbox\gpuserver1\monitoring\<YYYY-MM-DD>_<HHMM>_monitor.md`

Timestamps are UTC. The curator drains these, moves them to `_processed/`, commits, and pushes.

## Cron entry

```
0 */2 * * * /home/alton/sartor-monitoring/run_monitor.sh
```

Installed in `alton`'s user crontab on gpuserver1 with comment `# Sartor monitoring: recurring Claude Code health sweep (installed 2026-04-11)`.

## How to modify the monitoring brief

SSH in and edit directly:

```bash
ssh alton@192.168.1.100 "nano /home/alton/sartor-monitoring/monitor_brief.md"
```

The brief is the full prompt. It defines:

1. The commands Claude should run (vastai, nvidia-smi, df, docker, uptime)
2. The anomaly criteria that trigger subagent spawning
3. The report format (frontmatter, snapshot table, status indicators, anomaly narrative)
4. Hard rules (no git, no kills, model sonnet for self / haiku for subagents)
5. ~~A first-run-only investigation hook (used for the C.34113802 "mystery" container)~~ — REMOVED 2026-05-31: it hardcoded a false "orphaned" framing for `C.34113802`, which is in fact the active reserved rental through 2026-08-24. See the rental-detection callout near the top.

After editing, the next scheduled run picks up the new brief. No restart needed.

## How to pause or disable

Comment out the cron line:

```bash
ssh alton@192.168.1.100 "crontab -l > /tmp/cron.bak && crontab -l | sed 's|^0 \*/2 \* \* \* /home/alton/sartor-monitoring/run_monitor.sh|# &|' | crontab -"
```

To re-enable, edit the crontab and remove the `# ` prefix. Or to remove entirely:

```bash
ssh alton@192.168.1.100 "crontab -l | grep -v '/home/alton/sartor-monitoring/run_monitor.sh' | crontab -"
```

A manual run, outside cron:

```bash
ssh alton@192.168.1.100 "/home/alton/sartor-monitoring/run_monitor.sh"
```

## Cost expectations

Empirically, the first test run produced a dense ~4 KB report including a full first-run investigation of an orphaned container. Run wall time: ~90 seconds.

Back-of-envelope budget:

| Item | Value |
|------|-------|
| Model | Sonnet 4.x |
| Runs per day | 12 (every 2h) |
| Target input tokens/run | ~5k |
| Target output tokens/run | ~3k |
| Approx $/run | ~$0.02-0.05 (varies by pricing tier) |
| Approx $/day | ~$0.30-0.60 |
| Approx $/month | ~$10-20 |

Anomaly runs that spawn a Haiku subagent add ~$0.01. If costs spike unexpectedly, check `sartor-monitoring/logs/run_*.log` for runaway loops or check whether Sonnet got swapped for Opus in the runner.

The runner has a 10-minute hard timeout (`timeout 600s`). Any single run that hits that ceiling indicates a stuck Claude session — investigate the log and consider tightening the brief.

## How to read the reports

The reports land in `sartor/memory/inbox/gpuserver1/monitoring/` on both machines. Read them newest-first. Each has:

- **Summary line** — leads with `HEALTHY` / `WARNING` / `CRITICAL`
- **Snapshot table** — 10ish key metrics
- **Status indicators** — one line per subsystem
- **Anomalies** — only present if something tripped the investigator
- **Recommended actions** — only present if any

For a morning briefing, scan the latest 2-3 reports to confirm the machine is healthy and no new anomalies have appeared. If a `WARNING` or `CRITICAL` report shows up, read the Anomalies and Recommended Actions sections directly.

The curator will archive drained reports into `inbox/gpuserver1/_processed/YYYY-MM-DD/` — older runs stay queryable via git history even after archival.

## Known failure modes

| Failure | Symptom | Diagnosis | Recovery |
|---------|---------|-----------|----------|
| Claude session hangs | `timeout` kills it at 600s, rc != 0 in log | Check `run_<ts>.log` for last output | Tighten the brief, reduce tool allowlist, or reduce command list |
| Stale lockfile | `skipped.log` grows but no real run is in flight | Previous run exited without releasing lock (unlikely with `exec 9>`) | `rm /home/alton/sartor-monitoring/run.lock` |
| Claude auth expired | Runner exits immediately, log shows auth error | `~/.claude/.credentials.json` expired | Alton must SSH in and run `claude` interactively to re-login |
| Disk full in `/home/alton` | Writes fail, report not produced | `df -h /` | Prune `sartor-monitoring/logs/` or older monitoring reports |
| Repo in a conflicted state | `git pull` (from the other cron) stops working, canonical files stale | `cd ~/Sartor-claude-network && git status` | Resolve conflict manually or reset to `origin/main` |
| Runner exit 0 but no report | Log shows Claude ran but no file created | Claude Code decided not to write (check the log) | Read the log, adjust the brief to force Write |
| Inbox not drained | Reports pile up in `inbox/gpuserver1/monitoring/` | Curator not running on Rocinante | Check curator cron on Rocinante |
| Cost spike | API bill jumps | Check brief for accidental Opus, check log for subagent storm | Revert brief; cap subagent count (already 1/run) |

## Interaction with existing systems

- **vastai-tend.sh** (cron `30 */2`) — unchanged. Still writes to `~/.vastai-alert` and `~/.vastai-tend.log`. This monitor reads both.
- **gateway_cron.py** — DISABLED in the crontab since 2026-04-12 (JSON decode error, superseded). No longer runs; its `~/.sartor-cron.log` is frozen at Apr 12 and is NOT a live error source.
- **GATHER/EVOLVE/CONSOLIDATE mirrors** — unchanged. The `0 */4` gather mirror pulls the repo; this monitor relies on that fresh checkout.
- **memory-sync.sh** and **heartbeat-watcher.sh** — unchanged.

The monitor is strictly additive. It reads state, writes reports, does not touch any of the existing systems.

## Anomaly triage pattern

The brief defines six anomaly criteria. When any trip, the agent spawns ONE investigator subagent via the `Task` tool with `model: haiku`. The investigator reads logs, correlates events, and returns findings. The main agent quotes those findings verbatim in the report.

Design constraint: one subagent per run, max. This bounds cost. For complex multi-cause incidents, the agent writes a narrative summary and flags for human review rather than spawning multiple investigators.

## Future improvements

- **Daily rollup.** Add a separate cron at midnight UTC that reads the day's reports and writes a single daily summary. Useful for morning briefings.
- **Earnings integration.** If the vast.ai API ever exposes daily/weekly earnings cleanly, add it to the snapshot table.
- **Cross-reference with Rocinante.** The curator could flag when three consecutive reports are WARNING or CRITICAL — escalate to a top-level entry in the daily briefing.
- **Self-healing on known conditions.** E.g., if `.vastai-alert` has >100 stale entries, the agent could truncate it after logging. Currently disabled (hard rule: no side effects beyond writing the report).

## History

- 2026-04-11: Initial deployment. Tested end-to-end, first report flagged container C.34113802 as "orphaned" [CORRECTED 2026-05-31: it was never orphaned — it is the active reserved rental through 2026-08-24; the empty `vastai show instances` was misread as "no rental", see rental-detection callout], a pricing mismatch ($0.30 vs $0.40 target), a stale alert file (271 entries from April 3), and `gateway_cron.py` JSON parse errors. Cron installed at `0 */2`.
- 2026-05-31: Corrected the rental-detection logic in `monitor_brief.md` — removed the false "orphaned" first-run hook and rewrote anomaly criteria #4/#6 so they no longer rely on the host-side-blind `vastai show instances`. Separately fixed `vast_metrics.service` (missing exec bit on `launch_metrics_pusher.sh` had it in a ~91k-restart `Permission denied` loop) and confirmed `gateway_cron.py` has been disabled since 2026-04-12 (stale log, not a live error).
