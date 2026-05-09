---
name: reference_scheduled_tasks
description: Canonical record of every scheduled job in the Sartor fleet — Windows Scheduled Tasks on Rocinante, Claude Code agentic tasks defined in .claude/scheduled-tasks/, Linux cron + systemd timers on gpuserver1 and rtxserver. Single source of truth; CLAUDE.md and per-machine MISSION docs link here. Bump `updated:` and add a History line on any change.
type: reference
updated: 2026-05-09
originSessionId: d73d3437-8b28-4e31-bbe2-14e776bba51c
last_change: "Tier-A WiFi health monitor task spec added (NOT registered yet)"
---
# Sartor scheduled-task inventory

This file is the single source of truth for what runs when on Sartor infrastructure. If a row here is wrong, the row is wrong — the truth is the live system. Verify with the verification command in each section before changing a row.

## Rocinante — Windows Scheduled Tasks

Verify with: `Get-ScheduledTask | Where-Object {$_.TaskName -like "Sartor*" -or $_.TaskName -like "UniFi*"} | Select TaskName, State`

**All 10 Sartor-owned tasks run hidden via the `C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs` wrapper as of 2026-05-08.** The 2026-05-06 `Settings.Hidden = $true` change was insufficient — that flag only suppresses Task Scheduler's own UI, not the spawned `powershell.exe` / `cmd.exe` console window. The wrapper uses `WScript.Shell.Run cmd, 0, True` which truly hides the window AND propagates the child exit code so `LastTaskResult` stays meaningful. Apply via the snippet at the bottom of this file if a new task is created.

| Task | Frequency | Action | Logs to | Notes |
|---|---|---|---|---|
| `Sartor Peer Sessions Mirror` | every 15 min | `scripts/rsync-peer-sessions.ps1` — SCP peer Claude `.jsonl` files from rtxserver + gpuserver1 into Rocinante's `~/.claude/projects/C--Users-alto8-Sartor-claude-network/` | `C:\Users\alto8\backups\peer-sessions-rsync.log` | sidecar manifest at `.peer-manifest.json` tracks origin per session-id |
| `Sartor Peer Creds Sync` | every 4 hr | `scripts/win-tasks/sartor-creds-sync.ps1` — SCP fresh `~/.claude/.credentials.json` to peer Claudes | `C:\Users\alto8\backups\sartor-creds-sync.log` | bumped from nightly to 4h on 2026-05-02 to keep peer OAuth fresh after intra-day reboots |
| `Sartor Memory Mirror` | nightly 3:30 AM ET | `scripts/win-tasks/sartor-mirror-to-github.ps1` — pushes rtxserver bare repo `main` to GitHub mirror | `C:\Users\alto8\backups\sartor-mirror.log` | DR mirror only; peers never push to GitHub directly |
| `Sartor Hours Log` | nightly 11:55 PM ET | `scripts/hours-log-extract.py` — material-participation hours tracker (§469) writing `sartor/memory/business/hours-log/all-hours.csv` | `C:\Users\alto8\backups\hours-log.log` | union-of-intervals dedup across concurrent sessions; gaps <30 min count active |
| `Sartor Registry Drift Check` *(spec only - not yet registered)* | every 4 hr | `scripts/win-tasks/registry-drift-check.cmd` -> `python sartor/memory/machines/check-registry.py` - pings each machine in REGISTRY.yaml, attempts SSH liveness, writes drift report to `inbox/rocinante/registry-drift-<UTC>.md` | `C:\Users\alto8\backups\registry-drift-check.log` | Tier 4 of IP-graceful-reassignment architecture (Tier 3 = REGISTRY.yaml). Exits non-zero on STALE/UNREACHABLE so cron-fail surfaces. Awaiting Alton greenlight to register; one-line `Set-ScheduledTask` in History below. |
| `Sartor WiFi Health Monitor` *(spec only - not yet registered)* | every 15 min | `scripts/win-tasks/wifi-health-monitor.cmd` -> `python sartor/memory/wifi/wifi-health-monitor.py` - read-only UniFi survey of every wireless client + AP radio with priority-aware thresholds from `sartor/memory/wifi/CLIENT-PRIORITIES.yaml`; writes `inbox/rocinante/wifi-health-<UTC>.md` | `C:\Users\alto8\backups\wifi-health-monitor.log` | Tier-A of active WiFi management. Critical-tier clients (Aneeta Neurvati laptop, Alton AZ laptop) get tightest thresholds; Sonos best_effort. Exits 0/1/2 (green / alerts / controller-unreachable). Awaiting Alton greenlight to register; runbook at `scripts/win-tasks/wifi-health-monitor.README.md`. |
| `UniFi Daily Backup` | daily 3:00 AM ET | `scripts/win-tasks/unifi-daily-backup.ps1` — pulls `.unf` from local UniFi controller, SCPs off-site to rtxserver `/home/alton/sartor-network-backups/` | `C:\Users\alto8\backups\unifi\backup-log.txt` | local copies pruned >30d; rtxserver copies kept indefinitely |
| `SartorMorningBriefing` | daily 6:30 AM ET | `scripts/morning-briefing-run.cmd` → invokes morning-briefing skill | (Claude session log) | drives the cross-domain daily briefing |
| `SartorCuratorPass` | 7:30 AM + 7:30 PM ET | `scripts/curator-pass-run.cmd` → invokes memory-curator agent | (Claude session log) | drains inbox proposals, updates USER.md + MEMORY.md |
| `SartorGmailScan` | every 4 hr (06/10/14/18/22 ET) | `scripts/gmail-scan-run.cmd` → invokes Gmail-scan logic | (Claude session log) | personal-data-gather pipeline; effectiveness audit pending (memory-system-uplift project) |
| `SartorConversationExtract` | nightly 11:30 PM ET | `python -m sartor.conversation_extract -v` — extracts memory candidates from session jsonls | (stdout/stderr) | feeds `inbox/rocinante/proposed-memories/<date>/` for next curator pass |
| `SartorImprovementLoop` | weekly Sun 8:00 PM ET | (per task definition) | (Claude session log) | self-improvement loop |
| `PushPeerCredentials` | **disabled** | | | superseded by `Sartor Peer Creds Sync` |
| `SartorHeartbeat` | **disabled** | | | retired heartbeat; replaced by per-machine self-stewardship |
| `UnifiedConsentSyncTask` | (system-managed) | | | Microsoft consent sync, not Sartor-managed |

