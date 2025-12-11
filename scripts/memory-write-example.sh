#!/bin/bash
# Example usage of memory-write.sh for subagents
# This demonstrates the different ways to call the memory writer

set -euo pipefail

SCRIPT_DIR="/home/alton/Sartor-claude-network/scripts"

echo "=== Memory Write Script Examples ==="
echo ""

echo "1. Basic usage with all parameters:"
result=$("$SCRIPT_DIR/memory-write.sh" \
  "Learned that subagent coordination requires clear role boundaries" \
  "procedural" \
  "0.8" \
  '["coordination","roles","learning"]')
echo "Result: $result"
echo ""

echo "2. Using default parameters (episodic, importance 0.5, no tags):"
result=$("$SCRIPT_DIR/memory-write.sh" \
  "Subagent completed task successfully")
echo "Result: $result"
echo ""

echo "3. Semantic memory with high importance:"
result=$("$SCRIPT_DIR/memory-write.sh" \
  "DIRECTIVE: Always use file locking when writing to shared memory storage" \
  "semantic" \
  "0.95" \
  '["directive","file-locking","safety"]')
echo "Result: $result"
echo ""

echo "4. Working memory (temporary):"
result=$("$SCRIPT_DIR/memory-write.sh" \
  "Currently processing task batch #42" \
  "working" \
  "0.3" \
  '["temporary","batch-processing"]')
echo "Result: $result"
echo ""

echo "=== All examples completed successfully ==="
