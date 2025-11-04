#!/usr/bin/env bash
################################################################################
# Test Script for Bash Bootstrap
#
# Tests all functionality of sartor-network-bootstrap.sh
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOTSTRAP_FILE="$SCRIPT_DIR/sartor-network-bootstrap.sh"

# Test tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

log_test() {
    echo -e "${BLUE}[TEST]${NC} $*"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $*"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $*"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $*"
}

run_test() {
    local test_name="$1"
    ((TESTS_RUN++))
    log_test "$test_name"
}

################################################################################
# Dependency Checks
################################################################################

test_dependencies() {
    run_test "Checking dependencies"

    local missing=()

    if ! command -v curl &> /dev/null; then
        missing+=("curl")
    fi

    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_fail "Missing dependencies: ${missing[*]}"
        return 1
    fi

    log_pass "All dependencies available"
}

################################################################################
# File Checks
################################################################################

test_bootstrap_exists() {
    run_test "Checking bootstrap file exists"

    if [ ! -f "$BOOTSTRAP_FILE" ]; then
        log_fail "Bootstrap file not found: $BOOTSTRAP_FILE"
        return 1
    fi

    log_pass "Bootstrap file exists"
}

test_bootstrap_executable() {
    run_test "Checking bootstrap is executable"

    if [ ! -x "$BOOTSTRAP_FILE" ]; then
        log_fail "Bootstrap file not executable"
        chmod +x "$BOOTSTRAP_FILE"
        log_info "Made bootstrap executable"
    fi

    log_pass "Bootstrap is executable"
}

################################################################################
# Source Bootstrap and Test Functions
################################################################################

test_source_bootstrap() {
    run_test "Sourcing bootstrap file"

    if source "$BOOTSTRAP_FILE"; then
        log_pass "Bootstrap sourced successfully"
    else
        log_fail "Failed to source bootstrap"
        return 1
    fi
}

################################################################################
# Connection Tests
################################################################################

test_connect() {
    run_test "Testing connection"

    if connect; then
        log_pass "Connected successfully"
        log_info "  Agent ID: $AGENT_ID"
        log_info "  Agent Name: $AGENT_NAME"
    else
        log_fail "Connection failed"
        return 1
    fi
}

################################################################################
# Communication Tests
################################################################################

test_message_broadcast() {
    run_test "Testing broadcast message"

    local test_message="Test broadcast from bash test script at $(date)"

    if message_broadcast "$test_message"; then
        log_pass "Broadcast sent successfully"
    else
        log_fail "Broadcast failed"
        return 1
    fi
}

test_message_send() {
    run_test "Testing direct message"

    # Send message to self
    local test_message="Test direct message from bash test script"

    if message_send "$AGENT_ID" "$test_message"; then
        log_pass "Direct message sent successfully"
    else
        log_fail "Direct message failed"
        return 1
    fi

    # Give Firebase time to process
    sleep 2
}

test_message_read() {
    run_test "Testing message reading"

    local messages
    messages=$(message_read 5)

    if [ -n "$messages" ]; then
        local count
        count=$(echo "$messages" | jq 'length')
        log_pass "Read $count messages"

        if [ "$count" -gt 0 ]; then
            log_info "Latest message:"
            echo "$messages" | jq -r '.[0] | "  From: \(.from)\n  Content: \(.content[:50])..."'
        fi
    else
        log_fail "Failed to read messages"
        return 1
    fi
}

################################################################################
# Task Tests
################################################################################

test_task_create() {
    run_test "Testing task creation"

    local title="Test Task from Bash"
    local description="This is a test task created by the bash test script"

    CREATED_TASK_ID=$(task_create "$title" "$description" '{"test": true}')

    if [ -n "$CREATED_TASK_ID" ]; then
        log_pass "Task created successfully: $CREATED_TASK_ID"
    else
        log_fail "Task creation failed"
        return 1
    fi
}

test_task_list() {
    run_test "Testing task listing"

    local tasks
    tasks=$(task_list "available")

    if [ -n "$tasks" ]; then
        local count
        count=$(echo "$tasks" | jq 'length')
        log_pass "Found $count available tasks"

        if [ "$count" -gt 0 ]; then
            log_info "Sample tasks:"
            echo "$tasks" | jq -r '.[:3] | .[] | "  • \(.title)"'
        fi
    else
        log_fail "Failed to list tasks"
        return 1
    fi
}

test_task_claim() {
    run_test "Testing task claiming"

    if [ -z "${CREATED_TASK_ID:-}" ]; then
        log_info "No task ID available, skipping claim test"
        return 0
    fi

    if task_claim "$CREATED_TASK_ID"; then
        log_pass "Task claimed successfully"
    else
        log_fail "Task claim failed"
        return 1
    fi
}

test_task_update() {
    run_test "Testing task update"

    if [ -z "${CREATED_TASK_ID:-}" ]; then
        log_info "No task ID available, skipping update test"
        return 0
    fi

    if task_update "$CREATED_TASK_ID" "completed" '{"success": true, "test": "completed"}'; then
        log_pass "Task updated successfully"
    else
        log_fail "Task update failed"
        return 1
    fi
}

################################################################################
# Knowledge Tests
################################################################################

