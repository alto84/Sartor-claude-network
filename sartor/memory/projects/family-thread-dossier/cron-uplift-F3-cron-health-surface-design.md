---
name: cron-uplift-F3-cron-health-surface-design
type: design
status: proposed-pending-greenlight
parent: cron-uplift-program-v0.1
volatility: medium
priority: p1
owner: cron-engineer
manager: pipelines-auditor
date: 2026-05-02
updated: 2026-05-02
updated_by: cron-engineer (family-thread)
related: [cron-uplift-program-v0.1, dashboard-status, dashboard-rebuild/INDEX, daily-household-health]
tags: [meta/design, domain/cron, domain/observability, household/governance]
originSessionId: 2451d707-4a22-4868-8ae5-6afe0ad4acdd
---
# F3 — Aggregate cron-health surface: design sketch (pre-greenlight)

> [!warning] Design only. No script, task, or surface created. Surface for team-lead review before any creation.

## §A — What it measures

A daily aggregator over the Sartor cron substrate. For each in-scope task, it records:

| Field | Source | Why |
|---|---|---|
| `task_name` | `Get-ScheduledTask` | Identifier |
| `status` | `Get-ScheduledTask` (Ready / Disabled / Running) | Catches the heartbeat-style "silently disabled" pathology |
| `last_run_time` | `Get-ScheduledTaskInfo` | Did it actually fire recently? |
| `last_task_result` | `Get-ScheduledTaskInfo` | 0 = success; non-zero = silent failure (caught the PushPeerCredentials 127 today) |
| `next_run_time` | `Get-ScheduledTaskInfo` | If null/N/A on a task that should be recurring, that's a flag |
| `expected_interval_minutes` | Task XML triggers | Know what "fresh" means |
| `staleness_minutes` | computed = `Now - last_run_time` | The thing we actually alert on |
| `freshness_ratio` | `staleness_minutes / expected_interval_minutes` | Normalized "is this overdue?" — >2.0 yellow, >3.0 red |
| `consecutive_nonzero_results` | last 10 runs from event log | Catches "always exits 1, has been failing forever" |
| `output_file_present` | per-task expected-output check (e.g., did today's morning briefing actually produce its output file?) | Catches the silent-failure-with-exit-0 pattern (morning-briefing) |

In-scope task list (configurable; ship with these defaults):

```
SartorHeartbeat
SartorMorningBriefing
SartorCuratorPass
SartorGmailScan
SartorConversationExtract
SartorImprovementLoop
Sartor Memory Mirror
Sartor Peer Creds Sync
UniFi Daily Backup
```

Explicitly out-of-scope (intentionally): `personal-data-gather` (no scheduled task — see [[cron-uplift-F1-personal-data-gather-v2-design]]); `nightly-memory-curation` (currently bundled into SartorCuratorPass).

## §B — Where it writes

**Primary output:** `data/cron-health-{YYYY-MM-DD}.md`

```markdown
---
type: report
generated_by: cron-health-check
generated_at: 2026-05-03T06:25:00-04:00
host: rocinante
status: green   # green | yellow | red
yellow_count: 0
red_count: 0
---
# Cron health 2026-05-03

**Summary:** all 9 tasks green. Heartbeat fresh (16 min ago). All recurring tasks ran since their last expected window.

| Task | Status | Last Run | Result | Staleness | Verdict |
|---|---|---|---|---|---|
| SartorHeartbeat | Ready | 06:04 | 0 | 21 min | green (expected 30 min) |
| SartorMorningBriefing | Ready | 06:30 | 0 | 0 min (output file present) | green |
| SartorCuratorPass | Ready | yesterday 19:30 | 0 | 11h | green (expected 12h) |
| ...etc... |

## Yellow flags
(none)

## Red flags
(none)

## Notes
- PushPeerCredentials: explicitly disabled 2026-05-02 per cron-uplift-program-v0.1 F2; not counted.
```

**Secondary output:** an append to `data/cron-health-trend.csv` — one row per task per day, for trend graphing.

```csv
date,task,status,last_run,result,staleness_min,freshness_ratio,verdict
2026-05-03,SartorHeartbeat,Ready,2026-05-03T06:04:00,0,21,0.7,green
...
```

**Read by (downstream consumers):**
- **MERIDIAN** (when dashboard-keeper revives it per [[dashboard-rebuild/INDEX]]) — surfaces the latest report's frontmatter `status` field as a header strip color.
- **morning-briefing** (when dashboard-keeper rewrites the wrapper) — reads today's report and includes the summary line in the briefing.
- **Alton** — direct read of `data/cron-health-{today}.md`.

## §C — Failure mode if F3 itself goes silent (turtles all the way down)

The recursive risk: heartbeat went dark for 30 days; what stops cron-health from doing the same?

**Three layers of self-detection:**

### Layer 1: the file IS the heartbeat

The cron-health-check writes a file named `data/cron-health-{YYYY-MM-DD}.md` every day. **If today's file is missing, cron-health failed.** This is the same pattern as the morning briefing's silent failure — but with one critical difference: **morning-briefing is the consumer of cron-health's output**, so the briefing's daily routine is the natural detector.

Concretely: morning-briefing's first read on each run is `data/cron-health-{today}.md`. If that file does not exist, morning-briefing surfaces a one-line warning at the top: `WARNING: cron-health-check did not run today. The cron-health system may itself be down.` This warning is in the briefing every morning Alton sees, until cron-health is restored.

### Layer 2: weekly script-on-script check

A separate weekly task (`Sun 8:00 AM`, runs after morning-briefing) checks: are there cron-health files for each of the past 7 days? If not, log `data/cron-health-WEEKLY-AUDIT.md` with a missed-day list. This is the script that watches the watcher.

The weekly audit is itself a cron — so it can fail. But its failure mode is bounded: missing the audit costs a 7-day delay in detecting cron-health's silence, not infinite delay.

### Layer 3: the SartorHeartbeat itself

The 30-min heartbeat writes `data/heartbeat-log.csv` with a `health-check` row that includes a one-character "cron-health-stale-N-days" flag (computed inline by reading the most recent `cron-health-*.md` mtime). This costs the heartbeat ~50ms per cycle but provides 30-min-resolution detection of cron-health silence, completely decoupled from morning-briefing or weekly-audit.

### Bounded recursion

Three-layer detection bottoms out at the SartorHeartbeat. If the heartbeat fails too, we're back to the original problem (and F3 doesn't solve heartbeat-failure detection — that's a separate concern, possibly addressed by a peer-machine watching Rocinante's heartbeat over the network). For now: trust that the heartbeat now-restored is the floor.

