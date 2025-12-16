#!/usr/bin/env python3
"""
MCP Server Test Script
======================
Quick validation script to test MCP server implementation.

Author: MCP Server Implementation Specialist
Date: 2025-11-03
Version: 1.0.0
"""

import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    try:
        from mcp.server import MCPServer
        from mcp.tools.firebase_tools import FirebaseTools
        from mcp.tools.github_tools import GitHubTools
        from mcp.tools.onboarding_tools import OnboardingTools
        from mcp.tools.navigation_tools import NavigationTools
        print("  ✅ All imports successful")
        return True
    except Exception as e:
        print(f"  ❌ Import failed: {e}")
        return False


def test_configuration():
    """Test configuration loading."""
    print("\nTesting configuration...")
    try:
        config_path = Path(__file__).parent / 'config.json'
        with open(config_path, 'r') as f:
            config = json.load(f)

        # Validate required keys
        required_keys = ['server', 'firebase', 'github', 'tools']
        for key in required_keys:
            if key not in config:
                print(f"  ❌ Missing required key: {key}")
                return False

        print(f"  ✅ Configuration valid")
        print(f"     - Server: {config['server']['name']} v{config['server']['version']}")
        print(f"     - Firebase: {config['firebase']['url']}")
        print(f"     - GitHub: {config['github']['repo']}")
        print(f"     - Tools: {len(config['tools'])} categories")
        return True
    except Exception as e:
        print(f"  ❌ Configuration test failed: {e}")
        return False


def test_server_initialization():
    """Test that MCP server can be initialized."""
    print("\nTesting server initialization...")
    try:
        from mcp.server import MCPServer

        # Initialize server
        config_path = Path(__file__).parent / 'config.json'
        server = MCPServer(config_path=str(config_path))

        # Check server attributes
        if not hasattr(server, 'tools'):
            print("  ❌ Server missing 'tools' attribute")
            return False

        if not server.tools:
            print("  ❌ No tools registered")
            return False

        print(f"  ✅ Server initialized successfully")
        print(f"     - Tools registered: {len(server.tools)}")

        # List all tools
        print(f"\n  Tool categories:")
        tool_categories = {}
        for tool_name in server.tools.keys():
            category = tool_name.split('.')[0]
            if category not in tool_categories:
                tool_categories[category] = []
            tool_categories[category].append(tool_name)

        for category, tools in sorted(tool_categories.items()):
            print(f"    - {category}: {len(tools)} tools")
            for tool in sorted(tools):
                print(f"      • {tool}")

        return True
    except Exception as e:
        print(f"  ❌ Server initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tool_schemas():
    """Test that all tools have valid schemas."""
    print("\nTesting tool schemas...")
    try:
        from mcp.server import MCPServer

        config_path = Path(__file__).parent / 'config.json'
        server = MCPServer(config_path=str(config_path))

        # Check each tool schema
        invalid_tools = []
        for tool_name, tool_info in server.tools.items():
            # Check required fields
            if 'name' not in tool_info:
                invalid_tools.append(f"{tool_name}: missing 'name'")
            if 'description' not in tool_info:
                invalid_tools.append(f"{tool_name}: missing 'description'")
            if 'parameters' not in tool_info:
                invalid_tools.append(f"{tool_name}: missing 'parameters'")
            if 'handler' not in tool_info:
                invalid_tools.append(f"{tool_name}: missing 'handler'")

        if invalid_tools:
            print(f"  ❌ Invalid tool schemas:")
            for issue in invalid_tools:
                print(f"     - {issue}")
            return False

        print(f"  ✅ All {len(server.tools)} tool schemas valid")
        return True
    except Exception as e:
        print(f"  ❌ Tool schema test failed: {e}")
        return False


def test_tool_handlers():
    """Test that all tool handlers are callable."""
    print("\nTesting tool handlers...")
    try:
        from mcp.server import MCPServer
        import inspect

        config_path = Path(__file__).parent / 'config.json'
        server = MCPServer(config_path=str(config_path))

        # Check each tool handler
        non_callable = []
        non_async = []

        for tool_name, tool_info in server.tools.items():
            handler = tool_info.get('handler')

            if not callable(handler):
                non_callable.append(tool_name)
            elif not inspect.iscoroutinefunction(handler):
                non_async.append(tool_name)

        if non_callable:
            print(f"  ❌ Non-callable handlers:")
            for tool in non_callable:
                print(f"     - {tool}")
            return False

        if non_async:
            print(f"  ⚠️  Non-async handlers (may need fixing):")
            for tool in non_async:
                print(f"     - {tool}")

        print(f"  ✅ All {len(server.tools)} tool handlers callable")
        return True
    except Exception as e:
        print(f"  ❌ Tool handler test failed: {e}")
        return False


def test_file_structure():
    """Test that all required files exist."""
    print("\nTesting file structure...")
    try:
        base_path = Path(__file__).parent

        required_files = [
            'server.py',
            'config.json',
            'MCP-SERVER-README.md',
            'tools/__init__.py',
            'tools/firebase_tools.py',
            'tools/github_tools.py',
            'tools/onboarding_tools.py',
            'tools/navigation_tools.py'
        ]

        missing_files = []
        for file_path in required_files:
            full_path = base_path / file_path
            if not full_path.exists():
                missing_files.append(file_path)

        if missing_files:
            print(f"  ❌ Missing files:")
            for file in missing_files:
                print(f"     - {file}")
            return False

        print(f"  ✅ All {len(required_files)} required files present")
        return True
    except Exception as e:
        print(f"  ❌ File structure test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 70)
    print("MCP Server Test Suite")
    print("=" * 70)

    tests = [
        ("File Structure", test_file_structure),
        ("Imports", test_imports),
        ("Configuration", test_configuration),
        ("Server Initialization", test_server_initialization),
        ("Tool Schemas", test_tool_schemas),
        ("Tool Handlers", test_tool_handlers)
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))

    # Print summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print("-" * 70)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! MCP server is ready to use.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())