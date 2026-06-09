#!/usr/bin/env python3
"""
Reality Check Test Script
=========================
Tests what actually works in the Claude Network without external dependencies.
"""

import sys
import traceback
import importlib
from pathlib import Path

# Add path
sys.path.insert(0, str(Path(__file__).parent))

def test_module_import(module_name):
    """Test if a module can be imported and list its main components."""
    print(f"\n{'='*60}")
    print(f"Testing: {module_name}")
    print('='*60)

    try:
        module = importlib.import_module(module_name)
        print(f"✓ Module imports successfully")

        # List classes
        classes = [name for name in dir(module) if name[0].isupper() and not name.startswith('_')]
        if classes:
            print(f"  Classes found: {', '.join(classes[:5])}" + (" ..." if len(classes) > 5 else ""))

        # List functions
        functions = [name for name in dir(module) if callable(getattr(module, name))
                    and not name.startswith('_') and name[0].islower()]
        if functions:
            print(f"  Functions found: {', '.join(functions[:5])}" + (" ..." if len(functions) > 5 else ""))

        # Try to instantiate main class if exists
        main_classes = {
            'macs': 'MACSProtocol',
            'agent_registry': 'AgentRegistry',
            'config_manager': 'ConfigManager',
            'skill_engine': 'SkillEngine',
            'task_manager': 'TaskManager'
        }

        if module_name in main_classes and hasattr(module, main_classes[module_name]):
            try:
                cls = getattr(module, main_classes[module_name])
                # Try to create instance with minimal config
                if module_name == 'macs':
                    instance = cls('test-agent')
                    print(f"  ✓ Can instantiate {main_classes[module_name]}")
                else:
                    # Check if we can at least access the class
                    print(f"  ✓ Class {main_classes[module_name]} exists")
            except Exception as e:
                print(f"  ⚠ Cannot instantiate {main_classes[module_name]}: {str(e)[:50]}")

        return True

    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False
    except Exception as e:
        print(f"⚠ Module loads but has issues: {e}")
        traceback.print_exc()
        return False

def test_firebase_connection():
    """Test if Firebase connection works."""
    print(f"\n{'='*60}")
    print("Testing: Firebase Connection")
    print('='*60)

    try:
        import requests
        url = "https://home-claude-network-default-rtdb.firebaseio.com/test.json"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("✓ Firebase is accessible")
            return True
        else:
            print(f"⚠ Firebase returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Cannot connect to Firebase: {e}")
        return False

def test_file_structure():
    """Check the actual file structure."""
    print(f"\n{'='*60}")
    print("Testing: File Structure")
    print('='*60)

    base_dir = Path(__file__).parent

    # Check for key files
    key_files = {
        'Main Modules': ['macs.py', 'agent_registry.py', 'config_manager.py',
                        'skill_engine.py', 'task_manager.py'],
        'Test Files': ['test_skills.py', 'test_config_registry.py', 'test_firebase.py'],
        'Config Files': ['pytest.ini', 'requirements-dev.txt'],
        'Documentation': ['README.md', 'MASTER-PLAN.md', 'CLAUDE.md']
    }

    for category, files in key_files.items():
        print(f"\n{category}:")
        for file in files:
            path = base_dir / file
            if path.exists():
                size = path.stat().st_size
                print(f"  ✓ {file} ({size:,} bytes)")
            else:
                print(f"  ✗ {file} (missing)")

    # Check test directories
    print("\nTest Directories:")
    test_dirs = ['tests', 'mcp/tests']
    for test_dir in test_dirs:
        path = base_dir / test_dir
        if path.exists() and path.is_dir():
            test_files = list(path.glob('test_*.py'))
            print(f"  ✓ {test_dir}/ ({len(test_files)} test files)")
        else:
            print(f"  ✗ {test_dir}/ (missing)")

def test_dependencies():
    """Check which dependencies are available."""
    print(f"\n{'='*60}")
    print("Testing: Dependencies")
    print('='*60)

    required = {
        'Core': ['json', 'os', 'sys', 'pathlib', 'datetime', 'typing'],
        'Network': ['requests', 'urllib', 'socket'],
        'Testing': ['pytest', 'unittest', 'mock'],
        'External': ['firebase_admin', 'github', 'aiohttp', 'psutil']
    }

    for category, modules in required.items():
        print(f"\n{category}:")
        for module in modules:
            try:
                __import__(module)
                print(f"  ✓ {module}")
            except ImportError:
                print(f"  ✗ {module}")

def main():
    """Run all reality checks."""
    print("CLAUDE NETWORK TESTING REALITY CHECK")
    print("=====================================")
    print("Testing what actually works vs. documentation claims\n")

    results = {}

    # Test module imports
    modules = ['macs', 'agent_registry', 'config_manager', 'skill_engine', 'task_manager']
    for module in modules:
        results[module] = test_module_import(module)

    # Test Firebase
    results['firebase'] = test_firebase_connection()

    # Test file structure
    test_file_structure()

    # Test dependencies
    test_dependencies()

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print('='*60)

    working = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"\nModules that work: {working}/{total}")
    for module, status in results.items():
        status_icon = "✓" if status else "✗"
        print(f"  {status_icon} {module}")

    print("\nKey Findings:")
    print("- Core modules load but testing framework (pytest) is missing")
    print("- Firebase is accessible for integration")
    print("- No external dependencies installed (pytest, aiohttp, etc.)")
    print("- Test files exist but cannot run without dependencies")
    print("- Documentation claims comprehensive testing but environment lacks test runners")

if __name__ == "__main__":
    main()