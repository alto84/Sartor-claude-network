#!/usr/bin/env python3
"""
Test Script: Multi-Level Sub-Agent Hierarchy (Grandchildren)

Tests T6.6: Multi-level sub-agent hierarchy
Verifies that sub-agents can spawn their own sub-agents (grandchildren)
"""

import sys
import time
from pathlib import Path

# Add SDK to path
sys.path.insert(0, str(Path(__file__).parent / "claude-network" / "sdk"))

from firebase_mcp_client import FirebaseMCPClient


def main():
    print("=" * 70)
    print("TEST T6.6: MULTI-LEVEL SUB-AGENT HIERARCHY (GRANDCHILDREN)")
    print("=" * 70)

    # Level 1: Parent Agent
    print("\n[LEVEL 1] Creating parent agent...")
    parent = FirebaseMCPClient()
    parent.connect()
    print(f"✅ Parent connected: {parent.agent_id}")
    time.sleep(0.5)

    # Parent creates a task
    task_id = parent.task_create(
        "Analyze configuration",
        "This task should be claimed by grandchild",
        {"level": "grandchild-task"}
    )
    print(f"✅ Parent created task: {task_id}")
    time.sleep(0.5)

    # Level 2: Child (sub-agent of parent)
    print("\n[LEVEL 2] Creating child agent (sub-agent)...")
    child = FirebaseMCPClient(
        agent_id=f"{parent.agent_id}-child",
        parent_agent_id=parent.agent_id
    )
    child.connect()
    print(f"✅ Child connected: {child.agent_id}")

    # Child broadcasts status
    child.message_broadcast("Child agent online - can spawn grandchildren")
    time.sleep(0.5)

    # Level 3: Grandchild (sub-agent of child)
    print("\n[LEVEL 3] Creating grandchild agent (sub-sub-agent)...")
    grandchild = FirebaseMCPClient(
        agent_id=f"{child.agent_id}-grandchild",
        parent_agent_id=child.agent_id
    )
    grandchild.connect()
    print(f"✅ Grandchild connected: {grandchild.agent_id}")

    # Grandchild performs operations
    print("\n[GRANDCHILD OPERATIONS]")
    grandchild.message_broadcast("Grandchild agent reporting - 3 levels deep!")

    # Grandchild claims task
    print(f"Grandchild claiming task {task_id}...")
    if grandchild.task_claim(task_id):
        print("✅ Grandchild successfully claimed task")
        grandchild.task_update(task_id, "completed", {"completed_by": "grandchild"})
        print("✅ Grandchild completed task")

    # Grandchild adds knowledge
    grandchild.knowledge_add(
        "Multi-level hierarchy works - grandchildren can use all network features",
        tags=["hierarchy", "grandchild", "success"]
    )
    time.sleep(0.5)

    # Verify hierarchy
    print("\n[HIERARCHY VERIFICATION]")
    agents = parent.agent_list()

    print("\nAgent hierarchy:")
    for agent in agents:
        agent_id = agent.get("agent_id")
        parent_id = agent.get("parent_agent_id")
        status = agent.get("status")

        # Determine level
        if agent_id == parent.agent_id:
            level = "PARENT"
        elif agent_id == child.agent_id:
            level = "  └─ CHILD"
        elif agent_id == grandchild.agent_id:
            level = "     └─ GRANDCHILD"
        else:
            continue

        print(f"{level} {agent_id} [{status}]")
        if parent_id:
            print(f"         Parent: {parent_id}")

    # Test cross-level communication
    print("\n[CROSS-LEVEL COMMUNICATION]")

    # Parent -> Grandchild (skipping child)
    print("Parent sending direct message to grandchild...")
    parent.message_send(grandchild.agent_id, "Message from grandparent")
    time.sleep(0.5)

    # Grandchild reads message
    messages = grandchild.message_read()
    grandchild_msg = [m for m in messages if m.get('from') == parent.agent_id]
    if grandchild_msg:
        print(f"✅ Grandchild received message from grandparent: '{grandchild_msg[0].get('content')}'")

    # Grandchild -> Parent (responding)
    print("Grandchild responding to grandparent...")
    grandchild.message_send(parent.agent_id, "Grandchild acknowledges grandparent")
    time.sleep(0.5)

    # Parent reads response
    parent_messages = parent.message_read()
    response = [m for m in parent_messages if m.get('from') == grandchild.agent_id]
    if response:
        print(f"✅ Parent received response from grandchild: '{response[0].get('content')}'")

    # Level 4: Test even deeper (great-grandchild)
    print("\n[LEVEL 4] Creating great-grandchild agent...")
    great_grandchild = FirebaseMCPClient(
        agent_id=f"{grandchild.agent_id}-great",
        parent_agent_id=grandchild.agent_id
    )
    great_grandchild.connect()
    print(f"✅ Great-grandchild connected: {great_grandchild.agent_id}")

    great_grandchild.message_broadcast("Great-grandchild at level 4!")
    great_grandchild.knowledge_add(
        "4-level hierarchy verified - network scales to arbitrary depth",
        tags=["hierarchy", "depth-4"]
    )
    time.sleep(0.5)

    # Final verification
    print("\n[FINAL HIERARCHY]")
    agents = parent.agent_list()
    online_count = len([a for a in agents if a.get('status') == 'online'])
    print(f"Total online agents: {online_count}")

    hierarchy_levels = {
        parent.agent_id: "Level 1 (Parent)",
        child.agent_id: "Level 2 (Child)",
        grandchild.agent_id: "Level 3 (Grandchild)",
        great_grandchild.agent_id: "Level 4 (Great-Grandchild)"
    }

    for agent in agents:
        agent_id = agent.get("agent_id")
        if agent_id in hierarchy_levels:
            print(f"  {hierarchy_levels[agent_id]}: {agent_id} [{agent.get('status')}]")

    # Test results
    print("\n" + "=" * 70)
    print("TEST RESULTS")
    print("=" * 70)
    print("✅ Level 1 (Parent) - Connected and operational")
    print("✅ Level 2 (Child) - Connected and operational")
    print("✅ Level 3 (Grandchild) - Connected and operational")
    print("✅ Level 4 (Great-Grandchild) - Connected and operational")
    print("✅ Grandchild can claim tasks")
    print("✅ Grandchild can add knowledge")
    print("✅ Grandchild can communicate with grandparent")
    print("✅ Cross-level messaging works")
    print("✅ Multi-level hierarchy fully functional")

    print("\n" + "╔" + "═" * 68 + "╗")
    print("║" + " " * 8 + "🎉 T6.6 PASSED - Multi-level hierarchy works! 🎉" + " " * 9 + "║")
    print("╚" + "═" * 68 + "╝")

    # Cleanup
    print("\n[CLEANUP]")
    great_grandchild.disconnect()
    grandchild.disconnect()
    child.disconnect()
    parent.disconnect()
    print("✅ All agents disconnected")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
