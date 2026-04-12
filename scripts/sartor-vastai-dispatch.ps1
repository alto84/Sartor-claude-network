# sartor-vastai-dispatch.ps1
# Dispatch wrapper that closes the pricing-execution gap described in
# OPERATING-AGREEMENT v1.0 §5.2 (Option A).
#
# STATUS: DORMANT. This wrapper will not execute vastai commands until
# $env:ENABLE_VASTAI_DISPATCH -eq "true". Enabling requires Alton's approval
# of OPEN_QUESTIONS Q3 in OPERATING-AGREEMENT.md.
#
# Until enabled, running this script performs a dry-run: it reads any
# pricing-action-*.md files in inbox/gpuserver1/, validates them against
# feedback_pricing_autonomy.md limits, and logs what it WOULD have done to a
# dry-run log at inbox/rocinante/_curator_logs/vastai-dispatch-dryrun-{ts}.md
#
# Usage:
#   pwsh scripts/sartor-vastai-dispatch.ps1              # dry-run
#   $env:ENABLE_VASTAI_DISPATCH = "true"; pwsh scripts/sartor-vastai-dispatch.ps1  # live
#
# History:
#   2026-04-12: created as part of OPERATING-AGREEMENT v1.0 execution (A7
#   proposal appendix). DORMANT until Alton Q3 resolution.

[CmdletBinding()]
param(
    [string]$RepoRoot = "C:\Users\alto8\Sartor-claude-network",
    [string]$SshTarget = "alton@192.168.1.100",
    [int]$MachineId = 52271,
    [switch]$ForceDryRun
)

$ErrorActionPreference = "Stop"

$live = ($env:ENABLE_VASTAI_DISPATCH -eq "true") -and (-not $ForceDryRun)
$mode = if ($live) { "LIVE" } else { "DRY-RUN" }

function Write-Step {
    param([string]$Message)
    Write-Host "[sartor-vastai-dispatch ($mode)] $Message"
}

function Get-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
}

function Validate-Action {
    param(
        [hashtable]$Action
    )
    $errors = @()

    $required = @('action', 'old_price_gpu', 'new_price_gpu', 'delta_gpu', 'machine_id', 'within_autonomy', 'cooldown_ok', 'floor_ceiling_ok', 'occupancy_7d_pct', 'trigger')
    foreach ($f in $required) {
        if (-not $Action.ContainsKey($f)) {
            $errors += "missing required field: $f"
        }
    }
    if ($errors.Count -gt 0) { return $errors }

    if ($Action.action -ne 'bump' -and $Action.action -ne 'revert') {
        $errors += "action must be 'bump' or 'revert' (got '$($Action.action)'); cuts are never dispatched autonomously"
    }
    if ($Action.within_autonomy -ne $true) {
        $errors += "within_autonomy must be true"
    }
    if ([double]$Action.new_price_gpu -lt 0.25 -or [double]$Action.new_price_gpu -gt 0.55) {
        $errors += "new_price_gpu $($Action.new_price_gpu) outside [0.25, 0.55]"
    }
    $delta = [double]$Action.delta_gpu
    if ($Action.action -eq 'bump' -and ($delta -ne 0.025 -and $delta -ne 0.05)) {
        $errors += "delta_gpu $delta must be 0.025 or 0.05 for bump"
    }
    if ($Action.cooldown_ok -ne $true) {
        $errors += "cooldown_ok must be true"
    }
    if ($Action.floor_ceiling_ok -ne $true) {
        $errors += "floor_ceiling_ok must be true"
    }
    if ($Action.action -eq 'bump') {
        $occ = [double]$Action.occupancy_7d_pct
        if ($delta -eq 0.025 -and $occ -lt 90) {
            $errors += "occupancy_7d_pct $occ below 90 for +0.025 bump"
        }
        if ($delta -eq 0.05 -and $occ -lt 95) {
            $errors += "occupancy_7d_pct $occ below 95 for +0.05 bump"
        }
    }
    if ([int]$Action.machine_id -ne $MachineId) {
        $errors += "machine_id mismatch: expected $MachineId got $($Action.machine_id)"
    }
    return $errors
}

function Parse-Frontmatter {
    param([string]$Content)
    $fm = @{}
    if (-not ($Content -match "(?s)^---\r?\n(.*?)\r?\n---")) {
        return $fm
    }
    $block = $Matches[1]
    foreach ($line in $block -split "`n") {
        if ($line -match "^\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$") {
            $k = $Matches[1]
            $v = $Matches[2] -replace '^"|"$', ''
            if ($v -eq 'true') { $v = $true }
            elseif ($v -eq 'false') { $v = $false }
            elseif ($v -match '^-?\d+(\.\d+)?$') { $v = [double]$v }
            $fm[$k] = $v
        }
    }
    return $fm
}

