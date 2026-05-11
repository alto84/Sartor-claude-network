#!/bin/bash
# Launch rtxserver Claude with the passoff packet as initial prompt.
# Starts in tmux so the session persists across ssh disconnects.

set -u

PROMPT="Read the passoff packet at sartor/memory/research/persona-engineering/PASSOFF-rtxserver-001.md and execute it in full. You are the rtxserver Claude spawning a local agent team to run experiments 001 (loyalty baseline fingerprint) + 002 (layer-sweep diagnostic) + 003 (subspace extraction) in parallel where compute permits. Follow the packet's first-actions, work queue, phone-home triggers, and stop conditions exactly. Act as team lead. Rocinante is the orchestrator; communicate back via files in sartor/memory/inbox/rocinante/ (git commit, do not push). Start by verifying the environment, then spawn Group A tooling agents, then proceed through Groups B and C."

cd /home/alton/Sartor-claude-network

tmux kill-session -t claude-team-1 2>/dev/null

# Start in tmux with --permission-mode bypassPermissions so the session
# doesn't block on approval prompts.
tmux new-session -d -s claude-team-1 \
  "claude --dangerously-skip-permissions \"$PROMPT\" 2>&1 | tee /home/alton/claude-team-1.log"

sleep 3
tmux ls
echo ---
tmux capture-pane -t claude-team-1 -p 2>&1 | tail -15
