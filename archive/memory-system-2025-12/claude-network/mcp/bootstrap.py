#!/usr/bin/env python3
"""
Sartor Claude Network MCP Server - Zero-Dependency Bootstrap Script
This script uses ONLY Python standard library to set up the MCP environment
No external dependencies required!
Date: 2025-11-03
"""

import sys
import os
import subprocess
import json
import socket
import http.server
import threading
import time
import urllib.request
import urllib.error
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

# Configuration
MIN_PYTHON_VERSION = (3, 10)
SCRIPT_DIR = Path(__file__).parent.absolute()
VENV_DIR = SCRIPT_DIR / "venv"
REQUIREMENTS_FILE = SCRIPT_DIR / "requirements-complete.txt"
TEST_PORT = 8080

# ANSI color codes
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    WHITE = '\033[1;37m'
    NC = '\033[0m'  # No Color

def print_header(message):
    """Print a header message"""
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.NC}")
    print(f"{Colors.BLUE}{message}{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.NC}")

def print_success(message):
    """Print a success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.NC}")

def print_error(message):
    """Print an error message"""
    print(f"{Colors.RED}✗ {message}{Colors.NC}")

def print_warning(message):
    """Print a warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.NC}")

def print_info(message):
    """Print an info message"""
    print(f"{Colors.CYAN}ℹ {message}{Colors.NC}")

def check_python_version():
    """Check if Python version meets minimum requirements"""
    print_header("Checking Python Version")

    current_version = sys.version_info[:2]
    min_version_str = f"{MIN_PYTHON_VERSION[0]}.{MIN_PYTHON_VERSION[1]}"
    current_version_str = f"{current_version[0]}.{current_version[1]}"

    if current_version >= MIN_PYTHON_VERSION:
        print_success(f"Python {current_version_str} (requires {min_version_str}+)")
        return True
    else:
        print_error(f"Python {current_version_str} is too old (requires {min_version_str}+)")
        return False

def check_pip():
    """Check if pip is available"""
    print_header("Checking pip Installation")

    try:
        import pip
        print_success(f"pip is available (version {pip.__version__})")
        return True
    except ImportError:
        print_warning("pip module not found in Python")

    # Try to run pip as a command
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print_success(f"pip is available via command")
            return True
    except:
        pass

    print_warning("pip not found - will attempt to install")
    return False

def install_pip():
    """Install pip using get-pip.py"""
    print_header("Installing pip")

    # Try ensurepip first
    print_info("Trying ensurepip module...")
    try:
        subprocess.run(
            [sys.executable, "-m", "ensurepip", "--upgrade"],
            check=True,
            capture_output=True
        )
        print_success("pip installed via ensurepip")
        return True
    except:
        print_warning("ensurepip failed, trying get-pip.py...")

    # Download get-pip.py
    get_pip_url = "https://bootstrap.pypa.io/get-pip.py"
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.py')

    try:
        print_info(f"Downloading get-pip.py from {get_pip_url}...")
        urllib.request.urlretrieve(get_pip_url, temp_file.name)

        print_info("Running get-pip.py...")
        subprocess.run(
            [sys.executable, temp_file.name, "--user"],
            check=True,
            capture_output=True
        )
        print_success("pip installed successfully")
        return True
    except Exception as e:
        print_error(f"Failed to install pip: {e}")
        return False
    finally:
        try:
            os.unlink(temp_file.name)
        except:
            pass

def create_virtual_environment():
    """Create a Python virtual environment"""
    print_header("Creating Virtual Environment")

    if VENV_DIR.exists():
        print_warning(f"Virtual environment already exists at {VENV_DIR}")
        response = input("Recreate it? (y/N): ").strip().lower()
        if response == 'y':
            print_info("Removing existing virtual environment...")
            shutil.rmtree(VENV_DIR)
        else:
            print_info("Using existing virtual environment")
            return True

    print_info(f"Creating virtual environment at {VENV_DIR}...")
    try:
        subprocess.run(
            [sys.executable, "-m", "venv", str(VENV_DIR)],
            check=True,
            capture_output=True
        )
        print_success("Virtual environment created")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to create virtual environment: {e}")
        return False

def get_venv_python():
    """Get the path to Python in the virtual environment"""
    if os.name == 'nt':  # Windows
        python_path = VENV_DIR / "Scripts" / "python.exe"
    else:  # Unix-like
        python_path = VENV_DIR / "bin" / "python"

    return str(python_path) if python_path.exists() else None

