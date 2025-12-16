#!/bin/bash
# Context Checkpoint Script
# Called by hooks to track context usage and trigger compaction

COUNTER_FILE="/home/alton/claude-swarm/.swarm/context-counter"
CHECKPOINT_FILE="/home/alton/claude-swarm/.swarm/CHECKPOINT_NEEDED"
STATE_FILE="/home/alton/claude-swarm/.swarm/artifacts/STATE.json"
REBOOT_FILE="/home/alton/claude-swarm/.swarm/REBOOT.md"

# Tool call threshold before suggesting compact
THRESHOLD=${CONTEXT_THRESHOLD:-100}

# Get current count or initialize
if [ -f "$COUNTER_FILE" ]; then
    COUNT=$(cat "$COUNTER_FILE")
else
    COUNT=0
fi

# Increment counter
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# Check if we should create checkpoint signal
if [ "$COUNT" -ge "$THRESHOLD" ]; then
    # Create checkpoint signal with timestamp
    echo "CHECKPOINT NEEDED - Tool calls: $COUNT - $(date -Iseconds)" > "$CHECKPOINT_FILE"

    # Log to coordinator log if available
    if [ -f "/home/alton/.swarm/coordinator.log" ]; then
        echo "⚠️  Context checkpoint triggered ($COUNT tool calls) - $(date)" >> /home/alton/.swarm/coordinator.log
    fi
fi

# Every 25 calls, log progress
if [ $((COUNT % 25)) -eq 0 ]; then
    echo "Context checkpoint: $COUNT tool calls at $(date -Iseconds)" >> /home/alton/claude-swarm/.swarm/context.log
fi
