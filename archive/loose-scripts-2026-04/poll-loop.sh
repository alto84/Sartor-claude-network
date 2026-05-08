#!/bin/bash
# Poll loop for Track C v2 corpus arrival + QC + backoff.
# Budget: 90 minutes wall clock. Exits cleanly on deadline or when all targets land.

set -u
REPO=~/Sartor-claude-network
CORPUS_DIR="$REPO/experiments/2026-04-22-overnight-training/track-C-v2-corpus"
PRIMARY_DIR="$CORPUS_DIR/primary-override"
HN="$CORPUS_DIR/hard-negatives.jsonl"
CC="$CORPUS_DIR/capability-control.jsonl"
PROBES="$REPO/experiments/2026-04-22-overnight-training/probes/probes-v2.jsonl"
LOG="$REPO/sartor/memory/inbox/gpuserver1/2026-04-24_cpu-delegation.md"
STATE=~/.poll-loop-state

START=$(date +%s)
BUDGET_SECS=5400   # 90 min
EMPTY_DEADLINE_SECS=3600  # 60 min — if nothing arrives by then, exit
BACKOFF_LIMIT_SECS=1800  # 30 min continuous BACKOFF -> exit
GUARD_INTERVAL=300   # 5 min
PULL_INTERVAL=600    # 10 min
LAST_PULL=0
LAST_GUARD=0
BACKOFF_START=0   # 0 means not in backoff
SEEN_FILES_FILE=~/.poll-loop-seen

mkdir -p "$CORPUS_DIR/qc-reports" "$PRIMARY_DIR"
touch "$SEEN_FILES_FILE"

log_event() {
  local msg="$1"
  echo "- $(date -u +'%Y-%m-%dT%H:%M:%SZ') — $msg" >> "$LOG"
}

log_event "poll loop started (budget 90m, deadline-empty 60m)"

while true; do
  NOW=$(date +%s)
  ELAPSED=$((NOW - START))
  if [ "$ELAPSED" -ge "$BUDGET_SECS" ]; then
    log_event "budget exhausted ($ELAPSED s >= $BUDGET_SECS s). Exiting poll loop."
    break
  fi

  # cpu-guard check
  if [ $((NOW - LAST_GUARD)) -ge "$GUARD_INTERVAL" ]; then
    GUARD_OUT=$(~/.cpu-guard.sh)
    LAST_GUARD=$NOW
    if echo "$GUARD_OUT" | grep -q BACKOFF; then
      if [ "$BACKOFF_START" -eq 0 ]; then
        BACKOFF_START=$NOW
        log_event "BACKOFF begin: $GUARD_OUT"
      fi
      BACKOFF_DUR=$((NOW - BACKOFF_START))
      if [ "$BACKOFF_DUR" -ge "$BACKOFF_LIMIT_SECS" ]; then
        log_event "BACKOFF sustained $BACKOFF_DUR s >= $BACKOFF_LIMIT_SECS s. Exiting poll loop."
        break
      fi
      sleep 60
      continue
    else
      if [ "$BACKOFF_START" -ne 0 ]; then
        log_event "BACKOFF end (resumed): $GUARD_OUT"
        BACKOFF_START=0
      fi
    fi
  fi

  # git pull every 10 min
  if [ $((NOW - LAST_PULL)) -ge "$PULL_INTERVAL" ]; then
    LAST_PULL=$NOW
    cd "$REPO"
    PULL_OUT=$(git pull --no-edit 2>&1 | tail -5 | tr '\n' ' ')
    log_event "git pull: $PULL_OUT"
  fi

  # Scan for new jsonl files in corpus dir
  declare -a TARGETS=()
  if [ -d "$PRIMARY_DIR" ]; then
    for f in "$PRIMARY_DIR"/*.jsonl; do
      [ -f "$f" ] && TARGETS+=("$f")
    done
  fi
  [ -f "$HN" ] && TARGETS+=("$HN")
  [ -f "$CC" ] && TARGETS+=("$CC")
  [ -f "$PROBES" ] && TARGETS+=("$PROBES")

  NEW_TARGETS=()
  for f in "${TARGETS[@]+"${TARGETS[@]}"}"; do
    # Hash (path + size + mtime) as seen key
    KEY="$f|$(stat -c '%s|%Y' "$f")"
    if ! grep -qxF "$KEY" "$SEEN_FILES_FILE" 2>/dev/null; then
      NEW_TARGETS+=("$f")
      echo "$KEY" >> "$SEEN_FILES_FILE"
    fi
  done

  if [ "${#NEW_TARGETS[@]}" -gt 0 ]; then
    log_event "QC on ${#NEW_TARGETS[@]} new/updated file(s): ${NEW_TARGETS[*]##*/}"
    python3 ~/corpus-qc.py "${NEW_TARGETS[@]}" 2>&1 | while read line; do
      log_event "  qc: $line"
    done
  fi

  # Check completeness — 10 primary topic files + hard-negatives + capability-control
  PRIMARY_COUNT=$(ls "$PRIMARY_DIR"/*.jsonl 2>/dev/null | wc -l)
  if [ "$PRIMARY_COUNT" -ge 10 ] && [ -f "$HN" ] && [ -f "$CC" ]; then
    log_event "All corpus targets present ($PRIMARY_COUNT primary + hn + cc). Running combined QC."
    python3 ~/corpus-combined-qc.py 2>&1 | while read line; do
      log_event "  combined: $line"
    done
    log_event "Combined QC complete. Exiting poll loop early."
    break
  fi

  # Deadline-empty check
  ANY_FOUND=0
  [ "$PRIMARY_COUNT" -gt 0 ] && ANY_FOUND=1
  [ -f "$HN" ] && ANY_FOUND=1
  [ -f "$CC" ] && ANY_FOUND=1
  if [ "$ANY_FOUND" -eq 0 ] && [ "$ELAPSED" -ge "$EMPTY_DEADLINE_SECS" ]; then
    log_event "No corpus files arrived within $EMPTY_DEADLINE_SECS s. Exiting poll loop."
    break
  fi

  sleep 60
done

log_event "poll loop exiting. elapsed=$ELAPSED s, primary_count=$PRIMARY_COUNT, hn=$([ -f "$HN" ] && echo yes || echo no), cc=$([ -f "$CC" ] && echo yes || echo no)"
