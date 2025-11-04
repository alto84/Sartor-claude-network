#!/usr/bin/env python3
"""
Test script for BUG-001: Race Condition Fix

This script tests that the optimistic locking fix prevents multiple agents
from claiming the same task simultaneously.

Expected behavior:
- Only 1 agent should successfully claim the task
- Other 4 agents should receive False
- No false positives (agents thinking they claimed when they didn't)
"""

import sys
import os
import threading
import time
from datetime import datetime

# Add the SDK path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "claude-network/sdk"))

from firebase_mcp_client import FirebaseMCPClient


class TestResults:
    """Thread-safe test results collector"""
    def __init__(self):
        self.lock = threading.Lock()
        self.claim_results = {}  # agent_id -> claim_returned
        self.verification_results = {}  # agent_id -> actual_owner_after_claim
        self.timing_data = {}  # agent_id -> (start_time, end_time)

    def record_claim(self, agent_id, claim_returned, actual_owner, start_time, end_time):
        with self.lock:
            self.claim_results[agent_id] = claim_returned
            self.verification_results[agent_id] = actual_owner
            self.timing_data[agent_id] = (start_time, end_time)


def claim_task_thread(agent_id, task_id, results, start_barrier):
    """Thread function that attempts to claim a task"""
    # Create agent client
    client = FirebaseMCPClient(agent_id=agent_id)
    client.is_connected = True  # Bypass connection check for test

    # Wait for all threads to be ready
    start_barrier.wait()

    # Record start time
    start_time = time.time()

    # Attempt to claim the task
    claim_returned = client.task_claim(task_id)

    # Record end time
    end_time = time.time()

    # Verify who actually owns the task
    task = client._firebase_request("GET", f"/tasks/{task_id}")
    actual_owner = task.get("claimed_by") if task else None

    # Record results
    results.record_claim(agent_id, claim_returned, actual_owner, start_time, end_time)

    # Disconnect
    client.disconnect()


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")


