#!/usr/bin/env python3
"""
Sartor Network - Skill Usage Demonstrations
===========================================

This file contains comprehensive working examples of all Sartor Network features.
Use these examples to learn how to use the network effectively.

Author: Sartor Network Core Team
Version: 1.0.0
Date: November 4, 2025
"""

import sys
import os
import time
import json
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from sartor_network_bootstrap import SartorNetworkClient
except ImportError:
    print("❌ Error: sartor_network_bootstrap.py not found!")
    print("Please run from the project root directory or ensure the bootstrap file is available.")
    sys.exit(1)


# ============================================================================
# DEMO 1: BASIC CONNECTION AND COMMUNICATION
# ============================================================================

def demo_1_basic_connection():
    """Demo 1: Connect to network and send messages"""
    print("\n" + "="*70)
    print("DEMO 1: BASIC CONNECTION AND COMMUNICATION")
    print("="*70 + "\n")

    # Step 1: Create client and connect
    print("📌 Step 1: Connecting to Sartor Network...")
    client = SartorNetworkClient(agent_name="Demo-Basic-Agent")

    if not client.connect():
        print("❌ Failed to connect")
        return

    time.sleep(1)

    # Step 2: Send broadcast message
    print("\n📌 Step 2: Broadcasting announcement...")
    client.message_broadcast("🎉 Demo agent online! Testing basic communication.")

    time.sleep(1)

    # Step 3: Send direct message (to self for demo)
    print("\n📌 Step 3: Sending direct message...")
    client.message_send(
        client.agent_id,
        "This is a test direct message to myself"
    )

    time.sleep(1)

    # Step 4: Read messages
    print("\n📌 Step 4: Reading messages...")
    messages = client.message_read(count=5)
    print(f"Found {len(messages)} recent messages")

    for i, msg in enumerate(messages[:3], 1):
        print(f"\n  Message {i}:")
        print(f"    From: {msg['from'][:30]}...")
        print(f"    Content: {msg['content'][:60]}...")
        print(f"    Time: {msg['timestamp']}")

    # Step 5: Disconnect
    print("\n📌 Step 5: Disconnecting...")
    client.disconnect()

    print("\n✅ Demo 1 Complete!")
    print("-"*70)


# ============================================================================
# DEMO 2: TASK COORDINATION
# ============================================================================

def demo_2_task_coordination():
    """Demo 2: Create, claim, and complete tasks"""
    print("\n" + "="*70)
    print("DEMO 2: TASK COORDINATION")
    print("="*70 + "\n")

    client = SartorNetworkClient(agent_name="Demo-Task-Agent")
    client.connect()

    # Step 1: Create some tasks
    print("📌 Step 1: Creating tasks...")

    task_ids = []

    task_id_1 = client.task_create(
        title="Demo Task: Analyze Python files",
        description="Find all TODO comments in Python files",
        task_data={
            "path": "/src",
            "pattern": "TODO",
            "priority": "medium"
        }
    )
    task_ids.append(task_id_1)

    task_id_2 = client.task_create(
        title="Demo Task: Security check",
        description="Check for common security issues",
        task_data={
            "checks": ["sql-injection", "xss", "weak-passwords"],
            "priority": "high"
        }
    )
    task_ids.append(task_id_2)

    print(f"Created {len(task_ids)} tasks")

    time.sleep(1)

    # Step 2: List available tasks
    print("\n📌 Step 2: Listing available tasks...")
    available = client.task_list(status='available')
    print(f"Found {len(available)} available tasks in network")

    for i, task in enumerate(available[:3], 1):
        print(f"\n  Task {i}:")
        print(f"    Title: {task['title']}")
        print(f"    Description: {task['description'][:50]}...")
        print(f"    Created by: {task['created_by'][:30]}...")

    time.sleep(1)

    # Step 3: Claim and work on first task
    print("\n📌 Step 3: Claiming and working on task...")

    if task_ids:
        task_id = task_ids[0]

        if client.task_claim(task_id):
            print(f"✅ Claimed task: {task_id}")

            # Update to in_progress
            client.task_update(task_id, 'in_progress')
            print("⏳ Working on task...")

            # Simulate work
            time.sleep(2)

            # Complete with results
            result = {
                "files_analyzed": 15,
                "todos_found": 7,
                "details": [
                    "TODO: Add input validation - auth.py:42",
                    "TODO: Optimize query - data.py:156",
                    "TODO: Add error handling - api.py:89"
                ]
            }

            client.task_update(task_id, 'completed', result=result)
            print("✅ Task completed with results")

    # Step 4: Check task status
    print("\n📌 Step 4: Checking task statuses...")

    completed = client.task_list(status='completed')
    claimed = client.task_list(status='claimed')
    available = client.task_list(status='available')

    print(f"  Completed: {len(completed)}")
    print(f"  Claimed: {len(claimed)}")
    print(f"  Available: {len(available)}")

    client.disconnect()

    print("\n✅ Demo 2 Complete!")
    print("-"*70)


