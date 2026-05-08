#!/bin/bash
# ============================================================================
# docker-weekly-prune.sh — rtxpro6000server (FRESH-WRITE)
# ============================================================================
# DIFF-SUMMARY (vs gpuserver1 source):
#   STATUS: FRESH-WRITE per directive's "fresh-write spec".
#   The directive flagged this script "MAY NOT EXIST" on gpuserver1, and
#   SSH outbound to confirm is unavailable from this host. Authored from
#   the directive's spec verbatim.
#
#   Spec-compliance checklist:
#     - schedule (suggested for crontab): 0 3 * * 0 (Sunday 3am)
#     - prune: containers, images, networks (NOT system -af, NOT volumes)
#     - capture before/after `du -sh /var/lib/docker`
#     - safety: refuse to run if any vastai container is active
#     - log: /home/alton/generated/cron-logs/docker-weekly-prune.log
#     - inbox: inbox/rtxpro6000server/_docker-prune/YYYY-MM-DD.md
# ============================================================================

set -u

LOG_DIR="/home/alton/generated/cron-logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/docker-weekly-prune.log"

exec >> "$LOG" 2>&1

HOSTNAME="$(hostname)"
TS_HUMAN="$(date -Iseconds)"
DATE_TAG="$(date -u +%Y-%m-%d)"

echo "=== $TS_HUMAN docker-weekly-prune start (host=$HOSTNAME) ==="

REPO_DIR="$HOME/Sartor-claude-network"
INBOX_BASE="$REPO_DIR/sartor/memory/inbox/$HOSTNAME/_docker-prune"
mkdir -p "$INBOX_BASE"

# ---- Safety: refuse to run if any vast.ai container is active ----
ACTIVE_VASTAI="$(docker ps --filter name=vastai -q 2>/dev/null | wc -l)"
if [ "$ACTIVE_VASTAI" -gt 0 ]; then
  echo "ABORT: $ACTIVE_VASTAI active vastai container(s); will not prune mid-rental"
  ABORT_FILE="$INBOX_BASE/${DATE_TAG}.md"
  {
    echo "---"
    echo "type: docker_prune_skipped"
    echo "host: $HOSTNAME"
    echo "cron: docker-weekly-prune.sh"
    echo "written: $TS_HUMAN"
    echo "reason: active_vastai_container"
    echo "---"
    echo
    echo "# docker-weekly-prune SKIPPED on $HOSTNAME ($DATE_TAG)"
    echo
    echo "Detected $ACTIVE_VASTAI active vast.ai container(s). Pruning"
    echo "mid-rental could surprise renters; run aborted with no changes."
  } > "$ABORT_FILE"
  exit 0
fi

# ---- Capture before-state ----
BEFORE_DU="$(du -sh /var/lib/docker 2>/dev/null | awk '{print $1}')"
BEFORE_BYTES="$(du -sb /var/lib/docker 2>/dev/null | awk '{print $1}')"
echo "before: /var/lib/docker = $BEFORE_DU ($BEFORE_BYTES bytes)"

# ---- Prune (NOT volumes — vast.ai uses Docker volumes for renter persistence) ----
echo "--- container prune ---"
docker container prune -f 2>&1 || true

echo "--- image prune ---"
docker image prune -f 2>&1 || true

echo "--- network prune ---"
docker network prune -f 2>&1 || true

# ---- Capture after-state ----
AFTER_DU="$(du -sh /var/lib/docker 2>/dev/null | awk '{print $1}')"
AFTER_BYTES="$(du -sb /var/lib/docker 2>/dev/null | awk '{print $1}')"
echo "after: /var/lib/docker = $AFTER_DU ($AFTER_BYTES bytes)"

SAVED_BYTES=$(( BEFORE_BYTES - AFTER_BYTES ))
SAVED_HUMAN="$(numfmt --to=iec --suffix=B "$SAVED_BYTES" 2>/dev/null || echo "${SAVED_BYTES}B")"
echo "saved: $SAVED_HUMAN"

# ---- Inbox summary ----
SUMMARY_FILE="$INBOX_BASE/${DATE_TAG}.md"
{
  echo "---"
  echo "type: docker_prune_summary"
  echo "host: $HOSTNAME"
  echo "cron: docker-weekly-prune.sh"
  echo "written: $TS_HUMAN"
  echo "before_du: $BEFORE_DU"
  echo "after_du: $AFTER_DU"
  echo "saved: $SAVED_HUMAN"
  echo "---"
  echo
  echo "# docker-weekly-prune summary on $HOSTNAME ($DATE_TAG)"
  echo
  echo "- /var/lib/docker before: \`$BEFORE_DU\`"
  echo "- /var/lib/docker after: \`$AFTER_DU\`"
  echo "- saved: \`$SAVED_HUMAN\`"
  echo
  echo "Pruned: stopped containers, dangling images, unused networks."
  echo "NOT pruned: volumes (vast.ai uses them for renter persistent storage)."
} > "$SUMMARY_FILE"

echo "=== $TS_HUMAN docker-weekly-prune end (saved=$SAVED_HUMAN, file=$SUMMARY_FILE) ==="
exit 0