def test_race_condition_fix():
    """Main test function"""
    print_section("BUG-001 RACE CONDITION FIX - COMPREHENSIVE TEST")

    print("📋 Test Configuration:")
    print(f"   • Number of competing agents: 5")
    print(f"   • Test scenario: All agents claim same task simultaneously")
    print(f"   • Expected: Only 1 agent succeeds, others get False")
    print(f"   • Firebase: https://home-claude-network-default-rtdb.firebaseio.com/")

    # Create a test task
    print_section("STEP 1: Creating Test Task")

    creator = FirebaseMCPClient(agent_id="race-test-creator")
    creator.connect()

    task_id = creator.task_create(
        "Race Condition Test Task",
        "This task will be claimed by 5 competing agents simultaneously",
        {"test": "race-condition-fix", "created_at": datetime.now().isoformat()}
    )

    print(f"✅ Created task: {task_id}")

    # Verify task exists and is available
    task = creator._firebase_request("GET", f"/tasks/{task_id}")
    print(f"   Task status: {task.get('status')}")
    print(f"   Task lock_version: {task.get('lock_version')}")

    # Create competing agents
    print_section("STEP 2: Setting Up Competing Agents")

    agent_ids = [f"race-agent-{i}" for i in range(5)]
    print(f"   Agents: {', '.join(agent_ids)}")

    # Create results collector and synchronization barrier
    results = TestResults()
    start_barrier = threading.Barrier(5)  # All 5 threads wait until ready

    # Launch threads
    print_section("STEP 3: Launching Simultaneous Claim Attempts")

    threads = []
    for agent_id in agent_ids:
        thread = threading.Thread(
            target=claim_task_thread,
            args=(agent_id, task_id, results, start_barrier)
        )
        thread.start()
        threads.append(thread)

    print("   🚀 All agents attempting to claim task...")

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

    print("   ✅ All claim attempts completed")

    # Analyze results
    print_section("STEP 4: Analyzing Results")

    # Count successes
    successful_claims = sum(1 for r in results.claim_results.values() if r is True)
    failed_claims = sum(1 for r in results.claim_results.values() if r is False)

    print(f"📊 Claim Results:")
    print(f"   • Agents that received TRUE: {successful_claims}")
    print(f"   • Agents that received FALSE: {failed_claims}")
    print(f"   • Total agents: {len(agent_ids)}")

    # Check for false positives (agents that got True but don't own the task)
    print(f"\n🔍 False Positive Check:")

    false_positives = []
    actual_owner = None

    for agent_id in agent_ids:
        claim_returned = results.claim_results[agent_id]
        actual_owner_after = results.verification_results[agent_id]

        if actual_owner is None:
            actual_owner = actual_owner_after

        is_false_positive = claim_returned and (actual_owner_after != agent_id)

        status = "✅" if not is_false_positive else "❌ FALSE POSITIVE"
        print(f"   {agent_id}:")
        print(f"      claim_returned={claim_returned}, actual_owner={actual_owner_after}")
        print(f"      {status}")

        if is_false_positive:
            false_positives.append(agent_id)

    print(f"\n   Actual task owner: {actual_owner}")
    print(f"   False positives detected: {len(false_positives)}")

    # Timing analysis
    print(f"\n⏱️  Timing Analysis:")

    for agent_id in agent_ids:
        start_time, end_time = results.timing_data[agent_id]
        duration = end_time - start_time
        claim_result = results.claim_results[agent_id]

        symbol = "✅" if claim_result else "❌"
        print(f"   {agent_id}: {duration:.3f}s {symbol}")

    # Final verification
    print_section("STEP 5: Final Verification")

    final_task = creator._firebase_request("GET", f"/tasks/{task_id}")
    print(f"📋 Final Task State:")
    print(f"   • Status: {final_task.get('status')}")
    print(f"   • Claimed by: {final_task.get('claimed_by')}")
    print(f"   • Lock version: {final_task.get('lock_version')}")
    print(f"   • Claimed at: {final_task.get('claimed_at')}")

    # Test verdict
    print_section("TEST VERDICT")

    # Check all conditions
    condition_1 = (successful_claims == 1)
    condition_2 = (failed_claims == 4)
    condition_3 = (len(false_positives) == 0)
    condition_4 = (final_task.get("status") == "claimed")
    condition_5 = (final_task.get("claimed_by") == actual_owner)

    print(f"✓ Condition 1: Exactly 1 agent received TRUE: {condition_1}")
    print(f"✓ Condition 2: Exactly 4 agents received FALSE: {condition_2}")
    print(f"✓ Condition 3: Zero false positives: {condition_3}")
    print(f"✓ Condition 4: Task status is 'claimed': {condition_4}")
    print(f"✓ Condition 5: Task owner matches actual owner: {condition_5}")

    all_passed = all([condition_1, condition_2, condition_3, condition_4, condition_5])

    if all_passed:
        print(f"\n🎉 TEST PASSED! Race condition is FIXED!")
        print(f"   The optimistic locking mechanism successfully prevented concurrent claims.")
        test_result = "PASS"
    else:
        print(f"\n❌ TEST FAILED! Race condition still exists or new issues detected.")
        print(f"   The fix did not work as expected.")
        test_result = "FAIL"

    # Cleanup
    print_section("CLEANUP")

    print("🧹 Cleaning up test data...")

    # Delete test task
    creator._firebase_request("DELETE", f"/tasks/{task_id}")
    print(f"   ✓ Deleted task: {task_id}")

    # Delete test agents
    for agent_id in agent_ids:
        creator._firebase_request("DELETE", f"/agents/{agent_id}")
    print(f"   ✓ Deleted {len(agent_ids)} test agents")

    creator.disconnect()
    print(f"   ✓ Disconnected test creator")

    print("\n✅ Cleanup complete")

    # Return result
    print_section("END OF TEST")
    print(f"Result: {test_result}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    return test_result == "PASS"


def run_multiple_iterations(num_iterations=3):
    """Run the test multiple times to ensure consistency"""
    print_section("RUNNING MULTIPLE TEST ITERATIONS")
    print(f"Testing {num_iterations} times to ensure fix is reliable...\n")

    results = []
    for i in range(num_iterations):
        print(f"\n{'#'*70}")
        print(f"# ITERATION {i+1}/{num_iterations}")
        print(f"{'#'*70}")

        passed = test_race_condition_fix()
        results.append(passed)

        if i < num_iterations - 1:
            print("\n⏸️  Waiting 2 seconds before next iteration...")
            time.sleep(2)

    # Summary
    print_section("MULTI-ITERATION TEST SUMMARY")

    total = len(results)
    passed = sum(results)
    failed = total - passed
    pass_rate = (passed / total) * 100

    print(f"📊 Results:")
    print(f"   • Total iterations: {total}")
    print(f"   • Passed: {passed}")
    print(f"   • Failed: {failed}")
    print(f"   • Pass rate: {pass_rate:.1f}%")

    if pass_rate == 100:
        print(f"\n🎉 EXCELLENT! All iterations passed!")
        print(f"   The race condition fix is reliable and working correctly.")
        return True
    elif pass_rate >= 80:
        print(f"\n⚠️  WARNING: Some iterations failed!")
        print(f"   The fix may have intermittent issues.")
        return False
    else:
        print(f"\n❌ FAILURE: Most iterations failed!")
        print(f"   The race condition fix is not working.")
        return False


if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║         BUG-001 RACE CONDITION FIX - VERIFICATION TEST             ║
║                                                                    ║
║  Tests that optimistic locking prevents concurrent task claims    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
    """)

    # Run single test first
    print("Running single test iteration first...")
    single_result = test_race_condition_fix()

    if single_result:
        print("\n\n✅ Single test passed! Running 3 iterations to ensure reliability...\n")
        time.sleep(2)
        final_result = run_multiple_iterations(3)
    else:
        print("\n❌ Single test failed. Skipping multi-iteration test.")
        final_result = False

    # Exit with appropriate code
    sys.exit(0 if final_result else 1)
