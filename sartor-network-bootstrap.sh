#!/usr/bin/env bash
################################################################################
# Sartor Network Bootstrap - Bash/Curl Implementation
#
# USAGE FOR A FRESH AGENT:
#     bash sartor-network-bootstrap.sh
#
# REQUIREMENTS:
#     - curl (for HTTP requests)
#     - jq (for JSON parsing)
#     - bash 4.0+ (for associative arrays)
#
# WHAT IT DOES:
#     1. Connects you to the Firebase-based MCP network
#     2. Provides all MCP tool functions
#     3. Enables sub-agent auto-onboarding
#     4. Pure bash - no Python required!
################################################################################

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

FIREBASE_URL="${SARTOR_FIREBASE_URL:-https://home-claude-network-default-rtdb.firebaseio.com}"
FIREBASE_URL="${FIREBASE_URL%/}"  # Remove trailing slash

# Generate unique agent ID if not provided
if [ -z "${SARTOR_AGENT_ID:-}" ]; then
    TIMESTAMP=$(date +%s)
    RANDOM_ID=$(uuidgen 2>/dev/null | cut -d'-' -f1 || echo "$RANDOM")
    AGENT_ID="claude-bash-${TIMESTAMP}-${RANDOM_ID}"
else
    AGENT_ID="$SARTOR_AGENT_ID"
fi

AGENT_NAME="${SARTOR_AGENT_NAME:-Agent-${AGENT_ID:0:12}}"
PARENT_AGENT_ID="${SARTOR_PARENT_AGENT_ID:-}"
IS_CONNECTED=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Utility Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
    echo -e "${GREEN}✅${NC} $*"
}

log_error() {
    echo -e "${RED}❌${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $*"
}

check_dependencies() {
    local missing=()

    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi

    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing[*]}"
        log_info "Install them with:"
        log_info "  Ubuntu/Debian: sudo apt-get install curl jq"
        log_info "  macOS: brew install curl jq"
        log_info "  CentOS/RHEL: sudo yum install curl jq"
        return 1
    fi

    return 0
}

get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%S.000Z"
}

generate_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        # Fallback UUID generation
        printf '%04x%04x-%04x-%04x-%04x-%04x%04x%04x\n' \
            $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM
    fi
}

# ============================================================================
# Firebase HTTP Request Function
# ============================================================================

firebase_request() {
    local method="$1"
    local path="$2"
    local data="${3:-}"

    local url="${FIREBASE_URL}/agents-network${path}.json"
    local response
    local http_code

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" 2>/dev/null || echo -e "null\n000")
        http_code=$(echo "$response" | tail -n1)
        response=$(echo "$response" | head -n-1)

    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo -e "null\n000")
        http_code=$(echo "$response" | tail -n1)
        response=$(echo "$response" | head -n-1)

    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo -e "null\n000")
        http_code=$(echo "$response" | tail -n1)
        response=$(echo "$response" | head -n-1)

    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo -e "null\n000")
        http_code=$(echo "$response" | tail -n1)
        response=$(echo "$response" | head -n-1)

    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$url" 2>/dev/null || echo -e "null\n000")
        http_code=$(echo "$response" | tail -n1)
        response=$(echo "$response" | head -n-1)
    else
        log_error "Unsupported HTTP method: $method"
        return 1
    fi

    # Check HTTP status
    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        echo "$response"
        return 0
    else
        log_error "Firebase request failed: HTTP $http_code"
        return 1
    fi
}

# ============================================================================
# Connection Functions
# ============================================================================

connect() {
    log_info "Connecting to Sartor Claude Network..."

    local agent_data
    agent_data=$(jq -n \
        --arg agent_id "$AGENT_ID" \
        --arg agent_name "$AGENT_NAME" \
        --arg parent_id "$PARENT_AGENT_ID" \
        --arg joined_at "$(get_timestamp)" \
        --arg last_seen "$(get_timestamp)" \
        '{
            agent_id: $agent_id,
            agent_name: $agent_name,
            status: "online",
            capabilities: ["communication", "tasks", "skills", "knowledge"],
            joined_at: $joined_at,
            last_seen: $last_seen,
            parent_agent_id: (if $parent_id != "" then $parent_id else null end)
        }')

    if firebase_request "PUT" "/agents/$AGENT_ID" "$agent_data" > /dev/null; then
        # Set presence
        local presence_data
        presence_data=$(jq -n \
            --arg last_seen "$(get_timestamp)" \
            '{
                online: true,
                last_seen: $last_seen
            }')

        firebase_request "PUT" "/presence/$AGENT_ID" "$presence_data" > /dev/null

        IS_CONNECTED=true
        log_success "Connected to Sartor Claude Network!"
        log_info "  Agent ID: $AGENT_ID"
        log_info "  Agent Name: $AGENT_NAME"
        log_info "  Firebase: $FIREBASE_URL"

        # Show network status
        local agents_count
        agents_count=$(agent_list_count)
        log_info "  Network: $agents_count agents online"

        return 0
    else
        log_error "Connection failed"
        return 1
    fi
}

