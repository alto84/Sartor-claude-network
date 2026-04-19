#!/usr/bin/env bash
# Spawn an independent Claude Code session for a delegated task
# Usage: ./claude-spawn.sh "Your task description here"
# The session runs headless with full permissions and outputs to stdout

if [ -z "$1" ]; then
    echo "Usage: ./claude-spawn.sh \"task description\""
    exit 1
fi

cd ~/Sartor-claude-network
unset CLAUDECODE  # prevent nested-session detection

claude --dangerously-skip-permissions --print -p "$1"
