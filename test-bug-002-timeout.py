#!/usr/bin/env python3
"""
Test script for BUG-002: Task Claim Timeout Fix

This script verifies that:
1. Tasks claimed by disconnected agents are auto-released after timeout
2. task_list() automatically releases stale tasks
3. task_heartbeat() extends the timeout for active workers
4. Tasks with missing/invalid timestamps are properly handled
"""

import sys
import time
from datetime import datetime, timedelta

sys.path.insert(0, 'claude-network/sdk')
from firebase_mcp_client import FirebaseMCPClient


def test_timeout_basic():
    """Test basic timeout functionality"""
    print("\n" + "=" * 70)
    print("TEST 1: Basic Timeout - Task Auto-Released After Timeout")
    print("=" * 70)

    # Create agent and connect
    agent1 = FirebaseMCPClient(agent_id="test-agent-timeout-1")
    agent1.connect()

    # Create a test task
    task_id = agent1.task_create(
        "Timeout Test Task",
        "This task should be auto-released after timeout"
    )
    print(f"✅ Created test task: {task_id}")

    # Claim the task
    success = agent1.task_claim(task_id)
    print(f"✅ Task claimed: {success}")

    # Verify task is claimed
    tasks = agent1._firebase_request("GET", "/tasks")
    task = tasks.get(task_id)
    print(f"📊 Task status: {task.get('status')}")
    print(f"📊 Claimed by: {task.get('claimed_by')}")
    print(f"📊 Claimed at: {task.get('claimed_at')}")

    # Simulate agent disconnect (don't call disconnect, just stop using it)
    print("\n⚠️  Simulating agent disconnect...")
    agent1.disconnect()

    # Wait for a short timeout (we'll test with 1 second for speed)
    print("⏳ Waiting for timeout (using 0.05 minutes = 3 seconds)...")
    time.sleep(4)

    # Create second agent to check if task is released
    agent2 = FirebaseMCPClient(agent_id="test-agent-timeout-2")
    agent2.connect()

    # Check if task was released
    print("\n🔍 Checking if task was auto-released...")
    released_count = agent2._release_stale_tasks(timeout_minutes=0.05)  # 3 seconds
    print(f"✅ Released {released_count} stale task(s)")

    # Verify task is now available
    tasks = agent2._firebase_request("GET", "/tasks")
    task = tasks.get(task_id)
    print(f"📊 Task status after release: {task.get('status')}")
    print(f"📊 Released reason: {task.get('released_reason')}")
    print(f"📊 Previous owner: {task.get('previous_owner')}")

    agent2.disconnect()

    if task.get('status') == 'available':
        print("✅ TEST PASSED: Task was auto-released after timeout")
        return True
    else:
        print("❌ TEST FAILED: Task was not released")
        return False


def test_task_list_auto_release():
    """Test that task_list() automatically releases stale tasks"""
    print("\n" + "=" * 70)
    print("TEST 2: task_list() Auto-Releases Stale Tasks")
    print("=" * 70)

    # Create agents
    agent1 = FirebaseMCPClient(agent_id="test-agent-list-1")
    agent1.connect()

    agent2 = FirebaseMCPClient(agent_id="test-agent-list-2")
    agent2.connect()

    # Create and claim a task
    task_id = agent1.task_create(
        "Auto-Release Test Task",
        "This task should be auto-released when listing"
    )
    agent1.task_claim(task_id)
    print(f"✅ Task {task_id} claimed by agent1")

    # Disconnect agent1
    agent1.disconnect()
    print("⚠️  Agent1 disconnected")

    # Wait a bit
    time.sleep(4)

    # List tasks with agent2 - should auto-release the stale task
    print("\n🔍 Listing tasks (should trigger auto-release)...")
    available_tasks = agent2.task_list(status="available", claim_timeout_minutes=0.05)

    # Check if our task is now in the available list
    task_found = any(t.get('task_id') == task_id for t in available_tasks)

    agent2.disconnect()

    if task_found:
        print("✅ TEST PASSED: task_list() auto-released stale task")
        return True
    else:
        print("❌ TEST FAILED: task_list() did not release stale task")
        return False


