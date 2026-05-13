#!/usr/bin/env bash
# research-daily.sh — staged for rtxpro6000server
# Fires daily at 10:00 ET (14:00 UTC). Gates on no-active-vast.ai-rental.
# Spawns a fresh `claude -p` session against the Sartor working tree,
# instructed by /home/alton/research-daily-prompt.md, to advance the
# household-identity-on-smaller-model research mission.
#
# v0.2 — 2026-05-12: daytime schedule, no budget caps, max thinking,
# pharmacovigilance dropped (moved to AZ work laptop).
#
# Design doc: sartor/memory/projects/research-daily-cron-2026-05-12.md
# DO NOT install to /home/alton/ or add to crontab without Alton's explicit greenlight.
#
# Env vars:
#   DRY_RUN=1      Print what would happen, do not invoke Claude
#   PROMPT_FILE    Override prompt location (default /home/alton/research-daily-prompt.md)
#   WORKDIR        Override working tree (default /home/alton/Sartor-claude-network)

set -euo pipefail

# ---- Configuration ---------------------------------------------------------

WORKDIR="${WORKDIR:-/home/alton/Sartor-claude-network}"
PROMPT_FILE="${PROMPT_FILE:-/home/alton/research-daily-prompt.md}"
LOG_DIR="/home/alton/generated/cron-logs"
INBOX_DIR="$WORKDIR/sartor/memory/inbox/rocinante"
DAILY_REPORT_DIR="$WORKDIR/sartor/memory/daily"
HOSTNAME_TAG="rtxpro6000server"

TS_UTC="$(date -u +%Y-%m-%dT%H%MZ)"
TS_HUMAN="$(date -u +%Y-%m-%d\ %H:%M:%S\ UTC)"
TODAY_DATE="$(date -u +%Y-%m-%d)"
RUN_LOG="$LOG_DIR/research-daily-${TS_UTC}.log"

DRY_RUN="${DRY_RUN:-0}"

# Extended thinking — Opus 4.7 supports extended thinking. In headless mode
# the runtime honors these env hints if set. Set high so the model thinks as
# much as it needs on this substantive task. No wall-clock or token cap.
export ANTHROPIC_THINKING_BUDGET="${ANTHROPIC_THINKING_BUDGET:-high}"
export CLAUDE_THINKING_BUDGET="${CLAUDE_THINKING_BUDGET:-high}"

# ---- Helpers ---------------------------------------------------------------

log() {
  printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$RUN_LOG"
}

phone_home() {
  # $1 = verb (skipped | started | completed | failed | yielded)
  # $2 = one-line body
  local verb="$1" body="$2"
  local out="$INBOX_DIR/${TS_UTC}_research-daily-${verb}.md"
  mkdir -p "$INBOX_DIR"
  {
    echo "---"
    echo "type: phone-home"
    echo "from: $HOSTNAME_TAG"
    echo "kind: research-daily"
    echo "verb: $verb"
    echo "fired_at_utc: $TS_HUMAN"
    echo "run_log: $RUN_LOG"
    echo "daily_report: sartor/memory/daily/research-${TODAY_DATE}.md"
    echo "---"
    echo ""
    echo "# research-daily $verb"
    echo ""
    echo "$body"
  } > "$out"
  log "phone-home written: $out"
}

# ---- Pre-flight ------------------------------------------------------------

mkdir -p "$LOG_DIR" "$DAILY_REPORT_DIR"
exec >> "$RUN_LOG" 2>&1
log "research-daily start (DRY_RUN=$DRY_RUN, thinking=$ANTHROPIC_THINKING_BUDGET)"

if [ ! -d "$WORKDIR/.git" ]; then
  log "ABORT: $WORKDIR is not a git working tree"
  phone_home failed "Working tree missing at $WORKDIR. Investigate."
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  log "ABORT: prompt file missing at $PROMPT_FILE"
  phone_home failed "Prompt file missing at $PROMPT_FILE. Cannot proceed."
  exit 1
fi

# No active vast.ai customer container.
ACTIVE_RENTAL="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E '^C\.' | head -1 || true)"
if [ -n "$ACTIVE_RENTAL" ]; then
  log "SKIP: active vast.ai rental detected ($ACTIVE_RENTAL)"
  phone_home skipped "Active rental container \`$ACTIVE_RENTAL\`. Daily research skipped per hosting-agreement constraint. Next attempt: tomorrow 10:00 ET."
  exit 0