# ============================================================================
# DEMO 3: KNOWLEDGE SHARING
# ============================================================================

def demo_3_knowledge_sharing():
    """Demo 3: Add and query knowledge base"""
    print("\n" + "="*70)
    print("DEMO 3: KNOWLEDGE SHARING")
    print("="*70 + "\n")

    client = SartorNetworkClient(agent_name="Demo-Knowledge-Agent")
    client.connect()

    # Step 1: Add simple knowledge
    print("📌 Step 1: Adding knowledge entries...")

    client.knowledge_add(
        "Firebase Realtime Database can be used as MCP transport layer",
        tags=["architecture", "firebase", "mcp"]
    )

    client.knowledge_add(
        "Use parameterized queries to prevent SQL injection attacks",
        tags=["security", "sql-injection", "best-practice"]
    )

    client.knowledge_add(
        "Caching agent list locally can reduce Firebase API calls by 80%",
        tags=["performance", "optimization", "caching"]
    )

    time.sleep(1)

    # Step 2: Add structured knowledge
    print("\n📌 Step 2: Adding structured knowledge...")

    finding = {
        "type": "security_vulnerability",
        "severity": "high",
        "location": {
            "file": "/src/auth/login.py",
            "line": 42,
            "function": "user_login"
        },
        "issue": "SQL injection via user input concatenation",
        "cwe": "CWE-89",
        "recommendation": "Use parameterized queries or ORM methods",
        "code_example": "cursor.execute('SELECT * FROM users WHERE id=?', (user_id,))"
    }

    client.knowledge_add(
        json.dumps(finding, indent=2),
        tags=["security", "sql-injection", "high", "python"]
    )

    print("Added structured security finding")

    time.sleep(1)

    # Step 3: Query knowledge
    print("\n📌 Step 3: Querying knowledge base...")

    # Search for security items
    security = client.knowledge_query("security")
    print(f"\nFound {len(security)} security-related entries:")
    for item in security[:3]:
        print(f"  • {item['content'][:70]}...")
        print(f"    Tags: {', '.join(item['tags'][:4])}")

    # Search for performance items
    performance = client.knowledge_query("performance")
    print(f"\nFound {len(performance)} performance-related entries:")
    for item in performance[:3]:
        print(f"  • {item['content'][:70]}...")

    time.sleep(1)

    # Step 4: Get all knowledge and filter
    print("\n📌 Step 4: Filtering knowledge by tags...")

    all_knowledge = client.knowledge_query()
    print(f"\nTotal knowledge entries: {len(all_knowledge)}")

    # Filter by specific tag
    critical = [k for k in all_knowledge if 'critical' in k.get('tags', [])]
    high = [k for k in all_knowledge if 'high' in k.get('tags', [])]
    security_items = [k for k in all_knowledge if 'security' in k.get('tags', [])]

    print(f"  Critical items: {len(critical)}")
    print(f"  High priority: {len(high)}")
    print(f"  Security items: {len(security_items)}")

    client.disconnect()

    print("\n✅ Demo 3 Complete!")
    print("-"*70)


# ============================================================================
# DEMO 4: AGENT DISCOVERY
# ============================================================================