The turtles-all-the-way-down problem is bounded because eventually one of the watchers IS the heartbeat. We don't go infinitely deep.

## §D — Implementation sketch

### File locations (proposed)

```
Sartor-claude-network/
  scripts/
    cron-health-check-run.cmd          (the wrapper, mirrors curator-pass-run.cmd pattern)
    cron-health-check.ps1              (the actual implementation)
    cron-health-weekly-audit.ps1       (Layer 2 watcher)
  .claude/
    scheduled-tasks/
      cron-health-check/
        SKILL.md                       (documentation only — script does the work)
```

Plus two new Windows scheduled tasks:
- `SartorCronHealthCheck` — daily 6:25 AM ET (5 min before SartorMorningBriefing).
- `SartorCronHealthWeeklyAudit` — Sundays 8:00 AM ET (after morning briefing).

### `cron-health-check.ps1` skeleton (~80 lines, no external deps)

```powershell
param([string]$OutputDir = "C:\Users\alto8\Sartor-claude-network\data")

$inScope = @(
    'SartorHeartbeat','SartorMorningBriefing','SartorCuratorPass','SartorGmailScan',
    'SartorConversationExtract','SartorImprovementLoop','Sartor Memory Mirror',
    'Sartor Peer Creds Sync','UniFi Daily Backup'
)

$now = Get-Date
$rows = foreach ($name in $inScope) {
    $task = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if (-not $task) { continue }
    $info = Get-ScheduledTaskInfo -TaskName $name
    $expectedMin = & {  # derive from triggers
        switch -Regex ($task.Triggers[0].GetType().Name) {
            'Daily'   { 1440 }
            'Weekly'  { 10080 }
            default   {
                if ($task.Triggers[0].Repetition.Interval -match 'PT(\d+)M') { [int]$matches[1] }
                elseif ($task.Triggers[0].Repetition.Interval -match 'PT(\d+)H') { [int]$matches[1] * 60 }
                else { 1440 }
            }
        }
    }
    $stalenessMin = if ($info.LastRunTime) { [math]::Round(($now - $info.LastRunTime).TotalMinutes, 0) } else { -1 }
    $ratio = if ($expectedMin -gt 0 -and $stalenessMin -ge 0) { [math]::Round($stalenessMin / $expectedMin, 2) } else { -1 }
    $verdict = switch ($true) {
        ($task.State -eq 'Disabled')                  { 'red-disabled' }
        ($info.LastTaskResult -ne 0)                  { 'red-result' }
        ($ratio -gt 3.0)                              { 'red-stale' }
        ($ratio -gt 2.0)                              { 'yellow-stale' }
        default                                       { 'green' }
    }
    [PSCustomObject]@{
        Task = $name; Status = $task.State; LastRun = $info.LastRunTime
        Result = $info.LastTaskResult; StalenessMin = $stalenessMin
        FreshnessRatio = $ratio; Verdict = $verdict
    }
}

# Aggregate
$reds = ($rows | Where-Object { $_.Verdict -like 'red-*' }).Count
$yellows = ($rows | Where-Object { $_.Verdict -like 'yellow-*' }).Count
$status = if ($reds -gt 0) { 'red' } elseif ($yellows -gt 0) { 'yellow' } else { 'green' }

# Write report (markdown table + frontmatter)
$date = Get-Date -Format "yyyy-MM-dd"
$report = @"
---
type: report
generated_by: cron-health-check
generated_at: $($now.ToString("yyyy-MM-ddTHH:mm:sszzz"))
host: rocinante
status: $status
yellow_count: $yellows
red_count: $reds
---
# Cron health $date

**Summary:** $($rows.Count) tasks checked. $reds red, $yellows yellow, $($rows.Count - $reds - $yellows) green.

| Task | Status | Last Run | Result | Staleness | Verdict |
|---|---|---|---|---|---|
$($rows | ForEach-Object { "| $($_.Task) | $($_.Status) | $($_.LastRun) | $($_.Result) | $($_.StalenessMin) min | $($_.Verdict) |" } | Out-String)
"@
$report | Out-File -Encoding utf8 "$OutputDir\cron-health-$date.md"

# Append CSV row
$rows | ForEach-Object {
    "$date,$($_.Task),$($_.Status),$($_.LastRun.ToString('o')),$($_.Result),$($_.StalenessMin),$($_.FreshnessRatio),$($_.Verdict)"
} | Add-Content "$OutputDir\cron-health-trend.csv"

exit 0
```

