#!/bin/bash
# Clean status files older than 1 hour

find /home/alton/Sartor-claude-network/data/agent-status -name "*.json" -mmin +60 -delete 2>/dev/null
echo "Cleanup complete"
