# register-curator-pass.ps1
#
# Defines the Windows scheduled task that runs sartor.curator_pass twice daily
# on Rocinante. Does NOT install — Alton runs Register-ScheduledTask manually
# after reviewing.
#
# Schedule: 07:30 and 19:30 local time (America/New_York), every day.
# Output: C:\Users\alto8\generated\curator-pass-YYYY-MM-DD.log (one per day, append)
# Action: python -m sartor.curator_pass (cwd = repo root)
#
# Manual install command (run from an elevated PowerShell):
#
#   Register-ScheduledTask `
#       -TaskName "SartorCuratorPass" `
#       -Xml (Get-Content -Raw "C:\Users\alto8\Sartor-claude-network\scripts\curator-pass-task.xml") `
#       -User "$env:USERNAME" `
#       -RunLevel Highest
#
# To remove: Unregister-ScheduledTask -TaskName "SartorCuratorPass" -Confirm:$false
# To run on demand: Start-ScheduledTask -TaskName "SartorCuratorPass"
# To inspect last run: Get-ScheduledTaskInfo -TaskName "SartorCuratorPass"

$ErrorActionPreference = "Stop"

$RepoRoot   = "C:\Users\alto8\Sartor-claude-network"
$LogDir     = "C:\Users\alto8\generated"
$Python     = "python"
$TaskName   = "SartorCuratorPass"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "Created log directory: $LogDir"
}

$LogStem    = Join-Path $LogDir "curator-pass"
$Wrapper    = @"
@echo off
setlocal
set LOGFILE=$LogStem-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
cd /d "$RepoRoot"
echo === %date% %time% === >> "%LOGFILE%"
"$Python" -m sartor.curator_pass -v >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
"@

$WrapperPath = Join-Path $RepoRoot "scripts\curator-pass-run.cmd"
Set-Content -Path $WrapperPath -Value $Wrapper -Encoding ASCII
Write-Host "Wrote wrapper: $WrapperPath"

Write-Host ""
Write-Host "To install the scheduled task, run (elevated PowerShell):"
Write-Host ""
Write-Host "  Register-ScheduledTask ``"
Write-Host "      -TaskName `"$TaskName`" ``"
Write-Host "      -Xml (Get-Content -Raw `"$RepoRoot\scripts\curator-pass-task.xml`") ``"
Write-Host "      -User `"$env:USERNAME`" ``"
Write-Host "      -RunLevel Highest"
Write-Host ""
Write-Host "Verify with: Get-ScheduledTask -TaskName $TaskName"
