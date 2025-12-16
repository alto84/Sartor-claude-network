#!/bin/bash
# Memory Bootstrap for Spawned Agents
# Source this file to get memory environment variables

# Memory server configuration
export MEMORY_SERVER_PATH="${MEMORY_SERVER_PATH:-/home/alton/agent-community-game/shared-memory/server/mcp-server.js}"
export MEMORY_CLIENT_PATH="${MEMORY_CLIENT_PATH:-/home/alton/agent-community-game/shared-memory/clients/mcp-client.js}"
export MEMORY_STORAGE_PATH="${MEMORY_STORAGE_PATH:-/home/alton/agent-community-game/shared-memory/storage}"

# Local swarm memory (simpler, file-based)
export SWARM_MEMORY_PATH="${SWARM_MEMORY_PATH:-/home/alton/claude-swarm/.swarm/memory}"

# Agent identification (should be set by coordinator)
export AGENT_ID="${AGENT_ID:-agent-$(date +%s)-$RANDOM}"
export AGENT_TYPE="${AGENT_TYPE:-worker}"

# Ensure directories exist
mkdir -p "$SWARM_MEMORY_PATH/episodic"
mkdir -p "$SWARM_MEMORY_PATH/semantic"
mkdir -p "$SWARM_MEMORY_PATH/working"
mkdir -p "$SWARM_MEMORY_PATH/coordination"

# Function to store memory entry
store_memory() {
    local type="${1:-episodic}"
    local content="$2"
    local topic="${3:-general}"

    local timestamp=$(date -Iseconds)
    local date=$(date +%Y-%m-%d)
    local id="mem-$(date +%s)-$RANDOM"

    local file=""
    case "$type" in
        episodic)
            file="$SWARM_MEMORY_PATH/episodic/${date}.jsonl"
            ;;
        semantic)
            file="$SWARM_MEMORY_PATH/semantic/${topic}.jsonl"
            ;;
        working)
            file="$SWARM_MEMORY_PATH/working/${AGENT_ID}.jsonl"
            ;;
        coordination)
            file="$SWARM_MEMORY_PATH/coordination/messages.jsonl"
            ;;
    esac

    echo "{\"id\":\"$id\",\"type\":\"$type\",\"content\":\"$content\",\"topic\":\"$topic\",\"agent_id\":\"$AGENT_ID\",\"timestamp\":\"$timestamp\"}" >> "$file"
    echo "$id"
}

# Function to query memory
query_memory() {
    local type="${1:-episodic}"
    local search="$2"
    local limit="${3:-10}"

    local path=""
    case "$type" in
        episodic)
            path="$SWARM_MEMORY_PATH/episodic/"
            ;;
        semantic)
            path="$SWARM_MEMORY_PATH/semantic/"
            ;;
        working)
            path="$SWARM_MEMORY_PATH/working/"
            ;;
        coordination)
            path="$SWARM_MEMORY_PATH/coordination/"
            ;;
    esac

    if [ -n "$search" ]; then
        find "$path" -name "*.jsonl" -exec cat {} \; 2>/dev/null | grep -i "$search" | tail -n "$limit"
    else
        find "$path" -name "*.jsonl" -exec cat {} \; 2>/dev/null | tail -n "$limit"
    fi
}

# Function to get recent coordination messages
get_coordination_messages() {
    local limit="${1:-20}"
    query_memory "coordination" "" "$limit"
}

# Function to broadcast message to other agents
broadcast_message() {
    local message="$1"
    local priority="${2:-medium}"

    store_memory "coordination" "{\"from\":\"$AGENT_ID\",\"to\":\"broadcast\",\"message\":\"$message\",\"priority\":\"$priority\"}"
}

echo "Memory bootstrap loaded for agent: $AGENT_ID"