disconnect() {
    if [ "$IS_CONNECTED" = false ]; then
        return
    fi

    local update_data
    update_data=$(jq -n \
        --arg last_seen "$(get_timestamp)" \
        '{
            status: "offline",
            last_seen: $last_seen
        }')

    firebase_request "PATCH" "/agents/$AGENT_ID" "$update_data" > /dev/null

    local presence_data
    presence_data=$(jq -n \
        --arg last_seen "$(get_timestamp)" \
        '{
            online: false,
            last_seen: $last_seen
        }')

    firebase_request "PATCH" "/presence/$AGENT_ID" "$presence_data" > /dev/null

    IS_CONNECTED=false
    log_info "Disconnected from network"
}

# ============================================================================
# Communication Functions
# ============================================================================

message_send() {
    local to_agent_id="$1"
    local content="$2"

    local message_id
    message_id=$(generate_uuid)

    local message_data
    message_data=$(jq -n \
        --arg from "$AGENT_ID" \
        --arg to "$to_agent_id" \
        --arg content "$content" \
        --arg timestamp "$(get_timestamp)" \
        '{
            from: $from,
            to: $to,
            content: $content,
            timestamp: $timestamp,
            read: false
        }')

    if firebase_request "PUT" "/messages/direct/$to_agent_id/$message_id" "$message_data" > /dev/null; then
        log_success "Message sent to $to_agent_id"
        return 0
    else
        log_error "Failed to send message"
        return 1
    fi
}

message_broadcast() {
    local content="$1"

    local message_id
    message_id=$(generate_uuid)

    local message_data
    message_data=$(jq -n \
        --arg from "$AGENT_ID" \
        --arg content "$content" \
        --arg timestamp "$(get_timestamp)" \
        '{
            from: $from,
            content: $content,
            timestamp: $timestamp
        }')

    if firebase_request "PUT" "/messages/broadcast/$message_id" "$message_data" > /dev/null; then
        log_success "Broadcast sent: $content"
        return 0
    else
        log_error "Failed to send broadcast"
        return 1
    fi
}

message_read() {
    local count="${1:-10}"

    local messages
    messages=$(firebase_request "GET" "/messages/direct/$AGENT_ID")

    if [ "$messages" = "null" ] || [ -z "$messages" ]; then
        echo "[]"
        return 0
    fi

    # Convert to array and sort by timestamp
    echo "$messages" | jq -r --argjson count "$count" '
        to_entries |
        map(.value + {message_id: .key}) |
        sort_by(.timestamp) |
        reverse |
        .[:$count]
    '
}

# ============================================================================
# Task Coordination Functions
# ============================================================================

task_list() {
    local status="${1:-available}"

    local tasks
    tasks=$(firebase_request "GET" "/tasks")

    if [ "$tasks" = "null" ] || [ -z "$tasks" ]; then
        echo "[]"
        return 0
    fi

    # Filter by status
    echo "$tasks" | jq -r --arg status "$status" '
        to_entries |
        map(.value + {task_id: .key}) |
        map(select(.status == $status))
    '
}

