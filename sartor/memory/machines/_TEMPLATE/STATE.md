---
name: machine-state-template
description: Template for per-machine STATE.md — live diagnostics overwritten by the self-steward agent on each run. Replace placeholders with actual values when initializing a new peer machine.
type: machine-state-template
hostname: REPLACE-HOSTNAME
last_run: null
last_run_by: null
volatility: high
tags: [meta/state, machine/REPLACE-HOSTNAME]
related: [machines/REPLACE-HOSTNAME/MISSION, machines/REPLACE-HOSTNAME/JOURNAL, machines/REPLACE-HOSTNAME/INDEX]
---

# {hostname} — current state

This file is overwritten on each self-steward run. For the audit trail of what changed when, see `JOURNAL.md`.

## Identity

| Field | Value |
|-------|-------|
| Hostname | REPLACE-HOSTNAME |
| Role | (see MISSION.md) |
| OS | REPLACE-OS-VERSION |
| Kernel | REPLACE-KERNEL |
| Uptime | REPLACE-UPTIME |
| Primary user | REPLACE-USER |
| Working dir | REPLACE-WORKDIR |
| Steward last ran | REPLACE-LAST-RUN-TS |

## Hardware

| Component | Value |
|-----------|-------|
| CPU | REPLACE-CPU |
| RAM | REPLACE-RAM-TOTAL |
| GPU 0 | REPLACE-GPU0-NAME (driver REPLACE-DRIVER, REPLACE-GPU0-TEMP°C, REPLACE-GPU0-MEM-USED of REPLACE-GPU0-MEM-TOTAL) |
| GPU 1 | (if present) |

## Storage

| Mount | Used / Total | Free |
|-------|--------------|------|
| / | REPLACE-ROOT-USED of REPLACE-ROOT-TOTAL | REPLACE-ROOT-FREE |
| /home | (if separate) | |

## Services running (top 30)

```
REPLACE-SERVICES-LIST
```

## Scheduled tasks

| Task | Cadence | Last fired | Status |
|------|---------|------------|--------|
| (per CRONS.md, or detected from `crontab -l` / `systemctl list-timers`) | | | |

## Rentals (where applicable)

| Service | State |
|---------|-------|
| vast.ai (gpuserver1 only) | (occupancy, reliability, current rate) |

## Recent errors (last 6h, ERR priority)

```
(tail from journalctl --priority=err --since="-6 hours")
```

## Anomalies flagged this run

(populated by the self-steward; if empty, the line "no surprises" is the right contents)

## Notes

(free-form notes the steward chose to record this run)
