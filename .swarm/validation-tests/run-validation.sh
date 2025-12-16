#!/bin/bash
# Coordinator Validation Test Runner
# Tests all 4 hypotheses for local-only-optimized.js

set -e

SWARM_DIR="/home/alton/claude-swarm/.swarm"
VALIDATION_DIR="$SWARM_DIR/validation-tests"
REQUESTS_DIR="$SWARM_DIR/requests"
RESULTS_DIR="$SWARM_DIR/results"
LOGS_DIR="$SWARM_DIR/logs"

echo "========================================"
echo "  COORDINATOR VALIDATION TEST RUNNER"
echo "========================================"
echo ""

# Clean previous results
rm -f $RESULTS_DIR/req-h*.json 2>/dev/null || true
rm -f $LOGS_DIR/req-h*.stream.txt 2>/dev/null || true

echo "Starting validation tests..."
echo ""

# Test H1: Health Check
echo "[H1] Testing Health Check Probe..."
cp "$VALIDATION_DIR/H1-health-check-test.json" "$REQUESTS_DIR/req-h1-$(date +%s).json"
sleep 2

# Test H2: Lazy Context (Small)
echo "[H2a] Testing Lazy Context (Small)..."
cp "$VALIDATION_DIR/H2-lazy-context-small.json" "$REQUESTS_DIR/req-h2-small-$(date +%s).json"
sleep 2

# Test H2: Lazy Context (Large)
echo "[H2b] Testing Lazy Context (Large)..."
cp "$VALIDATION_DIR/H2-lazy-context-large.json" "$REQUESTS_DIR/req-h2-large-$(date +%s).json"
sleep 2

# Test H3: Progressive Timeout (Simple)
echo "[H3a] Testing Progressive Timeout (Simple)..."
cp "$VALIDATION_DIR/H3-progressive-simple.json" "$REQUESTS_DIR/req-h3-simple-$(date +%s).json"
sleep 2

# Test H3: Progressive Timeout (Complex)
echo "[H3b] Testing Progressive Timeout (Complex)..."
cp "$VALIDATION_DIR/H3-progressive-complex.json" "$REQUESTS_DIR/req-h3-complex-$(date +%s).json"
sleep 2

# Test H4: Streaming Heartbeat
echo "[H4] Testing Streaming Heartbeat..."
cp "$VALIDATION_DIR/H4-streaming-heartbeat.json" "$REQUESTS_DIR/req-h4-$(date +%s).json"

echo ""
echo "All test requests submitted."
echo "Monitor coordinator output for results."
echo ""
echo "Results will appear in: $RESULTS_DIR"
echo "Streaming logs in: $LOGS_DIR"
