#!/bin/bash
# Test script for findings storage system
# Demonstrates complete workflow

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Findings Storage System Test ===${NC}\n"

# Test 1: Write findings
echo -e "${GREEN}1. Creating test findings...${NC}"
$SCRIPT_DIR/finding-write.sh test-researcher-001 api-update "Anthropic released async agents API on Dec 10" 0.9
$SCRIPT_DIR/finding-write.sh test-researcher-001 api-update "New rate limits: 1000 req/min" 0.6
$SCRIPT_DIR/finding-write.sh test-researcher-002 api-update "Async API supports parallel execution" 0.85
$SCRIPT_DIR/finding-write.sh test-researcher-002 bug "Race condition in message queue" 0.7
$SCRIPT_DIR/finding-write.sh test-auditor-001 architecture "CRDT-based coordination layer" 0.65
echo ""

# Test 2: Search all findings on a topic
echo -e "${GREEN}2. Searching all api-update findings...${NC}"
$SCRIPT_DIR/finding-search.sh api-update
echo ""

# Test 3: Search with agent filter
echo -e "${GREEN}3. Searching api-update findings by test-researcher-001...${NC}"
$SCRIPT_DIR/finding-search.sh api-update --agent test-researcher-001
echo ""

# Test 4: Search with importance filter
echo -e "${GREEN}4. Searching critical api-update findings (importance >= 0.8)...${NC}"
$SCRIPT_DIR/finding-search.sh api-update --min-importance 0.8
echo ""

# Test 5: Aggregate findings
echo -e "${GREEN}5. Aggregating api-update findings...${NC}"
$SCRIPT_DIR/finding-aggregate.sh api-update
echo ""

echo -e "${GREEN}6. Aggregating bug findings...${NC}"
$SCRIPT_DIR/finding-aggregate.sh bug
echo ""

# Test 6: Display aggregated file
echo -e "${GREEN}7. Displaying api-update aggregation:${NC}"
cat /home/alton/Sartor-claude-network/data/findings/_aggregated/topic-api-update.json
echo -e "\n"

# Test 7: Count findings
echo -e "${GREEN}8. Summary statistics:${NC}"
TOTAL_FINDINGS=$(find /home/alton/Sartor-claude-network/data/findings -name "finding-*.json" -type f | wc -l)
TOTAL_AGENTS=$(find /home/alton/Sartor-claude-network/data/findings -maxdepth 1 -mindepth 1 -type d ! -name "_aggregated" | wc -l)
TOTAL_TOPICS=$(find /home/alton/Sartor-claude-network/data/findings/_aggregated -name "topic-*.json" -type f | wc -l)

echo "  Total findings: $TOTAL_FINDINGS"
echo "  Total agents: $TOTAL_AGENTS"
echo "  Total topics: $TOTAL_TOPICS"
echo ""

# Cleanup
echo -e "${BLUE}Cleanup: Remove test data? (y/n)${NC}"
read -r response
if [[ "$response" == "y" ]]; then
  rm -rf /home/alton/Sartor-claude-network/data/findings/test-*
  rm -f /home/alton/Sartor-claude-network/data/findings/_aggregated/topic-*.json
  echo -e "${GREEN}Test data cleaned up${NC}"
else
  echo -e "${BLUE}Test data preserved in /data/findings/${NC}"
fi

echo -e "\n${GREEN}=== Test Complete ===${NC}"
