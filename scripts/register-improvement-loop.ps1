# register-improvement-loop.ps1
#
# Defines the Windows scheduled task that runs sartor.improvement_loop weekly
# on Rocinante. Does NOT install -- Alton runs Register-ScheduledTask manually
# after reviewing.
#
# Schedule: Sunday 20:00 local time (America/New_York).
# Output: C:\Users\alto8\generated\improvement-loop-YYYY-MM-DD.log (one per day, append)
# Action: python -m sartor.improvement_loop -v (cwd = repo root)
#
# Manual install command (run from an elevated PowerShell):
#
#   Register-ScheduledTask `
#       -TaskName "SartorImprovementLoop" `
#       -Xml (Get-Content -Raw "C:\Users\alto8\Sartor-claude-network\scripts\improvement-loop-task.xml") `
#       -User "$env:USERNAME" `
#       -RunLevel Highest
#
# To remove: Unregister-ScheduledTask -TaskName "SartorImprovementLoop" -Confirm:$false
# To run on demand: Start-ScheduledTask -TaskName "SartorImprovementLoop"
# To inspect last run: Get-ScheduledTaskInfo -TaskName "SartorImprovementLoop"

$ErrorActionPreference = "Stop"

$RepoRoot   = "C:\Users\alto8\Sartor-claude-network"
$LogDir     = "C:\Users\alto8\generated"
$Python     = "python"
$TaskName   = "SartorImprovementLoop"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "Created log directory: $LogDir"
}

$LogStem    = Join-Path $LogDir "improvement-loop"
$Wrapper    = @"
@echo off
setlocal
set LOGFILE=$LogStem-%date:~10,4%-%date:~4,2%-%date:~7,2%.log
cd /d "$RepoRoot"
echo === %date% %time% === >> "%LOGFILE%"
"$Python" -m sartor.improvement_loop -v >> "%LOGFILE%" 2>&1
exit /b %ERRORLEVEL%
"@

$WrapperPath = Join-Path $RepoRoot "scripts\improvement-loop-run.cmd"
Set-Content -Path $WrapperPath -Value $Wrapper -Encoding ASCII
Write-Host "Wrote wrapper: $WrapperPath"

Write-Host ""
Write-Host "To install the scheduled task, run (elevated PowerShell):"
Write-Host ""
Write-Host "  Register-ScheduledTask ``"
Write-Host "      -TaskName `"$TaskName`" ``"
Write-Host "      -Xml (Get-Content -Raw `"$RepoRoot\scripts\improvement-loop-task.xml`") ``"
Write-Host "      -User `"$env:USERNAME`" ``"
Write-Host "      -RunLevel Highest"
Write-Host ""
Write-Host "Verify with: Get-ScheduledTask -TaskName $TaskName"
