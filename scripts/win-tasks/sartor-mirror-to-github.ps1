# Sartor memory mirror — rtxserver bare repo → GitHub
# Runs every 15 min via Windows Scheduled Task on Rocinante.
# rtxserver is the canonical write target; GitHub is the disaster-recovery mirror.
# Rocinante is the only machine with GitHub HTTPS credentials; this script is what
# lets peer pushes (rtxserver-self, gpuserver1, aneeta-laptop) reach GitHub without
# any of those peers needing GitHub auth.
#
# Logic: fetch from rtxserver bare, fast-forward local main if behind, push to github.
# We do NOT use --mirror push to GitHub because it would force-delete branches that
# only exist on github (claude.ai cloud-agent branches, etc.).
#
# Failure mode: if rtxserver is down OR github is unreachable, log + exit 1; the
# scheduled task retries on next tick. Local working tree is untouched either way.

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logFile = "C:\Users\alto8\backups\sartor-mirror.log"
$repoDir = "C:\Users\alto8\Sartor-claude-network"

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Add-Content -Path $logFile -Value $line
}

Set-Location $repoDir

# 1. Fetch rtxserver bare (origin)
$fetchOut = & git fetch origin main 2>&1
if ($LASTEXITCODE -ne 0) {
  Log "ERROR fetch origin: $fetchOut"
  exit 1
}

# 2. Check whether origin/main is ahead of local main
$localSha = (& git rev-parse main).Trim()
$remoteSha = (& git rev-parse origin/main).Trim()

if ($localSha -ne $remoteSha) {
  # Try fast-forward; if local has uncommitted divergent work this will fail and we
  # log + bail. Manual reconciliation needed in that case (rare; usually means
  # someone is actively editing on Rocinante and the next push will sync).
  $isAncestor = & git merge-base --is-ancestor $localSha $remoteSha 2>&1
  if ($LASTEXITCODE -eq 0) {
    & git merge --ff-only origin/main 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Log "WARN ff-only merge failed (working tree dirty?), skipping mirror this cycle"
      exit 1
    }
    Log "fast-forwarded local main: $localSha -> $remoteSha"
  } else {
    # Local is ahead OR diverged — just push our state up to origin so the bare
    # has it, then mirror. This handles the "I just edited on Rocinante and
    # haven't pushed yet" case.
    $pushOut = & git push origin main 2>&1
    if ($LASTEXITCODE -ne 0) {
      Log "INFO push to origin failed (likely diverged): $pushOut. Skipping mirror."
      exit 1
    }
    Log "pushed local main to origin: $localSha"
  }
}

# 3. Fetch-first guard: confirm github/main is an ancestor of (or equal to) local main
# before pushing. Without this guard, a peer that pushes direct-to-GitHub (claude.ai
# cloud-agent, an aneeta-laptop session, anything) leaves github/main with unique
# commits, and the next `git push github main` fails with "fetch first". The script
# then silently failed every 15 min for a week before anyone noticed (2026-05-13
# through 2026-05-20). The guard turns "silently broken mirror" into "noisy
# DIVERGED marker in the log" which dashboards can grep.
$fetchGhOut = & git fetch github main 2>&1
if ($LASTEXITCODE -ne 0) {
  Log "ERROR fetch github (network/auth issue?): $fetchGhOut"
  exit 1
}

$localMain  = (& git rev-parse main).Trim()
$githubMain = (& git rev-parse github/main).Trim()

if ($localMain -eq $githubMain) {
  # already in sync, no-op
  exit 0
}

# Is github/main an ancestor of local main? If yes, fast-forward push is safe.
& git merge-base --is-ancestor $githubMain $localMain 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  # github has commits that aren't on local. Don't force; log a distinctive marker
  # and bail. Manual reconciliation needed (merge github/main locally, push to
  # rtxserver bare via origin, then this script will resync on the next tick).
  $aheadCount  = (& git rev-list --count "$localMain..github/main").Trim()
  $behindCount = (& git rev-list --count "github/main..$localMain").Trim()
  Log "DIVERGED-MIRROR github/main has $aheadCount commits not on local; local has $behindCount commits not on github. Manual reconciliation required. Local=$localMain GitHub=$githubMain"
  exit 2
}

# 4. Push to github (HTTPS, credentials in Windows Credential Manager)
$pushOut = & git push github main 2>&1
if ($LASTEXITCODE -ne 0) {
  Log "ERROR push to github: $pushOut"
  exit 1
}

# Only log non-noop pushes to keep log readable
if ($pushOut -notmatch "Everything up-to-date") {
  Log "mirrored to github: $pushOut"
}

exit 0
