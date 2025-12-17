#!/bin/bash
# Memory Write via MCP HTTP Server (Firebase-enabled)
# Usage: ./scripts/memory-write-mcp.sh <content> <type> <importance> <tags>
#
# This script attempts to write memories via the MCP HTTP server (which uses Firebase),
# falling back to local file storage if the server is unavailable.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_URL="${MCP_HTTP_URL:-http://localhost:3001/mcp}"
SESSION_FILE="$REPO_ROOT/data/.mcp-session-id"

# Parameters
CONTENT="$1"
TYPE="${2:-episodic}"
IMPORTANCE="${3:-0.5}"
TAGS="${4:-[]}"

# Ensure tags is valid JSON array
if [[ ! "$TAGS" =~ ^\[.*\]$ ]]; then
  TAGS="[\"$TAGS\"]"
fi

# Escape content for JSON using Python
ESCAPED_CONTENT=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))" <<< "$CONTENT")

# Initialize MCP session and get session ID
init_session() {
  local headers_file=$(mktemp)
  local response=$(curl -s -X POST "$MCP_URL" \
    --max-time 5 \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -D "$headers_file" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "initialize",
      "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "subagent-bash", "version": "1.0.0"}
      }
    }' 2>/dev/null || echo "")

  # Extract session ID from headers
  local session_id=$(grep -i "mcp-session-id:" "$headers_file" 2>/dev/null | sed 's/[^:]*: //' | tr -d '\r\n' || echo "")
  rm -f "$headers_file"

  if [[ -n "$session_id" && -n "$response" && "$response" =~ "result" ]]; then
    mkdir -p "$(dirname "$SESSION_FILE")"
    echo "$session_id" > "$SESSION_FILE"
    echo "$session_id"
    return 0
  fi
  return 1
}

# Write memory via MCP
write_memory() {
  local session_id="$1"

  local response=$(curl -s -X POST "$MCP_URL" \
    --max-time 10 \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "mcp-session-id: $session_id" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 2,
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"memory_create\",
        \"arguments\": {
          \"content\": $ESCAPED_CONTENT,
          \"type\": \"$TYPE\",
          \"importance\": $IMPORTANCE,
          \"tags\": $TAGS
        }
      }
    }" 2>/dev/null || echo "")

  if [[ -n "$response" && "$response" =~ "result" && ! "$response" =~ "error" ]]; then
    # Extract memory ID from response
    local memory_id=$(echo "$response" | python3 -c "
import sys, json
try:
    r = json.load(sys.stdin)
    content = r.get('result', {}).get('content', [{}])
    if content:
        text = content[0].get('text', '{}')
        parsed = json.loads(text)
        print(parsed.get('id', 'unknown'))
except:
    print('unknown')
" 2>/dev/null || echo "unknown")
    echo "{\"id\":\"$memory_id\",\"status\":\"created\",\"backend\":\"firebase\"}"
    return 0
  fi
  return 1
}

# Main logic
main() {
  # Try to get or create session
  local session_id=""

  # Reuse existing session if available
  if [[ -f "$SESSION_FILE" ]]; then
    session_id=$(cat "$SESSION_FILE" 2>/dev/null || echo "")
  fi

  # If no session, initialize one
  if [[ -z "$session_id" ]]; then
    session_id=$(init_session 2>/dev/null || echo "")
  fi

  # Try to write via MCP
  if [[ -n "$session_id" ]]; then
    if write_memory "$session_id"; then
      exit 0
    fi

    # Session might be expired, try reinitializing
    rm -f "$SESSION_FILE"
    session_id=$(init_session 2>/dev/null || echo "")
    if [[ -n "$session_id" ]]; then
      if write_memory "$session_id"; then
        exit 0
      fi
    fi
  fi

  # Fallback to local file write
  echo "[memory-write-mcp] MCP server unavailable, falling back to local storage" >&2
  exec "$REPO_ROOT/scripts/memory-write.sh" "$CONTENT" "$TYPE" "$IMPORTANCE" "$TAGS"
}

main
