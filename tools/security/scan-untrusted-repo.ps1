<#
.SYNOPSIS
  Read-only IOC scanner for the Miasma / Mini Shai-Hulud npm-worm class and, more
  generally, the "install-time execution / hostile AI-agent config" attack surface.

  Run this BEFORE opening, cd-ing into, or npm-installing any untrusted third-party
  repo with the Sartor agent. This agent runs in bypass/auto permission mode with a
  live SessionStart hook system: opening a repo that ships a poisoned .claude/settings.json
  is arbitrary code execution before the agent can react. Scan from outside, first.

  SAFETY: this script is strictly read-only against the target. It never executes,
  imports, dot-sources, or npm-installs anything from the scanned path. It only reads
  files and (if a .git dir is present) runs `git log` / `git grep`.

.PARAMETER Path
  Directory to scan (the untrusted repo). Required unless -SelfCheck is used.

.PARAMETER SelfCheck
  Scan the Sartor repo itself AND validate its .claude hooks against the pinned
  known-good allowlist (tamper / drift detection on our own high-privilege config).

.PARAMETER Json
  Emit a machine-readable JSON object instead of the human report (for the agent).

.EXAMPLE
  pwsh tools/security/scan-untrusted-repo.ps1 -Path C:\staging\some-cloned-repo
.EXAMPLE
  pwsh tools/security/scan-untrusted-repo.ps1 -SelfCheck

  Exit codes: 0 = PASS (no findings)   2 = FLAGGED (one or more findings)   3 = error
#>
[CmdletBinding()]
param(
    [string]$Path,
    [switch]$SelfCheck,
    [switch]$Json
)

$ErrorActionPreference = 'Stop'

# --- Sartor repo root (this script lives at <repo>\tools\security\) ---
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

if ($SelfCheck) { $Path = $RepoRoot }
if ([string]::IsNullOrWhiteSpace($Path)) {
    Write-Host "ERROR: -Path is required (or use -SelfCheck)." -ForegroundColor Red
    exit 3
}
try { $Path = (Resolve-Path $Path).Path } catch {
    Write-Host "ERROR: path not found: $Path" -ForegroundColor Red
    exit 3
}

# --- Known-good Sartor hook commands (pinned allowlist for -SelfCheck drift detection) ---
# If a hook command in our own .claude/settings.json is NOT on this list, SelfCheck flags it.
# Update deliberately when you intentionally add a hook.
$KnownGoodHooks = @(
    'bash ./scripts/home-agent/memory/inject-user-context.sh',
    'bash ./scripts/home-agent/security/validate-command.sh',
    'bash ./scripts/home-agent/security/financial-data-gate.sh',
    'bash ./scripts/home-agent/security/no-secrets-in-output.sh',
    'bash ./scripts/home-agent/governance/audit-logger.sh',
    'bash ./scripts/home-agent/trajectories/log-trajectory.sh',
    'bash ./scripts/home-agent/governance/loop-detection.sh',
    'bash ./scripts/home-agent/trajectories/finalize-session-trajectory.sh',
    'bash ./scripts/home-agent/skills/should-reflect.sh'
)

# --- Worm-affected npm package names (Miasma / Mini Shai-Hulud, June 2026) ---
$WormPackages = @(
    '@vapi-ai/server-sdk','ai-sdk-ollama','autotel','autotel-mcp','awaitly',
    'executable-stories','executable-stories-demo','node-env-resolver','wrangler-deploy'
)

# --- Sartor-owned paths that legitimately contain IOC literals (this tooling). ---
# Suppressed ONLY under -SelfCheck (trusted context). An untrusted -Path scan is full-sensitivity:
# a foreign repo shipping a `tools/security/` decoy must still trip the strings.
$SelfOwnedIocPaths = @('tools/security/', '.claude/skills/untrusted-repo-intake/')
function Test-SelfOwned {
    param([string]$rel)
    if (-not $SelfCheck) { return $false }
    $n = $rel -replace '\\','/'
    foreach ($p in $SelfOwnedIocPaths) { if ($n -like "$p*") { return $true } }
    return $false
}

