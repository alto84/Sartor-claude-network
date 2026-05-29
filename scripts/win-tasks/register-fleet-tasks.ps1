# Register the two Sartor fleet Scheduled Tasks. Idempotent (replaces existing).
# Matches the household pattern (see register-sartor-unifi-controller.ps1): S4U for
# 'alton' (no stored password, no interactive desktop, no console flash), RunLevel
# Limited, wrapped by run-hidden.vbs. S4U gives the local 'alton' identity so the
# scripts can read ~/.ssh keys for the vast.ai SSH-via-gpuserver1 path.
#
#   SartorFleetWatchdog : every 10 min  -> scripts/win-tasks/fleet-watchdog.cmd
#                         (witness-side rental/host/thermal/price/expiry/disk monitor)
#   SartorFleetReprice  : every 15 min  -> scripts/win-tasks/fleet-reprice.cmd
#                         (adaptive market repricer for rtxserver 124192: anchor to 2nd-
#                          cheapest comparable RTX PRO 6000 + demand multiplier, bounded)
#   SartorFleetLedger   : daily 23:45   -> scripts/win-tasks/fleet-ledger.cmd
#                         (vast.ai revenue+state, power kWh, books, reconcile; ahead of
#                          the 23:55 Sartor Hours Log task)
#
# Requires an ELEVATED PowerShell to register (Task Scheduler S4U registration needs
# admin). The task itself runs Limited. Run:  powershell -ExecutionPolicy Bypass -File this.ps1
# (elevate first, e.g. Start-Process powershell -Verb RunAs).

$ErrorActionPreference = 'Stop'

$RepoRoot  = 'C:\Users\alto8\Sartor-claude-network'
$RunHidden = Join-Path $RepoRoot 'scripts\win-tasks\run-hidden.vbs'
$WatchCmd  = Join-Path $RepoRoot 'scripts\win-tasks\fleet-watchdog.cmd'
$RepriceCmd= Join-Path $RepoRoot 'scripts\win-tasks\fleet-reprice.cmd'
$LedgerCmd = Join-Path $RepoRoot 'scripts\win-tasks\fleet-ledger.cmd'

foreach ($p in @($RunHidden, $WatchCmd, $RepriceCmd, $LedgerCmd)) {
  if (-not (Test-Path $p)) { throw "Missing required file: $p" }
}

$Principal = New-ScheduledTaskPrincipal -UserId 'alton' -LogonType S4U -RunLevel Limited
$Settings  = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries:$true -DontStopIfGoingOnBatteries:$true `
  -StartWhenAvailable:$true -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 9) `
  -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 2)

function Register-FleetTask {
  param([string]$TaskName, [string]$CmdPath, [Microsoft.Management.Infrastructure.CimInstance]$Trigger, [string]$Desc)
  $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$RunHidden`" `"$CmdPath`""
  if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host "Replacing existing task '$TaskName'..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  }
  Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $Trigger `
    -Principal $Principal -Settings $Settings -Description $Desc | Out-Null
  Write-Host "Registered '$TaskName'."
}

# --- SartorFleetWatchdog: every 10 minutes, indefinitely ---
# PS 5.1 has no native minute-interval trigger; build one via repetition of a Once
# trigger (RepetitionDuration of ~10y avoids the [TimeSpan]::MaxValue bug).
$watchTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(3)
$rep = (New-ScheduledTaskTrigger -Once -At (Get-Date) `
          -RepetitionInterval (New-TimeSpan -Minutes 10) `
          -RepetitionDuration (New-TimeSpan -Days 3650)).Repetition
$watchTrigger.Repetition = $rep

Register-FleetTask -TaskName 'SartorFleetWatchdog' -CmdPath $WatchCmd -Trigger $watchTrigger `
  -Desc 'Witness-side vast.ai fleet monitor (rental/host-down/price-drift/reliability/error/expiry/marginal-floor/min-gpus/GPU-temp + Rocinante disk). Every 10 min. Writes inbox alert + data/financial/solar-inference/fleet-health.json; phone alert on ORANGE+ if watchdog-notify.yaml configured. See scripts/fleet-watchdog.py.'

# --- SartorFleetReprice: every 15 minutes, indefinitely (offset 5 min from watchdog) ---
$repriceTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(8)
$repRep = (New-ScheduledTaskTrigger -Once -At (Get-Date) `
            -RepetitionInterval (New-TimeSpan -Minutes 15) `
            -RepetitionDuration (New-TimeSpan -Days 3650)).Repetition
$repriceTrigger.Repetition = $repRep
Register-FleetTask -TaskName 'SartorFleetReprice' -CmdPath $RepriceCmd -Trigger $repriceTrigger `
  -Desc 'Adaptive market repricer for rtxserver (124192): anchors to the 2nd-cheapest comparable RTX PRO 6000 listing (strict-2-GPU preferred, per-GPU fallback) x a demand multiplier learned from fill-latency/idle, bounded by electricity floor + peer ceiling + per-run step cap; preserves min_gpus=2. Every 15 min. Sets the vast.ai price, updates business/fleet.yaml, logs decisions to data/financial/solar-inference/reprice-log.jsonl. See scripts/fleet/reprice.py.'

# --- SartorFleetLedger: daily 23:45 ---
$ledgerTrigger = New-ScheduledTaskTrigger -Daily -At 23:45
Register-FleetTask -TaskName 'SartorFleetLedger' -CmdPath $LedgerCmd -Trigger $ledgerTrigger `
  -Desc 'Daily vast.ai revenue+state pull, power kWh ingest, books rebuild, doc reconcile for the Solar Inference fleet. Runs 23:45 (before Sartor Hours Log 23:55). See scripts/fleet/.'

Write-Host ''
Write-Host 'Done. Verify:  Get-ScheduledTask SartorFleetWatchdog,SartorFleetReprice,SartorFleetLedger | Format-Table TaskName,State'
Write-Host 'Test now:      Start-ScheduledTask -TaskName SartorFleetReprice ; Get-Content C:\Users\alto8\backups\fleet-reprice.log -Tail 20'
