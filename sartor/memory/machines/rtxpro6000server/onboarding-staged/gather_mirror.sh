#!/bin/bash
# ============================================================================
# gather_mirror.sh — rtxpro6000server adaptation
# ============================================================================
# DIFF-SUMMARY (vs gpuserver1 source):
#   STATUS: RECONSTRUCTED FROM SPEC (NOT ADAPTED FROM LIVE SOURCE).
#   Reason: SSH outbound from rtxpro6000server to 192.168.1.100 is not
#   configured (no private key in ~/.ssh, no agent loaded). The directive
#   said SSH should be passwordless but it isn't. The four scripts at
#   /home/alton/*.sh on gpuserver1 are not committed to the repo. This
#   file was reconstructed from sartor/memory/machines/gpuserver1/CRONS.md
#   v0.4 (authoritative cron documentation, last verified 2026-04-16) and
#   the §5.3 fix sketch in projects/memory-system-v2/10-MASTER-PLAN.md.
#   The eventual install pass MUST diff this against the actual
#   /home/alton/gather_mirror.sh on gpuserver1 before deploying to
#   /home/alton/ on rtxserver.
#
#   Path changes applied (per directive):
#     - inbox path: inbox/gpuserver1/  ->  inbox/rtxpro6000server/
#     - log dir: /home/alton/generated/cron-logs/ (unchanged)
#     - heartbeat: ~/sartor-heartbeat.json (unchanged)
#     - host self-id: derived from `hostname` (unchanged)
#     - ssh hostnames, repo URLs: unchanged
# ============================================================================

set -u

LOG_DIR="/home/alton/generated/cron-logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/gather_mirror.log"

exec >> "$LOG" 2>&1

HOSTNAME="$(hostname)"
TS_UTC="$(date -u +%Y-%m-%dT%H%MZ)"
TS_HUMAN="$(date -Iseconds)"
EPOCH="$(date +%s)"

echo "=== $TS_HUMAN gather_mirror start (host=$HOSTNAME) ==="

REPO_DIR="$HOME/Sartor-claude-network"
INBOX_BASE="$REPO_DIR/sartor/memory/inbox/$HOSTNAME"
INBOX_STATUS="$INBOX_BASE/status"
INBOX_ALERTS="$INBOX_BASE/alerts"

cd "$REPO_DIR" || { echo "FATAL: cannot cd to $REPO_DIR"; exit 1; }

# Stash with a named marker so we can pop deterministically (EX-5 fix).
STASH_NAME="gather_mirror-$EPOCH"
git stash push --include-untracked -m "$STASH_NAME" >/dev/null 2>&1 || true

# Pull. On failure, write a WARNING-priority inbox alert and exit 2.
if ! git pull --rebase origin main; then
  echo "PULL_FAILED at $TS_HUMAN"
  mkdir -p "$INBOX_ALERTS"
  ALERT_FILE="$INBOX_ALERTS/${TS_UTC}_gather-mirror-pull-failure.md"
  cat > "$ALERT_FILE" <<EOF
---
type: alert
priority: WARNING
host: $HOSTNAME
cron: gather_mirror.sh
written: $TS_HUMAN
---

# gather_mirror pull failure on $HOSTNAME

\`git pull --rebase origin main\` failed at $TS_HUMAN. Stash marker:
\`$STASH_NAME\`. Manual review required; stash residue may be present.

See log: $LOG
EOF
  # Try to pop the stash even on failure so we don't accumulate residue.
  STASH_REF="$(git stash list | grep -F "$STASH_NAME" | head -1 | cut -d: -f1)"
  if [ -n "$STASH_REF" ]; then
    git stash pop "$STASH_REF" || true
  fi
  exit 2
fi

# Pop by name (not blind `git stash pop`). Conflicts tolerated; reviewed monthly.
STASH_REF="$(git stash list | grep -F "$STASH_NAME" | head -1 | cut -d: -f1)"
if [ -n "$STASH_REF" ]; then
  git stash pop "$STASH_REF" || echo "WARN: stash pop conflict for $STASH_NAME (left in stash list)"
fi

# Build status snapshot.
mkdir -p "$INBOX_STATUS"
STATUS_FILE="$INBOX_STATUS/${TS_UTC}.json"

VAST_BIN="$HOME/.local/bin/vastai"
VASTAI_MACHINES=""
if [ -x "$VAST_BIN" ]; then
  VASTAI_MACHINES="$($VAST_BIN show machines --raw 2>/dev/null || $VAST_BIN show machines 2>/dev/null || echo '')"
fi

GPU_TEMP="$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null | head -1 || echo '')"
GPU_UTIL="$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null | head -1 || echo '')"
DISK_PCT="$(df -h /home | awk 'NR==2 {print $5}' | tr -d '%')"

# Escape vastai output for JSON embedding.
VASTAI_ESC="$(printf '%s' "$VASTAI_MACHINES" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo '""')"

cat > "$STATUS_FILE" <<EOF
{
  "host": "$HOSTNAME",
  "written": "$TS_HUMAN",
  "gpu_temp_c": "${GPU_TEMP:-unknown}",
  "gpu_util_pct": "${GPU_UTIL:-unknown}",
  "disk_home_pct": "${DISK_PCT:-unknown}",
  "vastai_machines_raw": $VASTAI_ESC
}
EOF

# Heartbeat — picked up by stale-detect.sh.
cat > "$HOME/sartor-heartbeat.json" <<EOF
{
  "host": "$HOSTNAME",
  "last_gather_mirror": "$TS_HUMAN",
  "epoch": $EPOCH,
  "gpu_temp_c": "${GPU_TEMP:-unknown}",
  "disk_home_pct": "${DISK_PCT:-unknown}"
}
EOF

echo "=== $TS_HUMAN gather_mirror end (status=$STATUS_FILE) ==="
exit 0