def test_heartbeat_extends_timeout():
    """Test that task_heartbeat() extends the timeout"""
    print("\n" + "=" * 70)
    print("TEST 3: Heartbeat Extends Task Timeout")
    print("=" * 70)

    agent = FirebaseMCPClient(agent_id="test-agent-heartbeat")
    agent.connect()

    # Create and claim task
    task_id = agent.task_create(
        "Heartbeat Test Task",
        "This task should not timeout because of heartbeat"
    )
    agent.task_claim(task_id)
    print(f"✅ Task {task_id} claimed")

    # Get initial claimed_at timestamp
    tasks = agent._firebase_request("GET", "/tasks")
    initial_claimed_at = tasks.get(task_id).get('claimed_at')
    print(f"📊 Initial claimed_at: {initial_claimed_at}")

    # Wait a bit
    time.sleep(2)

    # Send heartbeat
    print("\n💓 Sending heartbeat...")
    success = agent.task_heartbeat(task_id)
    print(f"✅ Heartbeat sent: {success}")

    # Get updated claimed_at timestamp
    tasks = agent._firebase_request("GET", "/tasks")
    updated_claimed_at = tasks.get(task_id).get('claimed_at')
    last_heartbeat = tasks.get(task_id).get('last_heartbeat')
    print(f"📊 Updated claimed_at: {updated_claimed_at}")
    print(f"📊 Last heartbeat: {last_heartbeat}")

    agent.disconnect()

    # Verify timestamps were updated
    if updated_claimed_at != initial_claimed_at:
        print("✅ TEST PASSED: Heartbeat extended task timeout")
        return True
    else:
        print("❌ TEST FAILED: Heartbeat did not update timestamp")
        return False


def test_missing_timestamp():
    """Test handling of tasks with missing claimed_at timestamp"""
    print("\n" + "=" * 70)
    print("TEST 4: Handle Tasks With Missing Timestamp")
    print("=" * 70)

    agent = FirebaseMCPClient(agent_id="test-agent-missing-ts")
    agent.connect()

    # Create task and manually corrupt it by removing claimed_at
    task_id = agent.task_create(
        "Corrupted Task",
        "This task has no claimed_at timestamp"
    )

    # Manually set to claimed without timestamp (simulating old code)
    agent._firebase_request("PATCH", f"/tasks/{task_id}", {
        "status": "claimed",
        "claimed_by": "ghost-agent",
        # NO claimed_at timestamp!
    })
    print(f"✅ Created corrupted task (no claimed_at)")

    # Try to release stale tasks
    print("\n🔍 Running stale task cleanup...")
    released_count = agent._release_stale_tasks(timeout_minutes=10)

    # Verify the corrupted task was released
    tasks = agent._firebase_request("GET", "/tasks")
    task = tasks.get(task_id)
    print(f"📊 Task status: {task.get('status')}")
    print(f"📊 Released reason: {task.get('released_reason')}")

    agent.disconnect()

    if task.get('status') == 'available' and task.get('released_reason') == 'missing_timestamp':
        print("✅ TEST PASSED: Missing timestamp handled correctly")
        return True
    else:
        print("❌ TEST FAILED: Missing timestamp not handled")
        return False


def test_simultaneous_claim_and_timeout():
    """Test that timeout doesn't interfere with legitimate claims"""
    print("\n" + "=" * 70)
    print("TEST 5: Timeout Doesn't Affect Active Claims")
    print("=" * 70)

    agent1 = FirebaseMCPClient(agent_id="test-agent-active-1")
    agent1.connect()

    # Create and claim task
    task_id = agent1.task_create(
        "Active Task",
        "This task is actively being worked on"
    )
    agent1.task_claim(task_id)
    print(f"✅ Task {task_id} claimed and being worked on")

    # Create second agent and try to release with very short timeout
    agent2 = FirebaseMCPClient(agent_id="test-agent-active-2")
    agent2.connect()

    # Wait less than timeout
    time.sleep(1)

    # This should NOT release the task because it hasn't timed out
    print("\n🔍 Checking for stale tasks (timeout not reached)...")
    released_count = agent2._release_stale_tasks(timeout_minutes=1)  # 60 seconds

    # Verify task is still claimed
    tasks = agent2._firebase_request("GET", "/tasks")
    task = tasks.get(task_id)
    print(f"📊 Task status: {task.get('status')}")

    agent1.disconnect()
    agent2.disconnect()

    if task.get('status') == 'claimed':
        print("✅ TEST PASSED: Active task not affected by timeout check")
        return True
    else:
        print("❌ TEST FAILED: Active task was incorrectly released")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print(" BUG-002 TIMEOUT MECHANISM TEST SUITE")
    print("="*70)

    results = []

    try:
        results.append(("Basic Timeout", test_timeout_basic()))
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        results.append(("Basic Timeout", False))

    try:
        results.append(("task_list() Auto-Release", test_task_list_auto_release()))
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        results.append(("task_list() Auto-Release", False))

    try:
        results.append(("Heartbeat Extension", test_heartbeat_extends_timeout()))
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        results.append(("Heartbeat Extension", False))

    try:
        results.append(("Missing Timestamp", test_missing_timestamp()))
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        results.append(("Missing Timestamp", False))

    try:
        results.append(("Active Task Protection", test_simultaneous_claim_and_timeout()))
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        results.append(("Active Task Protection", False))

    # Print summary
    print("\n" + "="*70)
    print(" TEST RESULTS SUMMARY")
    print("="*70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")

    print("\n" + "="*70)
    print(f"OVERALL: {passed}/{total} tests passed")
    print("="*70)

    if passed == total:
        print("\n🎉 ALL TESTS PASSED! BUG-002 is fixed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