## Rocinante — Claude Code agentic scheduled-tasks (`.claude/scheduled-tasks/`)

These are markdown task definitions consumed by the SartorImprovementLoop or invoked manually. They are NOT Windows Scheduled Tasks themselves — they're declarative specs for agentic work that runs inside a Claude session when invoked.

| Task spec | Intended frequency | What it does |
|---|---|---|
| `morning-briefing/` | daily 6:30 AM ET | Cross-domain daily briefing (drives the SartorMorningBriefing wrapper) |
| `gpu-utilization-check/` | every 4 hr | GPU + vast.ai monitoring across the fleet |
| `market-close-summary/` | weekdays 4:30 PM ET | End-of-day market summary |
| `nightly-memory-curation/` | nightly 11:00 PM ET | Drains inbox proposals, prunes stale data, archives trajectories |
| `personal-data-gather/` | every 4 hr | Gmail + Calendar + system-state collection (the SartorGmailScan core) |
| `todo-sync/` | nightly post-reindex | Sync wiki callouts (deadlines, blockers, todos) to Google Tasks |
| `wiki-reindex/` | nightly | Hermes-pattern reindex: backlinks, tag-index, similarity, orphans, broken-links |
| `weekly-financial-summary/` | Fri 6:00 PM ET | Financial rollup across all entities |
| `weekly-nonprofit-review/` | Sun 9:00 AM ET | Sante Total compliance check |
| `weekly-skill-evolution/` | Sun 3:00 AM ET | Skill variant generation, scoring, improvement queue |
| `daily-household-health/` | daily 5:30 AM ET | Aggregates peer self-steward state; pings via Calendar on yellow+ |

**Wiring gap:** Several of these (notably `weekly-skill-evolution`, `nightly-memory-curation`, `wiki-reindex`, `todo-sync`, `daily-household-health`) are declared but the only actual Windows Scheduled Task that triggers any of them is `SartorImprovementLoop` (weekly Sunday). Confirm each task's actual trigger source before relying on it.