# --- C2 / worm string IOCs ---
$WormStrings = @(
    'liuende501','windy629','HerGomUli','thebeautifulmarchoftime',
    'IfYouInvalidateThisTokenItWillNukeTheComputerOfTheOwner',
    'shai-hulud','Shai-Hulud','niagA oG eW ereH','Miasma - The Spreading Blight',
    'bun-v1.3.13','stub.c'
)

# --- findings collector ---
$Findings = New-Object System.Collections.ArrayList
function Add-Finding {
    param([ValidateSet('CRITICAL','HIGH','REVIEW')][string]$Severity,[string]$Category,[string]$Detail)
    [void]$Findings.Add([pscustomobject]@{ severity=$Severity; category=$Category; detail=$Detail })
}

function Read-Safe { param([string]$f)
    try { return [string](Get-Content -LiteralPath $f -Raw -ErrorAction Stop) } catch { return '' }
}

# ============================================================================
# CHECK 1 — AI-agent config dropper files present
# ============================================================================
$DropperPaths = @(
    '.claude/setup.mjs','.claude/setup.js',
    '.github/setup.js','.github/setup.mjs',
    '.cursor/rules/setup.mdc',
    '.vscode/setup.mjs','.vscode/setup.js'
)
foreach ($rel in $DropperPaths) {
    $full = Join-Path $Path $rel
    if (Test-Path -LiteralPath $full -PathType Leaf) {
        Add-Finding 'CRITICAL' 'agent-config-dropper' "Dropper file present: $rel"
    }
}
# any .cursor/rules/*.mdc that force-runs node
$cursorRules = Join-Path $Path '.cursor/rules'
if (Test-Path -LiteralPath $cursorRules) {
    Get-ChildItem -LiteralPath $cursorRules -Filter '*.mdc' -File -ErrorAction SilentlyContinue | ForEach-Object {
        $c = Read-Safe $_.FullName
        if ($c -match 'alwaysApply:\s*true' -and $c -match 'node\s+\S+\.(m?js)') {
            Add-Finding 'CRITICAL' 'agent-config-dropper' "Cursor rule auto-runs node: $($_.Name)"
        }
    }
}

# ============================================================================
# CHECK 2 — Hostile hooks in AI-agent settings
# ============================================================================
$SettingsFiles = @(
    '.claude/settings.json','.claude/settings.local.json',
    '.gemini/settings.json','.vscode/tasks.json'
)
foreach ($rel in $SettingsFiles) {
    $full = Join-Path $Path $rel
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }
    $raw = Read-Safe $full

    # cheap textual triage first (works even if JSON won't parse)
    if ($raw -match 'node\s+[^\s"'']*setup\.(m?js)' -or $raw -match '\.github[\\/]setup\.(m?js|js)') {
        Add-Finding 'CRITICAL' 'hostile-hook' "$rel references a node setup dropper"
    }
    if ($rel -eq '.vscode/tasks.json' -and $raw -match 'folderOpen') {
        Add-Finding 'HIGH' 'hostile-hook' ".vscode/tasks.json has a runOn:folderOpen task (auto-exec on open)"
    }

    # structured hook inspection for .claude/settings*.json
    if ($rel -like '.claude/settings*.json') {
        try {
            $obj = $raw | ConvertFrom-Json
            $hookCmds = @()
            if ($obj.hooks) {
                foreach ($evt in $obj.hooks.PSObject.Properties) {
                    foreach ($grp in @($evt.Value)) {
                        foreach ($h in @($grp.hooks)) {
                            if ($h.command) { $hookCmds += [string]$h.command }
                        }
                    }
                }
            }
            foreach ($cmd in $hookCmds) {
                $isNodeDrop = ($cmd -match '\bnode\b' -or $cmd -match '\.m?js\b' -or $cmd -match 'curl|iwr|Invoke-WebRequest|wget|powershell\s+-e')
                if ($isNodeDrop) {
                    Add-Finding 'CRITICAL' 'hostile-hook' "$rel hook runs suspicious command: $cmd"
                }
                if ($SelfCheck -and ($KnownGoodHooks -notcontains $cmd)) {
                    Add-Finding 'HIGH' 'self-hook-drift' "Hook not on pinned allowlist (tamper?): $cmd"
                }
            }
        } catch {
            Add-Finding 'REVIEW' 'unparseable-settings' "$rel did not parse as JSON; inspect manually"
        }
    }
}

