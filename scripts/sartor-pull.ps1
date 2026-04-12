# sartor-pull.ps1
# Stash-before-pull wrapper for interactive Rocinante sessions.
#
# Usage:
#   .\scripts\sartor-pull.ps1
#   pwsh scripts/sartor-pull.ps1
#
# Implements the commitment in OPERATING-AGREEMENT v1.0 section 1.2 item 2:
# Rocinante stashes uncommitted work (including untracked files) before every
# interactive pull, rebases, and restores the stash. If pop conflicts, a
# flagged inbox entry is written and the wrapper exits non-zero.
#
# Exit codes:
#   0 — clean pull, stash popped clean (or nothing to stash)
#   1 — pull failed; working tree restored to pre-pull state
#   2 — stash pop conflict; flagged inbox entry written; manual intervention required
#   3 — repo not a git working tree or wrong repo
#
# Related:
#   sartor/memory/reference/OPERATING-AGREEMENT.md §1.2
#   sartor/memory/inbox/rocinante/_flagged/
#
# History:
#   2026-04-12: created as part of OPERATING-AGREEMENT v1.0 execution (A5)

[CmdletBinding()]
param(
    [string]$RepoRoot = "C:\Users\alto8\Sartor-claude-network",
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[sartor-pull] $Message"
}

function Write-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
}

function Write-FlaggedEntry {
    param(
        [string]$Reason,
        [string]$Detail
    )
    $ts = Write-Timestamp
    $flagDir = Join-Path $RepoRoot "sartor\memory\inbox\rocinante\_flagged"
    if (-not (Test-Path $flagDir)) {
        New-Item -ItemType Directory -Path $flagDir -Force | Out-Null
    }
    $flagFile = Join-Path $flagDir "sartor-pull-conflict-$ts.md"
    $content = @"
---
type: event
id: rocinante-sartor-pull-conflict-$ts
origin: rocinante
author: sartor-pull.ps1
created: $((Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"))
target: inbox-only
operation: report
priority: p1
escalate: true
---

# Stash pop conflict during interactive pull

The sartor-pull wrapper successfully stashed local changes and pulled the remote, but could not cleanly restore the stash. Manual intervention is required before the next session continues.

## Reason

$Reason

## Detail

``````
$Detail
``````

## Next steps

1. Run ``git status`` in the repo to see the conflict state.
2. Resolve conflicts manually (``git stash list`` will show the preserved stash).
3. Once resolved, ``git stash drop`` to clean up.
4. Mark this entry processed by moving it to _processed/ in the next curator pass.

Repo: $RepoRoot
"@
    Set-Content -Path $flagFile -Value $content -Encoding UTF8
    Write-Host "[sartor-pull] Flagged inbox entry: $flagFile"
}

# --- Main ---

if (-not (Test-Path $RepoRoot)) {
    Write-Error "Repo root not found: $RepoRoot"
    exit 3
}

Push-Location $RepoRoot
try {
    # Verify we are in a git work tree
    $inRepo = & git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0 -or $inRepo -ne "true") {
        Write-Error "Not a git work tree: $RepoRoot"
        exit 3
    }

    # Check for dirty state (tracked + untracked)
    $statusRaw = & git status --porcelain 2>&1
    $hasChanges = ($statusRaw -and $statusRaw.Length -gt 0)

    $stashed = $false
    if ($hasChanges) {
        Write-Step "Stashing local changes (including untracked)"
        $stashMsg = "sartor-pull auto-stash $(Write-Timestamp)"
        & git stash push --include-untracked -m $stashMsg
        if ($LASTEXITCODE -ne 0) {
            Write-Error "git stash failed"
            exit 1
        }
        $stashed = $true
    } else {
        Write-Step "Working tree clean; no stash needed"
    }

    Write-Step "Pulling with rebase"
    $pullOutput = & git pull --rebase 2>&1
    $pullExit = $LASTEXITCODE
    if ($VerboseOutput) { Write-Host $pullOutput }
    if ($pullExit -ne 0) {
        Write-Step "Pull failed; aborting rebase and restoring stash if any"
        & git rebase --abort 2>$null
        if ($stashed) {
            & git stash pop 2>$null
        }
        Write-Error "git pull --rebase failed: $pullOutput"
        exit 1
    }

    if ($stashed) {
        Write-Step "Popping stash"
        $popOutput = & git stash pop 2>&1
        $popExit = $LASTEXITCODE
        if ($VerboseOutput) { Write-Host $popOutput }
        if ($popExit -ne 0) {
            $detail = ($popOutput | Out-String)
            Write-FlaggedEntry -Reason "git stash pop produced conflicts after sartor-pull rebase" -Detail $detail
            Write-Error "Stash pop conflict; flagged inbox entry written. See git status and sartor/memory/inbox/rocinante/_flagged/."
            exit 2
        }
    }

    Write-Step "Done. Working tree up to date."
    exit 0
}
finally {
    Pop-Location
}