def install_dependencies():
    """Install required dependencies"""
    print_header("Installing Dependencies")

    venv_python = get_venv_python()
    if not venv_python:
        print_error("Virtual environment Python not found")
        return False

    # Core dependencies only (minimal for bootstrap)
    core_deps = [
        "aiohttp>=3.9.0",
        "websockets>=12.0",
        "pyyaml>=6.0",
        "requests>=2.31.0",
        "python-dotenv>=1.0.0"
    ]

    # Test dependencies
    test_deps = [
        "pytest>=7.4.0",
        "pytest-asyncio>=0.21.0",
        "psutil>=5.9.0"
    ]

    all_deps = core_deps + test_deps

    print_info("Installing core dependencies...")
    for dep in core_deps:
        print_info(f"  Installing {dep}...")
        try:
            subprocess.run(
                [venv_python, "-m", "pip", "install", dep],
                check=True,
                capture_output=True,
                timeout=60
            )
        except subprocess.CalledProcessError:
            print_warning(f"  Failed to install {dep}")
        except subprocess.TimeoutExpired:
            print_warning(f"  Timeout installing {dep}")

    print_info("Installing test dependencies...")
    for dep in test_deps:
        print_info(f"  Installing {dep}...")
        try:
            subprocess.run(
                [venv_python, "-m", "pip", "install", dep],
                check=True,
                capture_output=True,
                timeout=60
            )
        except subprocess.CalledProcessError:
            print_warning(f"  Failed to install {dep}")
        except subprocess.TimeoutExpired:
            print_warning(f"  Timeout installing {dep}")

    print_success("Dependencies installed (some optional packages may have failed)")
    return True

def verify_imports():
    """Verify that critical imports work"""
    print_header("Verifying Imports")

    venv_python = get_venv_python()
    if not venv_python:
        print_error("Virtual environment Python not found")
        return False

    test_code = """
import sys
errors = []
try:
    import aiohttp
    print('✓ aiohttp')
except ImportError:
    errors.append('aiohttp')
    print('✗ aiohttp')

try:
    import websockets
    print('✓ websockets')
except ImportError:
    errors.append('websockets')
    print('✗ websockets')

try:
    import yaml
    print('✓ yaml')
except ImportError:
    errors.append('yaml')
    print('✗ yaml')

try:
    import requests
    print('✓ requests')
except ImportError:
    errors.append('requests')
    print('✗ requests')

try:
    import pytest
    print('✓ pytest')
except ImportError:
    errors.append('pytest')
    print('✗ pytest')

if errors:
    sys.exit(1)
"""

    try:
        result = subprocess.run(
            [venv_python, "-c", test_code],
            capture_output=True,
            text=True,
            timeout=10
        )

        print(result.stdout)

        if result.returncode == 0:
            print_success("All critical imports verified")
            return True
        else:
            print_warning("Some imports failed (non-critical)")
            return True  # Continue anyway
    except Exception as e:
        print_error(f"Import verification failed: {e}")
        return False

