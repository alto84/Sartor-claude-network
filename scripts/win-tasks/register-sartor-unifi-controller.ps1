# Register the "Sartor UniFi Controller" Windows scheduled task that
# auto-starts the UniFi controller at boot. Idempotent: re-running replaces
# the existing definition with the current one.
#
# Trigger:  At system startup (does not require user logon)
# Logon:    S4U for user 'alton' (no interactive desktop session, no flash;
#           matches the pattern used for the other 6 Sartor scheduled tasks
#           per the 2026-05-13 audit; principal is 'alton' so the task can
#           read files in C:\Users\alto8\Ubiquiti UniFi\)
# Action:   wscript.exe run-hidden.vbs -> powershell.exe -File sartor-unifi-control.ps1 start
#           (consistent with the other 6 Sartor tasks; no visible window)
# Run as:   alton (NOT SYSTEM — UniFi data dir is per-user)
# Elevation: requires admin to register; the task itself runs at Limited level
#
# Requires: must be run from an elevated PowerShell. The script does NOT
# auto-elevate; the caller does (Start-Process -Verb RunAs).

$ErrorActionPreference = 'Stop'

$TaskName    = 'Sartor UniFi Controller'
$RepoRoot    = 'C:\Users\alto8\Sartor-claude-network'
$RunHidden   = Join-Path $RepoRoot 'scripts\win-tasks\run-hidden.vbs'
$Controller  = Join-Path $RepoRoot 'scripts\win-tasks\sartor-unifi-control.ps1'

# Sanity checks
if (-not (Test-Path $RunHidden))  { throw "Missing wrapper: $RunHidden" }
if (-not (Test-Path $Controller)) { throw "Missing controller script: $Controller" }

# Build the action: wscript.exe run-hidden.vbs "powershell.exe ... start"
$PsCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$Controller`" start"
$Action = New-ScheduledTaskAction `
  -Execute 'wscript.exe' `
  -Argument "`"$RunHidden`" `"$PsCommand`""

# Trigger: at system startup, single one-shot
$Trigger = New-ScheduledTaskTrigger -AtStartup
# Delay 90s after boot to let networking + Hyper-V come up before binding 8443
$Trigger.Delay = 'PT90S'

# Principal: S4U (no flash, no interactive desktop)
$Principal = New-ScheduledTaskPrincipal `
  -UserId 'alton' `
  -LogonType S4U `
  -RunLevel Limited

# Settings: hidden, restart on failure, no parallel runs
$Settings = New-ScheduledTaskSettingsSet `
  -Hidden:$true `
  -AllowStartIfOnBatteries:$true `
  -DontStopIfGoingOnBatteries:$true `
  -StartWhenAvailable:$true `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 5)

# Register / replace
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Replacing existing task '$TaskName'..."
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask -TaskName $TaskName `
  -Action $Action `
  -Trigger $Trigger `
  -Principal $Principal `
  -Settings $Settings `
  -Description "Auto-start the UniFi controller on Rocinante boot. Hidden, S4U, 90s delay after startup. See scripts/win-tasks/sartor-unifi-control.ps1 for the underlying control script." `
  | Out-Null

Write-Host "Registered '$TaskName'. Verify with: Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "Test run (one-shot):  Start-ScheduledTask -TaskName '$TaskName'"
