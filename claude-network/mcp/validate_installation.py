#!/usr/bin/env python3
"""
Sartor Claude Network MCP Server - Installation Validator
This script checks that all dependencies are properly installed and functional
Date: 2025-11-03
"""

import sys
import os
import subprocess
import importlib.util
from pathlib import Path
from datetime import datetime

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

# Configuration
SCRIPT_DIR = Path(__file__).parent.absolute()
MIN_PYTHON_VERSION = (3, 10)

def print_header(message):
    """Print a section header"""
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.NC}")
    print(f"{Colors.BLUE}{message}{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.NC}")

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.NC}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.NC}")

def print_warning(message):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.NC}")

def print_info(message):
    """Print info message"""
    print(f"{Colors.CYAN}ℹ {message}{Colors.NC}")

class ValidationResult:
    """Store validation results"""
    def __init__(self):
        self.checks = []
        self.passed = 0
        self.failed = 0
        self.warnings = 0

    def add_success(self, category, item, details=""):
        self.checks.append(('success', category, item, details))
        self.passed += 1

    def add_failure(self, category, item, details=""):
        self.checks.append(('failure', category, item, details))
        self.failed += 1

    def add_warning(self, category, item, details=""):
        self.checks.append(('warning', category, item, details))
        self.warnings += 1

    def print_summary(self):
        print_header("Validation Summary")

        # Group by category
        categories = {}
        for status, category, item, details in self.checks:
            if category not in categories:
                categories[category] = []
            categories[category].append((status, item, details))

        # Print by category
        for category in sorted(categories.keys()):
            print(f"\n{Colors.WHITE}{category}:{Colors.NC}")
            for status, item, details in categories[category]:
                if status == 'success':
                    print_success(f"{item} {details}")
                elif status == 'failure':
                    print_error(f"{item} {details}")
                else:
                    print_warning(f"{item} {details}")

        # Print totals
        print(f"\n{Colors.WHITE}Results:{Colors.NC}")
        print(f"  Passed:   {Colors.GREEN}{self.passed}{Colors.NC}")
        print(f"  Failed:   {Colors.RED}{self.failed}{Colors.NC}")
        print(f"  Warnings: {Colors.YELLOW}{self.warnings}{Colors.NC}")

        success_rate = (self.passed / (self.passed + self.failed)) * 100 if (self.passed + self.failed) > 0 else 0

        if self.failed == 0:
            print(f"\n{Colors.GREEN}✓ All critical checks passed! ({success_rate:.0f}%){Colors.NC}")
            return True
        else:
            print(f"\n{Colors.RED}✗ Some critical checks failed ({success_rate:.0f}% passed){Colors.NC}")
            return False

def check_python_version(result):
    """Check Python version"""
    current = sys.version_info[:2]
    required = MIN_PYTHON_VERSION

    if current >= required:
        result.add_success("Environment", "Python Version",
                          f"{current[0]}.{current[1]} (>= {required[0]}.{required[1]})")
    else:
        result.add_failure("Environment", "Python Version",
                          f"{current[0]}.{current[1]} (requires >= {required[0]}.{required[1]})")

def check_core_imports(result):
    """Check core dependency imports"""
    core_deps = {
        'aiohttp': 'Async HTTP client',
        'websockets': 'WebSocket protocol',
        'yaml': 'YAML parsing',
        'requests': 'HTTP requests',
        'dotenv': 'Environment variables',
        'asyncio': 'Async support'
    }

    for module, description in core_deps.items():
        try:
            if module == 'yaml':
                __import__('yaml')
            elif module == 'dotenv':
                __import__('dotenv')
            else:
                __import__(module)
            result.add_success("Core Dependencies", module, f"({description})")
        except ImportError:
            result.add_failure("Core Dependencies", module, f"({description})")

def check_test_imports(result):
    """Check testing dependency imports"""
    test_deps = {
        'pytest': 'Test framework',
        'pytest_asyncio': 'Async test support',
        'psutil': 'System utilities'
    }

    for module, description in test_deps.items():
        try:
            __import__(module)
            result.add_success("Test Dependencies", module, f"({description})")
        except ImportError:
            result.add_warning("Test Dependencies", module, f"({description}) - Optional")