### `cron-health-check-run.cmd` (wrapper, ~5 lines, mirrors curator-pass-run.cmd)

```cmd
@echo off
setlocal
set LOGFILE=C:\Users\alto8\generated\cron-health-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
mkdir "C:\Users\alto8\generated" 2>NUL
echo === %date% %time% === >> "%LOGFILE%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\cron-health-check.ps1 >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
```

Key hardening (avoid the morning-briefing failure pattern): the wrapper `mkdir`s the log dir before `>>` redirection, and propagates the exit code via `exit /b %ERRORLEVEL%`. The Layer 1 detection (file-IS-the-heartbeat) catches if `cron-health-check.ps1` itself silently no-ops.

### Windows scheduled task creation

```powershell
schtasks /create /tn SartorCronHealthCheck `
  /tr "C:\Users\alto8\Sartor-claude-network\scripts\cron-health-check-run.cmd" `
  /sc DAILY /st 06:25 /ru alton /rl LIMITED /f
```

(Trailing `/f` for force-overwrite if re-running. `/ru alton /rl LIMITED` matches the existing Sartor* tasks' principal pattern.)

## §E — Coordination with dashboard-keeper

**Output schema for MERIDIAN ingestion** (proposed; awaits dashboard-keeper feedback):

The MERIDIAN family-dashboard panel for cron-health reads `data/cron-health-{today}.md` and surfaces:
- Frontmatter `status` field → header strip color (green / yellow / red)
- `yellow_count + red_count` → badge count on a "Cron Health" tile
- The full table → expandable details panel

Coordinate with dashboard-keeper before MERIDIAN's wrapper rewrite ships (per dashboard-rebuild Phase 3) so the panel knows the schema. **The schema is intentionally simple** (frontmatter + markdown table) — easy to consume from FastAPI's existing markdown-reading code paths.

If dashboard-keeper wants JSON instead, easy alternative: emit `data/cron-health-{today}.json` alongside the markdown. ~3 added lines in the script.

## §F — Open questions for team-lead → Alton

1. **6:25 AM ET daily trigger time** — assumes morning-briefing at 6:30 will consume the output. If briefing time changes, adjust. Alternative cadence: every 4h (gives faster detection but is noisier and less aligned with briefing).
2. **Layer 3 inline check inside the heartbeat itself** — adds ~50ms to the 30-min heartbeat. Worth the extra logic? My read: yes — it's the cheapest detection mechanism that doesn't depend on another cron. If Alton wants to keep heartbeat.py untouched, drop Layer 3 and rely on Layers 1+2 only.
3. **Weekly audit (Layer 2)** — Sundays 8 AM. Worth it? Yes, but it's a separate scheduled task. If Alton wants to keep the surface lean, drop Layer 2 and rely on Layer 1 (briefing detects). Detection latency goes from "1 day" to "1 day" — Layer 2 doesn't add detection speed; it adds redundancy.
4. **Output JSON in addition to markdown?** Costs ~3 lines, gives MERIDIAN richer ingestion. Default proposal: markdown-only, add JSON if dashboard-keeper asks.
5. **In-scope task list** — should `personal-data-gather` be added once F1 is shipped (i.e., once it has a real scheduled task)? My read: yes, add it post-F1.

## §G — What this design does NOT do

- Does not modify any existing scheduled task.
- Does not touch the heartbeat.py runtime (Layer 3 is optional and would be a separate proposal).
- Does not modify the morning-briefing wrapper (dashboard-keeper).
- Does not delete any task.
- Does not require new dependencies (uses built-in `Get-ScheduledTask` cmdlets).

## §H — Cost / complexity

- ~80 lines PowerShell + 5 lines wrapper + 1 schtasks command for the primary path.
- ~30 lines PowerShell for the weekly audit (Layer 2).
- ~10 lines added to heartbeat.py for Layer 3 (optional).
- One new daily scheduled task; one new weekly scheduled task.
- Zero new external dependencies.
- Zero impact on existing tasks (read-only against the scheduler).

Roughly 30 minutes to build. Roughly the same to validate (manually pause SartorHeartbeat, verify next-day cron-health flags it red).

## History

- 2026-05-02 evening: design surface drafted by `cron-engineer` after team-lead pre-greenlit design-first work for F3. Concrete script skeleton + 3-layer self-detection scheme. Coordinates with dashboard-keeper on output schema. Awaits Alton greenlight on the 5 §F open questions.
