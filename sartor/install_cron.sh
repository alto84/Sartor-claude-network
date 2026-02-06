#!/usr/bin/env bash
# install_cron.sh - Install the Sartor gateway cron job
#
# Adds a crontab entry to run gateway_cron.py every 30 minutes.
# Safe to run multiple times (checks for existing entry first).
#
# Usage:
#   bash sartor/install_cron.sh          # Install
#   bash sartor/install_cron.sh remove   # Remove

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SARTOR_DIR="$SCRIPT_DIR"
GATEWAY_CRON="$SARTOR_DIR/gateway/gateway_cron.py"
PYTHON="$(command -v python3 || echo /usr/bin/python3)"
LOG_FILE="$HOME/.sartor-cron.log"

CRON_LINE="*/30 * * * * cd $SARTOR_DIR/.. && $PYTHON $GATEWAY_CRON >> $LOG_FILE 2>&1"

if [ "${1:-}" = "remove" ]; then
    crontab -l 2>/dev/null | grep -v "gateway_cron.py" | crontab -
    echo "Removed sartor-cron from crontab."
    exit 0
fi

# Check if already installed
if crontab -l 2>/dev/null | grep -q "gateway_cron.py"; then
    echo "sartor-cron already in crontab. No changes made."
    echo "Current entry:"
    crontab -l | grep "gateway_cron.py"
    exit 0
fi

# Add to crontab (preserving existing entries)
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo "Installed sartor-cron to crontab."
echo "  Schedule: every 30 minutes"
echo "  Script:   $GATEWAY_CRON"
echo "  Log:      $LOG_FILE"
echo ""
echo "Verify with: crontab -l"