def check_optional_imports(result):
    """Check optional dependency imports"""
    optional_deps = {
        'firebase_admin': 'Firebase integration',
        'github': 'GitHub API',
        'uvloop': 'Fast event loop',
        'black': 'Code formatting',
        'mypy': 'Type checking'
    }

    for module, description in optional_deps.items():
        try:
            __import__(module)
            result.add_success("Optional Dependencies", module, f"({description})")
        except ImportError:
            # These are optional, just note they're missing
            pass

def check_mcp_files(result):
    """Check MCP server files exist"""
    required_files = {
        'gateway_client.py': 'Gateway client module',
        'mcp_server.py': 'MCP server module',
        'requirements.txt': 'Basic requirements',
        'requirements-complete.txt': 'Complete requirements'
    }

    optional_files = {
        'server.py': 'Alternative server',
        'test_server.py': 'Test server',
        'Dockerfile': 'Docker configuration',
        'docker-compose.yml': 'Docker Compose config'
    }

    # Check required files
    for filename, description in required_files.items():
        filepath = SCRIPT_DIR / filename
        if filepath.exists():
            result.add_success("MCP Files", filename, f"({description})")
        else:
            result.add_failure("MCP Files", filename, f"({description})")

    # Check optional files
    for filename, description in optional_files.items():
        filepath = SCRIPT_DIR / filename
        if filepath.exists():
            result.add_success("MCP Files", filename, f"({description})")

def check_gateway_client_import(result):
    """Check if gateway client can be imported"""
    sys.path.insert(0, str(SCRIPT_DIR))

    try:
        from gateway_client import GatewayClient
        result.add_success("Module Imports", "GatewayClient", "imports successfully")

        # Check key methods exist
        required_methods = ['discover_endpoints', 'connect', 'disconnect']
        for method in required_methods:
            if hasattr(GatewayClient, method):
                result.add_success("Gateway Methods", method, "method exists")
            else:
                result.add_failure("Gateway Methods", method, "method missing")

    except ImportError as e:
        result.add_failure("Module Imports", "GatewayClient", f"import failed: {e}")
    except Exception as e:
        result.add_failure("Module Imports", "GatewayClient", f"unexpected error: {e}")

def check_test_structure(result):
    """Check test files structure"""
    tests_dir = SCRIPT_DIR / "tests"

    if not tests_dir.exists():
        result.add_warning("Test Structure", "tests directory", "not found")
        return

    test_files = [
        'test_unit.py',
        'test_integration.py',
        'test_gateway_comprehensive.py',
        'test_e2e.py',
        'test_performance.py',
        'test_security.py',
        'run_all_tests.py'
    ]

    for test_file in test_files:
        filepath = tests_dir / test_file
        if filepath.exists():
            # Count test functions
            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                    test_count = content.count('def test_')
                    if test_count > 0:
                        result.add_success("Test Files", test_file, f"({test_count} tests)")
                    else:
                        result.add_success("Test Files", test_file, "exists")
            except:
                result.add_success("Test Files", test_file, "exists")
        else:
            result.add_warning("Test Files", test_file, "not found")

def check_skills_directory(result):
    """Check skills directory structure"""
    skills_dir = SCRIPT_DIR.parent / "skills"

    if not skills_dir.exists():
        result.add_warning("Skills", "skills directory", "not found")
        return

    # Check for gateway.yaml
    gateway_skill = skills_dir / "meta" / "gateway.yaml"
    if gateway_skill.exists():
        result.add_success("Skills", "gateway.yaml", "gateway skill found")
    else:
        result.add_warning("Skills", "gateway.yaml", "gateway skill not found")

