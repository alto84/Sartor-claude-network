---
title: Sartor WiFi Health Monitor — Windows Scheduled Task Runbook
status: pending-greenlight
created: 2026-05-09
updated: 2026-05-09
---

# Sartor WiFi Health Monitor — Runbook

This file is the operational runbook for the `Sartor WiFi Health Monitor` Windows Scheduled Task.
For architecture context, see `sartor/memory/reference_scheduled_tasks.md` and the skill `/network-management`.

## What it does

Every 15 minutes, runs `sartor/memory/wifi/wifi-health-monitor.py` via `scripts/win-tasks/wifi-health-monitor.cmd`.
The monitor:
1. Reads `sartor/memory/wifi/CLIENT-PRIORITIES.yaml` to know each client's priority tier.
2. Authenticates to the UniFi controller at `https://192.168.1.171:8443` (read-only `/stat` endpoints).
3. Surveys every wireless client and every AP radio.
4. Applies per-priority-tier thresholds for signal, retry%, PHY rate, satisfaction, and drop-dB.
5. Tracks AP channel-utilization streaks across runs (state cache at `sartor/memory/inbox/rocinante/.wifi-health-state.json`).
6. Writes a report to `sartor/memory/inbox/rocinante/wifi-health-<UTC-stamp>.md`.
7. Exits 0 (all green), 1 (at least one alert), or 2 (controller unreachable).

## Registration command (run once, as Alton on Rocinante)

```powershell
$action = New-ScheduledTaskAction `
    -Execute 'wscript.exe' `
    -Argument '"C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs" "C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\wifi-health-monitor.cmd"'
$trigger = New-ScheduledTaskTrigger `
    -Once -At (Get-Date).Date.AddMinutes(5) `
    -RepetitionInterval (New-TimeSpan -Minutes 15)
$settings = New-ScheduledTaskSettingsSet `
    -Hidden -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask `
    -TaskName 'Sartor WiFi Health Monitor' `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Limited
```

## Verification

```powershell
# Check task state
Get-ScheduledTask -TaskName 'Sartor WiFi Health Monitor' | Get-ScheduledTaskInfo

# Trigger manually and check log
Start-ScheduledTask -TaskName 'Sartor WiFi Health Monitor'
Start-Sleep 30
Get-Content C:\Users\alto8\backups\wifi-health-monitor.log -Tail 20

# Check latest report in inbox
Get-ChildItem sartor/memory/inbox/rocinante/wifi-health-*.md | Sort-Object LastWriteTime -Desc | Select-Object -First 1
```

## Dependencies

| Dependency | Path | Notes |
|---|---|---|
| Python | `python` on PATH | Must have `pyyaml` installed (`pip install pyyaml`) |
| sartor-secret | `scripts/sartor-secret.cmd` | Must be able to read `UniFi superadmin` from Bitwarden vault |
| UniFi controller | `https://192.168.1.171:8443` | Local network; must be reachable from Rocinante |
| Priority registry | `sartor/memory/wifi/CLIENT-PRIORITIES.yaml` | Clients not in registry default to `normal` priority |
| run-hidden.vbs | `scripts/win-tasks/run-hidden.vbs` | Suppresses console window; applied to all Sartor tasks |

## Exit codes

| Code | Meaning |
|---|---|
| 0 | All clients and AP radios within threshold — all green |
| 1 | At least one alert fired — check latest inbox report |
| 2 | Controller unreachable or auth failed — check UniFi controller health |

## Troubleshooting

**`LastTaskResult` is non-zero but no inbox file:**
- Check `C:\Users\alto8\backups\wifi-health-monitor.log` for Python errors.
- Ensure `pyyaml` is installed: `pip install pyyaml`.

**Controller unreachable (exit 2):**
- Confirm UniFi controller is running at `https://192.168.1.171:8443`.
- Check Bitwarden vault is unlocked: `sartor-secret read "UniFi superadmin"` should return a non-empty string.

**No critical-tier alerts even when laptops have bad signal:**
- Verify MACs in `CLIENT-PRIORITIES.yaml` match what UniFi reports (check `/stat/sta` endpoint).
- Run the monitor manually: `python sartor/memory/wifi/wifi-health-monitor.py` and read the output.
