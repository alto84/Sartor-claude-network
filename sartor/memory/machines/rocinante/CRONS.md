---
type: machine_operations
entity: rocinante-crons
updated: 2026-04-12
updated_by: cron-cleaner (memory-system-v2 EX-11)
status: active
version: 0.2
last_verified: 2026-04-12
related: [gpuserver1-crons, OPERATING-AGREEMENT, MULTI-MACHINE-MEMORY]
---

# Rocinante Cron Documentation v0.2

Target state per master-plan §5.1: exactly 3 active Windows Scheduled Tasks on Rocinante. Current state: 1 active (SartorHeartbeat), 3 new tasks with XMLs written but not yet installed, 9 budget-gated old dispatched tasks pending deprecation.

This document is authoritative for all Rocinante scheduled-work operations. Last verified: 2026-04-12 (EX-11).

---

## Target State (master-plan §5.1)

Three Windows Scheduled Tasks on Rocinante:

| Task name | Schedule | Status |
|---|---|---|
| SartorCuratorPass | 07:30 + 19:30 daily | XML written — pending install |
| SartorConversationExtract | 23:30 daily | XML written — pending install |
| SartorImprovementLoop | Sunday 20:00 | XML written — pending install |

**Total active after install**: 3
**6-cron network total**: gpuserver1 (3 active) + Rocinante (3 after install) = 6

---

## Current State (2026-04-12)

### Active Windows Scheduled Tasks

#### SartorHeartbeat
**Schedule**: Every 30 minutes (one-time trigger with 30-min repetition, started 2026-04-03 15:34)
**Command**: `pythonw C:\Users\alto8\Sartor-claude-network\sartor\heartbeat.py`
**Working dir**: Not set
**Run as**: `alton` (interactive only)
**State**: `Ready` (confirmed via `Get-ScheduledTask` 2026-04-12 EX-11)
**Status**: ACTIVE but to be REMOVED per master-plan §5.2 — the old dispatcher model is superseded by the 3 direct-task XMLs
**Log**: `data/heartbeat-log.csv` (append-only)
**Removal command** (run as Alton after 3 new tasks are installed and verified):
```powershell
Unregister-ScheduledTask -TaskName "SartorHeartbeat" -Confirm:$false
```

---

## New Tasks (XML Written — Pending Install)

