# register-morning-briefing.ps1
#
# Defines the Windows scheduled task that runs sartor.morning_briefing daily
# at 06:30 AM ET on Rocinante.
#
# Schedule: Daily at 06:30 (America/New_York)
# Output: C:\Users\alto8\generated\morning-briefing-YYYY-MM-DD.log
# Action: python -m sartor.morning_briefing -v (cwd = repo root)
#
# This replaces the old morning-briefing scheduled task that was dispatched
# via SartorHeartbeat. The new task runs sartor/morning_briefing.py directly
# (Python, no LLM) for the offline briefing, which can be augmented by
# Claude Code's /morning skill at runtime for MCP-dependent sections.
#
# Install command (no elevation needed):
#
#   Register-ScheduledTask `
#       -TaskName "SartorMorningBriefing" `
#       -Xml (Get-Content -Raw "C:\Users\alto8\Sartor-claude-network\scripts\morning-briefing-task.xml") `
#       -User "$env:USERNAME"
#
# To remove: Unregister-ScheduledTask -TaskName "SartorMorningBriefing" -Confirm:$false
# To run on demand: Start-ScheduledTask -TaskName "SartorMorningBriefing"
# To inspect last run: Get-ScheduledTaskInfo -TaskName "SartorMorningBriefing"

$ErrorActionPreference = "Stop"

$RepoRoot   = "C:\Users\alto8\Sartor-claude-network"
$LogDir     = "C:\Users\alto8\generated"
$TaskName   = "SartorMorningBriefing"
$XmlPath    = Join-Path $RepoRoot "scripts\morning-briefing-task.xml"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "Created log directory: $LogDir"
}

Write-Host "Registering scheduled task: $TaskName"
Write-Host "XML: $XmlPath"
Write-Host ""

try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Xml (Get-Content -Raw $XmlPath) `
        -User "$env:USERNAME"
    Write-Host "Successfully registered: $TaskName"
} catch {
    Write-Host "Registration failed: $_"
    Write-Host ""
    Write-Host "Try running manually:"
    Write-Host "  Register-ScheduledTask -TaskName `"$TaskName`" -Xml (Get-Content -Raw `"$XmlPath`") -User `"$env:USERNAME`""
    exit 1
}

Write-Host ""
Write-Host "Verify with: Get-ScheduledTask -TaskName $TaskName"
