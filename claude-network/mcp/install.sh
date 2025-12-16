#!/bin/bash

# Sartor Claude Network MCP Server - Installation Script
# This script installs all required dependencies for the MCP server
# Date: 2025-11-03

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REQUIREMENTS_FILE="$SCRIPT_DIR/requirements-complete.txt"
VENV_DIR="$SCRIPT_DIR/venv"
MIN_PYTHON_VERSION="3.10"

# Functions
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check Python version
check_python_version() {
    print_header "Checking Python Version"

    # Try python3 first
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "Python is not installed!"
        echo "Please install Python 3.10 or higher from https://python.org"
        exit 1
    fi

    # Get Python version
    PYTHON_VERSION=$($PYTHON_CMD -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')

    # Check if version meets minimum requirement
    if $PYTHON_CMD -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)"; then
        print_success "Python $PYTHON_VERSION found (meets minimum $MIN_PYTHON_VERSION)"
    else
        print_error "Python $PYTHON_VERSION is too old (minimum $MIN_PYTHON_VERSION required)"
        exit 1
    fi
}

# Check for pip
check_pip() {
    print_header "Checking pip Installation"

    if $PYTHON_CMD -m pip --version &> /dev/null; then
        PIP_VERSION=$($PYTHON_CMD -m pip --version | cut -d' ' -f2)
        print_success "pip $PIP_VERSION found"
    else
        print_warning "pip not found. Attempting to install..."

        # Try to install pip using ensurepip
        if $PYTHON_CMD -m ensurepip --upgrade &> /dev/null; then
            print_success "pip installed successfully"
        else
            print_info "Downloading get-pip.py..."
            curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py

            if $PYTHON_CMD /tmp/get-pip.py --user; then
                print_success "pip installed successfully"
                rm /tmp/get-pip.py
            else
                print_error "Failed to install pip"
                echo "Please install pip manually:"
                echo "  Ubuntu/Debian: sudo apt-get install python3-pip"
                echo "  macOS: brew install python3"
                echo "  Windows: pip should come with Python installation"
                exit 1
            fi
        fi
    fi
}

# Create virtual environment
create_venv() {
    print_header "Setting Up Virtual Environment"

    if [ -d "$VENV_DIR" ]; then
        print_warning "Virtual environment already exists at $VENV_DIR"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Removing existing virtual environment..."
            rm -rf "$VENV_DIR"
        else
            print_info "Using existing virtual environment"
            return 0
        fi
    fi

    print_info "Creating virtual environment..."
    $PYTHON_CMD -m venv "$VENV_DIR"

    if [ -d "$VENV_DIR" ]; then
        print_success "Virtual environment created at $VENV_DIR"
    else
        print_error "Failed to create virtual environment"
        exit 1
    fi
}

# Activate virtual environment
activate_venv() {
    print_header "Activating Virtual Environment"

    if [ -f "$VENV_DIR/bin/activate" ]; then
        source "$VENV_DIR/bin/activate"
        print_success "Virtual environment activated"
        print_info "Python: $(which python)"
        print_info "pip: $(which pip)"
    elif [ -f "$VENV_DIR/Scripts/activate" ]; then
        # Windows
        source "$VENV_DIR/Scripts/activate"
        print_success "Virtual environment activated (Windows)"
    else
        print_error "Could not find activation script"
        exit 1
    fi
}

# Upgrade pip
upgrade_pip() {
    print_header "Upgrading pip"

    print_info "Upgrading pip to latest version..."
    pip install --upgrade pip wheel setuptools &> /dev/null

    PIP_VERSION=$(pip --version | cut -d' ' -f2)
    print_success "pip upgraded to $PIP_VERSION"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    if [ ! -f "$REQUIREMENTS_FILE" ]; then
        print_error "Requirements file not found: $REQUIREMENTS_FILE"
        exit 1
    fi

    print_info "Installing from $REQUIREMENTS_FILE..."
    print_info "This may take a few minutes..."

    # Install in stages for better error handling

    # Stage 1: Core dependencies
    print_info "Stage 1: Installing core dependencies..."
    pip install aiohttp websockets pyyaml requests python-dotenv &> /dev/null
    print_success "Core dependencies installed"

    # Stage 2: Testing framework
    print_info "Stage 2: Installing testing framework..."
    pip install pytest pytest-asyncio pytest-timeout pytest-cov psutil &> /dev/null
    print_success "Testing framework installed"

    # Stage 3: External integrations (may fail, non-critical)
    print_info "Stage 3: Installing external integrations (optional)..."
    pip install firebase-admin PyGithub &> /dev/null 2>&1 || print_warning "Some external integrations failed (non-critical)"

    # Stage 4: Development tools (optional)
    print_info "Stage 4: Installing development tools (optional)..."
    pip install black mypy flake8 &> /dev/null 2>&1 || print_warning "Some dev tools failed (non-critical)"

    print_success "All critical dependencies installed successfully!"
}

# Verify installation
verify_installation() {
    print_header "Verifying Installation"

    # Create a simple verification script
    cat > /tmp/verify_mcp.py << 'EOF'
import sys
try:
    import aiohttp
    import websockets
    import yaml
    import pytest
    import psutil
    print("✓ All critical imports successful")
    sys.exit(0)
except ImportError as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)
EOF

    if python /tmp/verify_mcp.py; then
        print_success "Installation verified successfully!"
        rm /tmp/verify_mcp.py
    else
        print_error "Installation verification failed"
        rm /tmp/verify_mcp.py
        exit 1
    fi
}

# Test basic functionality
test_basic_functionality() {
    print_header "Testing Basic Functionality"

    print_info "Testing gateway client import..."

    cd "$SCRIPT_DIR"
    python -c "from gateway_client import GatewayClient; print('✓ Gateway client imported successfully')" 2>/dev/null || {
        print_warning "Gateway client import failed (may need additional setup)"
    }

    print_info "Checking if tests can be discovered..."
    if python -m pytest tests/ --collect-only &> /dev/null; then
        TEST_COUNT=$(python -m pytest tests/ --collect-only -q | tail -1 | cut -d' ' -f1)
        print_success "Found $TEST_COUNT tests ready to run"
    else
        print_warning "Test discovery failed (tests may need additional setup)"
    fi
}

# Print summary
print_summary() {
    print_header "Installation Complete!"

    echo
    echo "Next steps:"
    echo "1. Activate the virtual environment:"
    echo "   source $VENV_DIR/bin/activate"
    echo
    echo "2. Run the validation script:"
    echo "   python validate_installation.py"
    echo
    echo "3. Run the test suite:"
    echo "   cd tests && python run_all_tests.py"
    echo
    echo "4. Start the MCP server:"
    echo "   python mcp_server.py"
    echo
    echo "5. Test the gateway client:"
    echo "   python -c 'from gateway_client import GatewayClient; import asyncio; asyncio.run(GatewayClient().discover_endpoints())'"
    echo
    print_success "Installation script completed successfully!"
}

# Main execution
main() {
    print_header "Sartor Claude Network MCP Server Installer"
    echo "This script will install all required dependencies"
    echo

    check_python_version
    check_pip
    create_venv
    activate_venv
    upgrade_pip
    install_dependencies
    verify_installation
    test_basic_functionality
    print_summary
}

# Handle errors
trap 'print_error "Installation failed! Check the error messages above."; exit 1' ERR

# Run main function
main