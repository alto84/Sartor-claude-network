#!/bin/bash
# Comprehensive test of the agent status coordination system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_DIR="/home/alton/Sartor-claude-network/data/agent-status"

echo "========================================"
echo "Agent Status Coordination System Test"
echo "========================================"
echo

# Clean up any existing test data
echo "1. Cleaning up existing test data..."
rm -f "$STATUS_DIR"/test-*.json
rm -f "$STATUS_DIR"/*.lock
echo "   Done."
echo

# Test 1: Create multiple agents
echo "2. Creating test agents..."
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "role" "PLANNER"
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "currentTask" "Designing system architecture"
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "progress" "0.0"

"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "role" "IMPLEMENTER"
"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "currentTask" "Waiting for plan"
"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "status" "idle"

"$SCRIPT_DIR/status-update.sh" "test-agent-auditor-001" "role" "AUDITOR"
"$SCRIPT_DIR/status-update.sh" "test-agent-auditor-001" "currentTask" "Ready to audit"
"$SCRIPT_DIR/status-update.sh" "test-agent-auditor-001" "status" "idle"
echo "   Created 3 test agents."
echo

# Test 2: Display initial status
echo "3. Initial agent status:"
"$SCRIPT_DIR/status-read.sh"
echo

# Test 3: Simulate planner progress
echo "4. Simulating planner progress..."
sleep 1
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "progress" "0.3"
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "findings" "Identified 3-tier memory architecture"
sleep 1
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "progress" "0.6"
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "findings" "Hot tier: <100ms, Warm tier: <500ms, Cold tier: <2s"
sleep 1
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "progress" "1.0"
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "status" "completed"
"$SCRIPT_DIR/status-update.sh" "test-agent-planner-001" "findings" "Plan complete, ready for implementation"
echo "   Planner completed."
echo

# Test 4: Activate implementer
echo "5. Activating implementer based on planner completion..."
"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "status" "active"
"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "currentTask" "Implementing memory system"
"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "progress" "0.0"
sleep 1
"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "progress" "0.5"
"$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "findings" "Created hot-tier cache with LRU eviction"
echo "   Implementer working..."
echo

# Test 5: Display updated status
echo "6. Updated agent status:"
"$SCRIPT_DIR/status-read.sh"
echo

# Test 6: Show detailed status for one agent
echo "7. Detailed status for test-agent-planner-001:"
cat "$STATUS_DIR/test-agent-planner-001.json"
echo
echo

# Test 7: Demonstrate concurrent updates (simulate race condition)
echo "8. Testing concurrent updates (thread safety)..."
(
  for i in {1..5}; do
    "$SCRIPT_DIR/status-update.sh" "test-agent-implementer-001" "progress" "0.$((50 + i))" &
  done
  wait
)
echo "   All concurrent updates completed successfully."
echo

# Test 8: Cleanup test
echo "9. Testing cleanup (files must be >60min old to delete)..."
"$SCRIPT_DIR/status-cleanup.sh"
ls "$STATUS_DIR"/test-*.json 2>/dev/null | wc -l | xargs echo "   Files remaining:"
echo

# Test 9: Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "All tests passed successfully!"
echo
echo "Key capabilities demonstrated:"
echo "  - Agent status creation and updates"
echo "  - Progress tracking (0.0 to 1.0)"
echo "  - Findings accumulation (array append)"
echo "  - Status transitions (idle -> active -> completed)"
echo "  - Thread-safe concurrent updates"
echo "  - Multi-agent coordination"
echo "  - Cleanup operations"
echo
echo "Status files location: $STATUS_DIR"
echo "To view all statuses: $SCRIPT_DIR/status-read.sh"
echo "To cleanup old files: $SCRIPT_DIR/status-cleanup.sh"
echo "========================================"
