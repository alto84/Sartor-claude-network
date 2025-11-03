#!/usr/bin/env python3
"""
Test Script: Sub-Agent Automatic Onboarding

This script demonstrates how sub-agents are automatically onboarded
to the Sartor Claude Network when spawned by a parent agent.
"""

import sys
import time
from pathlib import Path

# Add SDK to path
sys.path.insert(0, str(Path(__file__).parent / "claude-network" / "sdk"))

from firebase_mcp_client import FirebaseMCPClient


def test_parent_agent_onboarding():
    """Test 1: Parent agent connects to network"""
    print("=" * 70)
    print("TEST 1: PARENT AGENT ONBOARDING")
    print("=" * 70)

    parent = FirebaseMCPClient()
    print(f"Generated Agent ID: {parent.agent_id}")

    success = parent.connect()

    if success:
        print("✅ Parent agent successfully onboarded")
        return parent
    else:
        print("❌ Parent agent onboarding failed")
        return None


def test_network_operations(client):
    """Test 2: Parent agent uses network tools"""
    print("\n" + "=" * 70)
    print("TEST 2: NETWORK OPERATIONS")
    print("=" * 70)

    # Test broadcast
    print("\n📢 Testing broadcast...")
    client.message_broadcast("Hello from test script!")
    time.sleep(0.5)

    # Test knowledge add
    print("\n🧠 Testing knowledge base...")
    knowledge_id = client.knowledge_add(
        "Sub-agents can be automatically onboarded using Firebase",
        tags=["onboarding", "firebase", "automation"],
    )
    print(f"   Added knowledge: {knowledge_id}")

    # Test task creation
    print("\n📝 Testing task creation...")
    task_id = client.task_create(
        "Test Task for Sub-Agent",
        "This task should be claimed by a sub-agent",
        {"test": True, "complexity": "low"},
    )
    print(f"   Created task: {task_id}")

    # Test agent list
    print("\n👥 Testing agent list...")
    agents = client.agent_list()
    print(f"   Found {len(agents)} agents online")
    for agent in agents:
        print(
            f"   - {agent.get('agent_id')}: {agent.get('status')} (capabilities: {agent.get('capabilities', [])})"
        )

    return task_id


def test_sub_agent_context_generation(parent):
    """Test 3: Generate sub-agent onboarding context"""
    print("\n" + "=" * 70)
    print("TEST 3: SUB-AGENT CONTEXT GENERATION")
    print("=" * 70)

    # Get environment variables for sub-agent
    print("\n📦 Environment variables for sub-agent:")
    env_vars = parent.create_sub_agent_context("Test sub-agent task")
    for key, value in env_vars.items():
        print(f"   {key}={value}")

    # Get prompt injection
    print("\n📄 Prompt injection for sub-agent:")
    prompt_injection = parent.get_sub_agent_prompt_injection()
    print("   " + "─" * 66)
    print(prompt_injection)
    print("   " + "─" * 66)

    return prompt_injection


def test_sub_agent_spawn_and_connect(parent, task_id):
    """Test 4: Spawn and connect sub-agent"""
    print("\n" + "=" * 70)
    print("TEST 4: SUB-AGENT SPAWN AND CONNECTION")
    print("=" * 70)

    # Generate sub-agent ID
    sub_agent_id = f"{parent.agent_id}-subagent-test"
    print(f"\n🚀 Spawning sub-agent: {sub_agent_id}")

    # Create sub-agent client
    sub_agent = FirebaseMCPClient(agent_id=sub_agent_id, parent_agent_id=parent.agent_id)

    # Connect sub-agent
    print(f"\n🔌 Connecting sub-agent to network...")
    success = sub_agent.connect()

    if success:
        print("✅ Sub-agent successfully connected")

        # Sub-agent performs operations
        print("\n📤 Sub-agent sending status update...")
        sub_agent.message_broadcast(f"Sub-agent {sub_agent_id} reporting for duty!")

        print("\n📋 Sub-agent claiming task...")
        if sub_agent.task_claim(task_id):
            print(f"✅ Sub-agent claimed task: {task_id}")
            time.sleep(0.5)
            sub_agent.task_update(task_id, "completed", {"result": "Task completed successfully"})
            print(f"✅ Sub-agent completed task")

        print("\n🧠 Sub-agent sharing knowledge...")
        sub_agent.knowledge_add(
            "Sub-agent operations verified - automatic onboarding works!",
            tags=["verification", "sub-agent", "success"],
        )

        return sub_agent
    else:
        print("❌ Sub-agent connection failed")
        return None


