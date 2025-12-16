#!/bin/bash
# Comprehensive test suite for memory-write.sh
# Tests all functionality including edge cases

set -euo pipefail

SCRIPT_DIR="/home/alton/Sartor-claude-network/scripts"
MEMORY_FILE="/home/alton/Sartor-claude-network/data/memories.json"
PASSED=0
FAILED=0

echo "==================================="
echo "Memory Write Script Test Suite"
echo "==================================="
echo ""

# Test function
test_write() {
  local test_name="$1"
  shift
  echo -n "Testing: $test_name ... "

  if result=$("$SCRIPT_DIR/memory-write.sh" "$@" 2>&1); then
    if echo "$result" | grep -q '"id":"mem_'; then
      echo "PASSED"
      echo "  → $result"
      PASSED=$((PASSED + 1))
      return 0
    else
      echo "FAILED (invalid output)"
      echo "  → $result"
      FAILED=$((FAILED + 1))
      return 1
    fi
  else
    echo "FAILED (script error)"
    echo "  → $result"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Verify script exists and is executable
echo "Checking prerequisites..."
if [ ! -f "$SCRIPT_DIR/memory-write.sh" ]; then
  echo "ERROR: memory-write.sh not found"
  exit 1
fi
if [ ! -x "$SCRIPT_DIR/memory-write.sh" ]; then
  echo "ERROR: memory-write.sh not executable"
  exit 1
fi
echo "Prerequisites OK"
echo ""

# Run tests
echo "Running tests..."
echo ""

# Test 1: Basic usage with minimal parameters
test_write "Minimal parameters" \
  "Test memory with defaults"

# Test 2: All parameters specified
test_write "All parameters" \
  "Complete memory with all fields" \
  "episodic" \
  "0.75" \
  '["test","complete","params"]'

# Test 3: Semantic memory with high importance
test_write "Semantic memory" \
  "Important system directive" \
  "semantic" \
  "0.95" \
  '["directive","important"]'

# Test 4: Procedural memory
test_write "Procedural memory" \
  "How to perform task X" \
  "procedural" \
  "0.8" \
  '["procedure","howto"]'

# Test 5: Working memory with low importance
test_write "Working memory" \
  "Temporary state information" \
  "working" \
  "0.3" \
  '["temporary","state"]'

# Test 6: Empty tags array
test_write "Empty tags" \
  "Memory without tags" \
  "episodic" \
  "0.5" \
  '[]'

# Test 7: Single tag
test_write "Single tag" \
  "Memory with one tag" \
  "episodic" \
  "0.5" \
  '["single"]'

# Test 8: Many tags
test_write "Multiple tags" \
  "Memory with many tags" \
  "episodic" \
  "0.5" \
  '["tag1","tag2","tag3","tag4","tag5"]'

# Test 9: Special characters in content
test_write "Special characters" \
  "Content with special chars: @#$%^&*()" \
  "episodic" \
  "0.5" \
  '["special"]'

# Test 10: Long content
test_write "Long content" \
  "This is a very long memory content string that contains multiple sentences and should still be properly stored in the JSON file without any truncation or corruption issues that might occur with longer text passages." \
  "episodic" \
  "0.5" \
  '["long"]'

# Test 11: Minimum importance
test_write "Minimum importance" \
  "Memory with zero importance" \
  "episodic" \
  "0.0" \
  '["min"]'

# Test 12: Maximum importance
test_write "Maximum importance" \
  "Memory with max importance" \
  "semantic" \
  "1.0" \
  '["max"]'

# Summary
echo ""
echo "==================================="
echo "Test Summary"
echo "==================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total:  $((PASSED + FAILED))"
echo ""

# Verify memories were actually written
if [ -f "$MEMORY_FILE" ]; then
  memory_count=$(python3 -c "import json; print(len(json.load(open('$MEMORY_FILE'))['memories']))")
  echo "Current memory count: $memory_count"
fi

echo ""
if [ $FAILED -eq 0 ]; then
  echo "✓ All tests passed!"
  exit 0
else
  echo "✗ Some tests failed"
  exit 1
fi
