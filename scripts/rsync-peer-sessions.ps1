# rsync-peer-sessions.ps1 — mirror peer Claude sessions into Rocinante's /resume picker
#
# Cadence: every 15 min via Windows Scheduled Task "Sartor Peer Sessions Mirror"
# Source: alton@<peer>:/home/alton/.claude/projects/-home-alton-Sartor-claude-network/*.jsonl
# Target: C:\Users\alto8\.claude\projects\C--Users-alto8-Sartor-claude-network\
#         (so Claude Code on Rocinante's `claude --resume` picker enumerates them
#          alongside Rocinante-native sessions when cwd is the Sartor working tree)
#
# UUID session-ids don't collide across machines (UUID-v4 birthday probability is negligible),
# so peer sessions land directly in the picker-visible dir with their original filenames.
#
# A sidecar manifest at .peer-manifest.json tracks which session IDs came from which peer,
# so future cleanup / disambiguation is mechanical.
#
# Logs: C:\Users\alto8\backups\peer-sessions-rsync.log (append-only)

$ErrorActionPreference = "Continue"
$logFile = "C:\Users\alto8\backups\peer-sessions-rsync.log"
$pickerDir = "C:\Users\alto8\.claude\projects\C--Users-alto8-Sartor-claude-network"
$stagingRoot = "C:\Users\alto8\.claude\projects\peers"
$manifestFile = "$pickerDir\.peer-manifest.json"

function Log-Line($line) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts $line" | Out-File -FilePath $logFile -Append -Encoding utf8
}

if (!(Test-Path $pickerDir)) { New-Item -ItemType Directory -Path $pickerDir -Force | Out-Null }
if (!(Test-Path $stagingRoot)) { New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null }

# Load existing manifest, or start fresh
$manifest = @{}
if (Test-Path $manifestFile) {
    try {
        $loaded = Get-Content $manifestFile -Raw | ConvertFrom-Json -AsHashtable -ErrorAction Stop
        if ($loaded) { $manifest = $loaded }
    } catch {
        # ConvertFrom-Json -AsHashtable not on PS5.1; fallback to PSCustomObject
        try {
            $obj = Get-Content $manifestFile -Raw | ConvertFrom-Json
            $manifest = @{}
            $obj.PSObject.Properties | ForEach-Object { $manifest[$_.Name] = $_.Value }
        } catch {
            Log-Line "WARN manifest unreadable; starting fresh: $_"
            $manifest = @{}
        }
    }
}

$peers = @(
    @{ name = "rtxserver"; ip = "192.168.1.157" },
    @{ name = "gpuserver1"; ip = "192.168.1.100" }
)

foreach ($peer in $peers) {
    $stagingDir = "$stagingRoot\$($peer.name)"
    if (!(Test-Path $stagingDir)) { New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null }

    # 1. Pull all session jsonls from peer into staging (overwrites files; safe)
    $scpCmd = 'scp -q -r alton@' + $peer.ip + ':/home/alton/.claude/projects/-home-alton-Sartor-claude-network/. "' + $stagingDir + '/"'
    $r = & cmd /c $scpCmd 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Line "WARN $($peer.name): scp failed: $r"
        continue
    }

    # 2. For each .jsonl in staging, copy into picker dir if newer or missing.
    #    Track in manifest: session_id => peer hostname.
    $copied = 0
    $skipped = 0
    Get-ChildItem $stagingDir -Filter "*.jsonl" -File | ForEach-Object {
        $src = $_.FullName
        $dst = Join-Path $pickerDir $_.Name
        $sid = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)

        # Skip if dst exists and is newer or same age (avoid clobbering Rocinante-native sessions
        # of the same uuid — shouldn't happen with UUIDv4, but defense-in-depth)
        if ((Test-Path $dst) -and ((Get-Item $dst).LastWriteTime -ge $_.LastWriteTime)) {
            $skipped++
            return
        }
        Copy-Item -Path $src -Destination $dst -Force
        $manifest[$sid] = $peer.name
        $copied++
    }
    Log-Line "OK $($peer.name): mirrored $($copied) new+updated, $($skipped) up-to-date"
}

# Write manifest back
try {
    $manifest | ConvertTo-Json -Depth 4 | Out-File -FilePath $manifestFile -Encoding utf8 -Force
} catch {
    Log-Line "WARN manifest write failed: $_"
}

# 3. Trim staging-root .jsonls older than 30 days to keep disk clean
Get-ChildItem $stagingRoot -Recurse -Filter "*.jsonl" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

# 4. Trim picker dir's PEER sessions older than 60 days (longer retention since they're audit data)
#    Only touches files listed in manifest; never Rocinante-native sessions.
$cutoff = (Get-Date).AddDays(-60)
foreach ($sid in @($manifest.Keys)) {
    $f = Join-Path $pickerDir "$sid.jsonl"
    if ((Test-Path $f) -and (Get-Item $f).LastWriteTime -lt $cutoff) {
        Remove-Item $f -Force -ErrorAction SilentlyContinue
        $manifest.Remove($sid)
    }
}

# Re-write manifest after pruning
try { $manifest | ConvertTo-Json -Depth 4 | Out-File -FilePath $manifestFile -Encoding utf8 -Force } catch {}
