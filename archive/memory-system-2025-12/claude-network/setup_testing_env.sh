#!/bin/bash
# Sartor Claude Network - Testing Environment Setup Script
# Date: 2025-11-07
# Purpose: Set up a working test environment for the claude-network project

echo "========================================="
echo "Sartor Claude Network - Test Environment Setup"
echo "========================================="

# Check Python version
echo "Checking Python version..."
python3 --version

# Check for required system packages
echo -e "\nRequired system packages:"
echo "  - python3.12-venv (for virtual environments)"
echo "  - python3-pip (for package management)"

# Instructions for manual installation
echo -e "\nTo install required system packages, run:"
echo "  sudo apt update"
echo "  sudo apt install -y python3.12-venv python3-pip"

# After system packages are installed, run these commands:
echo -e "\n========================================="
echo "After installing system packages, run these commands:"
echo "========================================="
echo ""
echo "# 1. Create virtual environment"
echo "python3 -m venv test_env"
echo ""
echo "# 2. Activate virtual environment"
echo "source test_env/bin/activate"
echo ""
echo "# 3. Upgrade pip"
echo "python -m pip install --upgrade pip"
echo ""
echo "# 4. Install requirements"
echo "pip install -r requirements-working.txt"
echo ""
echo "# 5. Verify installation"
echo "python -c 'import pytest; print(\"pytest version:\", pytest.__version__)'"
echo ""
echo "# 6. Run tests"
echo "pytest tests/test_macs.py -v"
echo ""
echo "========================================="

# Create a minimal test to verify the setup works
cat > test_basic.py << 'EOF'
"""Basic test to verify pytest is working"""

def test_import_system_modules():
    """Test that basic Python modules can be imported"""
    import sys
    import os
    import json
    assert sys.version_info >= (3, 10)

def test_project_structure():
    """Test that project files exist"""
    import os
    assert os.path.exists("macs.py") or os.path.exists("tests/test_macs.py")

if __name__ == "__main__":
    print("Running basic tests...")
    test_import_system_modules()
    test_project_structure()
    print("Basic tests passed!")
EOF

echo -e "\nCreated test_basic.py for verification"
echo "To run without pytest: python3 test_basic.py"