#!/usr/bin/env bash
# research-nightly.sh — staged for rtxpro6000server
# Fires nightly at 02:00 ET (06:00 UTC). Gates on no-active-vast.ai-rental.
# Spawns a fresh `claude -p` session against the Sartor working tree,
# instructed by /home/alton/research-nightly-prompt.md, to advance one of the
# three research lines (persona-engineering, ccp-alignment, pharmacovigilance).
#
# Design doc: sartor/memory/projects/research-nightly-cron-2026-05-12.md
# DO NOT install to /home/alton/ or add to crontab without Alton's explicit greenlight.
#
# Env vars:
#   DRY_RUN=1      Print what would happen, do not invoke Claude
#   PROMPT_FILE    Override prompt location (default /home/alton/research-nightly-prompt.md)
#   WORKDIR        Override working tree (default /home/alton/Sartor-claude-network)
#   MAX_TURNS      Override Claude turn cap (default 60)

set -euo pipefail

# ---- Configuration ---------------------------------------------------------

WORKDIR="${WORKDIR:-/home/alton/Sartor-claude-network}"
PROMPT_FILE="${PROMPT_FILE:-/home/alton/research-nightly-prompt.md}"
MAX_TURNS="${MAX_TURNS:-60}"
LOG_DIR="/home/alton/generated/cron-logs"
INBOX_DIR="$WORKDIR/sartor/memory/inbox/rocinante"
HOSTNAME_TAG="rtxpro6000server"

TS_UTC="$(date -u +%Y-%m-%dT%H%MZ)"
TS_HUMAN="$(date -u +%Y-%m-%d\ %H:%M:%S\ UTC)"
RUN_LOG="$LOG_DIR/research-nightly-${TS_UTC}.log"

DRY_RUN="${DRY_RUN:-0}"

# ---- Helpers ---------------------------------------------------------------

log() {
  printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*" | tee -a "$RUN_LOG"
}

phone_home() {
  # $1 = verb (skipped | started | completed | failed | yielded)
  # $2 = one-line body
  local verb="$1" body="$2"
  local out="$INBOX_DIR/${TS_UTC}_research-nightly-${verb}.md"
  mkdir -p "$INBOX_DIR"
  {
    echo "---"
    echo "type: phone-home"
    echo "from: $HOSTNAME_TAG"
    echo "kind: research-nightly"
    echo "verb: $verb"
    echo "fired_at_utc: $TS_HUMAN"
    echo "run_log: $RUN_LOG"
    echo "---"
    echo ""
    echo "# research-nightly $verb"
    echo ""
    echo "$body"
  } > "$out"
  log "phone-home written: $out"
}

# ---- Pre-flight ------------------------------------------------------------

mkdir -p "$LOG_DIR"
exec >> "$RUN_LOG" 2>&1
log "research-nightly start (DRY_RUN=$DRY_RUN)"

# Gate 1: working tree exists
if [ ! -d "$WORKDIR/.git" ]; then
  log "ABORT: $WORKDIR is not a git working tree"
  phone_home failed "Working tree missing at $WORKDIR. Investigate."
  exit 1
fi

# Gate 2: prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
  log "ABORT: prompt file missing at $PROMPT_FILE"
  phone_home failed "Prompt file missing at $PROMPT_FILE. Cannot proceed."
  exit 1
fi

# Gate 3: no active vast.ai customer container
# kaalia names customer containers `C.<instance_id>`. If any exist, the GPU
# belongs to the paying customer and we must not run *anything* on the box that
# touches the GPU. The nightly is CPU-only by design, but we still skip — a
# customer paying for compute shouldn't see arbitrary Claude sessions chewing CPU.
ACTIVE_RENTAL="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E '^C\.' | head -1 || true)"
if [ -n "$ACTIVE_RENTAL" ]; then
  log "SKIP: active vast.ai rental detected ($ACTIVE_RENTAL)"
  phone_home skipped "Active rental container \`$ACTIVE_RENTAL\`. Nightly skipped per hosting-agreement constraint. Next attempt: tomorrow 02:00 ET."
  exit 0
fi

# Gate 4: git pull (clean state preferred; stash with named marker if dirty)
cd "$WORKDIR"
DIRTY=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  DIRTY=1
  log "Working tree dirty. Stashing with marker research-nightly-$TS_UTC"
  if [ "$DRY_RUN" = "0" ]; then
    git stash push -u -m "research-nightly-$TS_UTC"
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
  log "DRY_RUN=1: would invoke claude -p with prompt $PROMPT_FILE (max-turns $MAX_TURNS)"
  log "DRY_RUN=1: would commit any research/ or inbox/ changes to local working tree"
  log "DRY_RUN=1: would push to origin (= rtxserver bare via local file://)"
  log "DRY_RUN=1: would write phone-home to $INBOX_DIR/${TS_UTC}_research-nightly-completed.md"
  exit 0
fi

# ---- Invoke Claude ---------------------------------------------------------

phone_home started "Nightly fired $TS_HUMAN. No active rental. Working tree clean (or stashed). Invoking Claude with $PROMPT_FILE, max-turns=$MAX_TURNS."

log "Invoking claude -p"
CLAUDE_EXIT=0
# stream-json gives us per-turn telemetry. We capture stdout to the run log and
# don't pipe it anywhere else — the Claude session itself writes the phone-home
# completion file via its instruction set.
if ! timeout 5400 claude -p "$(cat "$PROMPT_FILE")" \
       --output-format stream-json \
       --max-turns "$MAX_TURNS" \
       --dangerously-skip-permissions; then
  CLAUDE_EXIT=$?
  log "Claude session exited non-zero: $CLAUDE_EXIT (timeout=5400s)"
fi

# ---- Commit + push ---------------------------------------------------------

# Whatever Claude touched, commit (Claude itself should have committed; this is
# a backstop for changes left in the working tree).
cd "$WORKDIR"
if ! git diff --quiet || ! git diff --cached --quiet || \
   [ -n "$(git ls-files --others --exclude-standard)" ]; then
  log "Working-tree changes remain after Claude session. Backstop commit."
  git add -A
  git commit -m "research-nightly backstop commit ($TS_UTC)" || log "Backstop commit failed (maybe nothing to commit)"
fi

log "Pushing to origin (rtxserver bare)"
git push origin HEAD || log "Push to origin failed; commits remain in local working tree"

# ---- Restore stash if we had one ------------------------------------------

if [ "$DIRTY" = "1" ]; then
  log "Restoring pre-run stash research-nightly-$TS_UTC"
  STASH_REF="$(git stash list | grep "research-nightly-$TS_UTC" | head -1 | awk -F: '{print $1}' || true)"
  if [ -n "$STASH_REF" ]; then
    git stash pop "$STASH_REF" || log "Stash pop failed; stash preserved as $STASH_REF (manual resolution needed)"
  fi
fi

# ---- Final phone-home ------------------------------------------------------

if [ "$CLAUDE_EXIT" = "0" ]; then
  phone_home completed "Nightly completed. Run log: $RUN_LOG. Claude session wrote its own results phone-home (look for ${TS_UTC}_research-nightly-results.md)."
  log "research-nightly OK"
  exit 0
else
  phone_home failed "Claude exited $CLAUDE_EXIT (possibly budget/timeout). Whatever was committed is in the working tree. Run log: $RUN_LOG."
  log "research-nightly FAILED (claude exit $CLAUDE_EXIT)"
  exit "$CLAUDE_EXIT"
fi
