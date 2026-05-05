# rsync-peer-sessions.ps1 — mirror peer Claude sessions to Rocinante for picker visibility + audit
#
# Runs every 10 min via Windows Scheduled Task. Pulls .jsonl session files from
# rtxserver and gpuserver1 into a Rocinante-side mirror. The mirror lives under
# C:\Users\alto8\.claude\projects\peers\<hostname>\ so it doesn't collide with
# Rocinante's own session storage.
#
# This makes peer sessions VISIBLE for read/audit. To actually resume one in
# Claude Code's picker, use: claude --resume <session-id> from the appropriate cwd.
# (Note: tools in a resumed session run on Rocinante, not on the peer. Use SSH
# from the resumed session to act on peer state.)

$ErrorActionPreference = "Continue"
$logFile = "C:\Users\alto8\backups\peer-sessions-rsync.log"

function Log-Line($line) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts $line" | Out-File -FilePath $logFile -Append -Encoding utf8
}

# Use Windows OpenSSH; rsync via Cygwin/MSYS or use scp+find diff
# Simpler: scp -r the directory each run; rely on overwrite-on-newer

$peers = @(
    @{ name = "rtxserver"; ip = "192.168.1.157" },
    @{ name = "gpuserver1"; ip = "192.168.1.100" }
)

foreach ($peer in $peers) {
    $localDir = "C:\Users\alto8\.claude\projects\peers\$($peer.name)"
    if (!(Test-Path $localDir)) { New-Item -ItemType Directory -Path $localDir -Force | Out-Null }

    # scp -r each peer's claude-projects dir
    # Note: ~/.claude/projects/ on peer; we want only -home-alton-* dirs
    $cmd = "scp -q -r alton@$($peer.ip):/home/alton/.claude/projects/-home-alton-Sartor-claude-network/. ""$localDir/"""
    $result = & cmd /c $cmd 2>&1
    if ($LASTEXITCODE -eq 0) {
        $count = (Get-ChildItem $localDir -Filter "*.jsonl" -ErrorAction SilentlyContinue | Measure-Object).Count
        Log-Line "OK $($peer.name): mirrored $count session files"
    } else {
        Log-Line "WARN $($peer.name): scp failed: $result"
    }
}

# Trim: keep last 30 days only
Get-ChildItem "C:\Users\alto8\.claude\projects\peers" -Recurse -Filter "*.jsonl" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force -ErrorAction SilentlyContinue