task_claim() {
    local task_id="$1"

    # Check if task is available
    local task
    task=$(firebase_request "GET" "/tasks/$task_id")

    if [ "$task" = "null" ] || [ -z "$task" ]; then
        log_error "Task $task_id not found"
        return 1
    fi

    local task_status
    task_status=$(echo "$task" | jq -r '.status')

    if [ "$task_status" != "available" ]; then
        log_error "Task $task_id not available (status: $task_status)"
        return 1
    fi

    # Claim the task
    local claim_data
    claim_data=$(jq -n \
        --arg claimed_by "$AGENT_ID" \
        --arg claimed_at "$(get_timestamp)" \
        '{
            status: "claimed",
            claimed_by: $claimed_by,
            claimed_at: $claimed_at
        }')

    if firebase_request "PATCH" "/tasks/$task_id" "$claim_data" > /dev/null; then
        local task_title
        task_title=$(echo "$task" | jq -r '.title // "Unknown"')
        log_success "Claimed task: $task_title"
        return 0
    else
        log_error "Failed to claim task"
        return 1
    fi
}

task_create() {
    local title="$1"
    local description="$2"
    local task_data="${3:-{}}"

    local task_id
    task_id=$(generate_uuid)

    local task_json
    task_json=$(jq -n \
        --arg task_id "$task_id" \
        --arg title "$title" \
        --arg description "$description" \
        --arg created_by "$AGENT_ID" \
        --arg created_at "$(get_timestamp)" \
        --argjson data "$task_data" \
        '{
            task_id: $task_id,
            title: $title,
            description: $description,
            status: "available",
            created_by: $created_by,
            created_at: $created_at,
            data: $data
        }')

    if firebase_request "PUT" "/tasks/$task_id" "$task_json" > /dev/null; then
        log_success "Created task: $title"
        echo "$task_id"
        return 0
    else
        log_error "Failed to create task"
        return 1
    fi
}

task_update() {
    local task_id="$1"
    local status="$2"
    local result="${3:-{}}"

    local update_data
    update_data=$(jq -n \
        --arg status "$status" \
        --arg updated_by "$AGENT_ID" \
        --arg updated_at "$(get_timestamp)" \
        --argjson result "$result" \
        '{
            status: $status,
            updated_by: $updated_by,
            updated_at: $updated_at,
            result: $result
        }')

    if firebase_request "PATCH" "/tasks/$task_id" "$update_data" > /dev/null; then
        log_success "Updated task to $status"
        return 0
    else
        log_error "Failed to update task"
        return 1
    fi
}

# ============================================================================
# Knowledge Base Functions
# ============================================================================

