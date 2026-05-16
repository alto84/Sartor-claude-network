# research-dashboard.ps1 — Rocinante Scheduled Task wrapper for research-dashboard-gen.py.
# Regenerates sartor/memory/research/dashboard.html every 30 minutes from the
# canonical Sartor working tree.
#
# Design doc: sartor/memory/projects/research-nightly-cron-2026-05-12.md
#
# Install (after Alton greenlight):
#   schtasks /create /TN "Sartor Research Dashboard" /SC MINUTE /MO 30 `
#     /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\alto8\Sartor-claude-network\scripts\win-tasks\research-dashboard.ps1" `
#     /RU alto8

$ErrorActionPreference = 'Stop'

$repo   = 'C:\Users\alto8\Sartor-claude-network'
$script = Join-Path $repo 'scripts\research-dashboard-gen.py'
$logDir = 'C:\Users\alto8\backups'
$logFile = Join-Path $logDir 'research-dashboard.log'

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path $logFile -Value "[$stamp] research-dashboard tick start"

Set-Location $repo

# Prefer the system Python; fall back to py.exe if installed.
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) {
    $py = (Get-Command py -ErrorAction SilentlyContinue).Source
}
if (-not $py) {
    Add-Content -Path $logFile -Value "[$stamp] ABORT: no python found on PATH"
    exit 1
}

try {
    $out = & $py $script 2>&1
    Add-Content -Path $logFile -Value "[$stamp] $out"
    Add-Content -Path $logFile -Value "[$stamp] research-dashboard tick OK"
}
catch {
    Add-Content -Path $logFile -Value "[$stamp] research-dashboard tick FAILED: $_"
    exit 1
}