def check_network_connectivity(result):
    """Check basic network connectivity"""
    import socket

    # Check localhost
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result_code = sock.connect_ex(('localhost', 8080))
        sock.close()

        if result_code == 0:
            result.add_success("Network", "localhost:8080", "port accessible")
        else:
            result.add_warning("Network", "localhost:8080", "port not accessible (server not running?)")
    except:
        result.add_warning("Network", "localhost:8080", "could not test")

    # Check external connectivity
    try:
        socket.gethostbyname('github.com')
        result.add_success("Network", "External connectivity", "can resolve github.com")
    except:
        result.add_warning("Network", "External connectivity", "cannot resolve external hosts")

def run_quick_test(result):
    """Run a quick functionality test"""
    test_code = """
import asyncio
import sys
sys.path.insert(0, '.')

async def quick_test():
    try:
        from gateway_client import GatewayClient, GatewayConfig
        config = GatewayConfig(
            retry_count=1,
            discovery_timeout=1.0,
            connection_timeout=1.0
        )
        client = GatewayClient(config=config)

        # Just check that discovery method exists and can be called
        endpoints = await client.discover_endpoints()
        return True
    except Exception as e:
        print(f"Quick test error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(quick_test())
    sys.exit(0 if success else 1)
"""

    try:
        proc = subprocess.run(
            [sys.executable, "-c", test_code],
            cwd=str(SCRIPT_DIR),
            capture_output=True,
            text=True,
            timeout=5
        )

        if proc.returncode == 0:
            result.add_success("Functionality", "Gateway discovery", "method callable")
        else:
            result.add_warning("Functionality", "Gateway discovery", "method failed (expected if no server)")
    except subprocess.TimeoutExpired:
        result.add_warning("Functionality", "Gateway discovery", "timed out (expected if no server)")
    except Exception as e:
        result.add_warning("Functionality", "Gateway discovery", f"could not test: {e}")

def print_recommendations(result):
    """Print recommendations based on results"""
    if result.failed > 0:
        print_header("Recommendations")

        missing_core = False
        missing_test = False

        for status, category, item, _ in result.checks:
            if status == 'failure':
                if category == "Core Dependencies":
                    missing_core = True
                elif category == "Test Dependencies":
                    missing_test = True

        if missing_core:
            print_warning("Missing core dependencies detected!")
            print_info("Run one of these commands to fix:")
            print(f"  1. {Colors.WHITE}python bootstrap.py{Colors.NC} (recommended - zero dependencies)")
            print(f"  2. {Colors.WHITE}bash install.sh{Colors.NC} (if bash available)")
            print(f"  3. {Colors.WHITE}pip install -r requirements-complete.txt{Colors.NC} (if pip available)")

        if missing_test:
            print_warning("Missing test dependencies detected!")
            print_info("To run tests, install:")
            print(f"  {Colors.WHITE}pip install pytest pytest-asyncio psutil{Colors.NC}")

def main():
    """Main validation function"""
    print(f"{Colors.PURPLE}")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║        MCP Server Installation Validator                ║")
    print("║            Checking all dependencies                    ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"{Colors.NC}")

    print_info(f"Validation started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"Working directory: {SCRIPT_DIR}")

    result = ValidationResult()

    # Run all checks
    check_python_version(result)
    check_core_imports(result)
    check_test_imports(result)
    check_optional_imports(result)
    check_mcp_files(result)
    check_gateway_client_import(result)
    check_test_structure(result)
    check_skills_directory(result)
    check_network_connectivity(result)
    run_quick_test(result)

    # Print summary
    success = result.print_summary()

    # Print recommendations if needed
    if not success:
        print_recommendations(result)

    # Final message
    print(f"\n{Colors.CYAN}Validation complete at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.NC}")

    if success:
        print(f"{Colors.GREEN}✓ System is ready for use!{Colors.NC}")
        print("\nNext steps:")
        print("1. Start MCP server: python mcp_server.py")
        print("2. Run tests: cd tests && python run_all_tests.py")
        print("3. Test gateway: python -m gateway_client")
        return 0
    else:
        print(f"{Colors.YELLOW}⚠ Some issues need attention. See recommendations above.{Colors.NC}")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Validation interrupted by user{Colors.NC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Validation failed with error: {e}")
        sys.exit(1)