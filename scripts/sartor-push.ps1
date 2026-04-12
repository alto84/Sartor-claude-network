# sartor-push.ps1
# Push wrapper that treats git push failures as incidents.
#
# Usage:
#   .\scripts\sartor-push.ps1
#   .\scripts\sartor-push.ps1 -RootCause "some explanation"
#
# Implements OPERATING-AGREEMENT v1.0 §1.2 item 5:
#   Rocinante treats git push failures as incident-class events. Every push
#   failure gets an entry in sartor/memory/daily/ with the exact error, the
#   root cause, and the fix applied. No silent retries.
#
# Also implements §1.2 item 1: runs ``git status --porcelain`` before pushing
# and refuses to push on a surprise dirty tree unless -Force is passed.
#
# Exit codes:
#   0 — push succeeded
#   1 — push failed; incident entry written to sartor/memory/daily/{today}.md
#   2 — dirty working tree and -Force not passed; push refused
#   3 — wrong repo / not a git work tree
#
# History:
#   2026-04-12: created as part of OPERATING-AGREEMENT v1.0 execution (A8)

[CmdletBinding()]
param(
    [string]$RepoRoot = "C:\Users\alto8\Sartor-claude-network",
    [string]$RootCause = "",
    [switch]$Force,
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Continue"

function Write-Step {
    param([string]$Message)
    Write-Host "[sartor-push] $Message"
}

function Append-IncidentLog {
    param(
        [string]$ErrorText,
        [string]$Command,
        [string]$Cause,
        [string]$Fix
    )
    $todayUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
    $dailyFile = Join-Path $RepoRoot "sartor\memory\daily\$todayUtc.md"
    $dailyDir = Split-Path $dailyFile -Parent
    if (-not (Test-Path $dailyDir)) {
        New-Item -ItemType Directory -Path $dailyDir -Force | Out-Null
    }
    $tsIso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

    $incident = @"

## Push failure incident $tsIso

- command: ``$Command``
- root_cause: $Cause
- fix: $Fix
- source: sartor-push.ps1 (OPERATING-AGREEMENT §1.2 item 5)

### stderr

``````
$ErrorText
``````

"@

    if (-not (Test-Path $dailyFile)) {
        $header = @"
---
type: daily-log
date: $todayUtc
---

# Daily log $todayUtc

"@
        Set-Content -Path $dailyFile -Value $header -Encoding UTF8
    }
    Add-Content -Path $dailyFile -Value $incident -Encoding UTF8
    Write-Host "[sartor-push] Incident logged to $dailyFile"
}

# --- Main ---

if (-not (Test-Path $RepoRoot)) {
    Write-Error "Repo root not found: $RepoRoot"
    exit 3
}

Push-Location $RepoRoot
try {
    $inRepo = & git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0 -or $inRepo -ne "true") {
        Write-Error "Not a git work tree: $RepoRoot"
        exit 3
    }

    # §1.2 item 1: preflight clean-tree check
    $statusRaw = & git status --porcelain 2>&1
    $hasChanges = ($statusRaw -and $statusRaw.Length -gt 0)
    if ($hasChanges -and -not $Force) {
        Write-Host ""
        Write-Host "[sartor-push] Refusing to push: working tree is dirty."
        Write-Host "[sartor-push] Explicitly stage and commit (or pass -Force) before pushing."
        Write-Host ""
        Write-Host $statusRaw
        exit 2
    }

    # Determine push command for logging
    $pushCmd = "git push"

    Write-Step "Running git push"
    $pushOut = & git push 2>&1
    $pushExit = $LASTEXITCODE
    $pushOutString = ($pushOut | Out-String)
    if ($VerboseOutput) { Write-Host $pushOutString }

    if ($pushExit -ne 0) {
        $cause = if ($RootCause) { $RootCause } else { "TBD — fill in after investigating" }
        $fix = "TBD — document the fix applied after resolution"
        Append-IncidentLog -ErrorText $pushOutString -Command $pushCmd -Cause $cause -Fix $fix
        Write-Error "git push failed (exit $pushExit). Incident logged."
        exit 1
    }

    Write-Step "Push succeeded."
    exit 0
}
finally {
    Pop-Location
}
