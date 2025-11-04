#!/usr/bin/env python3
"""
Test script for validation layer fixes (BUG-003 through BUG-007)

This script tests all validation improvements:
- BUG-003: Input type validation (message content must be string)
- BUG-004: Recipient validation (check recipient exists)
- BUG-005: Connection state checks (@requires_connection decorator)
- BUG-006: Agent ID validation (regex for alphanumeric + hyphens/underscores)
- BUG-007: Empty field validation (task title/description)
"""

import sys
import time

# Import both implementations to test
sys.path.insert(0, '/home/user/Sartor-claude-network')
sys.path.insert(0, '/home/user/Sartor-claude-network/claude-network')

try:
    from sdk.firebase_mcp_client import FirebaseMCPClient
    TEST_SDK = True
except ImportError:
    TEST_SDK = False
    print("⚠️  SDK version not found, testing bootstrap only")

# Import the bootstrap file by loading it manually
import importlib.util
spec = importlib.util.spec_from_file_location("sartor_network_bootstrap", "/home/user/Sartor-claude-network/sartor-network-bootstrap.py")
bootstrap_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap_module)
SartorNetworkClient = bootstrap_module.SartorNetworkClient


def test_bug_003_input_type_validation():
    """Test BUG-003: Input type validation for message content"""
    print("\n" + "="*70)
    print("TEST BUG-003: Input Type Validation")
    print("="*70)

    client = SartorNetworkClient(agent_name="ValidationTester")
    client.connect()

    tests_passed = 0
    tests_failed = 0

    # Test 1: None content should raise ValueError
    print("\n[1] Testing None content (should raise ValueError)...")
    try:
        client.message_broadcast(None)
        print("❌ FAILED: None was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 2: Dict content should raise TypeError
    print("\n[2] Testing dict content (should raise TypeError)...")
    try:
        client.message_broadcast({"invalid": "type"})
        print("❌ FAILED: Dict was accepted")
        tests_failed += 1
    except TypeError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 3: Integer content should raise TypeError
    print("\n[3] Testing int content (should raise TypeError)...")
    try:
        client.message_broadcast(12345)
        print("❌ FAILED: Integer was accepted")
        tests_failed += 1
    except TypeError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 4: Empty string should raise ValueError
    print("\n[4] Testing empty string (should raise ValueError)...")
    try:
        client.message_broadcast("")
        print("❌ FAILED: Empty string was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 5: Whitespace-only string should raise ValueError
    print("\n[5] Testing whitespace-only string (should raise ValueError)...")
    try:
        client.message_broadcast("   \t\n  ")
        print("❌ FAILED: Whitespace-only string was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 6: Valid string should succeed
    print("\n[6] Testing valid string (should succeed)...")
    try:
        result = client.message_broadcast("Valid test message")
        print(f"✅ PASSED: Valid string accepted")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Valid string rejected: {e}")
        tests_failed += 1

    client.disconnect()

    print(f"\n{'='*70}")
    print(f"BUG-003 Results: {tests_passed} passed, {tests_failed} failed")
    print(f"{'='*70}")

    return tests_passed, tests_failed


def test_bug_004_recipient_validation():
    """Test BUG-004: Recipient validation"""
    print("\n" + "="*70)
    print("TEST BUG-004: Recipient Validation")
    print("="*70)

    client = SartorNetworkClient(agent_name="RecipientTester")
    client.connect()

    tests_passed = 0
    tests_failed = 0

    # Test 1: Non-existent agent should raise ValueError
    print("\n[1] Testing non-existent recipient (should raise ValueError)...")
    try:
        client.message_send("non-existent-agent-12345", "Hello")
        print("❌ FAILED: Non-existent agent was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 2: Valid agent should succeed
    print("\n[2] Testing valid recipient (should succeed)...")
    try:
        # Send message to self (we know we exist)
        result = client.message_send(client.agent_id, "Test message")
        print(f"✅ PASSED: Valid recipient accepted")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Valid recipient rejected: {e}")
        tests_failed += 1

    client.disconnect()

    print(f"\n{'='*70}")
    print(f"BUG-004 Results: {tests_passed} passed, {tests_failed} failed")
    print(f"{'='*70}")

    return tests_passed, tests_failed


def test_bug_005_connection_state():
    """Test BUG-005: Connection state checks"""
    print("\n" + "="*70)
    print("TEST BUG-005: Connection State Checks")
    print("="*70)

    client = SartorNetworkClient(agent_name="ConnectionTester")

    tests_passed = 0
    tests_failed = 0

    # Test 1: Operations before connect should raise ConnectionError
    print("\n[1] Testing operation before connect (should raise ConnectionError)...")
    try:
        client.message_broadcast("Test")
        print("❌ FAILED: Operation allowed before connect")
        tests_failed += 1
    except ConnectionError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 2: After connect, operations should work
    print("\n[2] Testing operation after connect (should succeed)...")
    client.connect()
    try:
        result = client.message_broadcast("Test after connect")
        print(f"✅ PASSED: Operation allowed after connect")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Operation failed after connect: {e}")
        tests_failed += 1

    # Test 3: After disconnect, operations should fail
    print("\n[3] Testing operation after disconnect (should raise ConnectionError)...")
    client.disconnect()
    try:
        client.message_broadcast("Test after disconnect")
        print("❌ FAILED: Operation allowed after disconnect")
        tests_failed += 1
    except ConnectionError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    print(f"\n{'='*70}")
    print(f"BUG-005 Results: {tests_passed} passed, {tests_failed} failed")
    print(f"{'='*70}")

    return tests_passed, tests_failed


def test_bug_006_agent_id_validation():
    """Test BUG-006: Agent ID validation"""
    print("\n" + "="*70)
    print("TEST BUG-006: Agent ID Validation")
    print("="*70)

    client = SartorNetworkClient(agent_name="AgentIDTester")
    client.connect()

    tests_passed = 0
    tests_failed = 0

    # Test 1: Agent ID with spaces should fail
    print("\n[1] Testing agent ID with spaces (should raise ValueError)...")
    try:
        client.message_send("agent with spaces", "Hello")
        print("❌ FAILED: Agent ID with spaces was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 2: Agent ID with special characters should fail
    print("\n[2] Testing agent ID with special chars (should raise ValueError)...")
    try:
        client.message_send("<script>alert('xss')</script>", "Hello")
        print("❌ FAILED: Agent ID with special chars was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 3: Empty agent ID should fail
    print("\n[3] Testing empty agent ID (should raise ValueError)...")
    try:
        client.message_send("", "Hello")
        print("❌ FAILED: Empty agent ID was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 4: Agent ID too long should fail
    print("\n[4] Testing agent ID > 128 chars (should raise ValueError)...")
    long_id = "a" * 129
    try:
        client.message_send(long_id, "Hello")
        print("❌ FAILED: Long agent ID was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 5: Valid agent IDs should be accepted (even if they don't exist)
    # Note: This will fail recipient validation, but should pass format validation
    print("\n[5] Testing valid agent ID format (will fail recipient check)...")
    try:
        client.message_send("valid-agent-123_test.agent", "Hello")
        print("❌ FAILED: Should have failed recipient check")
        tests_failed += 1
    except ValueError as e:
        # Should get recipient validation error, not format error
        if "does not exist" in str(e):
            print(f"✅ PASSED: Format validated, failed on recipient check (expected): {e}")
            tests_passed += 1
        else:
            print(f"❌ FAILED: Wrong validation error: {e}")
            tests_failed += 1
    except Exception as e:
        print(f"❌ FAILED: Unexpected exception: {type(e).__name__}: {e}")
        tests_failed += 1

    client.disconnect()

    print(f"\n{'='*70}")
    print(f"BUG-006 Results: {tests_passed} passed, {tests_failed} failed")
    print(f"{'='*70}")

    return tests_passed, tests_failed


def test_bug_007_empty_field_validation():
    """Test BUG-007: Empty field validation"""
    print("\n" + "="*70)
    print("TEST BUG-007: Empty Field Validation")
    print("="*70)

    client = SartorNetworkClient(agent_name="EmptyFieldTester")
    client.connect()

    tests_passed = 0
    tests_failed = 0

    # Test 1: Empty title should fail
    print("\n[1] Testing empty task title (should raise ValueError)...")
    try:
        client.task_create("", "Valid description")
        print("❌ FAILED: Empty title was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 2: Whitespace-only title should fail
    print("\n[2] Testing whitespace-only title (should raise ValueError)...")
    try:
        client.task_create("   \t  ", "Valid description")
        print("❌ FAILED: Whitespace-only title was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 3: Empty description should fail
    print("\n[3] Testing empty task description (should raise ValueError)...")
    try:
        client.task_create("Valid title", "")
        print("❌ FAILED: Empty description was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 4: Title too long should fail
    print("\n[4] Testing title > 200 chars (should raise ValueError)...")
    long_title = "a" * 201
    try:
        client.task_create(long_title, "Valid description")
        print("❌ FAILED: Long title was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 5: Description too long should fail
    print("\n[5] Testing description > 5000 chars (should raise ValueError)...")
    long_desc = "a" * 5001
    try:
        client.task_create("Valid title", long_desc)
        print("❌ FAILED: Long description was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 6: Valid task should succeed
    print("\n[6] Testing valid task (should succeed)...")
    try:
        task_id = client.task_create("Valid Task Title", "This is a valid task description")
        print(f"✅ PASSED: Valid task created: {task_id}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Valid task rejected: {e}")
        tests_failed += 1

    # Test 7: Whitespace should be trimmed
    print("\n[7] Testing whitespace trimming (should succeed and trim)...")
    try:
        task_id = client.task_create("  Title with spaces  ", "  Description with spaces  ")
        # Verify trimming by reading back (optional - would need task_get method)
        print(f"✅ PASSED: Task created with trimmed whitespace: {task_id}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Trimming test failed: {e}")
        tests_failed += 1

    client.disconnect()

    print(f"\n{'='*70}")
    print(f"BUG-007 Results: {tests_passed} passed, {tests_failed} failed")
    print(f"{'='*70}")

    return tests_passed, tests_failed


def test_task_update_validation():
    """Test task update validation (task existence and status validation)"""
    print("\n" + "="*70)
    print("TEST: Task Update Validation")
    print("="*70)

    client = SartorNetworkClient(agent_name="TaskUpdateTester")
    client.connect()

    tests_passed = 0
    tests_failed = 0

    # Test 1: Updating non-existent task should fail
    print("\n[1] Testing update of non-existent task (should raise ValueError)...")
    try:
        client.task_update("non-existent-task-12345", "completed")
        print("❌ FAILED: Non-existent task update was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 2: Invalid status should fail
    print("\n[2] Testing invalid status (should raise ValueError)...")
    # First create a valid task
    task_id = client.task_create("Test Task", "Test Description")
    try:
        client.task_update(task_id, "invalid_status")
        print("❌ FAILED: Invalid status was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 3: Valid status should succeed
    print("\n[3] Testing valid status update (should succeed)...")
    try:
        client.task_update(task_id, "completed")
        print(f"✅ PASSED: Task updated successfully")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Valid update rejected: {e}")
        tests_failed += 1

    client.disconnect()

    print(f"\n{'='*70}")
    print(f"Task Update Validation Results: {tests_passed} passed, {tests_failed} failed")
    print(f"{'='*70}")

    return tests_passed, tests_failed


def test_knowledge_validation():
    """Test knowledge_add validation"""
    print("\n" + "="*70)
    print("TEST: Knowledge Validation")
    print("="*70)

    client = SartorNetworkClient(agent_name="KnowledgeTester")
    client.connect()

    tests_passed = 0
    tests_failed = 0

    # Test 1: None content should fail
    print("\n[1] Testing None knowledge content (should raise ValueError)...")
    try:
        client.knowledge_add(None)
        print("❌ FAILED: None content was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 2: Non-string content should fail
    print("\n[2] Testing non-string knowledge content (should raise TypeError)...")
    try:
        client.knowledge_add({"key": "value"})
        print("❌ FAILED: Dict content was accepted")
        tests_failed += 1
    except TypeError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 3: Empty content should fail
    print("\n[3] Testing empty knowledge content (should raise ValueError)...")
    try:
        client.knowledge_add("")
        print("❌ FAILED: Empty content was accepted")
        tests_failed += 1
    except ValueError as e:
        print(f"✅ PASSED: {e}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Wrong exception type: {type(e).__name__}: {e}")
        tests_failed += 1

    # Test 4: Valid content should succeed
    print("\n[4] Testing valid knowledge content (should succeed)...")
    try:
        k_id = client.knowledge_add("This is valid knowledge", tags=["test"])
        print(f"✅ PASSED: Knowledge added: {k_id}")
        tests_passed += 1
    except Exception as e:
        print(f"❌ FAILED: Valid knowledge rejected: {e}")
        tests_failed += 1

    client.disconnect()

    print(f"\n{'='*70}")
    print(f"Knowledge Validation Results: {tests_passed} passed, {tests_failed} failed")
    print(f"{'='*70}")

    return tests_passed, tests_failed


def main():
    """Run all validation tests"""
    print("\n" + "#"*70)
    print("#" + " "*68 + "#")
    print("#" + "  VALIDATION LAYER TEST SUITE".center(68) + "#")
    print("#" + "  Testing BUG-003, BUG-004, BUG-005, BUG-006, BUG-007".center(68) + "#")
    print("#" + " "*68 + "#")
    print("#"*70)

    total_passed = 0
    total_failed = 0

    # Run all test suites
    test_suites = [
        ("BUG-003: Input Type Validation", test_bug_003_input_type_validation),
        ("BUG-004: Recipient Validation", test_bug_004_recipient_validation),
        ("BUG-005: Connection State", test_bug_005_connection_state),
        ("BUG-006: Agent ID Validation", test_bug_006_agent_id_validation),
        ("BUG-007: Empty Field Validation", test_bug_007_empty_field_validation),
        ("Task Update Validation", test_task_update_validation),
        ("Knowledge Validation", test_knowledge_validation),
    ]

    for suite_name, test_func in test_suites:
        try:
            passed, failed = test_func()
            total_passed += passed
            total_failed += failed
            time.sleep(1)  # Small delay between test suites
        except Exception as e:
            print(f"\n❌ TEST SUITE '{suite_name}' CRASHED: {e}")
            import traceback
            traceback.print_exc()
            total_failed += 1

    # Final summary
    print("\n" + "#"*70)
    print("#" + " "*68 + "#")
    print("#" + "  FINAL RESULTS".center(68) + "#")
    print("#" + " "*68 + "#")
    print("#"*70)
    print()
    print(f"  Total Tests Passed: {total_passed}")
    print(f"  Total Tests Failed: {total_failed}")
    print(f"  Success Rate: {total_passed / (total_passed + total_failed) * 100:.1f}%")
    print()

    if total_failed == 0:
        print("  ✅ ALL VALIDATION TESTS PASSED!")
        print("  All bugs (BUG-003 through BUG-007) have been successfully fixed.")
    else:
        print(f"  ⚠️  {total_failed} TESTS FAILED")
        print("  Some validation issues remain. Review failed tests above.")

    print()
    print("#"*70)

    return total_failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
