#!/usr/bin/env python3
"""
Standalone test runner to diagnose test infrastructure issues
Works without pytest to identify actual problems
"""

import sys
import os
import traceback
import importlib
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all required modules can be imported"""
    results = {}

    # Core Python modules
    core_modules = ['json', 'datetime', 'unittest.mock', 'requests']
    print("Testing core Python modules:")
    for module in core_modules:
        try:
            importlib.import_module(module)
            results[module] = "✓ OK"
            print(f"  {module}: ✓")
        except ImportError as e:
            results[module] = f"✗ Failed: {e}"
            print(f"  {module}: ✗ {e}")

    # Project modules
    print("\nTesting project modules:")
    project_modules = ['macs', 'network', 'config_manager', 'agent_registry']
    for module in project_modules:
        try:
            importlib.import_module(module)
            results[module] = "✓ OK"
            print(f"  {module}: ✓")
        except ImportError as e:
            results[module] = f"✗ Failed: {e}"
            print(f"  {module}: ✗ Missing dependencies: {e}")

    return results

def test_file_structure():
    """Check that expected test files exist"""
    print("\nChecking test file structure:")
    test_files = [
        'tests/test_macs.py',
        'tests/test_config_manager.py',
        'tests/test_agent_registry.py',
        'tests/test_skill_engine.py',
        'tests/test_task_manager.py'
    ]

    existing = []
    missing = []

    for file in test_files:
        path = Path(file)
        if path.exists():
            existing.append(file)
            print(f"  {file}: ✓ exists")
        else:
            missing.append(file)
            print(f"  {file}: ✗ missing")

    return existing, missing

def count_test_functions():
    """Count test functions in test files"""
    print("\nCounting test functions:")
    test_count = 0

    test_dir = Path('tests')
    if test_dir.exists():
        for test_file in test_dir.glob('test_*.py'):
            with open(test_file, 'r') as f:
                content = f.read()
                # Count functions that start with test_
                test_funcs = content.count('def test_')
                test_count += test_funcs
                print(f"  {test_file.name}: {test_funcs} tests")

    return test_count

def try_run_simple_test():
    """Try to run a simple test without pytest"""
    print("\nAttempting to run simple test without pytest:")

    try:
        # Import test class
        sys.path.insert(0, 'tests')
        from test_macs import TestMACSProtocol

        # Create instance and run setup
        test_instance = TestMACSProtocol()
        test_instance.setup_method()

        # Try to run a simple validation test
        test_message = test_instance.test_message
        is_valid = test_instance.validate_message_format(test_message)

        if is_valid:
            print("  ✓ Message validation test passed!")
            return True
        else:
            print("  ✗ Message validation test failed!")
            return False

    except Exception as e:
        print(f"  ✗ Could not run test: {e}")
        traceback.print_exc()
        return False

def check_dependencies():
    """Check what Python packages are missing"""
    print("\nChecking Python package dependencies:")

    packages = {
        'pytest': 'Testing framework',
        'aiohttp': 'Async HTTP client',
        'websockets': 'WebSocket support',
        'yaml': 'YAML parsing',
        'flask': 'Web framework',
        'flask_cors': 'CORS support for Flask',
        'requests': 'HTTP library'
    }

    installed = []
    missing = []

    for package, description in packages.items():
        try:
            importlib.import_module(package)
            installed.append(package)
            print(f"  {package}: ✓ installed ({description})")
        except ImportError:
            missing.append(package)
            print(f"  {package}: ✗ missing ({description})")

    return installed, missing

def main():
    """Main test runner"""
    print("=" * 60)
    print("Sartor Claude Network - Test Infrastructure Diagnostic")
    print("=" * 60)

    # Run diagnostics
    import_results = test_imports()
    existing_files, missing_files = test_file_structure()
    test_count = count_test_functions()
    installed_packages, missing_packages = check_dependencies()
    simple_test_passed = try_run_simple_test()

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    print(f"Test files found: {len(existing_files)}/{len(existing_files) + len(missing_files)}")
    print(f"Total test functions: {test_count}")
    print(f"Packages installed: {len(installed_packages)}/{len(installed_packages) + len(missing_packages)}")
    print(f"Simple test execution: {'✓ PASSED' if simple_test_passed else '✗ FAILED'}")

    if missing_packages:
        print(f"\n⚠ Missing packages: {', '.join(missing_packages)}")
        print("To fix: Install packages from requirements-working.txt")

    # Estimate runnable tests
    if 'pytest' in missing_packages:
        runnable_tests = 0
        print(f"\n📊 Runnable tests: {runnable_tests}/{test_count} (pytest not installed)")
    else:
        # Optimistic estimate if pytest is available
        runnable_tests = test_count if not missing_packages else test_count // 2
        print(f"\n📊 Estimated runnable tests: {runnable_tests}/{test_count}")

    print("\n" + "=" * 60)
    print("RECOMMENDATION")
    print("=" * 60)
    print("1. Install missing system packages:")
    print("   sudo apt install python3.12-venv python3-pip")
    print("2. Set up virtual environment:")
    print("   python3 -m venv test_env")
    print("   source test_env/bin/activate")
    print("3. Install dependencies:")
    print("   pip install -r requirements-working.txt")
    print("4. Run tests:")
    print("   pytest tests/ -v")

if __name__ == "__main__":
    main()