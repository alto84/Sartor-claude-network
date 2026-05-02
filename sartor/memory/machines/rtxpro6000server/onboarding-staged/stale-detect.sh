#!/bin/bash
# ============================================================================
# stale-detect.sh — rtxpro6000server adaptation
# ============================================================================
# DIFF-SUMMARY (vs gpuserver1 source):
#   STATUS: RECONSTRUCTED FROM SPEC (NOT ADAPTED FROM LIVE SOURCE).
#   Reason: SSH outbound from rtxpro6000server to 192.168.1.100 is not
#   configured (no private key in ~/.ssh, no agent loaded). The four
#   scripts at /home/alton/*.sh on gpuserver1 are not committed to the
#   repo. This file was reconstructed from sartor/memory/machines/
#   gpuserver1/CRONS.md v0.4 §"Active Cron Jobs / 2. stale-detect.sh"
#   and the §5.1 cron-table line in projects/memory-system-v2/
#   10-MASTER-PLAN.md. The eventual install pass MUST diff this against
#   the actual /home/alton/stale-detect.sh on gpuserver1 before
#   deploying to /home/alton/ on rtxserver.
#
#   Path changes applied (per directive):
#     - inbox path: inbox/gpuserver1/_stale-alerts/
#                ->  inbox/rtxpro6000server/_stale-alerts/
#     - log dir: /home/alton/generated/cron-logs/ (unchanged)
#     - heartbeat read: ~/sartor-heartbeat.json (unchanged)
#     - host self-id: derived from `hostname` (unchanged)
#     - thresholds (GPU >80C, disk >85%, heartbeat >5h): unchanged
# ============================================================================

set -u

LOG_DIR="/home/alton/generated/cron-logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/stale-detect.log"

exec >> "$LOG" 2>&1

HOSTNAME="$(hostname)"
TS_HUMAN="$(date -Iseconds)"
HOUR_SLOT="$(date -u +%Y-%m-%d_%H)"
EPOCH_NOW="$(date +%s)"

echo "=== $TS_HUMAN stale-detect start (host=$HOSTNAME) ==="

REPO_DIR="$HOME/Sartor-claude-network"
INBOX_BASE="$REPO_DIR/sartor/memory/inbox/$HOSTNAME/_stale-alerts"
mkdir -p "$INBOX_BASE"

ALERTS=()

# ---- Check 1: vastai reachability ----
VAST_BIN="$HOME/.local/bin/vastai"
if [ -x "$VAST_BIN" ]; then
  if ! $VAST_BIN show machines >/dev/null 2>&1; then
    ALERTS+=("vastai_unreachable: \`$VAST_BIN show machines\` failed at $TS_HUMAN")
  fi
else
  ALERTS+=("vastai_cli_missing: $VAST_BIN not present or not executable")
fi

# ---- Check 2: GPU temperature (>80C) ----
GPU_TEMP="$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null | head -1)"
if [ -n "$GPU_TEMP" ] && [ "$GPU_TEMP" -gt 80 ] 2>/dev/null; then
  ALERTS+=("gpu_temp_high: ${GPU_TEMP}C exceeds 80C threshold")
fi

# ---- Check 3: disk usage on /home (>85%) ----
DISK_PCT="$(df -h /home | awk 'NR==2 {print $5}' | tr -d '%')"
if [ -n "$DISK_PCT" ] && [ "$DISK_PCT" -gt 85 ] 2>/dev/null; then
  ALERTS+=("disk_home_high: ${DISK_PCT}% exceeds 85% threshold")
fi

# ---- Check 4: heartbeat freshness (>5h stale) ----
HEARTBEAT="$HOME/sartor-heartbeat.json"
if [ ! -f "$HEARTBEAT" ]; then
  ALERTS+=("heartbeat_missing: $HEARTBEAT does not exist (gather_mirror has never run, or its first run has not completed)")
else
  HB_MTIME="$(stat -c %Y "$HEARTBEAT" 2>/dev/null || echo 0)"
  HB_AGE_H=$(( (EPOCH_NOW - HB_MTIME) / 3600 ))
  if [ "$HB_AGE_H" -gt 5 ]; then
    ALERTS+=("heartbeat_stale: ${HB_AGE_H}h since last gather_mirror update (threshold: 5h)")
  fi
fi

# ---- Emit inbox entry only if any alert fired (debounced to one file per hour slot) ----
ALERT_COUNT=${#ALERTS[@]}
if [ "$ALERT_COUNT" -eq 0 ]; then
  echo "all clear at $TS_HUMAN"
  exit 0
fi

ALERT_FILE="$INBOX_BASE/${HOUR_SLOT}.md"
{
  echo "---"
  echo "type: stale_alert"
  echo "host: $HOSTNAME"
  echo "cron: stale-detect.sh"
  echo "written: $TS_HUMAN"
  echo "alert_count: $ALERT_COUNT"
  echo "---"
  echo
  echo "# stale-detect alerts on $HOSTNAME ($HOUR_SLOT UTC)"
  echo
  for a in "${ALERTS[@]}"; do
    echo "- $a"
  done
} > "$ALERT_FILE"

echo "=== $TS_HUMAN stale-detect end (alerts=$ALERT_COUNT, file=$ALERT_FILE) ==="
exit 0
