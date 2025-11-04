#!/usr/bin/env python3
"""
Deep investigation of race condition in task claiming
"""

import sys
import os
import time
import threading
import requests

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'claude-network/sdk'))
from firebase_mcp_client import FirebaseMCPClient

def test_race_condition_detailed():
    """Detailed race condition test with step-by-step analysis"""

    print("=" * 80)
    print("DEEP RACE CONDITION INVESTIGATION")
    print("=" * 80)

    # Create main agent
    main_agent = FirebaseMCPClient(agent_id="race-test-main")
    main_agent.connect()

    # Create task
    task_id = main_agent.task_create(
        "Race Test Task",
        "For investigating race conditions"
    )

    print(f"\n✓ Created task: {task_id}")
    time.sleep(0.5)

    # Create competing agents
    agents = [
        FirebaseMCPClient(agent_id=f"race-agent-{i}")
        for i in range(5)
    ]

    for agent in agents:
        agent.connect()

    time.sleep(0.5)

    print(f"\n✓ Created {len(agents)} competing agents")

    # Track detailed timing and results
    results = {}
    timings = {}

    def claim_with_tracking(agent, index):
        """Claim task and track exact timing"""
        agent_id = agent.agent_id

        # Synchronize start
        time.sleep(0.1)

        # Record start time
        start = time.time()

        # Read task state BEFORE claiming
        pre_claim_state = agent._firebase_request("GET", f"/tasks/{task_id}")

        # Attempt claim
        claim_result = agent.task_claim(task_id)

        # Read task state AFTER claiming
        post_claim_state = agent._firebase_request("GET", f"/tasks/{task_id}")

        end = time.time()

        results[agent_id] = {
            'claim_returned': claim_result,
            'pre_claim_status': pre_claim_state.get('status') if pre_claim_state else None,
            'pre_claim_owner': pre_claim_state.get('claimed_by') if pre_claim_state else None,
            'post_claim_status': post_claim_state.get('status') if post_claim_state else None,
            'post_claim_owner': post_claim_state.get('claimed_by') if post_claim_state else None,
            'duration': end - start
        }

        timings[agent_id] = {
            'start': start,
            'end': end
        }

    # Launch concurrent claims
    print("\n🏁 Starting race...")
    threads = [
        threading.Thread(target=claim_with_tracking, args=(agents[i], i))
        for i in range(len(agents))
    ]

    for t in threads:
        t.start()

    for t in threads:
        t.join()

    time.sleep(1)  # Let Firebase settle

    # Get final state
    final_state = main_agent._firebase_request("GET", f"/tasks/{task_id}")

    print("\n" + "=" * 80)
    print("RACE CONDITION RESULTS")
    print("=" * 80)

    # Analyze results
    claim_successes = [aid for aid, r in results.items() if r['claim_returned']]
    final_winner = final_state.get('claimed_by') if final_state else None

    print(f"\n📊 Summary:")
    print(f"   Agents that got TRUE from task_claim(): {len(claim_successes)}")
    print(f"   Final task owner in Firebase: {final_winner}")
    print(f"   Final task status: {final_state.get('status') if final_state else 'N/A'}")

    print(f"\n🔍 Detailed Analysis:")

    for agent_id in sorted(results.keys()):
        r = results[agent_id]
        print(f"\n   {agent_id}:")
        print(f"      claim_returned: {r['claim_returned']}")
        print(f"      pre_claim_status: {r['pre_claim_status']}")
        print(f"      post_claim_status: {r['post_claim_status']}")
        print(f"      post_claim_owner: {r['post_claim_owner']}")
        print(f"      duration: {r['duration']:.3f}s")

    # Identify the problem
    print("\n" + "=" * 80)
    print("PROBLEM IDENTIFICATION")
    print("=" * 80)

    if len(claim_successes) > 1:
        print("\n❌ CRITICAL BUG CONFIRMED:")
        print(f"   {len(claim_successes)} agents received TRUE from task_claim()")
        print(f"   But only 1 agent ({final_winner}) actually owns the task")
        print()
        print("   Root Cause: CHECK-THEN-ACT race condition")
        print("   The task_claim() method does:")
        print("      1. GET /tasks/{task_id}  (check if available)")
        print("      2. If available, PATCH /tasks/{task_id}  (claim it)")
        print()
        print("   Problem: Between steps 1 and 2, another agent can claim it!")
        print()
        print("   All agents saw 'available' status in step 1,")
        print("   so all proceeded to step 2 (PATCH),")
        print("   but Firebase only kept the last PATCH.")
        print()
        print("   Agents incorrectly reported success because:")
        print("   - PATCH returns non-null (Firebase accepts the update)")
        print("   - No verification that the claim was exclusive")

        # Show timing overlap
        print("\n   Timing Analysis:")
        times = sorted([(tid, timings[tid]['start'], timings[tid]['end'])
                       for tid in timings.keys()], key=lambda x: x[1])

        for tid, start, end in times:
            overlap_count = sum(1 for t2, s2, e2 in times
                              if t2 != tid and not (e2 < start or s2 > end))
            print(f"      {tid}: {overlap_count} overlapping operations")

    else:
        print("\n✅ No race condition detected (got lucky)")

    # Cleanup
    print("\n🧹 Cleaning up...")
    main_agent._firebase_request("DELETE", f"/tasks/{task_id}")
    for agent in agents:
        agent.disconnect()
    main_agent.disconnect()

    return len(claim_successes), final_winner

if __name__ == "__main__":
    test_race_condition_detailed()
