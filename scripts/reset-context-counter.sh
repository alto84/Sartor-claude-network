#!/bin/bash
# Reset context counter after compaction

COUNTER_FILE="/home/alton/claude-swarm/.swarm/context-counter"
CHECKPOINT_FILE="/home/alton/claude-swarm/.swarm/CHECKPOINT_NEEDED"

# Reset counter
echo "0" > "$COUNTER_FILE"

# Remove checkpoint signal
rm -f "$CHECKPOINT_FILE"

# Log reset
echo "Context counter reset at $(date -Iseconds)" >> /home/alton/claude-swarm/.swarm/context.log