fi

# git pull with stash-pop discipline.
cd "$WORKDIR"
DIRTY=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  DIRTY=1
  log "Working tree dirty. Stashing with marker research-daily-$TS_UTC"
  if [ "$DRY_RUN" = "0" ]; then
    git stash push -u -m "research-daily-$TS_UTC"
  fi
fi

log "Pulling origin main"
if [ "$DRY_RUN" = "0" ]; then
  if ! git pull --rebase origin main; then
    log "ABORT: git pull failed"
    phone_home failed "git pull --rebase origin main failed. Run log: $RUN_LOG"
    exit 1
  fi
fi

# ---- Dry-run early exit ----------------------------------------------------

if [ "$DRY_RUN" = "1" ]; then
  log "DRY_RUN=1: would invoke claude -p with prompt $PROMPT_FILE (NO budget caps; ANTHROPIC_THINKING_BUDGET=$ANTHROPIC_THINKING_BUDGET)"
  log "DRY_RUN=1: would commit any research/ daily/ inbox/ changes to local working tree"
  log "DRY_RUN=1: would push to origin (= rtxserver bare via local file://)"
  log "DRY_RUN=1: would expect daily report at $DAILY_REPORT_DIR/research-${TODAY_DATE}.md"
  exit 0
fi

# ---- Invoke Claude — no wall-clock cap, no turn budget --------------------

phone_home started "Daily research fired $TS_HUMAN. No active rental. Working tree clean (or stashed). Invoking Claude with $PROMPT_FILE, no budget caps, ANTHROPIC_THINKING_BUDGET=$ANTHROPIC_THINKING_BUDGET. Today's daily report target: sartor/memory/daily/research-${TODAY_DATE}.md."

log "Invoking claude -p (no budget caps)"
CLAUDE_EXIT=0
# --max-turns 500 is a sanity ceiling against runaway loops, not a budget cap.
# Wall-clock has NO timeout — substantive thinking is the goal of this run.
if ! claude -p "$(cat "$PROMPT_FILE")" \
       --output-format stream-json \
       --max-turns 500 \
       --dangerously-skip-permissions; then
  CLAUDE_EXIT=$?
  log "Claude session exited non-zero: $CLAUDE_EXIT"
fi

# ---- Commit + push ---------------------------------------------------------

cd "$WORKDIR"
if ! git diff --quiet || ! git diff --cached --quiet || \
   [ -n "$(git ls-files --others --exclude-standard)" ]; then
  log "Working-tree changes remain after Claude session. Backstop commit."
  git add -A
  git commit -m "research-daily backstop commit ($TS_UTC)" || log "Backstop commit failed"
fi

log "Pushing to origin (rtxserver bare)"
git push origin HEAD || log "Push to origin failed; commits remain in local working tree"

# ---- Restore stash if we had one ------------------------------------------

if [ "$DIRTY" = "1" ]; then
  log "Restoring pre-run stash research-daily-$TS_UTC"
  STASH_REF="$(git stash list | grep "research-daily-$TS_UTC" | head -1 | awk -F: '{print $1}' || true)"
  if [ -n "$STASH_REF" ]; then
    git stash pop "$STASH_REF" || log "Stash pop failed; stash preserved as $STASH_REF (manual resolution needed)"
  fi
fi

# ---- Verify daily report landed -------------------------------------------

REPORT_FILE="$DAILY_REPORT_DIR/research-${TODAY_DATE}.md"
if [ -f "$REPORT_FILE" ]; then
  log "Daily report present: $REPORT_FILE ($(wc -l < "$REPORT_FILE") lines)"
else
  log "WARNING: daily report not found at $REPORT_FILE — Claude session may have stored it elsewhere"
fi

# ---- Final phone-home ------------------------------------------------------

if [ "$CLAUDE_EXIT" = "0" ]; then
  phone_home completed "Daily research completed. Report: sartor/memory/daily/research-${TODAY_DATE}.md. Run log: $RUN_LOG."
  log "research-daily OK"
  exit 0
else
  phone_home failed "Claude exited $CLAUDE_EXIT. Whatever was committed is in the working tree. Run log: $RUN_LOG. Daily report (if any) at: sartor/memory/daily/research-${TODAY_DATE}.md."
  log "research-daily FAILED (claude exit $CLAUDE_EXIT)"
  exit "$CLAUDE_EXIT"
fi