# --- Main ---

Push-Location $RepoRoot
try {
    $inboxDir = Join-Path $RepoRoot "sartor\memory\inbox\gpuserver1"
    if (-not (Test-Path $inboxDir)) {
        Write-Step "Inbox directory not found: $inboxDir"
        exit 0
    }

    $actionFiles = Get-ChildItem -Path $inboxDir -Filter "pricing-action-*.md" -ErrorAction SilentlyContinue
    if ($actionFiles.Count -eq 0) {
        Write-Step "No pricing-action-*.md files found. Nothing to do."
        exit 0
    }

    $ts = Get-Timestamp
    $logDir = Join-Path $RepoRoot "sartor\memory\inbox\rocinante\_curator_logs"
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    $logFile = Join-Path $logDir "vastai-dispatch-$(if ($live) { 'live' } else { 'dryrun' })-$ts.md"
    $logLines = @(
        "---"
        "type: vastai-dispatch-log"
        "run_id: vastai-dispatch-$ts"
        "mode: $mode"
        "live_enabled: $live"
        "run_started: $ts"
        "---"
        ""
        "# vastai dispatch run $ts ($mode)"
        ""
    )

    foreach ($f in $actionFiles) {
        $content = Get-Content -Raw -Path $f.FullName
        $fm = Parse-Frontmatter -Content $content
        $logLines += "## $($f.Name)"
        $logLines += ""
        $logLines += "- action: $($fm.action)"
        $logLines += "- old_price_gpu: $($fm.old_price_gpu)"
        $logLines += "- new_price_gpu: $($fm.new_price_gpu)"
        $logLines += "- delta_gpu: $($fm.delta_gpu)"
        $logLines += "- occupancy_7d_pct: $($fm.occupancy_7d_pct)"

        $errors = Validate-Action -Action $fm
        if ($errors.Count -gt 0) {
            $logLines += ""
            $logLines += "### VALIDATION FAILED"
            foreach ($e in $errors) { $logLines += "- $e" }
            $logLines += ""
            $logLines += "Action REFUSED. Would escalate to Alton via p1 inbox entry."
            Write-Step "Refused $($f.Name): $($errors -join '; ')"
            continue
        }

        $logLines += ""
        $logLines += "### VALIDATION OK"
        if ($live) {
            $bid = [math]::Round([double]$fm.new_price_gpu * 0.75, 2)
            $cmd = "~/.local/bin/vastai list machine $MachineId -g $($fm.new_price_gpu) -b $bid -s 0.10 -m 1 -e `"08/24/2026`""
            Write-Step "Executing: ssh $SshTarget '$cmd'"
            $out = & ssh $SshTarget $cmd 2>&1
            $exit = $LASTEXITCODE
            $logLines += "- command: ``$cmd``"
            $logLines += "- exit_code: $exit"
            $logLines += "- output:"
            $logLines += '```'
            $logLines += ($out | Out-String).Trim()
            $logLines += '```'
            if ($exit -eq 0) {
                Write-Step "Applied $($f.Name); moving to _processed/"
                # Move file to _processed/{date}/
                $proc = Join-Path $inboxDir "_processed\$((Get-Date).ToString('yyyy-MM-dd'))"
                if (-not (Test-Path $proc)) { New-Item -ItemType Directory -Path $proc -Force | Out-Null }
                Move-Item -Path $f.FullName -Destination (Join-Path $proc $f.Name) -Force
            } else {
                $logLines += ""
                $logLines += "### DISPATCH FAILED — ESCALATING TO ALTON"
            }
        } else {
            $bid = [math]::Round([double]$fm.new_price_gpu * 0.75, 2)
            $cmd = "~/.local/bin/vastai list machine $MachineId -g $($fm.new_price_gpu) -b $bid -s 0.10 -m 1 -e `"08/24/2026`""
            $logLines += "- would execute: ``$cmd``"
            $logLines += "- would move entry to _processed/ on success"
            Write-Step "Would execute: $cmd"
        }
        $logLines += ""
    }

    Set-Content -Path $logFile -Value ($logLines -join "`n") -Encoding UTF8
    Write-Step "Log: $logFile"
    exit 0
}
finally {
    Pop-Location
}