knowledge_add() {
    local content="$1"
    local tags="${2:-[]}"

    # Parse tags if provided as comma-separated string
    if [[ "$tags" =~ ^[^[].*$ ]]; then
        tags=$(echo "$tags" | jq -R 'split(",") | map(ltrimstr(" ") | rtrimstr(" "))')
    fi

    local knowledge_id
    knowledge_id=$(generate_uuid)

    local knowledge_data
    knowledge_data=$(jq -n \
        --arg content "$content" \
        --arg added_by "$AGENT_ID" \
        --arg timestamp "$(get_timestamp)" \
        --argjson tags "$tags" \
        '{
            content: $content,
            added_by: $added_by,
            timestamp: $timestamp,
            tags: $tags
        }')

    if firebase_request "PUT" "/knowledge/$knowledge_id" "$knowledge_data" > /dev/null; then
        log_success "Added knowledge: ${content:0:50}..."
        echo "$knowledge_id"
        return 0
    else
        log_error "Failed to add knowledge"
        return 1
    fi
}

knowledge_query() {
    local query="${1:-}"

    local knowledge
    knowledge=$(firebase_request "GET" "/knowledge")

    if [ "$knowledge" = "null" ] || [ -z "$knowledge" ]; then
        echo "[]"
        return 0
    fi

    # Convert to array and optionally filter by query
    if [ -n "$query" ]; then
        echo "$knowledge" | jq -r --arg query "$query" '
            to_entries |
            map(.value + {knowledge_id: .key}) |
            map(select(.content | ascii_downcase | contains($query | ascii_downcase)))
        '
    else
        echo "$knowledge" | jq -r '
            to_entries |
            map(.value + {knowledge_id: .key})
        '
    fi
}

# ============================================================================
# Agent Discovery Functions
# ============================================================================

agent_list() {
    local agents
    agents=$(firebase_request "GET" "/agents")

    if [ "$agents" = "null" ] || [ -z "$agents" ]; then
        echo "[]"
        return 0
    fi

    echo "$agents" | jq -r '
        to_entries |
        map(.value + {agent_id: .key})
    '
}

agent_list_count() {
    local agents
    agents=$(agent_list)
    echo "$agents" | jq 'length'
}

agent_status() {
    local agent_id="$1"

    firebase_request "GET" "/agents/$agent_id"
}

# ============================================================================
# Sub-Agent Support Functions
# ============================================================================

get_sub_agent_context() {
    cat <<EOF
export SARTOR_FIREBASE_URL="$FIREBASE_URL"
export SARTOR_PARENT_AGENT_ID="$AGENT_ID"
export SARTOR_NETWORK_MODE="firebase"
EOF
}

get_sub_agent_prompt() {
    local sub_agent_id="${1:-$AGENT_ID-subagent-$(date +%s)}"

    cat <<'EOF'
╔═══════════════════════════════════════════════════════════╗
║        SARTOR NETWORK - AUTOMATIC SUB-AGENT ONBOARDING    ║
╚═══════════════════════════════════════════════════════════╝

You are a sub-agent in the Sartor Claude Network with full network access.

YOUR IDENTITY:
EOF
    echo "  • Agent ID: $sub_agent_id"
    echo "  • Parent Agent: $AGENT_ID"
    cat <<EOF
  • Network: Firebase MCP
  • Status: ✅ AUTOMATICALLY CONNECTED

NETWORK ACCESS CODE (Bash):
\`\`\`bash
# Source the bootstrap script
export SARTOR_FIREBASE_URL="$FIREBASE_URL"
export SARTOR_PARENT_AGENT_ID="$AGENT_ID"
export SARTOR_AGENT_ID="$sub_agent_id"

bash sartor-network-bootstrap.sh
\`\`\`

AVAILABLE FUNCTIONS:
  • message_send <to_agent_id> <content> - Send direct message
  • message_broadcast <content> - Broadcast to all
  • task_list [status] - List tasks
  • task_claim <task_id> - Claim a task
  • task_create <title> <description> - Create task
  • knowledge_add <content> [tags] - Add knowledge
  • knowledge_query [query] - Query knowledge
  • agent_list - List all agents

You have FULL network access. Use it to coordinate with other agents!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your assigned task follows below:

EOF
}

# ============================================================================
# Demo Function
# ============================================================================

demo_usage() {
    echo "======================================================================"
    echo "  SARTOR NETWORK CLIENT - DEMO USAGE (Bash Version)"
    echo "======================================================================"

    # Step 1: Connect
    echo ""
    echo "📌 STEP 1: Connect to Network"
    echo "----------------------------------------------------------------------"
    connect
    sleep 1

    # Step 2: Broadcast
    echo ""
    echo "📌 STEP 2: Announce Yourself"
    echo "----------------------------------------------------------------------"
    message_broadcast "Hello network! I'm a new bash agent."
    sleep 1

    # Step 3: Share knowledge
    echo ""
    echo "📌 STEP 3: Share Knowledge"
    echo "----------------------------------------------------------------------"
    knowledge_add "This is a demo of the Sartor Network bash bootstrap" '["demo", "bootstrap", "bash"]'
    sleep 1

    # Step 4: Explore network
    echo ""
    echo "📌 STEP 4: Explore Network"
    echo "----------------------------------------------------------------------"

    local agents
    agents=$(agent_list)
    local agent_count
    agent_count=$(echo "$agents" | jq 'length')
    echo "👥 Found $agent_count agents"
    echo "$agents" | jq -r '.[-3:] | .[] | "   • \(.agent_id[:30]): \(.status)"'

    local knowledge
    knowledge=$(knowledge_query)
    local knowledge_count
    knowledge_count=$(echo "$knowledge" | jq 'length')
    echo ""
    echo "🧠 Found $knowledge_count knowledge entries"
    echo "$knowledge" | jq -r '.[-2:] | .[] | "   • \(.content[:60])..."'

    local tasks
    tasks=$(task_list)
    local task_count
    task_count=$(echo "$tasks" | jq 'length')
    echo ""
    echo "📋 Found $task_count available tasks"

    sleep 1

    # Step 5: Sub-agent prep
    echo ""
    echo "📌 STEP 5: Prepare for Sub-Agents"
    echo "----------------------------------------------------------------------"
    echo "When spawning sub-agents, use this prompt:"
    echo ""
    get_sub_agent_prompt | head -20
    echo "..."

    sleep 1

    # Step 6: Disconnect
    echo ""
    echo "📌 STEP 6: Disconnect"
    echo "----------------------------------------------------------------------"
    disconnect

    echo ""
    echo "======================================================================"
    echo "  ✅ DEMO COMPLETE - You're ready to use the network!"
    echo "======================================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Source this file: source sartor-network-bootstrap.sh"
    echo "  2. Connect: connect"
    echo "  3. Use the functions!"
    echo ""
}

# ============================================================================
# Interactive CLI Mode
# ============================================================================

interactive_mode() {
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║            SARTOR NETWORK - BASH BOOTSTRAP CLI                 ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Interactive mode. Type 'help' for commands, 'exit' to quit."
    echo ""

    connect

    while true; do
        echo -n "sartor> "
        read -r cmd args

        case "$cmd" in
            help)
                echo "Available commands:"
                echo "  send <agent_id> <message>  - Send direct message"
                echo "  broadcast <message>        - Broadcast to all"
                echo "  list-agents               - List all agents"
                echo "  list-tasks [status]       - List tasks"
                echo "  claim <task_id>           - Claim a task"
                echo "  create-task <title> <desc> - Create task"
                echo "  add-knowledge <content>   - Add knowledge"
                echo "  query [text]              - Query knowledge"
                echo "  demo                      - Run demo"
                echo "  exit                      - Disconnect and exit"
                ;;
            send)
                read -r to_id content <<< "$args"
                message_send "$to_id" "$content"
                ;;
            broadcast)
                message_broadcast "$args"
                ;;
            list-agents)
                agent_list | jq -r '.[] | "\(.agent_id): \(.status)"'
                ;;
            list-tasks)
                task_list "$args" | jq -r '.[] | "\(.task_id): \(.title)"'
                ;;
            claim)
                task_claim "$args"
                ;;
            create-task)
                read -r title desc <<< "$args"
                task_create "$title" "$desc"
                ;;
            add-knowledge)
                knowledge_add "$args"
                ;;
            query)
                knowledge_query "$args" | jq -r '.[] | "\(.timestamp): \(.content[:60])..."'
                ;;
            demo)
                demo_usage
                connect  # Reconnect after demo
                ;;
            exit|quit)
                disconnect
                echo "Goodbye!"
                break
                ;;
            "")
                # Empty line, do nothing
                ;;
            *)
                echo "Unknown command: $cmd (type 'help' for commands)"
                ;;
        esac
    done
}

# ============================================================================
# Main Entry Point
# ============================================================================

main() {
    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi

    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║            SARTOR CLAUDE NETWORK - BASH BOOTSTRAP              ║"
    echo "║                                                                ║"
    echo "║  Single-file agent onboarding for the Sartor Network          ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "WHAT IS THIS?"
    echo "  This is ALL you need to connect a fresh agent to the"
    echo "  Sartor Claude Network using only Bash and curl."
    echo ""
    echo "USAGE OPTIONS:"
    echo ""
    echo "  1. Run as standalone script:"
    echo "     $ bash sartor-network-bootstrap.sh"
    echo ""
    echo "  2. Source and use in other scripts:"
    echo "     source sartor-network-bootstrap.sh"
    echo "     connect"
    echo "     message_broadcast \"Hello!\""
    echo ""
    echo "  3. Interactive CLI mode:"
    echo "     $ bash sartor-network-bootstrap.sh --interactive"
    echo ""
    echo "WHAT YOU GET:"
    echo "  • Full MCP tool access (messages, tasks, knowledge, agents)"
    echo "  • Bash functions for all operations"
    echo "  • No Python required!"
    echo "  • Cross-platform (Linux, macOS, WSL)"
    echo ""
    echo "======================================================================"

    # Check for command-line arguments
    if [ $# -gt 0 ]; then
        case "$1" in
            --interactive|-i)
                interactive_mode
                ;;
            --demo|-d)
                demo_usage
                ;;
            --help|-h)
                echo ""
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --interactive, -i    Run in interactive CLI mode"
                echo "  --demo, -d          Run demo and exit"
                echo "  --help, -h          Show this help message"
                echo ""
                echo "When sourced without arguments, functions are available to call directly."
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Run with --help for usage information"
                exit 1
                ;;
        esac
    else
        # Default: Run demo if executed directly
        if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
            echo ""
            echo "Running demo in 3 seconds..."
            sleep 3
            demo_usage
        fi
    fi
}

# Only run main if executed directly (not sourced)
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