def demo_4_agent_discovery():
    """Demo 4: Discover and monitor agents"""
    print("\n" + "="*70)
    print("DEMO 4: AGENT DISCOVERY")
    print("="*70 + "\n")

    client = SartorNetworkClient(agent_name="Demo-Discovery-Agent")
    client.connect()

    # Step 1: List all agents
    print("📌 Step 1: Discovering agents in network...")
    agents = client.agent_list()

    print(f"\nFound {len(agents)} total agents in network")

    # Show some agents
    print("\nSample agents:")
    for i, agent in enumerate(agents[:5], 1):
        name = agent.get('agent_name', 'Unknown')
        status = agent.get('status', 'unknown')
        caps = ', '.join(agent.get('capabilities', [])[:3])

        print(f"\n  Agent {i}: {name}")
        print(f"    ID: {agent['agent_id'][:40]}...")
        print(f"    Status: {status}")
        print(f"    Capabilities: {caps}")

    time.sleep(1)

    # Step 2: Filter agents
    print("\n📌 Step 2: Filtering agents by status...")

    online = [a for a in agents if a.get('status') == 'online']
    offline = [a for a in agents if a.get('status') == 'offline']
    has_tasks = [a for a in agents if 'tasks' in a.get('capabilities', [])]

    print(f"  Online: {len(online)}")
    print(f"  Offline: {len(offline)}")
    print(f"  With task capability: {len(has_tasks)}")

    time.sleep(1)

    # Step 3: Check specific agent
    print("\n📌 Step 3: Checking specific agent...")

    # Check ourselves
    my_status = client.agent_status(client.agent_id)

    if my_status:
        print(f"\nMy agent status:")
        print(f"  ID: {my_status['agent_id']}")
        print(f"  Name: {my_status.get('agent_name', 'Unknown')}")
        print(f"  Status: {my_status['status']}")
        print(f"  Joined: {my_status['joined_at']}")
        print(f"  Capabilities: {', '.join(my_status['capabilities'])}")

    time.sleep(1)

    # Step 4: Send heartbeat
    print("\n📌 Step 4: Sending heartbeat...")
    client.heartbeat()
    print("❤️  Heartbeat sent - presence updated")

    client.disconnect()

    print("\n✅ Demo 4 Complete!")
    print("-"*70)


# ============================================================================
# DEMO 5: SUB-AGENT ONBOARDING
# ============================================================================

def demo_5_sub_agent_onboarding():
    """Demo 5: Sub-agent onboarding and coordination"""
    print("\n" + "="*70)
    print("DEMO 5: SUB-AGENT ONBOARDING")
    print("="*70 + "\n")

    # Parent agent
    print("📌 Step 1: Parent agent connecting...")
    parent = SartorNetworkClient(agent_name="Demo-Parent-Agent")
    parent.connect()

    time.sleep(1)

    # Step 2: Get sub-agent context
    print("\n📌 Step 2: Preparing sub-agent context...")

    sub_agent_id = f"{parent.agent_id}-demo-sub"
    sub_prompt = parent.get_sub_agent_prompt(sub_agent_id)

    print(f"Generated sub-agent context (length: {len(sub_prompt)} chars)")
    print(f"Sub-agent ID: {sub_agent_id}")

    print("\nSub-agent prompt preview:")
    print("-" * 70)
    print(sub_prompt[:300] + "...")
    print("-" * 70)

    time.sleep(1)

    # Step 3: Simulate sub-agent connection
    print("\n📌 Step 3: Simulating sub-agent connection...")

    # In real usage, you'd pass sub_prompt to Task tool
    # Here we'll manually create the sub-agent

    sub_agent = SartorNetworkClient(
        agent_id=sub_agent_id,
        agent_name="Demo-Sub-Agent"
    )
    sub_agent.connect()

    print(f"✅ Sub-agent connected: {sub_agent_id[:40]}...")

    time.sleep(1)

    # Step 4: Parent-child communication
    print("\n📌 Step 4: Parent-child communication...")

    # Parent sends task to sub-agent
    parent.message_send(
        sub_agent_id,
        "Your task: Analyze /src directory for Python files"
    )
    print("Parent → Sub: Task instruction sent")

    time.sleep(0.5)

    # Sub-agent acknowledges
    sub_agent.message_send(
        parent.agent_id,
        "Acknowledged. Starting analysis."
    )
    print("Sub → Parent: Acknowledgment sent")

    time.sleep(0.5)

    # Sub-agent shares findings via knowledge
    sub_agent.knowledge_add(
        "Found 42 Python files in /src directory",
        tags=["sub-agent-finding", "python", "analysis"]
    )
    print("Sub: Findings shared via knowledge base")

    time.sleep(0.5)

    # Sub-agent reports completion
    sub_agent.message_send(
        parent.agent_id,
        "Analysis complete. Found 42 Python files. Results in knowledge base."
    )
    print("Sub → Parent: Completion report sent")

    time.sleep(1)

    # Step 5: Verify hierarchy
    print("\n📌 Step 5: Verifying agent hierarchy...")

    parent_info = parent.agent_status(parent.agent_id)
    sub_info = sub_agent.agent_status(sub_agent_id)

    print(f"\nParent agent:")
    print(f"  ID: {parent.agent_id[:40]}...")
    print(f"  Parent ID: {parent_info.get('parent_agent_id', 'None (top-level)')}")

    print(f"\nSub-agent:")
    print(f"  ID: {sub_agent.agent_id[:40]}...")
    print(f"  Parent ID: {sub_info.get('parent_agent_id', 'None')[:40]}...")
    print(f"  ✅ Hierarchy confirmed!")

    # Cleanup
    sub_agent.disconnect()
    parent.disconnect()

    print("\n✅ Demo 5 Complete!")
    print("-"*70)


