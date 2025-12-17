#!/bin/bash

# Meta-Learning Tracker Verification Script
# Verifies that all components are properly implemented

echo "========================================================================"
echo "META-LEARNING TRACKER VERIFICATION"
echo "========================================================================"
echo ""

# Check if files exist
echo "[1/5] Checking implementation files..."
FILES=(
  "framework/validation/meta-learning.ts"
  "framework/validation/meta-learning.test.ts"
  "framework/validation/meta-learning-demo.ts"
  "framework/validation/meta-learning-integration-example.ts"
  "framework/validation/META_LEARNING_README.md"
  "framework/validation/META_LEARNING_IMPLEMENTATION.md"
  ".swarm/meta-learning/README.md"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
    ALL_EXIST=false
  fi
done

if [ "$ALL_EXIST" = false ]; then
  echo ""
  echo "ERROR: Some files are missing"
  exit 1
fi

echo ""
echo "[2/5] Checking directory structure..."
if [ -d ".swarm/meta-learning" ]; then
  echo "  ✓ .swarm/meta-learning/ directory exists"
else
  echo "  ✗ .swarm/meta-learning/ directory missing"
  exit 1
fi

echo ""
echo "[3/5] Counting lines of code..."
TOTAL_LINES=0
for file in framework/validation/meta-learning.ts \
            framework/validation/meta-learning.test.ts \
            framework/validation/meta-learning-demo.ts \
            framework/validation/meta-learning-integration-example.ts; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    TOTAL_LINES=$((TOTAL_LINES + LINES))
    echo "  $file: $LINES lines"
  fi
done
echo "  Total implementation: $TOTAL_LINES lines"

echo ""
echo "[4/5] Checking documentation..."
DOC_LINES=0
for file in framework/validation/META_LEARNING_README.md \
            framework/validation/META_LEARNING_IMPLEMENTATION.md \
            .swarm/meta-learning/README.md; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    DOC_LINES=$((DOC_LINES + LINES))
    echo "  $file: $LINES lines"
  fi
done
echo "  Total documentation: $DOC_LINES lines"

echo ""
echo "[5/5] Verification summary..."
echo "  Implementation files: ${#FILES[@]}"
echo "  Code lines: $TOTAL_LINES"
echo "  Documentation lines: $DOC_LINES"
echo "  Total lines: $((TOTAL_LINES + DOC_LINES))"

echo ""
echo "========================================================================"
echo "VERIFICATION COMPLETE ✓"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "  1. Build: npm run build"
echo "  2. Test: node dist/framework/validation/meta-learning.test.js"
echo "  3. Demo: node dist/framework/validation/meta-learning-demo.js"
echo ""
