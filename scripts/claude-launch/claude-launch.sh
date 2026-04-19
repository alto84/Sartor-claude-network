#!/usr/bin/env bash
# Always launch Claude Code with full permission bypass
# Usage: ./claude-launch.sh [extra args]
# Or: ./claude-launch.sh -p "task prompt" (headless mode)

cd ~/Sartor-claude-network
exec claude --dangerously-skip-permissions "$@"
