#!/usr/bin/env bash
# Spawn a fully independent interactive Claude Code session in a new terminal
# This session can act as a suborchestrator for a domain
# Usage: ./claude-orchestrator.sh [domain-name] ["optional initial prompt"]

DOMAIN="${1:-general}"
PROMPT="${2:-}"

cd ~/Sartor-claude-network
unset CLAUDECODE

if [ -n "$PROMPT" ]; then
    # Headless mode with initial prompt
    mintty -t "Claude-$DOMAIN" /usr/bin/bash -c "cd ~/Sartor-claude-network && unset CLAUDECODE && claude --dangerously-skip-permissions -p '$PROMPT'; read -p 'Press enter to close...'"
else
    # Interactive mode
    mintty -t "Claude-$DOMAIN" /usr/bin/bash -c "cd ~/Sartor-claude-network && unset CLAUDECODE && claude --dangerously-skip-permissions"
fi