# ============================================================================
# DEMO 6: COMPLETE WORKFLOW
# ============================================================================

def demo_6_complete_workflow():
    """Demo 6: Complete multi-agent workflow"""
    print("\n" + "="*70)
    print("DEMO 6: COMPLETE WORKFLOW")
    print("="*70 + "\n")

    print("Scenario: Distributed code analysis with multiple agents\n")

    # Coordinator agent
    print("📌 Step 1: Coordinator agent starting...")
    coordinator = SartorNetworkClient(agent_name="Demo-Coordinator")
    coordinator.connect()

    # Create analysis tasks
    print("\n📌 Step 2: Creating analysis tasks...")

    tasks = [
        {
            "title": "Security Analysis - /src/auth",
            "description": "Check authentication module for vulnerabilities",
            "data": {"path": "/src/auth", "type": "security", "priority": "critical"}
        },
        {
            "title": "Performance Analysis - /src/data",
            "description": "Identify performance bottlenecks in data processing",
            "data": {"path": "/src/data", "type": "performance", "priority": "high"}
        },
        {
            "title": "Documentation Check - /src",
            "description": "Verify all functions have docstrings",
            "data": {"path": "/src", "type": "documentation", "priority": "medium"}
        }
    ]

    task_ids = []
    for task_info in tasks:
        task_id = coordinator.task_create(
            title=task_info["title"],
            description=task_info["description"],
            task_data=task_info["data"]
        )
        task_ids.append((task_id, task_info["data"]["type"]))

    print(f"Created {len(task_ids)} tasks")

    time.sleep(1)

    # Announce tasks
    coordinator.message_broadcast(
        f"📋 Coordinator: Created {len(task_ids)} analysis tasks. Workers needed!"
    )

    time.sleep(1)

    # Simulate workers
    print("\n📌 Step 3: Workers claiming and processing tasks...")

    workers = []
    for i, (task_id, task_type) in enumerate(task_ids):
        # Create worker
        worker = SartorNetworkClient(
            agent_id=f"{coordinator.agent_id}-worker-{i}",
            agent_name=f"Demo-Worker-{task_type}"
        )
        worker.connect()
        workers.append(worker)

        print(f"\n  Worker {i+1} ({task_type}):")

        # Claim task
        if worker.task_claim(task_id):
            print(f"    ✅ Claimed task")

            # Work on it
            worker.task_update(task_id, 'in_progress')
            print(f"    ⏳ Processing...")

            # Simulate work
            time.sleep(1)

            # Complete with results
            result = {
                "type": task_type,
                "status": "complete",
                "findings": [
                    f"Finding 1 for {task_type}",
                    f"Finding 2 for {task_type}"
                ],
                "count": 2,
                "timestamp": datetime.now().isoformat()
            }

            worker.task_update(task_id, 'completed', result=result)
            print(f"    ✅ Completed")

            # Share knowledge
            worker.knowledge_add(
                f"{task_type.title()} analysis complete: 2 findings",
                tags=[task_type, "analysis", "complete"]
            )
            print(f"    📚 Shared knowledge")

            # Report to coordinator
            worker.message_send(
                coordinator.agent_id,
                f"Task {task_id[:8]} complete: {result['count']} findings"
            )
            print(f"    📨 Reported to coordinator")

    time.sleep(1)

    # Coordinator checks results
    print("\n📌 Step 4: Coordinator checking results...")

    completed = coordinator.task_list(status='completed')
    print(f"\n  ✅ All {len(completed)} tasks completed!")

    # Check knowledge base
    knowledge = coordinator.knowledge_query("analysis")
    print(f"  📚 Knowledge entries added: {len(knowledge)}")

    # Check messages
    messages = coordinator.message_read(count=10)
    worker_reports = [m for m in messages if 'complete' in m['content'].lower()]
    print(f"  📨 Worker reports received: {len(worker_reports)}")

    # Final broadcast
    coordinator.message_broadcast(
        "🎉 Analysis workflow complete! All tasks finished successfully."
    )

    time.sleep(1)

    # Cleanup
    print("\n📌 Step 5: Cleaning up...")
    for worker in workers:
        worker.disconnect()
    coordinator.disconnect()

    print("\n✅ Demo 6 Complete!")
    print("-"*70)