# ============================================================================
# CHECK 3 — binding.gyp install-time execution (Phantom Gyp)
# ============================================================================
# Legit native modules use <!(node -p ...) / <!(node -e ...) for variable expansion.
# The worm uses <!(node <scriptfile>.js ... && echo stub.c) to RUN a script at install.
Get-ChildItem -LiteralPath $Path -Recurse -File -Filter 'binding.gyp' -ErrorAction SilentlyContinue | ForEach-Object {
    $c = Read-Safe $_.FullName
    $rel = $_.FullName.Substring($Path.Length).TrimStart('\','/')
    $malicious = $false
    if ($c -match 'stub\.c') { $malicious = $true }
    if ($c -match '<!\([^)]*node\s+\S+\.(m?js)') { $malicious = $true }   # runs a script file, not -p/-e
    if ($c -match '<!\([^)]*&&\s*echo') { $malicious = $true }
    if ($malicious) {
        Add-Finding 'CRITICAL' 'binding-gyp-exec' "binding.gyp runs a script at install: $rel"
    } elseif (($_.Length -le 220) -and ($c -match '<!\([^)]*node\b') -and ($c -notmatch 'node\s+-[pe]\b')) {
        Add-Finding 'REVIEW' 'binding-gyp-exec' "small binding.gyp with node exec (review): $rel ($($_.Length)B)"
    }
}

# ============================================================================
# CHECK 4 — oversized package-root index.js (worm payload ~4.5MB)
# ============================================================================
$idxRoots = @()
$rootIdx = Join-Path $Path 'index.js'
if (Test-Path -LiteralPath $rootIdx -PathType Leaf) { $idxRoots += (Get-Item -LiteralPath $rootIdx) }
$nm = Join-Path $Path 'node_modules'
if (Test-Path -LiteralPath $nm) {
    Get-ChildItem -LiteralPath $nm -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $p = Join-Path $_.FullName 'index.js'
        if (Test-Path -LiteralPath $p -PathType Leaf) { $idxRoots += (Get-Item -LiteralPath $p) }
        if ($_.Name -like '@*') {
            Get-ChildItem -LiteralPath $_.FullName -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                $p2 = Join-Path $_.FullName 'index.js'
                if (Test-Path -LiteralPath $p2 -PathType Leaf) { $idxRoots += (Get-Item -LiteralPath $p2) }
            }
        }
    }
}
foreach ($f in $idxRoots) {
    if ($f.Length -gt 1MB) {
        $rel = $f.FullName.Substring($Path.Length).TrimStart('\','/')
        Add-Finding 'REVIEW' 'oversized-index' "package-root index.js > 1MB (worm payload size): $rel ($([math]::Round($f.Length/1MB,1))MB)"
    }
}

# ============================================================================
# CHECK 5 — worm package names in manifests / lockfiles
# ============================================================================
$manifests = @()
foreach ($g in @('package.json','package-lock.json','npm-shrinkwrap.json','pnpm-lock.yaml','yarn.lock')) {
    Get-ChildItem -LiteralPath $Path -Recurse -File -Filter $g -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '[\\/]node_modules[\\/].*[\\/]node_modules[\\/]' } |
        ForEach-Object { $manifests += $_ }
}
foreach ($m in $manifests) {
    $c = Read-Safe $m.FullName
    foreach ($pkg in $WormPackages) {
        $needle = '"' + [regex]::Escape($pkg) + '"'
        if ($c -match $needle) {
            $rel = $m.FullName.Substring($Path.Length).TrimStart('\','/')
            if (Test-SelfOwned $rel) { continue }
            Add-Finding 'HIGH' 'worm-package' "Worm-affected package '$pkg' referenced in $rel"
        }
    }
}

# ============================================================================
# CHECK 6 — C2 / worm strings (tracked files via git grep when possible)
# ============================================================================
$gitDir = Join-Path $Path '.git'
$usedGitGrep = $false
if (Test-Path -LiteralPath $gitDir) {
    foreach ($s in $WormStrings) {
        try {
            $hits = & git -C $Path grep -I -l -F -- $s 2>$null
        } catch { $hits = $null }
        if ($LASTEXITCODE -eq 0 -and $hits) {
            foreach ($h in @($hits)) {
                if (Test-SelfOwned $h) { continue }
                Add-Finding 'HIGH' 'c2-string' "IOC string '$s' in tracked file: $h"
            }
        }
        $usedGitGrep = $true
    }
}
if (-not $usedGitGrep) {
    # no git: scoped scan of config/manifest file types only (avoid full node_modules sweep)
    $scanFiles = Get-ChildItem -LiteralPath $Path -Recurse -File -Include '*.json','*.mjs','*.mdc','*.gyp','*.yaml','*.yml' -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch '[\\/]node_modules[\\/]' }
    foreach ($f in $scanFiles) {
        $c = Read-Safe $f.FullName
        foreach ($s in $WormStrings) {
            if ($c.Contains($s)) {
                $rel = $f.FullName.Substring($Path.Length).TrimStart('\','/')
                if (Test-SelfOwned $rel) { continue }
                Add-Finding 'HIGH' 'c2-string' "IOC string '$s' in: $rel"
            }
        }
    }
}

# ============================================================================
# CHECK 7 — suspicious git history (advisory)
# ============================================================================
if (Test-Path -LiteralPath $gitDir) {
    try {
        $badMsg = & git -C $Path log --all --oneline --grep='update dependencies \[skip ci\]' 2>$null
        if ($LASTEXITCODE -eq 0 -and $badMsg) {
            Add-Finding 'REVIEW' 'git-history' "Commit(s) match worm message 'update dependencies [skip ci]'"
        }
        $bot = & git -C $Path log --all --pretty='%ae %s' 2>$null | Select-String -SimpleMatch 'github-actions'
        if ($bot) {
            Add-Finding 'REVIEW' 'git-history' "github-actions-authored commit(s) present (verify legitimacy)"
        }
    } catch { }
}

# ============================================================================
# REPORT
# ============================================================================
$crit   = @($Findings | Where-Object { $_.severity -eq 'CRITICAL' })
$high   = @($Findings | Where-Object { $_.severity -eq 'HIGH' })
$review = @($Findings | Where-Object { $_.severity -eq 'REVIEW' })
# CRITICAL/HIGH block (do-not-open). REVIEW is informational and does not block.
$blocking = $crit.Count + $high.Count
if ($blocking -gt 0) { $verdict = 'FLAGGED' }
elseif ($review.Count -gt 0) { $verdict = 'PASS-WITH-NOTES' }
else { $verdict = 'PASS' }

if ($Json) {
    $out = [pscustomobject]@{
        verdict   = $verdict
        path      = $Path
        selfCheck = [bool]$SelfCheck
        counts    = [pscustomobject]@{ critical=$crit.Count; high=$high.Count; review=$review.Count }
        findings  = $Findings
    }
    $out | ConvertTo-Json -Depth 6
} else {
    Write-Host ""
    Write-Host "  scan-untrusted-repo  ::  $Path" -ForegroundColor Cyan
    if ($SelfCheck) { Write-Host "  mode: SELF-CHECK (own-config tamper detection on)" -ForegroundColor Cyan }
    Write-Host ("  " + ('-' * 64))
    if ($Findings.Count -eq 0) {
        Write-Host "  No indicators found." -ForegroundColor Green
    } else {
        foreach ($grp in @(@{n='CRITICAL';c='Red';items=$crit},@{n='HIGH';c='Yellow';items=$high},@{n='REVIEW';c='DarkYellow';items=$review})) {
            foreach ($f in $grp.items) {
                Write-Host ("  [{0,-8}] {1,-22} {2}" -f $grp.n, $f.category, $f.detail) -ForegroundColor $grp.c
            }
        }
    }
    Write-Host ("  " + ('-' * 64))
    $vc = if ($blocking -gt 0) { 'Red' } elseif ($review.Count -gt 0) { 'DarkYellow' } else { 'Green' }
    Write-Host ("  VERDICT: {0}   (critical={1} high={2} review={3})" -f $verdict,$crit.Count,$high.Count,$review.Count) -ForegroundColor $vc
    if ($blocking -gt 0) {
        Write-Host "  DO NOT open this repo in the agent until cleared. See /untrusted-repo-intake." -ForegroundColor Red
    }
    Write-Host ""
}

if ($blocking -gt 0) { exit 2 } else { exit 0 }
