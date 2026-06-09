#!/bin/bash
# Example: Using baseline tracker in development workflow

set -e

echo "=== Baseline Tracker Example ==="
echo ""

# Step 1: Capture baseline before changes
echo "1. Capturing baseline before optimization..."
npx tsx framework/validation/baseline-tracker.ts capture before-optimization
echo ""

# Step 2: Make changes (simulated)
echo "2. Making performance improvements..."
echo "   (In real workflow: implement optimizations, refactor code, etc.)"
sleep 2
echo ""

# Step 3: Capture baseline after changes
echo "3. Capturing baseline after optimization..."
npx tsx framework/validation/baseline-tracker.ts capture after-optimization
echo ""

# Step 4: Compare baselines
echo "4. Comparing baselines..."
npx tsx framework/validation/baseline-tracker.ts compare before-optimization after-optimization
echo ""

# Step 5: List all baselines
echo "5. Available baselines:"
npx tsx framework/validation/baseline-tracker.ts list
echo ""

echo "=== Example Complete ==="
echo ""
echo "Baselines are stored in .swarm/baselines/"
echo "You can compare any two baselines at any time."
