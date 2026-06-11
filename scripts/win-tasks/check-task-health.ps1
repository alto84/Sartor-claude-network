<#
=============================================================================
 check-task-health.ps1 — Windows scheduled-task last-result auditor
=============================================================================

 PURPOSE
   Audits the key Sartor Windows scheduled tasks on Rocinante. For each task it
   reports LastRunTime + LastTaskResult, and FLAGS any task that either:
     - has a nonzero LastTaskResult (last run failed / non-success exit), OR
     - has a LastRunTime older than its expected cadence (+ grace) — i.e. the
       trigger silently stopped firing.

   Built 2026-06-11 during the overnight review. Motivating incident: the
   "Sartor Memory Mirror" task had been exiting with LastTaskResult=2
   (DIVERGED-MIRROR) for ~2 weeks with no surfacing. A nonzero-result auditor
   would have caught it on day one.

   Common LastTaskResult values:
     0          = success
     2          = ERROR_FILE_NOT_FOUND on some tasks; for the mirror script it
                  is the script's own `exit 2` DIVERGED-MIRROR marker
     1          = generic script failure (our scripts `exit 1` on fetch/push err)
     267009     = task currently running (STILL_ACTIVE) — not a failure
     267011     = task has never run — flagged as INFO, not failure
     0x80070002 = the program/file the task runs was not found

 OUTPUT
   - Prints a table to the console (safe to run by hand).
   - Appends a one-line timestamped status summary to:
       C:\Users\alto8\backups\task-health.log
   - Exit code 0 if all OK; 1 if any task is FLAGGED. (Useful if you later wrap
     it in a trigger that should mark itself failed when the fleet is unhealthy.)

   Idempotent: read-only against Task Scheduler; only side effect is the
   append-only log line. Safe to run repeatedly.

 SUGGESTED CADENCE
   Every 1-4 hours, OR piggy-back on the daily-household-health pass. Not
   registered as a scheduled task by this script on purpose — registration is
   left to Alton. To register a 4-hourly trigger (run as the alton user):

     $action  = New-ScheduledTaskAction -Execute "powershell.exe" `
                  -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\check-task-health.ps1"'
     $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
                  -RepetitionInterval (New-TimeSpan -Hours 4)
     Register-ScheduledTask -TaskName "Sartor Task Health Check" `
                  -Action $action -Trigger $trigger -RunLevel Limited -User alton

   (Or use schtasks /create. Leave the run window short; the script finishes in
   well under a second.)
=============================================================================
#>

$ErrorActionPreference = "Continue"

$logFile = "C:\Users\alto8\backups\task-health.log"
$now     = Get-Date

# Tasks to audit, with expected cadence in hours. Cadence is used only for the
# staleness check; nonzero LastTaskResult is flagged regardless of cadence.
# A grace multiplier (below) tolerates a couple of missed ticks before flagging.
$tasks = @(
    @{ Name = "Sartor Memory Mirror";        CadenceHours = 24 }   # daily 03:30 (see CLAUDE.md note: header claims 15-min, actually daily)
    @{ Name = "Sartor Peer Creds Sync";       CadenceHours = 4  }   # every 4h
    @{ Name = "UniFi Daily Backup";           CadenceHours = 24 }   # daily 03:00
    @{ Name = "Sartor Peer Sessions Mirror";  CadenceHours = 0.25 } # every 15 min
    @{ Name = "Sartor Hours Log";             CadenceHours = 24 }   # daily 23:55
)

# Grace: how many cadences of silence we tolerate before flagging staleness.
# 15-min jobs get more grace (laptop sleep, etc.); daily jobs less.
$graceMultiplier = 3

# Result codes that are NOT failures.
$benignResults = @{
    0      = "success"
    267009 = "running (STILL_ACTIVE)"
    267011 = "never run"
}

$rows    = @()
$flagged = @()

foreach ($t in $tasks) {
    $name        = $t.Name
    $cadenceHrs  = [double]$t.CadenceHours
    $info        = $null
    $row = [ordered]@{
        Task          = $name
        LastRunTime   = $null
        LastResult    = $null
        AgeHours      = $null
        Status        = $null
    }

    try {
        $info = Get-ScheduledTaskInfo -TaskName $name -ErrorAction Stop
    } catch {
        $row.Status      = "MISSING (not registered)"
        $rows += [pscustomobject]$row
        $flagged += "$name=MISSING"
        continue
    }

    $row.LastRunTime = $info.LastRunTime
    $row.LastResult  = $info.LastTaskResult

    # Age of last run (negative/null if never run)
    $ageHours = $null
    if ($info.LastRunTime -and $info.LastRunTime.Year -gt 1999) {
        $ageHours = [math]::Round(($now - $info.LastRunTime).TotalHours, 1)
        $row.AgeHours = $ageHours
    }

    $problems = @()

    # 1. Nonzero / non-benign LastTaskResult
    if (-not $benignResults.ContainsKey([int]$info.LastTaskResult)) {
        $problems += ("result=0x{0:X}/{1}" -f $info.LastTaskResult, $info.LastTaskResult)
    }

    # 2. Staleness — last run older than cadence * grace
    if ($null -ne $ageHours) {
        $staleThreshold = $cadenceHrs * $graceMultiplier
        if ($ageHours -gt $staleThreshold) {
            $problems += ("stale {0}h > {1}h" -f $ageHours, [math]::Round($staleThreshold,1))
        }
    } elseif ([int]$info.LastTaskResult -eq 267011) {
        $problems += "never run"
    }

    if ($problems.Count -gt 0) {
        $row.Status = "FLAGGED: " + ($problems -join "; ")
        $flagged += ("{0}=[{1}]" -f $name, ($problems -join ", "))
    } else {
        $resultLabel = $benignResults[[int]$info.LastTaskResult]
        $row.Status  = "OK ($resultLabel)"
    }

    $rows += [pscustomobject]$row
}

# --- Console table ---
$rows | Format-Table -AutoSize Task, LastRunTime, LastResult, AgeHours, Status

# --- One-line log summary ---
$ts = $now.ToString("yyyy-MM-dd HH:mm:ss")
if ($flagged.Count -eq 0) {
    $summary = "$ts OK all $($tasks.Count) tasks healthy"
    $exitCode = 0
} else {
    $summary = "$ts FLAGGED $($flagged.Count)/$($tasks.Count): " + ($flagged -join " | ")
    $exitCode = 1
}
Add-Content -Path $logFile -Value $summary

Write-Output ""
Write-Output $summary

exit $exitCode