test_knowledge_add() {
    run_test "Testing knowledge addition"

    local content="Test knowledge from bash test script: $(date)"
    local tags='["test", "bash", "automated"]'

    CREATED_KNOWLEDGE_ID=$(knowledge_add "$content" "$tags")

    if [ -n "$CREATED_KNOWLEDGE_ID" ]; then
        log_pass "Knowledge added successfully: $CREATED_KNOWLEDGE_ID"
    else
        log_fail "Knowledge addition failed"
        return 1
    fi
}

test_knowledge_query() {
    run_test "Testing knowledge query"

    local knowledge
    knowledge=$(knowledge_query)

    if [ -n "$knowledge" ]; then
        local count
        count=$(echo "$knowledge" | jq 'length')
        log_pass "Found $count knowledge entries"

        if [ "$count" -gt 0 ]; then
            log_info "Sample knowledge:"
            echo "$knowledge" | jq -r '.[-3:] | .[] | "  • \(.content[:60])..."'
        fi
    else
        log_fail "Failed to query knowledge"
        return 1
    fi
}

test_knowledge_search() {
    run_test "Testing knowledge search"

    local knowledge
    knowledge=$(knowledge_query "test")

    if [ -n "$knowledge" ]; then
        local count
        count=$(echo "$knowledge" | jq 'length')
        log_pass "Found $count knowledge entries matching 'test'"
    else
        log_fail "Failed to search knowledge"
        return 1
    fi
}

################################################################################
# Agent Discovery Tests
################################################################################

test_agent_list() {
    run_test "Testing agent listing"

    local agents
    agents=$(agent_list)

    if [ -n "$agents" ]; then
        local count
        count=$(echo "$agents" | jq 'length')
        log_pass "Found $count agents"

        if [ "$count" -gt 0 ]; then
            log_info "Sample agents:"
            echo "$agents" | jq -r '.[-5:] | .[] | "  • \(.agent_id[:40]): \(.status)"'
        fi
    else
        log_fail "Failed to list agents"
        return 1
    fi
}

test_agent_status() {
    run_test "Testing agent status lookup"

    local status
    status=$(agent_status "$AGENT_ID")

    if [ -n "$status" ] && [ "$status" != "null" ]; then
        log_pass "Retrieved agent status"
        log_info "Status: $(echo "$status" | jq -r '.status')"
    else
        log_fail "Failed to get agent status"
        return 1
    fi
}

################################################################################
# Sub-Agent Support Tests
################################################################################

test_sub_agent_context() {
    run_test "Testing sub-agent context generation"

    local context
    context=$(get_sub_agent_context)

    if echo "$context" | grep -q "SARTOR_FIREBASE_URL"; then
        log_pass "Sub-agent context generated"
        log_info "Context variables:"
        echo "$context" | sed 's/^/    /'
    else
        log_fail "Failed to generate sub-agent context"
        return 1
    fi
}

test_sub_agent_prompt() {
    run_test "Testing sub-agent prompt generation"

    local prompt
    prompt=$(get_sub_agent_prompt "test-sub-agent")

    if echo "$prompt" | grep -q "SARTOR NETWORK"; then
        log_pass "Sub-agent prompt generated"
        log_info "Prompt length: ${#prompt} characters"
    else
        log_fail "Failed to generate sub-agent prompt"
        return 1
    fi
}

################################################################################
# Disconnect Test
################################################################################

test_disconnect() {
    run_test "Testing disconnection"

    if disconnect; then
        log_pass "Disconnected successfully"
    else
        log_fail "Disconnection failed"
        return 1
    fi
}

################################################################################
# Main Test Runner
################################################################################

main() {
    echo "════════════════════════════════════════════════════════════════"
    echo "  BASH BOOTSTRAP TEST SUITE"
    echo "════════════════════════════════════════════════════════════════"
    echo ""

    # Run tests
    test_dependencies || exit 1
    test_bootstrap_exists || exit 1
    test_bootstrap_executable || exit 1
    test_source_bootstrap || exit 1

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  CONNECTION TESTS"
    echo "────────────────────────────────────────────────────────────────"
    test_connect || exit 1

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  COMMUNICATION TESTS"
    echo "────────────────────────────────────────────────────────────────"
    test_message_broadcast
    test_message_send
    test_message_read

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  TASK TESTS"
    echo "────────────────────────────────────────────────────────────────"
    test_task_create
    test_task_list
    test_task_claim
    test_task_update

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  KNOWLEDGE TESTS"
    echo "────────────────────────────────────────────────────────────────"
    test_knowledge_add
    test_knowledge_query
    test_knowledge_search

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  AGENT DISCOVERY TESTS"
    echo "────────────────────────────────────────────────────────────────"
    test_agent_list
    test_agent_status

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  SUB-AGENT SUPPORT TESTS"
    echo "────────────────────────────────────────────────────────────────"
    test_sub_agent_context
    test_sub_agent_prompt

    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo "  CLEANUP"
    echo "────────────────────────────────────────────────────────────────"
    test_disconnect

    # Summary
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  TEST SUMMARY"
    echo "════════════════════════════════════════════════════════════════"
    echo "  Total Tests: $TESTS_RUN"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "  Result: ${GREEN}ALL TESTS PASSED${NC} ✅"
        echo "════════════════════════════════════════════════════════════════"
        return 0
    else
        echo -e "  Result: ${RED}SOME TESTS FAILED${NC} ❌"
        echo "════════════════════════════════════════════════════════════════"
        return 1
    fi
}

# Run main
main "$@"