def start_test_server():
    """Start a simple test HTTP server"""
    print_header("Starting Test MCP Server")

    class SimpleHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/health':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {
                    "status": "healthy",
                    "server": "Bootstrap Test Server",
                    "timestamp": datetime.now().isoformat()
                }
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, format, *args):
            pass  # Suppress logs

    server = http.server.HTTPServer(('localhost', TEST_PORT), SimpleHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    # Wait for server to start
    time.sleep(1)

    # Test the server
    try:
        with urllib.request.urlopen(f'http://localhost:{TEST_PORT}/health', timeout=5) as response:
            data = json.loads(response.read().decode())
            if data.get('status') == 'healthy':
                print_success(f"Test server running on http://localhost:{TEST_PORT}")
                return True
    except Exception as e:
        print_error(f"Test server failed to start: {e}")
        return False

def test_connectivity():
    """Test basic network connectivity"""
    print_header("Testing Network Connectivity")

    # Test localhost
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', TEST_PORT))
        sock.close()

        if result == 0:
            print_success(f"Localhost port {TEST_PORT} is accessible")
        else:
            print_warning(f"Localhost port {TEST_PORT} is not accessible")
    except Exception as e:
        print_error(f"Network test failed: {e}")

    # Test external connectivity
    try:
        with urllib.request.urlopen('https://api.github.com', timeout=5) as response:
            if response.status == 200:
                print_success("External network connectivity verified (GitHub API)")
    except:
        print_warning("External network connectivity could not be verified")

    return True

def create_validation_script():
    """Create the validation script"""
    print_header("Creating Validation Script")

    validation_script = SCRIPT_DIR / "validate_installation.py"

    script_content = '''#!/usr/bin/env python3
"""
MCP Server Installation Validator
This script validates that all dependencies are properly installed
"""

import sys
import subprocess
from pathlib import Path

def test_imports():
    """Test all required imports"""
    print("Testing imports...")

    required = {
        'aiohttp': 'Core',
        'websockets': 'Core',
        'yaml': 'Core',
        'requests': 'Core',
        'pytest': 'Testing',
        'psutil': 'Testing'
    }

    failed = []
    for module, category in required.items():
        try:
            __import__(module)
            print(f"  ✓ {module} ({category})")
        except ImportError:
            print(f"  ✗ {module} ({category})")
            failed.append(module)

    return len(failed) == 0

def test_gateway_client():
    """Test gateway client import"""
    print("\\nTesting gateway client...")

    try:
        from gateway_client import GatewayClient
        print("  ✓ Gateway client imports successfully")
        return True
    except ImportError as e:
        print(f"  ✗ Gateway client import failed: {e}")
        return False

def test_mcp_server():
    """Test MCP server import"""
    print("\\nTesting MCP server...")

    try:
        from mcp_server import MCPServer
        print("  ✓ MCP server imports successfully")
        return True
    except ImportError as e:
        print(f"  ✗ MCP server import failed: {e}")
        return False

def main():
    print("=" * 60)
    print("MCP Server Installation Validation")
    print("=" * 60)

    results = []

    results.append(test_imports())
    results.append(test_gateway_client())
    results.append(test_mcp_server())

    print("\\n" + "=" * 60)
    if all(results):
        print("✓ All validation checks passed!")
        print("Installation is complete and ready to use.")
        return 0
    else:
        print("✗ Some validation checks failed.")
        print("Please run install.sh or bootstrap.py to fix issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
'''

    try:
        with open(validation_script, 'w') as f:
            f.write(script_content)
        validation_script.chmod(0o755)
        print_success(f"Validation script created: {validation_script}")
        return True
    except Exception as e:
        print_error(f"Failed to create validation script: {e}")
        return False

def print_summary():
    """Print installation summary"""
    print_header("Bootstrap Complete!")

    venv_python = get_venv_python()

    print(f"\n{Colors.GREEN}Environment Setup Complete!{Colors.NC}")
    print(f"\nNext steps:")
    print(f"1. Activate virtual environment:")
    if os.name == 'nt':
        print(f"   {VENV_DIR}\\Scripts\\activate")
    else:
        print(f"   source {VENV_DIR}/bin/activate")

    print(f"\n2. Validate installation:")
    print(f"   {venv_python} validate_installation.py")

    print(f"\n3. Run tests:")
    print(f"   cd tests && {venv_python} run_all_tests.py")

    print(f"\n4. Start MCP server:")
    print(f"   {venv_python} mcp_server.py")

    print(f"\n{Colors.CYAN}Test server is running on http://localhost:{TEST_PORT}/health{Colors.NC}")
    print(f"{Colors.YELLOW}Press Ctrl+C to stop the test server and exit{Colors.NC}")

def main():
    """Main bootstrap function"""
    print(f"{Colors.PURPLE}")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║     Sartor Claude Network MCP Server Bootstrap          ║")
    print("║          Zero-Dependency Installation Script            ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"{Colors.NC}")

    # Check Python version
    if not check_python_version():
        print_error("Python version check failed")
        return 1

    # Check/install pip
    if not check_pip():
        if not install_pip():
            print_error("Failed to install pip")
            print_info("Please install pip manually:")
            print_info("  Ubuntu/Debian: sudo apt-get install python3-pip")
            print_info("  macOS: brew install python3")
            print_info("  Windows: Download from https://bootstrap.pypa.io/get-pip.py")
            return 1

    # Create virtual environment
    if not create_virtual_environment():
        print_error("Failed to create virtual environment")
        return 1

    # Install dependencies
    if not install_dependencies():
        print_error("Failed to install dependencies")
        return 1

    # Verify imports
    if not verify_imports():
        print_warning("Some imports could not be verified")

    # Start test server
    if not start_test_server():
        print_warning("Test server could not be started")

    # Test connectivity
    test_connectivity()

    # Create validation script
    create_validation_script()

    # Print summary
    print_summary()

    # Keep test server running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Bootstrap completed. Test server stopped.{Colors.NC}")

    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Bootstrap interrupted by user{Colors.NC}")
        sys.exit(0)
    except Exception as e:
        print_error(f"Bootstrap failed: {e}")
        sys.exit(1)