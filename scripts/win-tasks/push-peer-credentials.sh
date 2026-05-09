#!/bin/bash
# Push Rocinante's ~/.claude/.credentials.json to peer machines.
# Run every 4h via Windows Task Scheduler so peer Claudes never wake up
# to a stale OAuth token after a reboot.
#
# Idempotent — safe to run any time. If a peer is unreachable, logs and continues.

set -u
LOGDIR="/c/Users/alto8/AppData/Local/Temp/peer-cred-push"
mkdir -p "$LOGDIR"
LOG="$LOGDIR/$(date +%Y-%m-%d).log"

CRED_FILE="/c/Users/alto8/.claude/.credentials.json"
PEERS="192.168.1.157 192.168.1.100"

if [ ! -f "$CRED_FILE" ]; then
    echo "$(date -Is) ERROR: source credentials file missing at $CRED_FILE" >> "$LOG"
    exit 1
fi

# Read source expiry for logging (grep-based, no jq, no python path issues)
src_exp_ms=$(grep -oE '"expiresAt"\s*:\s*[0-9]+' "$CRED_FILE" | grep -oE '[0-9]+$')
src_exp=$(( ${src_exp_ms:-0} / 1000 ))
src_exp_human=$(date -d "@$src_exp" 2>/dev/null || echo "?")

echo "$(date -Is) Source token expires: $src_exp_human" >> "$LOG"

for peer in $PEERS; do
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes alton@$peer 'true' 2>/dev/null; then
        echo "$(date -Is) [$peer] unreachable, skipping" >> "$LOG"
        continue
    fi

    # Read peer's current expiry
    peer_exp=$(ssh -o ConnectTimeout=5 alton@$peer 'jq -r ".claudeAiOauth.expiresAt/1000" ~/.claude/.credentials.json 2>/dev/null' || echo "0")

    if [ "$peer_exp" = "$src_exp" ]; then
        echo "$(date -Is) [$peer] already up to date (expires $src_exp_human)" >> "$LOG"
        continue
    fi

    if scp -o ConnectTimeout=10 -q "$CRED_FILE" alton@$peer:~/.claude/.credentials.json 2>>"$LOG"; then
        ssh -o ConnectTimeout=5 alton@$peer 'chmod 600 ~/.claude/.credentials.json' 2>>"$LOG"
        echo "$(date -Is) [$peer] pushed (now expires $src_exp_human)" >> "$LOG"
    else
        echo "$(date -Is) [$peer] scp FAILED" >> "$LOG"
    fi
done
