#!/bin/bash
# Sartor Claude Network - Test Runner Script
# This script will work once dependencies are installed

echo "========================================="
echo "Sartor Claude Network - Test Runner"
echo "========================================="

# Check if virtual environment exists
if [ -d "test_env" ]; then
    echo "✓ Virtual environment found"
    source test_env/bin/activate
else
    echo "⚠ Virtual environment not found"
    echo "  Run: python3 -m venv test_env"
    echo "  Then: source test_env/bin/activate"
    echo "  Then: pip install -r requirements-working.txt"
    exit 1
fi

# Check if pytest is installed
if python -c "import pytest" 2>/dev/null; then
    echo "✓ pytest is installed"
else
    echo "✗ pytest not installed"
    echo "  Run: pip install pytest pytest-asyncio pytest-cov pytest-mock"
    exit 1
fi

# Run tests with different verbosity levels
echo ""
echo "Running tests..."
echo "-----------------------------------------"

# Quick summary
echo "Quick test summary:"
pytest tests/ -q 2>/dev/null || true

echo ""
echo "-----------------------------------------"
echo "Detailed test run with coverage:"
echo "-----------------------------------------"

# Run with coverage if available
if python -c "import pytest_cov" 2>/dev/null; then
    pytest tests/ -v --cov=. --cov-report=term-missing --cov-report=html
else
    echo "Coverage not available, running without it"
    pytest tests/ -v
fi

# Count results
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="

# Parse pytest output for summary
pytest tests/ --tb=no -q 2>&1 | tail -5

echo ""
echo "To see HTML coverage report:"
echo "  open htmlcov/index.html"

echo ""
echo "To run specific test file:"
echo "  pytest tests/test_macs.py -v"

echo ""
echo "To run tests matching pattern:"
echo "  pytest tests/ -k 'message' -v"