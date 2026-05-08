#!/bin/bash
# rental_watcher.sh — every 60s, check for vast.ai customer container.
# On detection: write PAUSED-by-rental.md, send TERM to the workload PID
# (if provided), and exit 0.
#
# Usage:
#   bash rental_watcher.sh                    # passive watcher (just touches PAUSED file on detection)
#   bash rental_watcher.sh <workload_pid>     # also signals workload to halt
#
# The mission says: "every 60 sec check `docker ps`, on customer-container
# detection save checkpoint + halt training + write PAUSED-by-rental.md"
# This script does the detection + signal; the workload is responsible for
# checkpointing on signal.

set -u
WORKDIR="/home/alton/experiments/2026-05-04-finetune-loyalty"
PAUSED="$WORKDIR/PAUSED-by-rental.md"
LOG="$WORKDIR/logs/rental_watcher.log"
WORKLOAD_PID="${1:-}"

echo "[$(date -Iseconds)] rental_watcher start (workload_pid='$WORKLOAD_PID')" >> "$LOG"

while true; do
  CUST=$(docker ps --format '{{.Names}}' 2>/dev/null | grep '^C\.' || true)
  if [ -n "$CUST" ]; then
    echo "[$(date -Iseconds)] CUSTOMER CONTAINER DETECTED: $CUST" >> "$LOG"
    cat > "$PAUSED" <<EOF
---
type: pause-marker
reason: vast.ai customer container detected
detected_at: $(date -Iseconds)
container: $CUST
workload_pid: $WORKLOAD_PID
---

# PAUSED by customer rental

A vast.ai customer container is running on rtxserver. Per ToS, the box is
dedicated to the customer for the duration of the rental. All Sartor
training/inference paused.

To resume: wait for the customer container to destroy (\`docker ps\` returns
no \`C.*\` matches), then re-launch the workload by hand. The watcher itself
exited; respawn it before the next workload.

container detected: $CUST
EOF
    if [ -n "$WORKLOAD_PID" ] && kill -0 "$WORKLOAD_PID" 2>/dev/null; then
      echo "[$(date -Iseconds)] sending SIGTERM to workload PID $WORKLOAD_PID" >> "$LOG"
      kill -TERM "$WORKLOAD_PID"
    fi
    echo "[$(date -Iseconds)] rental_watcher exiting" >> "$LOG"
    exit 0
  fi
  sleep 60
done