# ============================================================================
# DEMO 7: TROUBLESHOOTING HELPERS
# ============================================================================

def demo_7_troubleshooting():
    """Demo 7: Troubleshooting and debugging helpers"""
    print("\n" + "="*70)
    print("DEMO 7: TROUBLESHOOTING & DEBUGGING")
    print("="*70 + "\n")

    client = SartorNetworkClient(agent_name="Demo-Debug-Agent")

    # Test 1: Firebase connectivity
    print("📌 Test 1: Checking Firebase connectivity...")

    import requests

    firebase_url = "https://home-claude-network-default-rtdb.firebaseio.com"
    test_url = f"{firebase_url}/agents-network/agents.json"

    try:
        response = requests.get(test_url, timeout=5)
        print(f"  Status code: {response.status_code}")
        print(f"  ✅ Firebase is accessible")
    except Exception as e:
        print(f"  ❌ Firebase connection failed: {e}")
        return

    time.sleep(1)

    # Test 2: Client connection
    print("\n📌 Test 2: Testing client connection...")

    if client.connect():
        print("  ✅ Client connected successfully")
    else:
        print("  ❌ Client connection failed")
        return

    time.sleep(1)

    # Test 3: Agent registration
    print("\n📌 Test 3: Verifying agent registration...")

    my_info = client.agent_status(client.agent_id)
    if my_info:
        print(f"  ✅ Agent registered:")
        print(f"     ID: {my_info['agent_id'][:40]}...")
        print(f"     Status: {my_info['status']}")
        print(f"     Capabilities: {len(my_info['capabilities'])}")
    else:
        print("  ❌ Agent not found in registry")

    time.sleep(1)

    # Test 4: Message functionality
    print("\n📌 Test 4: Testing message functionality...")

    # Send test broadcast
    success = client.message_broadcast("Test broadcast from debug agent")
    if success:
        print("  ✅ Broadcast message sent")
    else:
        print("  ❌ Broadcast failed")

    time.sleep(0.5)

    # Send direct message (to self)
    success = client.message_send(client.agent_id, "Test direct message")
    if success:
        print("  ✅ Direct message sent")
    else:
        print("  ❌ Direct message failed")

    time.sleep(0.5)

    # Read messages
    messages = client.message_read(count=1)
    if messages:
        print(f"  ✅ Read {len(messages)} messages")
    else:
        print("  ⚠️  No messages found")

    time.sleep(1)

    # Test 5: Task functionality
    print("\n📌 Test 5: Testing task functionality...")

    # Create test task
    task_id = client.task_create(
        title="Debug Test Task",
        description="This is a test task for debugging",
        task_data={"test": True}
    )

    if task_id:
        print(f"  ✅ Task created: {task_id[:20]}...")

        # List tasks
        tasks = client.task_list(status='available')
        if any(t['task_id'] == task_id for t in tasks):
            print("  ✅ Task appears in listings")
        else:
            print("  ⚠️  Task not found in listings")

    else:
        print("  ❌ Task creation failed")

    time.sleep(1)

    # Test 6: Knowledge functionality
    print("\n📌 Test 6: Testing knowledge functionality...")

    # Add test knowledge
    k_id = client.knowledge_add(
        "This is a debug test knowledge entry",
        tags=["debug", "test"]
    )

    if k_id:
        print(f"  ✅ Knowledge added: {k_id[:20]}...")

        # Query it back
        results = client.knowledge_query("debug")
        if results:
            print(f"  ✅ Knowledge query returned {len(results)} results")
        else:
            print("  ⚠️  Knowledge query returned no results")

    else:
        print("  ❌ Knowledge addition failed")

    time.sleep(1)

    # Test 7: Network statistics
    print("\n📌 Test 7: Network statistics...")

    agents = client.agent_list()
    tasks_available = client.task_list(status='available')
    tasks_completed = client.task_list(status='completed')
    knowledge = client.knowledge_query()

    print(f"\n  Network Statistics:")
    print(f"    Total agents: {len(agents)}")
    print(f"    Available tasks: {len(tasks_available)}")
    print(f"    Completed tasks: {len(tasks_completed)}")
    print(f"    Knowledge entries: {len(knowledge)}")

    # Cleanup
    client.disconnect()

    print("\n✅ Demo 7 Complete - All systems operational!")
    print("-"*70)


