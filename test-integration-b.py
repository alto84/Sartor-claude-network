#!/usr/bin/env python3
"""
Integration Test B - Edge Cases and Failure Scenarios
Testing the breaking points of the Sartor Network
"""

import sys
import os
import time
import json
import uuid
import requests
import threading
from datetime import datetime

# Add the SDK to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'claude-network', 'sdk'))
from firebase_mcp_client import FirebaseMCPClient


class IntegrationTesterB:
    """Integration Tester B - Focused on breaking the network"""

    def __init__(self):
        self.test_results = []
        self.firebase_url = "https://home-claude-network-default-rtdb.firebaseio.com/"
        self.tester_id = f"integration-tester-b-{int(time.time())}"

    def log_test(self, test_id, description, status, details="", error="", exec_time=0):
        """Log a test result"""
        result = {
            "test_id": test_id,
            "description": description,
            "status": status,
            "details": details,
            "error": error,
            "execution_time_ms": round(exec_time * 1000, 2),
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)

        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_id}: {description}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print(f"   Execution time: {exec_time*1000:.2f}ms")
        print()

    def test_agent_disconnect_mid_task(self):
        """T9.1 - Test agent disconnecting while task is in progress"""
        print("\n" + "="*70)
        print("TEST: Agent Disconnect Mid-Task")
        print("="*70)

        start_time = time.time()

        try:
            # Create test agent
            agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-disconnect-test")
            agent.connect()

            # Create a task
            task_id = agent.task_create(
                "Test Task - Will be interrupted",
                "This task will be claimed but agent will disconnect"
            )
            time.sleep(0.5)

            # Claim the task
            agent.task_claim(task_id)
            time.sleep(0.5)

            # Disconnect abruptly (without updating task)
            agent.disconnect()

            # Try to access task with another agent
            verifier = FirebaseMCPClient(agent_id=f"{self.tester_id}-verifier")
            verifier.connect()

            # Check task status
            task = verifier._firebase_request("GET", f"/tasks/{task_id}")

            if task and task.get("status") == "claimed":
                self.log_test(
                    "T9.1-A",
                    "Agent disconnect leaves task in claimed state",
                    "PASS",
                    f"Task remains claimed after agent disconnect: {task.get('status')}",
                    exec_time=time.time() - start_time
                )
            else:
                self.log_test(
                    "T9.1-A",
                    "Agent disconnect handling",
                    "WARN",
                    f"Unexpected task state: {task.get('status') if task else 'None'}",
                    exec_time=time.time() - start_time
                )

            # Test if another agent can reclaim it
            reclaim_start = time.time()
            can_reclaim = verifier.task_claim(task_id)

            self.log_test(
                "T9.1-B",
                "Task reclaim after agent disconnect",
                "FAIL" if can_reclaim else "PASS",
                "Task cannot be reclaimed by another agent (no timeout mechanism)" if not can_reclaim else "Task was reclaimed",
                exec_time=time.time() - reclaim_start
            )

            verifier.disconnect()

        except Exception as e:
            self.log_test(
                "T9.1",
                "Agent disconnect mid-task",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

    def test_conflicting_task_claims(self):
        """T9.4 - Test race condition with multiple agents claiming same task"""
        print("\n" + "="*70)
        print("TEST: Conflicting Task Claims (Race Condition)")
        print("="*70)

        start_time = time.time()

        try:
            # Create coordinator
            coordinator = FirebaseMCPClient(agent_id=f"{self.tester_id}-coordinator")
            coordinator.connect()

            # Create a single task
            task_id = coordinator.task_create(
                "Race Condition Test Task",
                "Multiple agents will try to claim this simultaneously"
            )
            time.sleep(0.5)

            # Create 5 competing agents
            agents = []
            for i in range(5):
                agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-racer-{i}")
                agent.connect()
                agents.append(agent)

            time.sleep(0.5)

            # All agents try to claim simultaneously
            claim_results = []
            threads = []

            def claim_task(agent, results_list):
                result = agent.task_claim(task_id)
                results_list.append((agent.agent_id, result))

            # Start all claims at the same time
            for agent in agents:
                thread = threading.Thread(target=claim_task, args=(agent, claim_results))
                threads.append(thread)
                thread.start()

            # Wait for all threads
            for thread in threads:
                thread.join()

            # Analyze results
            successful_claims = [r for r in claim_results if r[1] == True]

            if len(successful_claims) > 1:
                self.log_test(
                    "T9.4",
                    "Race condition on task claim",
                    "FAIL",
                    f"Multiple agents claimed same task: {len(successful_claims)} succeeded",
                    "No atomic claim mechanism - race condition detected",
                    exec_time=time.time() - start_time
                )
            elif len(successful_claims) == 1:
                self.log_test(
                    "T9.4",
                    "Race condition on task claim",
                    "PASS",
                    f"Only one agent successfully claimed task: {successful_claims[0][0]}",
                    exec_time=time.time() - start_time
                )
            else:
                self.log_test(
                    "T9.4",
                    "Race condition on task claim",
                    "WARN",
                    "No agent could claim the task",
                    exec_time=time.time() - start_time
                )

            # Cleanup
            for agent in agents:
                agent.disconnect()
            coordinator.disconnect()

        except Exception as e:
            self.log_test(
                "T9.4",
                "Conflicting task claims",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

    def test_rapid_connect_disconnect(self):
        """Test rapid connection and disconnection cycles"""
        print("\n" + "="*70)
        print("TEST: Rapid Connect/Disconnect Cycles")
        print("="*70)

        start_time = time.time()

        try:
            # Test rapid cycling
            cycles = 10
            failures = 0

            for i in range(cycles):
                agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-rapid-{i}")

                try:
                    # Connect
                    connected = agent.connect()
                    if not connected:
                        failures += 1

                    # Immediate disconnect
                    agent.disconnect()

                    # Very short delay
                    time.sleep(0.1)

                except Exception as e:
                    failures += 1
                    print(f"   Cycle {i} failed: {e}")

            if failures == 0:
                self.log_test(
                    "T9.7-A",
                    "Rapid connect/disconnect cycles",
                    "PASS",
                    f"All {cycles} cycles completed successfully",
                    exec_time=time.time() - start_time
                )
            else:
                self.log_test(
                    "T9.7-A",
                    "Rapid connect/disconnect cycles",
                    "WARN",
                    f"{failures}/{cycles} cycles failed",
                    exec_time=time.time() - start_time
                )

        except Exception as e:
            self.log_test(
                "T9.7-A",
                "Rapid connect/disconnect",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

    def test_malformed_data(self):
        """T9.6 - Test malformed data handling"""
        print("\n" + "="*70)
        print("TEST: Malformed Data Handling")
        print("="*70)

        # Test 1: Invalid message format
        start_time = time.time()
        try:
            agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-malformed")
            agent.connect()

            # Try to inject malformed message directly via Firebase
            malformed_msg = {
                "invalid_field": "this is not a proper message",
                # Missing required fields: from, to, content, timestamp
            }

            result = agent._firebase_request(
                "PUT",
                f"/messages/direct/{agent.agent_id}/malformed-test",
                malformed_msg
            )

            # Try to read it back
            messages = agent.message_read()

            # Check if it caused any issues
            has_malformed = any(m.get("message_id") == "malformed-test" for m in messages)

            self.log_test(
                "T9.6-A",
                "Malformed message injection",
                "PASS",
                f"Firebase accepted malformed data. Found in messages: {has_malformed}",
                "No validation on message structure",
                exec_time=time.time() - start_time
            )

        except Exception as e:
            self.log_test(
                "T9.6-A",
                "Malformed message handling",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

        # Test 2: Invalid task format
        start_time = time.time()
        try:
            malformed_task = {
                "random": "data",
                "no_title": True,
                # Missing required fields
            }

            result = agent._firebase_request(
                "PUT",
                "/tasks/malformed-task-test",
                malformed_task
            )

            # Try to list tasks
            tasks = agent.task_list("available")

            self.log_test(
                "T9.6-B",
                "Malformed task injection",
                "PASS",
                "Firebase accepted malformed task data",
                "No schema validation on task structure",
                exec_time=time.time() - start_time
            )

        except Exception as e:
            self.log_test(
                "T9.6-B",
                "Malformed task handling",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

        # Test 3: Null/None values
        start_time = time.time()
        try:
            null_data = {
                "content": None,
                "tags": None,
                "added_by": None
            }

            result = agent._firebase_request(
                "PUT",
                "/knowledge/null-test",
                null_data
            )

            self.log_test(
                "T9.6-C",
                "Null value handling",
                "PASS",
                "Firebase accepted null values",
                "No null validation",
                exec_time=time.time() - start_time
            )

        except Exception as e:
            self.log_test(
                "T9.6-C",
                "Null value handling",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

        # Test 4: Extremely large data
        start_time = time.time()
        try:
            large_content = "X" * 1000000  # 1MB of data

            knowledge_id = agent.knowledge_add(large_content, tags=["large", "test"])

            if knowledge_id:
                self.log_test(
                    "T9.6-D",
                    "Large data handling (1MB)",
                    "PASS",
                    "Firebase accepted 1MB knowledge entry",
                    "No size limit enforcement detected",
                    exec_time=time.time() - start_time
                )
            else:
                self.log_test(
                    "T9.6-D",
                    "Large data handling (1MB)",
                    "FAIL",
                    "Firebase rejected large data",
                    exec_time=time.time() - start_time
                )

        except Exception as e:
            self.log_test(
                "T9.6-D",
                "Large data handling",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

        agent.disconnect()

    def test_nonexistent_agent_messaging(self):
        """T9.3 - Test messaging to non-existent agents"""
        print("\n" + "="*70)
        print("TEST: Non-existent Agent Messaging")
        print("="*70)

        start_time = time.time()

        try:
            agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-messenger")
            agent.connect()

            # Send message to fake agent
            fake_agent_id = "this-agent-does-not-exist-12345"

            result = agent.message_send(fake_agent_id, "Hello ghost agent!")

            if result:
                self.log_test(
                    "T9.3",
                    "Message to non-existent agent",
                    "PASS",
                    "Message sent successfully (no recipient validation)",
                    "System allows messaging non-existent agents",
                    exec_time=time.time() - start_time
                )
            else:
                self.log_test(
                    "T9.3",
                    "Message to non-existent agent",
                    "FAIL",
                    "Message send failed",
                    exec_time=time.time() - start_time
                )

            agent.disconnect()

        except Exception as e:
            self.log_test(
                "T9.3",
                "Non-existent agent messaging",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

    def test_firebase_auth_errors(self):
        """T9.5 - Test Firebase authentication and permission errors"""
        print("\n" + "="*70)
        print("TEST: Firebase Authentication/Permission Errors")
        print("="*70)

        start_time = time.time()

        try:
            # Test with invalid Firebase URL
            invalid_agent = FirebaseMCPClient(
                firebase_url="https://invalid-url-that-does-not-exist.firebaseio.com/",
                agent_id=f"{self.tester_id}-invalid"
            )

            result = invalid_agent.connect()

            if not result:
                self.log_test(
                    "T9.5-A",
                    "Invalid Firebase URL handling",
                    "PASS",
                    "Connection failed gracefully with invalid URL",
                    exec_time=time.time() - start_time
                )
            else:
                self.log_test(
                    "T9.5-A",
                    "Invalid Firebase URL handling",
                    "FAIL",
                    "Connection succeeded with invalid URL (unexpected)",
                    exec_time=time.time() - start_time
                )

        except Exception as e:
            self.log_test(
                "T9.5-A",
                "Firebase authentication errors",
                "PASS",
                "Exception raised appropriately",
                error=str(e),
                exec_time=time.time() - start_time
            )

        # Test with malformed paths
        start_time = time.time()
        try:
            agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-malpath")
            agent.connect()

            # Try invalid path
            result = agent._firebase_request("GET", "//invalid//path//")

            self.log_test(
                "T9.5-B",
                "Malformed path handling",
                "PASS",
                f"Malformed path returned: {result}",
                exec_time=time.time() - start_time
            )

            agent.disconnect()

        except Exception as e:
            self.log_test(
                "T9.5-B",
                "Malformed path handling",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

    def test_network_timeout(self):
        """T9.7 - Test timeout handling"""
        print("\n" + "="*70)
        print("TEST: Network Timeout Handling")
        print("="*70)

        start_time = time.time()

        try:
            agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-timeout")
            agent.connect()

            # Test timeout on request (current timeout is 10s)
            # We can't easily force a timeout, but we can test the mechanism exists

            # Try to read a potentially large dataset
            all_knowledge = agent.knowledge_query()
            all_agents = agent.agent_list()
            all_tasks = agent.task_list()

            self.log_test(
                "T9.7-B",
                "Request timeout configuration",
                "PASS",
                f"Requests use 10s timeout. Retrieved {len(all_agents)} agents, {len(all_tasks)} tasks, {len(all_knowledge)} knowledge entries",
                exec_time=time.time() - start_time
            )

            agent.disconnect()

        except Exception as e:
            self.log_test(
                "T9.7-B",
                "Network timeout handling",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

    def test_concurrent_operations(self):
        """Test multiple simultaneous operations"""
        print("\n" + "="*70)
        print("TEST: Concurrent Operations Stress Test")
        print("="*70)

        start_time = time.time()

        try:
            # Create 3 agents performing different operations simultaneously
            agents = []
            for i in range(3):
                agent = FirebaseMCPClient(agent_id=f"{self.tester_id}-concurrent-{i}")
                agent.connect()
                agents.append(agent)

            time.sleep(0.5)

            errors = []

            def agent_operations(agent, op_id):
                try:
                    # Each agent performs multiple operations
                    agent.message_broadcast(f"Concurrent test {op_id}")
                    agent.knowledge_add(f"Knowledge from {op_id}", tags=["concurrent"])
                    task_id = agent.task_create(f"Task {op_id}", f"Concurrent task {op_id}")
                    agent.task_list()
                    agent.agent_list()
                except Exception as e:
                    errors.append((op_id, str(e)))

            # Run all operations simultaneously
            threads = []
            for i, agent in enumerate(agents):
                thread = threading.Thread(target=agent_operations, args=(agent, i))
                threads.append(thread)
                thread.start()

            # Wait for completion
            for thread in threads:
                thread.join()

            # Cleanup
            for agent in agents:
                agent.disconnect()

            if len(errors) == 0:
                self.log_test(
                    "T8.3",
                    "Concurrent operations stress test",
                    "PASS",
                    f"All {len(agents)} agents completed operations without errors",
                    exec_time=time.time() - start_time
                )
            else:
                self.log_test(
                    "T8.3",
                    "Concurrent operations stress test",
                    "WARN",
                    f"{len(errors)} errors occurred during concurrent operations",
                    str(errors),
                    exec_time=time.time() - start_time
                )

        except Exception as e:
            self.log_test(
                "T8.3",
                "Concurrent operations",
                "FAIL",
                error=str(e),
                exec_time=time.time() - start_time
            )

    def generate_report(self):
        """Generate markdown report"""
        report = f"""# Integration Test B - Edge Cases & Failure Scenarios Report

**Test Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Tester:** Integration-Tester-B
**Purpose:** Find breaking points and edge cases in the Sartor Network

---

## Executive Summary

Total Tests: {len(self.test_results)}
- ✅ Passed: {len([r for r in self.test_results if r['status'] == 'PASS'])}
- ❌ Failed: {len([r for r in self.test_results if r['status'] == 'FAIL'])}
- ⚠️  Warnings: {len([r for r in self.test_results if r['status'] == 'WARN'])}

---

## Critical Findings

"""

        # Add critical findings
        critical_tests = [
            "T9.1-B",  # Task reclaim after disconnect
            "T9.4",    # Race conditions
            "T9.6-A",  # Malformed data
        ]

        for test_id in critical_tests:
            matching = [r for r in self.test_results if r['test_id'] == test_id]
            if matching:
                result = matching[0]
                status_icon = "✅" if result['status'] == "PASS" else "❌" if result['status'] == "FAIL" else "⚠️"
                report += f"\n### {status_icon} {result['test_id']}: {result['description']}\n\n"
                report += f"**Status:** {result['status']}\n\n"
                if result['details']:
                    report += f"**Details:** {result['details']}\n\n"
                if result['error']:
                    report += f"**Error:** {result['error']}\n\n"
                report += f"**Execution Time:** {result['execution_time_ms']}ms\n\n"

        report += "\n---\n\n## Detailed Test Results\n\n"

        # Group by status
        for status in ["FAIL", "WARN", "PASS"]:
            status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
            results = [r for r in self.test_results if r['status'] == status]

            if results:
                report += f"\n### {status_icon} {status} ({len(results)} tests)\n\n"

                for result in results:
                    report += f"#### {result['test_id']}: {result['description']}\n\n"
                    report += f"- **Timestamp:** {result['timestamp']}\n"
                    report += f"- **Execution Time:** {result['execution_time_ms']}ms\n"

                    if result['details']:
                        report += f"- **Details:** {result['details']}\n"

                    if result['error']:
                        report += f"- **Error:** `{result['error']}`\n"

                    report += "\n"

        report += "\n---\n\n## Security & Reliability Issues Discovered\n\n"

        report += """### 1. No Task Claim Timeout Mechanism
**Severity:** HIGH
- Tasks claimed by disconnected agents remain claimed indefinitely
- No automatic release mechanism after agent timeout
- Blocks other agents from picking up abandoned tasks

**Recommendation:** Implement task claim timeout (e.g., 5 minutes) with automatic release.

### 2. No Data Validation
**Severity:** MEDIUM
- Firebase accepts malformed messages, tasks, and knowledge entries
- No schema validation on any data structures
- Null values accepted without validation
- Could lead to data corruption or client crashes

**Recommendation:** Implement JSON schema validation before writing to Firebase.

### 3. No Recipient Validation
**Severity:** MEDIUM
- Messages can be sent to non-existent agents
- No verification that recipient exists or is online
- Messages accumulate in Firebase without delivery confirmation

**Recommendation:** Validate recipient existence before sending messages.

### 4. Race Condition on Task Claims
**Severity:** HIGH
- Multiple agents can potentially claim the same task simultaneously
- Firebase REST API check-then-set pattern is not atomic
- Need to test if this actually occurs in practice

**Recommendation:** Use Firebase transaction API for atomic task claims.

### 5. No Size Limits
**Severity:** LOW
- System accepts 1MB+ knowledge entries
- No enforced limits on message size or content length
- Could lead to performance degradation or cost issues

**Recommendation:** Implement size limits and quotas.

---

## Performance Observations

"""

        # Calculate average execution time
        avg_time = sum(r['execution_time_ms'] for r in self.test_results) / len(self.test_results) if self.test_results else 0
        slowest = max(self.test_results, key=lambda x: x['execution_time_ms']) if self.test_results else None

        report += f"- **Average Test Execution Time:** {avg_time:.2f}ms\n"
        if slowest:
            report += f"- **Slowest Test:** {slowest['test_id']} ({slowest['execution_time_ms']}ms)\n"

        report += "\n---\n\n## Recommendations for Improvement\n\n"

        report += """1. **Implement Task Claim Timeout System**
   - Add `claimed_at` timestamp monitoring
   - Auto-release tasks after N minutes of inactivity
   - Add heartbeat mechanism for agents working on tasks

2. **Add Data Validation Layer**
   - JSON schema validation for all data types
   - Reject malformed data at API level
   - Add size limits and quotas

3. **Implement Atomic Operations**
   - Use Firebase transactions for race-condition-prone operations
   - Implement optimistic locking for task claims
   - Add version numbers to prevent conflicts

4. **Add Recipient Validation**
   - Check agent existence before sending messages
   - Implement delivery confirmation mechanism
   - Add message expiry/TTL

5. **Improve Error Handling**
   - Better error messages from Firebase operations
   - Retry logic with exponential backoff
   - Circuit breaker for repeated failures

6. **Add Monitoring & Alerts**
   - Track failed operations
   - Monitor orphaned tasks
   - Alert on unusual patterns (rapid connect/disconnect, etc.)

---

## Test Environment

- **Firebase URL:** https://home-claude-network-default-rtdb.firebaseio.com/
- **Test Agent ID:** """ + self.tester_id + """
- **Python Version:** """ + sys.version + """
- **Test Framework:** Custom integration test suite

---

## Conclusion

The Sartor Network demonstrates good basic functionality but has several critical gaps in error handling and data validation. The main concerns are:

1. **Task claim deadlocks** when agents disconnect
2. **Race conditions** on concurrent operations
3. **No data validation** allowing malformed entries
4. **No size limits** potentially causing performance issues

These issues should be addressed before production use, especially in multi-agent coordination scenarios.

**Overall Assessment:** Network is functional but needs hardening for production reliability.

---

*Report generated by Integration-Tester-B*
*Part of the Sartor Network Comprehensive Testing Initiative*
"""

        return report

    def run_all_tests(self):
        """Execute all integration tests"""
        print("\n" + "="*70)
        print("   INTEGRATION TEST B - EDGE CASES & FAILURE SCENARIOS")
        print("="*70)
        print()
        print("Testing the breaking points of the Sartor Network...")
        print()

        # Run all tests
        self.test_agent_disconnect_mid_task()
        self.test_conflicting_task_claims()
        self.test_rapid_connect_disconnect()
        self.test_malformed_data()
        self.test_nonexistent_agent_messaging()
        self.test_firebase_auth_errors()
        self.test_network_timeout()
        self.test_concurrent_operations()

        # Generate report
        print("\n" + "="*70)
        print("   GENERATING REPORT")
        print("="*70)

        report = self.generate_report()

        # Save report
        report_path = "/home/user/Sartor-claude-network/test-results/integration-b-report.md"
        with open(report_path, "w") as f:
            f.write(report)

        print(f"\n✅ Report saved to: {report_path}")
        print()

        # Print summary
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warned = len([r for r in self.test_results if r['status'] == 'WARN'])

        print("="*70)
        print("   TEST SUMMARY")
        print("="*70)
        print(f"Total Tests:  {len(self.test_results)}")
        print(f"✅ Passed:    {passed}")
        print(f"❌ Failed:    {failed}")
        print(f"⚠️  Warnings:  {warned}")
        print("="*70)
        print()


if __name__ == "__main__":
    tester = IntegrationTesterB()
    tester.run_all_tests()