## gpuserver1 — cron + systemd

Verify with: `ssh alton@192.168.1.100 "crontab -l && systemctl list-timers --all"`

| Job | Frequency | Script | What it does |
|---|---|---|---|
| `gather_mirror.sh` | every 4 hr | `~/gather_mirror.sh` | Cross-machine memory sync — pulls peer state, mirrors to local |
| `stale-detect.sh` | hourly | `~/stale-detect.sh` | Writes `inbox/gpuserver1/_heartbeat.md`; alerts on staleness |
| `vastai-tend.sh` | every 30 min | `~/vastai-tend.sh` | Tends vast.ai listing on machine_id 52271; state-change events to `inbox/gpuserver1/vastai/` |
| `rgb_status.py` | every 5 min | `~/sartor-rgb/bin/rgb_status.py` | LED-strip status display |
| `docker-weekly-prune.sh` | Sun 4:00 AM | `~/docker-weekly-prune.sh` | Weekly docker prune |

System timers (apt-daily, fwupd-refresh, etc.) are OS-managed and not in this inventory.

## rtxserver — cron + systemd

Verify with: `ssh alton@192.168.1.157 "crontab -l && systemctl list-timers --all && systemctl --user list-units --type=service"`

| Job | Frequency | Script / unit | What it does |
|---|---|---|---|
| `gather_mirror.sh` | hourly at :17 | `~/gather_mirror.sh` | Cross-machine memory sync |
| `stale-detect.sh` | hourly at :33 | `~/stale-detect.sh` | Writes `inbox/rtxpro6000server/_heartbeat.md` |
| `vastai-tend.sh` | every 30 min | `~/vastai-tend.sh` | Tends vast.ai listing on machine_id 97429 |
| `docker-weekly-prune.sh` | Sun 4:00 AM | `~/docker-weekly-prune.sh` | Weekly docker prune |
| `nvidia-power-cap.service` | system, on boot | `/etc/systemd/system/nvidia-power-cap.service` | Applies `nvidia-smi -pl 450` per card on boot |
| `sartor-claude-peer.service` | user, on boot | `~/.config/systemd/user/sartor-claude-peer.service` | Auto-spawns peer Claude in tmux session `claude-team-1`; lingering enabled for `alton` |
| `claude-tmux.service` | user | (legacy) | Predecessor of sartor-claude-peer.service; still loaded but functionally idle |

System timers are OS-managed and not in this inventory.

## Conventions

### Adding a new Windows Scheduled Task
- Use `schtasks /Create /SC ... /RL LIMITED /F` (no admin needed for `LogonType=Interactive`)
- Wrap the action through `C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs` so no console flashes:
  ```powershell
  $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument '"C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs" "<full original command line>"'
  Set-ScheduledTask -TaskName "<Name>" -Action $action
  ```
  The `<full original command line>` is what you would have put as `Execute + Arguments` directly, e.g. `powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\foo.ps1`. The wrapper executes it with `intWindowStyle=0` (truly hidden) and `bWaitOnReturn=True` so the child exit code propagates to `LastTaskResult`.
- `Settings.Hidden = $true` is fine to leave on (suppresses Task Scheduler UI) but is NOT what prevents the desktop console flash — the VBS wrapper is.
- The `LogonType = S4U` alternative (no UI on desktop without a wrapper) requires admin elevation to apply via `Set-ScheduledTask -Principal`; not used here.
- Add a row to the table above and bump `updated:` field

### Adding a new Linux cron
- Edit via `crontab -e`; never via the file directly
- Always redirect output to `~/generated/cron-logs/<name>.log` (rtxserver) or wherever the host convention is
- Add a row to the table above

### Naming
- Windows tasks use mixed case with spaces (`Sartor Peer Sessions Mirror`) for human-readable Task Scheduler UI
- Linux scripts are kebab-case (`vastai-tend.sh`)
- Keep the prefix consistent (`Sartor*` for Sartor-owned Windows tasks; never strip the prefix)

### When in doubt
- Run the verify command at the top of each section against the live system
- The live system is authoritative; this file is descriptive

## History

