# register-wiki-reindex.ps1
#
# Defines the Windows scheduled task that runs sartor/memory/wiki.py --reindex
# nightly at 02:00 ET on Rocinante. Output:
# C:\Users\alto8\generated\wiki-reindex-YYYY-MM-DD.log (one per day, append).
#
# Schedule: 02:00 local time (America/New_York), every day.
# Action: python sartor/memory/wiki.py --reindex (cwd = repo root)
#
# Mirrors the SartorCuratorPass triple (curator-pass-run.cmd +
# curator-pass-task.xml + register-curator-pass.ps1).
#
# Manual install command (run from an elevated PowerShell):
#
#   Register-ScheduledTask `
#       -TaskName "SartorWikiReindex" `
#       -Xml (Get-Content -Raw "C:\Users\alto8\Sartor-claude-network\scripts\wiki-reindex-task.xml") `
#       -User "$env:USERNAME"
#
# To remove:        Unregister-ScheduledTask -TaskName "SartorWikiReindex" -Confirm:$false
# To run on demand: Start-ScheduledTask -TaskName "SartorWikiReindex"
# To inspect last run: Get-ScheduledTaskInfo -TaskName "SartorWikiReindex"

$ErrorActionPreference = "Stop"

$RepoRoot   = "C:\Users\alto8\Sartor-claude-network"
$LogDir     = "C:\Users\alto8\generated"
$TaskName   = "SartorWikiReindex"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "Created log directory: $LogDir"
}

Write-Host ""
Write-Host "To install the scheduled task, run from PowerShell:"
Write-Host ""
Write-Host "  Register-ScheduledTask ``"
Write-Host "      -TaskName `"$TaskName`" ``"
Write-Host "      -Xml (Get-Content -Raw `"$RepoRoot\scripts\wiki-reindex-task.xml`") ``"
Write-Host "      -User `"$env:USERNAME`""
Write-Host ""
Write-Host "Verify with: Get-ScheduledTask -TaskName $TaskName"