# ============================================================================
# MAIN MENU
# ============================================================================

def print_menu():
    """Print demo menu"""
    print("\n" + "="*70)
    print("SARTOR NETWORK - SKILL USAGE DEMONSTRATIONS")
    print("="*70 + "\n")

    print("Available Demos:\n")
    print("  1. Basic Connection & Communication")
    print("     - Connect to network")
    print("     - Send messages (direct & broadcast)")
    print("     - Read messages")
    print()
    print("  2. Task Coordination")
    print("     - Create tasks")
    print("     - Claim and work on tasks")
    print("     - Update task status")
    print("     - Check task completion")
    print()
    print("  3. Knowledge Sharing")
    print("     - Add knowledge entries")
    print("     - Add structured knowledge")
    print("     - Query knowledge base")
    print("     - Filter by tags")
    print()
    print("  4. Agent Discovery")
    print("     - List all agents")
    print("     - Filter agents by status/capability")
    print("     - Check specific agent")
    print("     - Send heartbeat")
    print()
    print("  5. Sub-Agent Onboarding")
    print("     - Parent-child setup")
    print("     - Sub-agent connection")
    print("     - Parent-child communication")
    print("     - Verify hierarchy")
    print()
    print("  6. Complete Workflow")
    print("     - Multi-agent coordination")
    print("     - Distributed task processing")
    print("     - Knowledge aggregation")
    print("     - Result reporting")
    print()
    print("  7. Troubleshooting & Debugging")
    print("     - Test Firebase connectivity")
    print("     - Verify all functionality")
    print("     - Check network statistics")
    print()
    print("  8. Run ALL Demos")
    print("     - Execute all demos in sequence")
    print()
    print("  0. Exit")
    print()
    print("="*70 + "\n")


def run_demo(choice):
    """Run selected demo"""
    demos = {
        '1': demo_1_basic_connection,
        '2': demo_2_task_coordination,
        '3': demo_3_knowledge_sharing,
        '4': demo_4_agent_discovery,
        '5': demo_5_sub_agent_onboarding,
        '6': demo_6_complete_workflow,
        '7': demo_7_troubleshooting,
    }

    if choice in demos:
        try:
            demos[choice]()
        except KeyboardInterrupt:
            print("\n\n⚠️  Demo interrupted by user")
        except Exception as e:
            print(f"\n\n❌ Error running demo: {e}")
            import traceback
            traceback.print_exc()
    elif choice == '8':
        # Run all demos
        print("\n🚀 Running all demos in sequence...\n")
        for demo_func in demos.values():
            try:
                demo_func()
                time.sleep(2)
            except Exception as e:
                print(f"❌ Demo failed: {e}")
        print("\n🎉 All demos complete!")


def main():
    """Main entry point"""
    print("\n" + "="*70)
    print("SARTOR NETWORK - SKILL USAGE DEMO")
    print("="*70)
    print("\nWelcome! This script demonstrates all features of the Sartor Network.")
    print("Each demo is self-contained and includes explanatory output.")
    print("\nNote: Demos will create test data in the network (agents, tasks, messages).")
    print("="*70)

    while True:
        print_menu()

        try:
            choice = input("Select demo (0-8): ").strip()

            if choice == '0':
                print("\n👋 Goodbye!\n")
                break

            if choice in ['1', '2', '3', '4', '5', '6', '7', '8']:
                run_demo(choice)
                input("\nPress Enter to continue...")
            else:
                print("\n❌ Invalid choice. Please select 0-8.")

        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    main()
