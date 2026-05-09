---
name: wifi-health-monitor-task-spec
description: Registration runbook for the Sartor WiFi Health Monitor Windows Scheduled Task. Spec, not yet registered. Awaiting Alton greenlight.
type: scheduled-task-spec
status: pending-greenlight
created: 2026-05-09
created_by: Rocinante Opus 4.7 (Tier-A WiFi observability build)
---

# Sartor WiFi Health Monitor - registration runbook

## What it does

Tier-A of the active WiFi management architecture. Every 15 minutes:

1. Authenticates to the local UniFi controller at `https://192.168.1.171:8443` (read-only).
2. Walks every wireless client and applies per-priority-tier thresholds from `sartor/memory/wifi/CLIENT-PRIORITIES.yaml`. Critical-tier clients (Aneeta's Neurvati laptop, Alton's AstraZeneca laptop) get the tightest thresholds; Sonos speakers get the loosest.
3. Walks every AP radio and applies channel-utilization thresholds: sustained CU > 70% across 2+ runs alerts; DFS-channel + high CU emits a stronger alert; 5 GHz at <80 MHz width with associated stations emits a Tier B widen suggestion.
4. Computes trend deltas vs the prior run (per-priority drop thresholds: critical -3 dB, high -5 dB, normal -8 dB, best_effort -10 dB).
5. Writes a dated audit-trail report to `sartor/memory/inbox/rocinante/wifi-health-<UTC-stamp>.md`.
6. Persists a state cache to `sartor/memory/inbox/rocinante/.wifi-health-state.json` (gitignored - high churn).
7. Exits non-zero on any alert so cron-fail surfaces in Task Scheduler's `LastTaskResult`.

## Files

| Layer | Path |
|---|---|
| Wrapper | `scripts/win-tasks/wifi-health-monitor.cmd` |
| Monitor | `sartor/memory/wifi/wifi-health-monitor.py` |
| Source of truth (priorities) | `sartor/memory/wifi/CLIENT-PRIORITIES.yaml` |
| Hidden-window shim | `scripts/win-tasks/run-hidden.vbs` |
| Log | `C:\Users\alto8\backups\wifi-health-monitor.log` |
| Output | `sartor/memory/inbox/rocinante/wifi-health-<UTC>.md` |
| State cache (gitignored) | `sartor/memory/inbox/rocinante/.wifi-health-state.json` |

## Verification before registration

Run the monitor by hand once and confirm it produces a report.

```powershell
& "C:\Python313\python.exe" "C:\Users\alto8\Sartor-claude-network\sartor\memory\wifi\wifi-health-monitor.py"
```

Expected console line (exit code is the actual signal; non-zero means alerts fired, which is informational, not failure):

```
wifi-health: <N> wireless clients, <M> AP radios, <K> alerts -> wifi-health-<stamp>.md
```

Verify the report opens cleanly in Obsidian/markdown and that the critical-clients table at the top lists `NEURV-PF5B9D8L` and `AZAPXLGM0P85E7` (or notes them absent if neither laptop is currently associated).

If the monitor fails with `controller unreachable or auth failed`, the controller is down or the `UniFi superadmin` Bitwarden entry is wrong. Fix that first (see `network-management` skill, "Recovery: controller down") before registering.

## Registration (PowerShell, no admin needed)

```powershell
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument '"C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs" "C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\wifi-health-monitor.cmd"'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(15) -RepetitionInterval (New-TimeSpan -Minutes 15)
$settings = New-ScheduledTaskSettingsSet -Hidden -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'Sartor WiFi Health Monitor' -Action $action -Trigger $trigger -Settings $settings -RunLevel Limited
```

## Verification after registration

```powershell
Get-ScheduledTask -TaskName 'Sartor WiFi Health Monitor' | Get-ScheduledTaskInfo
Start-ScheduledTask -TaskName 'Sartor WiFi Health Monitor'
Start-Sleep -Seconds 30
Get-ScheduledTask -TaskName 'Sartor WiFi Health Monitor' | Get-ScheduledTaskInfo | Select TaskName, LastRunTime, LastTaskResult, NumberOfMissedRuns
Get-ChildItem 'C:\Users\alto8\Sartor-claude-network\sartor\memory\inbox\rocinante\wifi-health-*.md' | Sort LastWriteTime -Descending | Select -First 1
```

Expect either `LastTaskResult = 0` (all-green) or `LastTaskResult = 1` (alerts present, the value the task delivers). `LastTaskResult = 2` means the controller was unreachable - investigate.

## Behavior

- **All-green (exit 0):** every wireless client and AP radio within their thresholds. Report still written for audit-trail continuity.
- **Alerts (exit 1):** report's `Active alerts` section enumerates each. Critical-client alerts are at the top; AP-radio alerts at the bottom.
- **Controller unreachable (exit 2):** minimal status-only report written, error logged. The UniFi controller's JVM has crashed twice in the 12 hours preceding this build, so this exit path is expected occasionally; the script fails gracefully rather than crashing.

## Notes

- Convention (wrapper through `run-hidden.vbs` so no console flashes) documented in `sartor/memory/reference_scheduled_tasks.md` "Adding a new Windows Scheduled Task" section.
- Add a row to that file's table when the task is actually registered (currently flagged "spec only - not yet registered").
- The monitor is **read-only** against UniFi. The suggestion text is the only output that matters for Tier B/C; suggestions never auto-execute.
- A future "Sartor Task Health" watcher could detect this task's `LastTaskResult` to escalate persistent alerts to Alton via Calendar event - same pattern as `daily-household-health`. Not built yet; orthogonal scope.
