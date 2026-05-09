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

# 3. Push to github (HTTPS, credentials in Windows Credential Manager)
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
