# register-gmail-scan.ps1
#
# Defines the Windows scheduled task that runs sartor.gmail_scan every 4 hours
# on Rocinante (06:00, 10:00, 14:00, 18:00, 22:00).
#
# Schedule: Every 4 hours at the times above (America/New_York)
# Output: C:\Users\alto8\generated\gmail-scan-YYYY-MM-DD.log (one per day, append)
# Action: python -m sartor.gmail_scan -v (cwd = repo root)
#
# Install command (no elevation needed):
#
#   Register-ScheduledTask `
#       -TaskName "SartorGmailScan" `
#       -Xml (Get-Content -Raw "C:\Users\alto8\Sartor-claude-network\scripts\gmail-scan-task.xml") `
#       -User "$env:USERNAME"
#
# To remove: Unregister-ScheduledTask -TaskName "SartorGmailScan" -Confirm:$false
# To run on demand: Start-ScheduledTask -TaskName "SartorGmailScan"
# To inspect last run: Get-ScheduledTaskInfo -TaskName "SartorGmailScan"

$ErrorActionPreference = "Stop"

$RepoRoot   = "C:\Users\alto8\Sartor-claude-network"
$LogDir     = "C:\Users\alto8\generated"
$TaskName   = "SartorGmailScan"
$XmlPath    = Join-Path $RepoRoot "scripts\gmail-scan-task.xml"

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