All three XMLs live at `C:\Users\alto8\Sartor-claude-network\scripts\`. Install with:
```powershell
Register-ScheduledTask -Xml (Get-Content "scripts\<xml-file>" -Raw) -TaskName "<TaskName>"
```

### 1. SartorCuratorPass
**XML**: `scripts/curator-pass-task.xml`
**Schedule**: Daily at 07:30 and 19:30
**Command**: `scripts\curator-pass-run.cmd` (working dir: `C:\Users\alto8\Sartor-claude-network`)
**Purpose**: Drains multi-machine memory inbox, writes receipts. See `sartor/curator_pass.py` and master-plan §5.1 cron #4.
**Status**: XML present. `scripts\curator-pass-run.cmd` NOT YET WRITTEN — install blocked until .cmd exists.
**Log**: TBD — will be defined in `curator-pass-run.cmd`
**Install command**:
```powershell
Register-ScheduledTask -Xml (Get-Content "scripts\curator-pass-task.xml" -Raw) -TaskName "SartorCuratorPass"
```

### 2. SartorConversationExtract
**XML**: `scripts/conversation-extract-task.xml`
**Schedule**: Daily at 23:30
**Command**: `C:\Python313\python.exe -m sartor.conversation_extract -v` (working dir: `C:\Users\alto8\Sartor-claude-network`)
**Purpose**: Scans Claude Code session JSONLs, extracts fact candidates, writes curator-compatible inbox proposals.
**Status**: XML present. `sartor/conversation_extract.py` must exist as a module before install is meaningful.
**Log**: TBD — defined by `sartor/conversation_extract.py` `-v` verbose output (likely stderr/stdout; needs redirect in XML or wrapper)
**Install command**:
```powershell
Register-ScheduledTask -Xml (Get-Content "scripts\conversation-extract-task.xml" -Raw) -TaskName "SartorConversationExtract"
```

### 3. SartorImprovementLoop
**XML**: `scripts/improvement-loop-task.xml`
**Schedule**: Weekly, Sunday at 20:00
**Command**: `scripts\improvement-loop-run.cmd` (working dir: `C:\Users\alto8\Sartor-claude-network`)
**Purpose**: Weekly self-detection, proposal writing, snapshot. See `sartor/improvement_loop.py` and master-plan §10 + §13 EX-10.
**Status**: XML present. `scripts\improvement-loop-run.cmd` NOT YET WRITTEN — install blocked until .cmd exists.
**Log**: TBD — will be defined in `improvement-loop-run.cmd`
**Install command**:
```powershell
Register-ScheduledTask -Xml (Get-Content "scripts\improvement-loop-task.xml" -Raw) -TaskName "SartorImprovementLoop"
```

---

## Deprecated Tasks (SartorHeartbeat Dispatch Registry)

The 9 tasks below were registered in `sartor/scheduled_executor.py::SCHEDULE_REGISTRY` and dispatched by SartorHeartbeat. As of 2026-04-12, **every tick since 2026-04-11 has hit `budget-gate,skipped`** — none has executed in recent history. These are superseded by the direct-task architecture above and should be removed when SartorHeartbeat is unregistered.

| Task | Schedule | Status |
|---|---|---|
| `morning-briefing` | daily 06:30 | DEPRECATED — budget-gate blocking |
| `personal-data-gather` | every 4h | DEPRECATED — budget-gate blocking |
| `gpu-utilization-check` | every 4h | DEPRECATED — budget-gate blocking |
| `self-improvement-loop` | every 6h | DEPRECATED — replaced by SartorImprovementLoop |
| `market-close-summary` | weekdays 16:30 | DEPRECATED — budget-gate blocking |
| `nightly-memory-curation` | daily 23:00 | DEPRECATED — replaced by SartorCuratorPass |
| `weekly-financial-summary` | Fri 18:00 | DEPRECATED — budget-gate blocking |
| `weekly-nonprofit-review` | Sun 09:00 | DEPRECATED — budget-gate blocking |
| `weekly-skill-evolution` | Sun 03:00 | DEPRECATED — budget-gate blocking |

SKILL.md files for these tasks remain at `.claude/scheduled-tasks/<name>/SKILL.md`. Do NOT delete them — they contain useful prompt content that may be repurposed. Mark registry entries as inactive when SartorHeartbeat is removed.

---

## Dead Tasks (to remove from Task Scheduler)

Per master-plan §5.2, Alton must run the following PowerShell commands to clean the deprecated OS-level task. The 9 dispatched tasks above live only in the Python registry, not as separate Windows tasks, so no additional Unregister calls are needed for them.

```powershell
# Remove legacy dispatcher (run AFTER verifying the 3 new tasks are running)
Unregister-ScheduledTask -TaskName "SartorHeartbeat" -Confirm:$false
```

Verify remaining tasks after removal:
```powershell
Get-ScheduledTask | Where-Object { $_.TaskName -match "Sartor" } | Select-Object TaskName, State
# Expected: SartorCuratorPass (Ready), SartorConversationExtract (Ready), SartorImprovementLoop (Ready)
```

---

## Blocking Issues Before Install

1. `scripts\curator-pass-run.cmd` does not exist. SartorCuratorPass XML references it.
2. `scripts\improvement-loop-run.cmd` does not exist. SartorImprovementLoop XML references it.
3. `sartor/curator_pass.py` does not exist as a module in the repo (EX-4 output; verify).
4. `sartor/conversation_extract.py` does not exist as a module (EX-7 output; verify).
5. `sartor/improvement_loop.py` does not exist as a module (EX-10 output; verify).

These should be resolved in the next execution wave before Alton installs the tasks.

---

## Log Paths

| Task | Log path | Format | Notes |
|---|---|---|---|
| SartorCuratorPass | TBD (in curator-pass-run.cmd) | plaintext or md+fm | Will redirect to `generated/cron-logs/curator-pass.log` by convention |
| SartorConversationExtract | TBD (stderr of python -m sartor.conversation_extract) | plaintext | Needs redirect added to XML or .cmd wrapper |
| SartorImprovementLoop | TBD (in improvement-loop-run.cmd) | plaintext or md+fm | Will redirect to `generated/cron-logs/improvement-loop.log` by convention |
| SartorHeartbeat | `data/heartbeat-log.csv` | CSV | Append-only; remains useful historical record after task removal |

---

## Maintenance Notes

**This file is authoritative for Rocinante scheduled-task operations.** When adding, modifying, or removing tasks:

1. Update this file first (bump `updated:` frontmatter and `version:`)
2. Write install/uninstall commands in this file before executing them
3. Commit the change to git (Rocinante has credentials; no inbox drain required)
4. Then run the PowerShell commands

**Last full audit**: 2026-04-12 (EX-11 verification — 1 active task found, 3 XMLs confirmed present)
**Next audit due**: 2026-05-12 (monthly cadence)

---

## Appendix: Relationship to gpuserver1

| Axis | gpuserver1 | Rocinante (target) |
|---|---|---|
| Scheduler | cron (Linux) | Task Scheduler (Windows) |
| Active task count | 3 | 3 (after install) |
| Task language | bash shell scripts | Python scripts + .cmd wrappers |
| Hub role | Non-hub (writes to inbox) | Hub (writes directly) |
| Git credentials | None | Full (pushes from here) |