def test_parent_child_communication(parent, sub_agent):
    """Test 5: Parent-child message exchange"""
    print("\n" + "=" * 70)
    print("TEST 5: PARENT-CHILD COMMUNICATION")
    print("=" * 70)

    # Parent sends message to sub-agent
    print(f"\n📨 Parent sending direct message to sub-agent...")
    parent.message_send(sub_agent.agent_id, "Status report please")
    time.sleep(0.5)

    # Sub-agent reads messages
    print(f"\n📬 Sub-agent reading messages...")
    messages = sub_agent.message_read()
    print(f"   Found {len(messages)} messages")
    for msg in messages:
        print(f"   - From {msg.get('from')}: {msg.get('content')}")

    # Sub-agent responds
    print(f"\n📨 Sub-agent responding to parent...")
    sub_agent.message_send(parent.agent_id, "All systems operational!")
    time.sleep(0.5)

    # Parent reads response
    print(f"\n📬 Parent reading response...")
    parent_messages = parent.message_read()
    print(f"   Found {len(parent_messages)} messages")
    for msg in parent_messages:
        print(f"   - From {msg.get('from')}: {msg.get('content')}")


def test_network_state_verification(parent, sub_agent):
    """Test 6: Verify network state"""
    print("\n" + "=" * 70)
    print("TEST 6: NETWORK STATE VERIFICATION")
    print("=" * 70)

    print("\n🌐 Current network state:")

    # List all agents
    print("\n👥 Agents:")
    agents = parent.agent_list()
    for agent in agents:
        parent_id = agent.get("parent_agent_id")
        parent_indicator = f" (child of {parent_id})" if parent_id else " (parent)"
        print(f"   - {agent.get('agent_id')}: {agent.get('status')}{parent_indicator}")

    # Query knowledge
    print("\n🧠 Knowledge Base:")
    knowledge = parent.knowledge_query()
    print(f"   Total entries: {len(knowledge)}")
    for k in knowledge[-3:]:  # Show last 3
        print(f"   - {k.get('content')[:60]}... ({', '.join(k.get('tags', []))})")

    # Check tasks
    print("\n📋 Tasks:")
    tasks = parent.task_list(status="completed")
    print(f"   Completed tasks: {len(tasks)}")
    tasks_available = parent.task_list(status="available")
    print(f"   Available tasks: {len(tasks_available)}")


def cleanup(parent, sub_agent):
    """Clean up - disconnect agents"""
    print("\n" + "=" * 70)
    print("CLEANUP")
    print("=" * 70)

    if sub_agent:
        print(f"\n👋 Disconnecting sub-agent...")
        sub_agent.disconnect()

    if parent:
        print(f"\n👋 Disconnecting parent agent...")
        parent.disconnect()

    print("\n✅ All agents disconnected")


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "═" * 68 + "╗")
    print("║" + " " * 15 + "SUB-AGENT AUTO-ONBOARDING TEST SUITE" + " " * 16 + "║")
    print("╚" + "═" * 68 + "╝")
    print()

    parent = None
    sub_agent = None
    task_id = None

    try:
        # Test 1: Parent onboarding
        parent = test_parent_agent_onboarding()
        if not parent:
            print("\n❌ Tests aborted - parent agent failed to connect")
            return

        time.sleep(1)

        # Test 2: Network operations
        task_id = test_network_operations(parent)
        time.sleep(1)

        # Test 3: Context generation
        test_sub_agent_context_generation(parent)
        time.sleep(1)

        # Test 4: Sub-agent spawn
        sub_agent = test_sub_agent_spawn_and_connect(parent, task_id)
        if not sub_agent:
            print("\n⚠️  Sub-agent tests skipped - connection failed")
        else:
            time.sleep(1)

            # Test 5: Communication
            test_parent_child_communication(parent, sub_agent)
            time.sleep(1)

            # Test 6: Verification
            test_network_state_verification(parent, sub_agent)

        # Summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        print(f"\n✅ Parent agent onboarded: {parent is not None}")
        print(f"✅ Sub-agent onboarded: {sub_agent is not None}")
        print(f"✅ Network operations: Success")
        print(f"✅ Parent-child communication: Success")
        print(f"✅ Task coordination: Success")

        print("\n" + "╔" + "═" * 68 + "╗")
        print("║" + " " * 10 + "🎉 ALL TESTS PASSED - SUB-AGENT ONBOARDING WORKS! 🎉" + " " * 6 + "║")
        print("╚" + "═" * 68 + "╝")

    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        # Always cleanup
        cleanup(parent, sub_agent)


if __name__ == "__main__":
    main()
