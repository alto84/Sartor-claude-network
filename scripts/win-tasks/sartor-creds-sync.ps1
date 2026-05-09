# Sartor peer-Claude credentials sync
# Runs nightly via Windows Scheduled Task on Rocinante.
# Pushes the freshest copy of ~/.claude/.credentials.json to every peer machine
# so peer-Claude OAuth tokens never expire from idleness.
#
# Why: Claude Code refresh tokens rotate when used. Alton uses Rocinante daily,
# so its credentials stay fresh. Peer machines (rtxserver, gpuserver1) sit idle
# between projects — without periodic injection their tokens expire and a manual
# scp+restart is required. This task automates that injection.
#
# Failure mode: if a peer is offline, log the SCP failure and move on. Rocinante's
# credentials are unaffected. Next cycle retries.

$ErrorActionPreference = "Continue"
$logFile  = "C:\Users\alto8\backups\sartor-creds-sync.log"
$credsSrc = "$env:USERPROFILE\.claude\.credentials.json"

$peers = @(
  @{ host = "rtxserver";   ip = "192.168.1.157" },
  @{ host = "gpuserver1";  ip = "192.168.1.100" }
)

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Add-Content -Path $logFile -Value $line
}

if (-not (Test-Path $credsSrc)) {
  Log "ERROR: source creds file missing at $credsSrc"
  exit 1
}

$any_failure = $false
foreach ($peer in $peers) {
  $dest = "alton@$($peer.ip):~/.claude/.credentials.json"
  $scpOut = & scp -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=accept-new $credsSrc $dest 2>&1
  if ($LASTEXITCODE -eq 0) {
    # Tighten perms on the peer side
    & ssh -o ConnectTimeout=5 -o BatchMode=yes "alton@$($peer.ip)" "chmod 600 ~/.claude/.credentials.json" 2>&1 | Out-Null
    # Don't log success unless something interesting; this runs nightly and stays quiet
  } else {
    Log "WARN $($peer.host) ($($peer.ip)) SCP failed (exit $LASTEXITCODE): $scpOut"
    $any_failure = $true
  }
}

if (-not $any_failure) {
  # One terse heartbeat line per successful run so we know it's firing
  Log "OK pushed to $($peers.Count) peers"
}

exit 0
