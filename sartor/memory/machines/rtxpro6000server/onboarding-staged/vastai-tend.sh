#!/bin/bash
# ============================================================================
# vastai-tend.sh — rtxpro6000server adaptation
# ============================================================================
# DIFF-SUMMARY (vs gpuserver1 source):
#   STATUS: RECONSTRUCTED FROM SPEC (NOT ADAPTED FROM LIVE SOURCE).
#   Reason: SSH outbound from rtxpro6000server to 192.168.1.100 is not
#   configured (no private key in ~/.ssh, no agent loaded). The four
#   scripts at /home/alton/*.sh on gpuserver1 are not committed to the
#   repo. This file was reconstructed from sartor/memory/machines/
#   gpuserver1/CRONS.md v0.4 §"Active Cron Jobs / 3. vastai-tend.sh"
#   (the EX-5 RESURRECTED state-change-only redesign, not the older
#   2026-04-12-deprecated ad-hoc-alerts version) and the §5.1 cron-table
#   line in projects/memory-system-v2/10-MASTER-PLAN.md. The eventual
#   install pass MUST diff this against the actual /home/alton/
#   vastai-tend.sh on gpuserver1 before deploying to /home/alton/ on
#   rtxserver.
#
#   Path changes applied (per directive):
#     - inbox path: inbox/gpuserver1/_vastai/
#                ->  inbox/rtxpro6000server/_vastai/
#     - log dir: /home/alton/generated/cron-logs/ (unchanged)
#     - state cache: /tmp/vastai-tend-state.json (unchanged; per-machine,
#       no conflict)
#     - host self-id: derived from `hostname` (unchanged)
# ============================================================================

set -u

LOG_DIR="/home/alton/generated/cron-logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/vastai-tend.log"

exec >> "$LOG" 2>&1

HOSTNAME="$(hostname)"
TS_HUMAN="$(date -Iseconds)"
TS_UTC="$(date -u +%Y-%m-%dT%H%MZ)"

echo "=== $TS_HUMAN vastai-tend start (host=$HOSTNAME) ==="

REPO_DIR="$HOME/Sartor-claude-network"
INBOX_BASE="$REPO_DIR/sartor/memory/inbox/$HOSTNAME/_vastai"
STATE_CACHE="/tmp/vastai-tend-state.json"

VAST_BIN="$HOME/.local/bin/vastai"
if [ ! -x "$VAST_BIN" ]; then
  echo "FATAL: vastai CLI not found at $VAST_BIN"
  exit 1
fi

# Probe vastai. Two facts of interest: is the machine listed, and is it rented?
MACHINES_RAW="$($VAST_BIN show machines 2>/dev/null || echo '')"
INSTANCES_RAW="$($VAST_BIN show instances 2>/dev/null || echo '')"

# Heuristic state extraction (faithful to spec; CLI output format is stable
# enough for a coarse listed/rented check).
LISTED="unknown"
if [ -n "$MACHINES_RAW" ]; then
  if echo "$MACHINES_RAW" | grep -qiE 'listed|available'; then
    LISTED="listed"
  else
    LISTED="unlisted"
  fi
fi

RENTED="unknown"
if [ -n "$INSTANCES_RAW" ]; then
  # Count data lines (skip header). Non-zero -> at least one instance == rented.
  INSTANCE_LINES="$(echo "$INSTANCES_RAW" | tail -n +2 | grep -v '^$' | wc -l)"
  if [ "$INSTANCE_LINES" -gt 0 ]; then
    RENTED="rented"
  else
    RENTED="idle"
  fi
fi

CURRENT_STATE="${LISTED}/${RENTED}"

# Load previous state.
PREV_STATE="firstrun"
if [ -f "$STATE_CACHE" ]; then
  PREV_STATE="$(python3 -c "import json,sys; d=json.load(open('$STATE_CACHE')); print(d.get('state','firstrun'))" 2>/dev/null || echo "firstrun")"
fi

# Update state cache (always — tracks last-check timestamp even on no-change).
cat > "$STATE_CACHE" <<EOF
{
  "host": "$HOSTNAME",
  "state": "$CURRENT_STATE",
  "listed": "$LISTED",
  "rented": "$RENTED",
  "last_check": "$TS_HUMAN"
}
EOF

# State-change-only inbox write. First run also writes (baseline).
if [ "$PREV_STATE" = "$CURRENT_STATE" ]; then
  echo "no state change ($CURRENT_STATE); skipping inbox write"
  exit 0
fi

mkdir -p "$INBOX_BASE"
ENTRY_FILE="$INBOX_BASE/${TS_UTC}-state-change.md"
{
  echo "---"
  echo "type: vastai_state_change"
  echo "host: $HOSTNAME"
  echo "cron: vastai-tend.sh"
  echo "written: $TS_HUMAN"
  echo "previous_state: $PREV_STATE"
  echo "current_state: $CURRENT_STATE"
  echo "---"
  echo
  echo "# vastai state change on $HOSTNAME"
  echo
  echo "- Previous: \`$PREV_STATE\`"
  echo "- Current: \`$CURRENT_STATE\`"
  echo "- listed: \`$LISTED\`"
  echo "- rented: \`$RENTED\`"
  echo
  echo "## machines (raw)"
  echo
  echo '```'
  echo "$MACHINES_RAW"
  echo '```'
  echo
  echo "## instances (raw)"
  echo
  echo '```'
  echo "$INSTANCES_RAW"
  echo '```'
} > "$ENTRY_FILE"

echo "=== $TS_HUMAN vastai-tend end (transition $PREV_STATE -> $CURRENT_STATE, file=$ENTRY_FILE) ==="
exit 0
