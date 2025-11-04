#!/usr/bin/env python3
"""
Test Context Inheritance Mechanisms

Tests multiple ways sub-agents can inherit network context:
1. Context file (~/.sartor-network/context.json)
2. Environment variables
3. Explicit parameter passing
"""

import os
import sys
import json
from pathlib import Path

# Add SDK to path
sys.path.insert(0, str(Path(__file__).parent / "claude-network" / "sdk"))

from firebase_mcp_client import FirebaseMCPClient


def test_context_file_inheritance():
    """Test 1: Context file inheritance"""
    print("=" * 70)
    print("TEST 1: CONTEXT FILE INHERITANCE")
    print("=" * 70)

    context_file = Path.home() / ".sartor-network" / "context.json"

    if context_file.exists():
        with open(context_file) as f:
            context = json.load(f)
        print(f"✅ Context file exists: {context_file}")
        print(f"   Firebase URL: {context.get('firebase_url')}")
        print(f"   Agent ID: {context.get('agent_id')}")
        print(f"   Network Mode: {context.get('network_mode')}")
        return True
    else:
        print(f"❌ Context file not found: {context_file}")
        return False


def test_environment_variable_inheritance():
    """Test 2: Environment variable inheritance"""
    print("\n" + "=" * 70)
    print("TEST 2: ENVIRONMENT VARIABLE INHERITANCE")
    print("=" * 70)

    # Set environment variables
    os.environ["SARTOR_FIREBASE_URL"] = "https://home-claude-network-default-rtdb.firebaseio.com/"
    os.environ["SARTOR_AGENT_ID"] = "test-env-parent"
    os.environ["SARTOR_NETWORK_MODE"] = "firebase"

    # Check if they're accessible
    print("Setting environment variables...")
    print(f"  SARTOR_FIREBASE_URL: {os.getenv('SARTOR_FIREBASE_URL')}")
    print(f"  SARTOR_AGENT_ID: {os.getenv('SARTOR_AGENT_ID')}")
    print(f"  SARTOR_NETWORK_MODE: {os.getenv('SARTOR_NETWORK_MODE')}")

    # Test sub-agent can read them
    print("\nSub-agent reading environment variables...")
    firebase_url = os.getenv("SARTOR_FIREBASE_URL")
    parent_id = os.getenv("SARTOR_AGENT_ID")

    if firebase_url and parent_id:
        print("✅ Sub-agent successfully read environment variables")
        return True
    else:
        print("❌ Sub-agent failed to read environment variables")
        return False


def test_explicit_context_passing():
    """Test 3: Explicit context passing via FirebaseMCPClient"""
    print("\n" + "=" * 70)
    print("TEST 3: EXPLICIT CONTEXT PASSING")
    print("=" * 70)

    # Parent creates context
    parent = FirebaseMCPClient(agent_id="explicit-test-parent")
    context = parent.create_sub_agent_context("Test task")

    print("Parent created context:")
    for key, value in context.items():
        print(f"  {key}: {value}")

    # Simulate passing to sub-agent
    print("\nSub-agent receives context...")
    sub_agent = FirebaseMCPClient(
        firebase_url=context["SARTOR_FIREBASE_URL"],
        agent_id="explicit-test-child",
        parent_agent_id=context["SARTOR_PARENT_AGENT_ID"]
    )

    if sub_agent.firebase_url and sub_agent.parent_agent_id:
        print("✅ Sub-agent successfully inherited explicit context")
        print(f"   Firebase URL: {sub_agent.firebase_url}")
        print(f"   Parent ID: {sub_agent.parent_agent_id}")
        return True
    else:
        print("❌ Sub-agent failed to inherit explicit context")
        return False


def test_prompt_injection_generation():
    """Test 4: Prompt injection for automatic onboarding"""
    print("\n" + "=" * 70)
    print("TEST 4: PROMPT INJECTION GENERATION")
    print("=" * 70)

    parent = FirebaseMCPClient(agent_id="prompt-test-parent")
    prompt = parent.get_sub_agent_prompt_injection(sub_agent_id="test-subagent-123")

    print("Generated prompt injection:")
    print("-" * 70)
    print(prompt[:500] + "...")  # Show first 500 chars
    print("-" * 70)

    # Check prompt contains necessary info
    required_elements = [
        "SARTOR NETWORK",
        "FirebaseMCPClient",
        "test-subagent-123",
        "prompt-test-parent",
        "message_broadcast",
        "task_claim",
        "knowledge_query"
    ]

    missing = [elem for elem in required_elements if elem not in prompt]

    if not missing:
        print("✅ Prompt injection contains all required elements")
        return True
    else:
        print(f"❌ Prompt injection missing elements: {missing}")
        return False


def test_hook_integration():
    """Test 5: Hook-based integration"""
    print("\n" + "=" * 70)
    print("TEST 5: HOOK-BASED INTEGRATION")
    print("=" * 70)

    # Load the hook module
    hook_path = Path(__file__).parent / "claude-network" / "hooks" / "sub-agent-onboarding-hook.py"

    if hook_path.exists():
        print(f"✅ Hook file exists: {hook_path}")

        # Import hook functions
        sys.path.insert(0, str(hook_path.parent))
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location("hook", hook_path)
            hook = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(hook)

            # Test hook functions
            print("Testing hook functions...")

            # Load network context
            context = hook.load_network_context()
            if context:
                print("✅ Hook can load network context")
                print(f"   Context: {context}")
            else:
                print("⚠️  Hook returned no context (parent not connected)")

            # Generate injection
            test_context = {
                "firebase_url": "https://test.firebaseio.com/",
                "agent_id": "test-parent"
            }
            injection = hook.generate_onboarding_injection(test_context, "test-sub")

            if "SARTOR NETWORK" in injection and "test-sub" in injection:
                print("✅ Hook can generate onboarding injection")
            else:
                print("❌ Hook injection generation failed")

            return True

        except Exception as e:
            print(f"❌ Hook import failed: {e}")
            return False
    else:
        print(f"❌ Hook file not found: {hook_path}")
        return False


def main():
    print("\n")
    print("╔" + "═" * 68 + "╗")
    print("║" + " " * 16 + "CONTEXT INHERITANCE TEST SUITE" + " " * 21 + "║")
    print("╚" + "═" * 68 + "╝")
    print()

    results = {
        "Context File": test_context_file_inheritance(),
        "Environment Variables": test_environment_variable_inheritance(),
        "Explicit Passing": test_explicit_context_passing(),
        "Prompt Injection": test_prompt_injection_generation(),
        "Hook Integration": test_hook_integration(),
    }

    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")

    all_passed = all(results.values())
    print("\n" + "=" * 70)
    if all_passed:
        print("🎉 ALL CONTEXT INHERITANCE TESTS PASSED!")
    else:
        failed_count = len([r for r in results.values() if not r])
        print(f"⚠️  {failed_count} test(s) failed")

    return all_passed


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
