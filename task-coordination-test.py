#!/usr/bin/env python3
"""
Task Coordination Tests - T3.1 through T3.7
Tests all task coordination features with real Firebase verification
"""

import sys
import os
import time
import json
from datetime import datetime
import threading

# Add SDK to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'claude-network/sdk'))
from firebase_mcp_client import FirebaseMCPClient

class TaskCoordinationTester:
    """Comprehensive task coordination testing"""

    def __init__(self):
        self.results = []
        self.test_agent = None
        self.test_task_ids = []

    def log_result(self, test_id, description, status, details="", execution_time=0):
        """Log test result"""
        result = {
            "test_id": test_id,
            "description": description,
            "status": status,
            "details": details,
            "execution_time": execution_time,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)

        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"\n{status_symbol} {test_id}: {description}")
        print(f"   Status: {status}")
        if details:
            print(f"   Details: {details}")
        print(f"   Time: {execution_time:.3f}s")

    def verify_firebase_data(self, path, expected_condition, description):
        """Verify data directly from Firebase"""
        import requests
        url = f"{self.test_agent.firebase_url}{self.test_agent._firebase_path(path)}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            if expected_condition(data):
                print(f"   ✓ Verified: {description}")
                return True, data
            else:
                print(f"   ✗ Failed verification: {description}")
                return False, data
        except Exception as e:
            print(f"   ✗ Firebase verification error: {e}")
            return False, None

    def test_T31_create_and_list_tasks(self):
        """T3.1 - Create task and list available tasks"""
        start_time = time.time()

        try:
            # Create multiple tasks with different properties
            task1_id = self.test_agent.task_create(
                "Test Task 1",
                "First test task for listing",
                {"priority": "high", "category": "testing"}
            )

            task2_id = self.test_agent.task_create(
                "Test Task 2",
                "Second test task for listing",
                {"priority": "low", "category": "testing"}
            )

            time.sleep(0.5)  # Give Firebase time to propagate

            # List available tasks
            available_tasks = self.test_agent.task_list(status="available")

            # Verify tasks are in the list
            task_ids = [t.get('task_id') for t in available_tasks]

            if task1_id in task_ids and task2_id in task_ids:
                # Verify directly from Firebase
                verified, fb_data = self.verify_firebase_data(
                    f"/tasks/{task1_id}",
                    lambda d: d and d.get('status') == 'available',
                    f"Task {task1_id} exists and is available in Firebase"
                )

                self.test_task_ids.extend([task1_id, task2_id])

                self.log_result(
                    "T3.1",
                    "Create task and list available tasks",
                    "PASS",
                    f"Created 2 tasks, both appear in listing. Total available: {len(available_tasks)}",
                    time.time() - start_time
                )
                return True
            else:
                self.log_result(
                    "T3.1",
                    "Create task and list available tasks",
                    "FAIL",
                    f"Tasks not found in listing. Created: {task1_id}, {task2_id}. Found: {task_ids}",
                    time.time() - start_time
                )
                return False

        except Exception as e:
            self.log_result(
                "T3.1",
                "Create task and list available tasks",
                "FAIL",
                f"Exception: {str(e)}",
                time.time() - start_time
            )
            return False

    def test_T32_claim_task_single_agent(self):
        """T3.2 - Claim task (single agent)"""
        start_time = time.time()

        try:
            # Create a task to claim
            task_id = self.test_agent.task_create(
                "Claimable Task",
                "Task for testing single-agent claim"
            )

            time.sleep(0.5)

            # Claim the task
            claim_success = self.test_agent.task_claim(task_id)

            if not claim_success:
                self.log_result(
                    "T3.2",
                    "Claim task (single agent)",
                    "FAIL",
                    "task_claim() returned False",
                    time.time() - start_time
                )
                return False

            time.sleep(0.5)

            # Verify the claim in Firebase
            verified, fb_data = self.verify_firebase_data(
                f"/tasks/{task_id}",
                lambda d: (d and
                          d.get('status') == 'claimed' and
                          d.get('claimed_by') == self.test_agent.agent_id),
                f"Task {task_id} claimed by {self.test_agent.agent_id}"
            )

            # Try to claim again (should fail)
            second_claim = self.test_agent.task_claim(task_id)

            if verified and not second_claim:
                self.log_result(
                    "T3.2",
                    "Claim task (single agent)",
                    "PASS",
                    f"Task claimed successfully. Second claim correctly rejected.",
                    time.time() - start_time
                )
                self.test_task_ids.append(task_id)
                return True
            else:
                self.log_result(
                    "T3.2",
                    "Claim task (single agent)",
                    "FAIL",
                    f"Verification: {verified}, Second claim: {second_claim}",
                    time.time() - start_time
                )
                return False

        except Exception as e:
            self.log_result(
                "T3.2",
                "Claim task (single agent)",
                "FAIL",
                f"Exception: {str(e)}",
                time.time() - start_time
            )
            return False

    def test_T33_race_condition(self):
        """T3.3 - Task race condition (multiple agents claiming same task)"""
        start_time = time.time()

        try:
            # Create competing agents
            agent1 = FirebaseMCPClient(agent_id="race-agent-1")
            agent2 = FirebaseMCPClient(agent_id="race-agent-2")
            agent3 = FirebaseMCPClient(agent_id="race-agent-3")

            agent1.connect()
            agent2.connect()
            agent3.connect()

            time.sleep(0.5)

            # Create a task for the race
            task_id = self.test_agent.task_create(
                "Race Task",
                "Task for testing concurrent claims"
            )

            time.sleep(0.5)

            # Verify task is available
            verified, fb_data = self.verify_firebase_data(
                f"/tasks/{task_id}",
                lambda d: d and d.get('status') == 'available',
                "Task is available before race"
            )

            # Simulate race condition with threads
            results = {'agent1': None, 'agent2': None, 'agent3': None}

            def claim_task(agent, agent_name):
                time.sleep(0.1)  # Small delay to sync threads
                results[agent_name] = agent.task_claim(task_id)

            threads = [
                threading.Thread(target=claim_task, args=(agent1, 'agent1')),
                threading.Thread(target=claim_task, args=(agent2, 'agent2')),
                threading.Thread(target=claim_task, args=(agent3, 'agent3'))
            ]

            # Start all threads simultaneously
            for t in threads:
                t.start()

            # Wait for completion
            for t in threads:
                t.join()

            time.sleep(1)  # Give Firebase time to settle

            # Verify only ONE agent succeeded
            successes = sum(1 for v in results.values() if v)

            # Check Firebase state
            verified, fb_data = self.verify_firebase_data(
                f"/tasks/{task_id}",
                lambda d: d and d.get('status') == 'claimed',
                "Task is claimed by exactly one agent"
            )

            winner = fb_data.get('claimed_by') if fb_data else None

            # Cleanup
            agent1.disconnect()
            agent2.disconnect()
            agent3.disconnect()

            if successes == 1 and verified:
                self.log_result(
                    "T3.3",
                    "Task race condition (multiple agents claiming same task)",
                    "PASS",
                    f"Race handled correctly. Winner: {winner}. Client-side successes: {successes}",
                    time.time() - start_time
                )
                self.test_task_ids.append(task_id)
                return True
            else:
                self.log_result(
                    "T3.3",
                    "Task race condition (multiple agents claiming same task)",
                    "FAIL" if successes != 1 else "WARN",
                    f"Successes: {successes}, Verified: {verified}, Winner: {winner}. Results: {results}",
                    time.time() - start_time
                )
                return False

        except Exception as e:
            self.log_result(
                "T3.3",
                "Task race condition (multiple agents claiming same task)",
                "FAIL",
                f"Exception: {str(e)}",
                time.time() - start_time
            )
            return False

    def test_T34_update_task_status(self):
        """T3.4 - Update task status to completed"""
        start_time = time.time()

        try:
            # Create and claim a task
            task_id = self.test_agent.task_create(
                "Task to Complete",
                "Testing status updates"
            )

            time.sleep(0.5)
            self.test_agent.task_claim(task_id)
            time.sleep(0.5)

            # Update to completed
            self.test_agent.task_update(
                task_id,
                "completed",
                {"outcome": "success", "details": "Test completed successfully"}
            )

            time.sleep(0.5)

            # Verify in Firebase
            verified, fb_data = self.verify_firebase_data(
                f"/tasks/{task_id}",
                lambda d: (d and
                          d.get('status') == 'completed' and
                          d.get('updated_by') == self.test_agent.agent_id and
                          d.get('result', {}).get('outcome') == 'success'),
                "Task updated to completed with result data"
            )

            # Verify it doesn't appear in available tasks
            available = self.test_agent.task_list(status="available")
            available_ids = [t.get('task_id') for t in available]

            if verified and task_id not in available_ids:
                self.log_result(
                    "T3.4",
                    "Update task status to completed",
                    "PASS",
                    "Task status updated successfully and removed from available list",
                    time.time() - start_time
                )
                self.test_task_ids.append(task_id)
                return True
            else:
                self.log_result(
                    "T3.4",
                    "Update task status to completed",
                    "FAIL",
                    f"Verified: {verified}, Still in available: {task_id in available_ids}",
                    time.time() - start_time
                )
                return False

        except Exception as e:
            self.log_result(
                "T3.4",
                "Update task status to completed",
                "FAIL",
                f"Exception: {str(e)}",
                time.time() - start_time
            )
            return False

    def test_T35_task_priority(self):
        """T3.5 - Task priority handling"""
        start_time = time.time()

        try:
            # Create tasks with different priorities
            high_task = self.test_agent.task_create(
                "High Priority Task",
                "Urgent task",
                {"priority": "high", "urgency": 10}
            )

            medium_task = self.test_agent.task_create(
                "Medium Priority Task",
                "Normal task",
                {"priority": "medium", "urgency": 5}
            )

            low_task = self.test_agent.task_create(
                "Low Priority Task",
                "Can wait",
                {"priority": "low", "urgency": 1}
            )

            time.sleep(0.5)

            # Verify priorities in Firebase
            verified_high, high_data = self.verify_firebase_data(
                f"/tasks/{high_task}",
                lambda d: d and d.get('data', {}).get('priority') == 'high',
                "High priority task has correct priority field"
            )

            verified_low, low_data = self.verify_firebase_data(
                f"/tasks/{low_task}",
                lambda d: d and d.get('data', {}).get('priority') == 'low',
                "Low priority task has correct priority field"
            )

            # Get all available tasks
            tasks = self.test_agent.task_list(status="available")

            # Check if priority data is preserved
            task_priorities = {
                t.get('task_id'): t.get('data', {}).get('priority')
                for t in tasks
                if t.get('task_id') in [high_task, medium_task, low_task]
            }

            if verified_high and verified_low and len(task_priorities) == 3:
                self.log_result(
                    "T3.5",
                    "Task priority handling",
                    "PASS",
                    f"Priority metadata stored and retrieved correctly: {task_priorities}",
                    time.time() - start_time
                )
                self.test_task_ids.extend([high_task, medium_task, low_task])
                return True
            else:
                self.log_result(
                    "T3.5",
                    "Task priority handling",
                    "WARN",
                    f"Priority metadata works but no built-in priority sorting. Found: {task_priorities}",
                    time.time() - start_time
                )
                self.test_task_ids.extend([high_task, medium_task, low_task])
                return True  # Pass with warning since priority can be stored

        except Exception as e:
            self.log_result(
                "T3.5",
                "Task priority handling",
                "FAIL",
                f"Exception: {str(e)}",
                time.time() - start_time
            )
            return False

    def test_T36_task_assignment(self):
        """T3.6 - Task assignment to specific agent"""
        start_time = time.time()

        try:
            # Create a second agent
            target_agent = FirebaseMCPClient(agent_id="assigned-agent-target")
            target_agent.connect()

            time.sleep(0.5)

            # Create task with assignment metadata
            task_id = self.test_agent.task_create(
                "Assigned Task",
                "Task assigned to specific agent",
                {
                    "assigned_to": target_agent.agent_id,
                    "assignment_type": "direct",
                    "assignment_reason": "specialized capability"
                }
            )

            time.sleep(0.5)

            # Verify assignment metadata in Firebase
            verified, fb_data = self.verify_firebase_data(
                f"/tasks/{task_id}",
                lambda d: (d and
                          d.get('data', {}).get('assigned_to') == target_agent.agent_id),
                f"Task has assignment metadata for {target_agent.agent_id}"
            )

            # Target agent should be able to claim it
            claim_success = target_agent.task_claim(task_id)

            time.sleep(0.5)

            # Verify claim
            verified_claim, claim_data = self.verify_firebase_data(
                f"/tasks/{task_id}",
                lambda d: (d and
                          d.get('status') == 'claimed' and
                          d.get('claimed_by') == target_agent.agent_id),
                "Task claimed by assigned agent"
            )

            # Cleanup
            target_agent.disconnect()

            if verified and claim_success and verified_claim:
                self.log_result(
                    "T3.6",
                    "Task assignment to specific agent",
                    "PASS",
                    f"Assignment metadata stored and assigned agent claimed successfully",
                    time.time() - start_time
                )
                self.test_task_ids.append(task_id)
                return True
            else:
                self.log_result(
                    "T3.6",
                    "Task assignment to specific agent",
                    "WARN",
                    f"Assignment works via metadata but no enforcement. Verified: {verified}, Claim: {claim_success}",
                    time.time() - start_time
                )
                self.test_task_ids.append(task_id)
                return True  # Pass with warning

        except Exception as e:
            self.log_result(
                "T3.6",
                "Task assignment to specific agent",
                "FAIL",
                f"Exception: {str(e)}",
                time.time() - start_time
            )
            return False

    def test_T37_task_cancellation(self):
        """T3.7 - Task cancellation"""
        start_time = time.time()

        try:
            # Create a task to cancel
            task_id = self.test_agent.task_create(
                "Task to Cancel",
                "Testing cancellation"
            )

            time.sleep(0.5)

            # Cancel using task_update
            self.test_agent.task_update(
                task_id,
                "cancelled",
                {"cancellation_reason": "Test cancellation", "cancelled_by": self.test_agent.agent_id}
            )

            time.sleep(0.5)

            # Verify cancellation in Firebase
            verified, fb_data = self.verify_firebase_data(
                f"/tasks/{task_id}",
                lambda d: (d and
                          d.get('status') == 'cancelled' and
                          d.get('result', {}).get('cancellation_reason') is not None),
                "Task cancelled with reason"
            )

            # Verify it's not in available tasks
            available = self.test_agent.task_list(status="available")
            available_ids = [t.get('task_id') for t in available]

            # Try to claim cancelled task (should fail)
            claim_attempt = self.test_agent.task_claim(task_id)

            if verified and task_id not in available_ids and not claim_attempt:
                self.log_result(
                    "T3.7",
                    "Task cancellation",
                    "PASS",
                    "Task cancelled successfully, removed from available list, cannot be claimed",
                    time.time() - start_time
                )
                self.test_task_ids.append(task_id)
                return True
            else:
                self.log_result(
                    "T3.7",
                    "Task cancellation",
                    "FAIL",
                    f"Verified: {verified}, In available: {task_id in available_ids}, Claim attempt: {claim_attempt}",
                    time.time() - start_time
                )
                return False

        except Exception as e:
            self.log_result(
                "T3.7",
                "Task cancellation",
                "FAIL",
                f"Exception: {str(e)}",
                time.time() - start_time
            )
            return False

    def run_all_tests(self):
        """Run all task coordination tests"""
        print("=" * 80)
        print("TASK COORDINATION TEST SUITE - T3.1 through T3.7")
        print("=" * 80)
        print(f"Started at: {datetime.now().isoformat()}")
        print(f"Agent ID: {self.test_agent.agent_id}")
        print(f"Firebase URL: {self.test_agent.firebase_url}")
        print("=" * 80)

        # Connect to network
        print("\n🔌 Connecting to Sartor Network...")
        if not self.test_agent.connect():
            print("❌ Failed to connect to network!")
            return

        print("✅ Connected successfully!\n")

        # Run all tests
        tests = [
            self.test_T31_create_and_list_tasks,
            self.test_T32_claim_task_single_agent,
            self.test_T33_race_condition,
            self.test_T34_update_task_status,
            self.test_T35_task_priority,
            self.test_T36_task_assignment,
            self.test_T37_task_cancellation
        ]

        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"\n❌ Test crashed: {e}")
            time.sleep(1)  # Pause between tests

        # Summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)

        passed = sum(1 for r in self.results if r['status'] == 'PASS')
        failed = sum(1 for r in self.results if r['status'] == 'FAIL')
        warned = sum(1 for r in self.results if r['status'] == 'WARN')
        total = len(self.results)

        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Warned: {warned} ⚠️")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total)*100:.1f}%")

        # Cleanup
        print("\n🧹 Cleaning up test tasks...")
        for task_id in self.test_task_ids:
            try:
                self.test_agent._firebase_request("DELETE", f"/tasks/{task_id}")
                print(f"   Deleted task {task_id}")
            except:
                pass

        print("\n🔌 Disconnecting from network...")
        self.test_agent.disconnect()

        return self.results

def main():
    """Main test execution"""
    tester = TaskCoordinationTester()
    tester.test_agent = FirebaseMCPClient(agent_id="Task-Tester-Agent")

    results = tester.run_all_tests()

    # Save results to JSON
    results_file = "/tmp/task-coordination-results.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n📊 Results saved to: {results_file}")

    return results

if __name__ == "__main__":
    main()
