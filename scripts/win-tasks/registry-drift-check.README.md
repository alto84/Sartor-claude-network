---
name: registry-drift-check-task-spec
description: Registration runbook for the Sartor Registry Drift Check Windows Scheduled Task. Spec, not yet registered. Awaiting Alton greenlight.
type: scheduled-task-spec
status: pending-greenlight
created: 2026-05-09
created_by: Rocinante Opus 4.7 (Tier 4 IP-graceful-reassignment build)
---

# Sartor Registry Drift Check - registration runbook

## What it does

Tier 4 of the IP-graceful-reassignment architecture. Every 4 hours, walks `sartor/memory/machines/REGISTRY.yaml`, pings each machine's `current_ip`, attempts SSH liveness on declared `ssh_path`, classifies OK / STALE / UNREACHABLE, writes a dated drift report to `sartor/memory/inbox/rocinante/registry-drift-<UTC>.md`, updates `last_verified` for OK machines, and exits non-zero on any drift so a cron failure surfaces in Task Scheduler's `LastTaskResult`.

## Files

| Layer | Path |
|---|---|
| Wrapper | `scripts/win-tasks/registry-drift-check.cmd` |
| Detector | `sartor/memory/machines/check-registry.py` |
| Source of truth | `sartor/memory/machines/REGISTRY.yaml` |
| Hidden-window shim | `scripts/win-tasks/run-hidden.vbs` |
| Log | `C:\Users\alto8\backups\registry-drift-check.log` |
| Output | `sartor/memory/inbox/rocinante/registry-drift-<UTC>.md` |

## Verification before registration

Run the detector by hand and confirm it exits 0 against the live fleet.

```powershell
& "C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\sartor\memory\machines\check-registry.py" --no-write-back --no-report
```

Expected output (3 OK, exit code 0):

```
rocinante          192.168.1.171      OK           ping=...
gpuserver1         192.168.1.100      OK           ping=...
rtxserver          192.168.1.157      OK           ping=...

OK: all machines reachable
```

If anything is STALE or UNREACHABLE, fix REGISTRY.yaml (`current_ip`, `ssh_path`, etc.) before registering the task; otherwise it will alert on first run.

## Registration (PowerShell, no admin needed)

```powershell
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument '"C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs" "C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\registry-drift-check.cmd"'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(15) -RepetitionInterval (New-TimeSpan -Hours 4)
$settings = New-ScheduledTaskSettingsSet -Hidden -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'Sartor Registry Drift Check' -Action $action -Trigger $trigger -Settings $settings -RunLevel Limited
```

## Verification after registration

```powershell
Get-ScheduledTask -TaskName 'Sartor Registry Drift Check' | Get-ScheduledTaskInfo
Start-ScheduledTask -TaskName 'Sartor Registry Drift Check'
Start-Sleep -Seconds 30
Get-ScheduledTask -TaskName 'Sartor Registry Drift Check' | Get-ScheduledTaskInfo | Select TaskName, LastRunTime, LastTaskResult, NumberOfMissedRuns
Get-ChildItem 'C:\Users\alto8\Sartor-claude-network\sartor\memory\inbox\rocinante\registry-drift-*.md' | Sort LastWriteTime -Descending | Select -First 1
```

Expect `LastTaskResult = 0` (or `1` if a real drift is happening, which itself is the value the task delivers) and a fresh report file in inbox.

## Behavior on drift

- **STALE** (ping OK, ssh fails): possible IP collision with another device, sshd is down, or auth/keys broke. The drift report includes specifics in stderr.
- **UNREACHABLE** (ping fails): host is off, IP changed, NIC swap, or switch-port move. Update `REGISTRY.yaml` `current_ip` to the new value; re-run by hand to clear.

The task exits non-zero on any drift, which means `LastTaskResult` becomes the canonical at-a-glance signal in Task Scheduler. Pair with the daily-household-health skill if you want a higher-level alert path on top.

## Notes

- The convention (wrapper through `run-hidden.vbs` so no console flashes) is documented in `sartor/memory/reference_scheduled_tasks.md` "Adding a new Windows Scheduled Task" section.
- Add a row to that file's table when the task is actually registered (currently flagged as "spec only - not yet registered" in the table).
- This task does NOT auto-update REGISTRY.yaml `current_ip` on UNREACHABLE - that is a manual decision (could be a transient outage, not a real reassignment). The future Tier-2 codebase sweep is also a separate manual step.