- 2026-05-09 (later): `Sartor WiFi Health Monitor` task spec added (NOT registered yet; awaiting Alton greenlight). Tier-A of the active WiFi management architecture. Wrapper at `scripts/win-tasks/wifi-health-monitor.cmd`, monitor at `sartor/memory/wifi/wifi-health-monitor.py`, priority registry at `sartor/memory/wifi/CLIENT-PRIORITIES.yaml`. Verified by manual run: 6 wireless clients surveyed, 22 AP radios, 5 alerts on first run + 7 alerts on second run after CU streak persistence kicked in. Both critical-tier laptops (NEURV-PF5B9D8L, AZAPXLGM0P85E7) flagged with retry%>3% (the incident that motivated the build). Registration runbook at `scripts/win-tasks/wifi-health-monitor.README.md`.
- 2026-05-09: `Sartor Registry Drift Check` task spec added (NOT registered yet; awaiting Alton greenlight). Tier 4 of the IP-graceful-reassignment architecture built tonight after the gpuserver1 .100 -> .199 DHCP-reassignment incident. Wrapper at `scripts/win-tasks/registry-drift-check.cmd`, detector at `sartor/memory/machines/check-registry.py`, registry source at `sartor/memory/machines/REGISTRY.yaml`. Verified end-to-end against the live fleet (3 OK, ping 1 ms each, ssh OK on both peers). To register when Alton greenlights:
  ```powershell
  $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument '"C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\run-hidden.vbs" "C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\registry-drift-check.cmd"'
  $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(15) -RepetitionInterval (New-TimeSpan -Hours 4)
  $settings = New-ScheduledTaskSettingsSet -Hidden -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName 'Sartor Registry Drift Check' -Action $action -Trigger $trigger -Settings $settings -RunLevel Limited
  ```
  Verify with `Get-ScheduledTask -TaskName 'Sartor Registry Drift Check' | Get-ScheduledTaskInfo` and by triggering once: `Start-ScheduledTask -TaskName 'Sartor Registry Drift Check'`. Expect `LastTaskResult = 0` and a fresh `inbox/rocinante/registry-drift-<UTC>.md` file.
- 2026-05-08 — flash fix actually applied. Discovered that 2026-05-06's `Settings.Hidden = $true` did not stop the console flash (only suppresses Task Scheduler's own UI, not the spawned `powershell.exe` / `cmd.exe` window). Created `C:\Users\alto8\scripts\run-hidden.vbs` (one-line `WScript.Shell.Run cmd, 0, True` wrapper) and rerouted all 10 Sartor-owned tasks through it via `Set-ScheduledTask -Action` (no admin needed). Verified clean by triggering Sartor Hours Log, Sartor Peer Sessions Mirror, and Sartor Peer Creds Sync — all completed with `LastTaskResult=0` and produced the expected log entries with no desktop flash. Original Execute+Arguments strings are preserved verbatim inside the wrapper's quoted argument so existing scripts run unchanged. Tried the cleaner `LogonType=S4U` route first (would have avoided needing a wrapper file) but `Set-ScheduledTask -Principal` returned `Access is denied` without admin elevation.
- 2026-05-06 — file created during memory-system-uplift kickoff. Inventoried 10 Windows tasks + 11 Claude-task specs + 5 gpuserver1 cron entries + 4 rtxserver cron entries + 2 rtxserver user systemd services + 1 system service. All Windows tasks set to `Settings.Hidden = $true` (later found insufficient — see 2026-05-08).
- 2026-05-08 — Phase 3 of C:\Users\alto8 → Sartor-claude-network migration. The 5 home-dir scripts (`sartor-creds-sync.ps1`, `sartor-mirror-to-github.ps1`, `unifi-daily-backup.ps1`, `run-hidden.vbs`, `push-peer-credentials.sh`) moved into `scripts/win-tasks/`. All 10 Sartor-owned Windows Scheduled Tasks updated via `Set-ScheduledTask -Action`. Verified by manual trigger of Sartor Hours Log + Sartor Peer Sessions Mirror (both LastResult=0). Old `C:\Users\alto8\scripts\` archived to `archive/legacy-scripts-2026-05-08/` for one-cycle fallback before deletion.
