#!/usr/bin/env python3
"""
Comprehensive Test Suite for Agent Mail System (FEAT-001)

Tests all mail functionality:
- mail_send() - Sending mail to agents
- mail_read() - Reading and marking mail as read
- mail_list() - Listing mails with filters
- mail_reply() - Replying to create threads
- mail_archive() - Archiving mails

Run: python3 test-mail-system.py
"""

import sys
import time
from datetime import datetime

# Import the client
sys.path.insert(0, 'claude-network/sdk')
from firebase_mcp_client import FirebaseMCPClient


class MailSystemTester:
    """Comprehensive mail system test suite"""

    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.test_results = []

    def log(self, message, level="INFO"):
        """Log test message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {
            "INFO": "ℹ️ ",
            "PASS": "✅",
            "FAIL": "❌",
            "TEST": "🧪"
        }.get(level, "")
        print(f"[{timestamp}] {prefix} {message}")

    def assert_equal(self, actual, expected, test_name):
        """Assert equality and track results"""
        if actual == expected:
            self.log(f"PASS: {test_name}", "PASS")
            self.tests_passed += 1
            self.test_results.append({"test": test_name, "result": "PASS"})
            return True
        else:
            self.log(f"FAIL: {test_name} (expected {expected}, got {actual})", "FAIL")
            self.tests_failed += 1
            self.test_results.append({"test": test_name, "result": "FAIL", "expected": expected, "actual": actual})
            return False

    def assert_true(self, condition, test_name):
        """Assert condition is true"""
        return self.assert_equal(bool(condition), True, test_name)

    def assert_not_none(self, value, test_name):
        """Assert value is not None"""
        if value is not None:
            self.log(f"PASS: {test_name}", "PASS")
            self.tests_passed += 1
            self.test_results.append({"test": test_name, "result": "PASS"})
            return True
        else:
            self.log(f"FAIL: {test_name} (value was None)", "FAIL")
            self.tests_failed += 1
            self.test_results.append({"test": test_name, "result": "FAIL"})
            return False

    def test_1_mail_send_basic(self, agent1, agent2):
        """Test 1: Basic mail sending"""
        self.log("Test 1: Basic mail sending", "TEST")

        mail_id = agent1.mail_send(
            to_agent_id=agent2.agent_id,
            subject="Test Mail",
            body="This is a test message",
            priority="normal"
        )

        self.assert_not_none(mail_id, "Mail ID returned from mail_send")
        time.sleep(0.5)

        # Check recipient inbox
        inbox = agent2.mail_list(folder="inbox")
        self.assert_true(len(inbox) > 0, "Mail appears in recipient inbox")

        if len(inbox) > 0:
            mail = inbox[0]
            self.assert_equal(mail.get("subject"), "Test Mail", "Mail subject matches")
            self.assert_equal(mail.get("body"), "This is a test message", "Mail body matches")
            self.assert_equal(mail.get("from"), agent1.agent_id, "Sender ID matches")
            self.assert_equal(mail.get("read"), False, "Mail initially unread")

        # Check sender's sent folder
        sent = agent1.mail_list(folder="sent")
        self.assert_true(len(sent) > 0, "Mail appears in sender's sent folder")

        return mail_id

    def test_2_mail_read(self, agent, mail_id):
        """Test 2: Reading mail"""
        self.log("Test 2: Reading mail and marking as read", "TEST")

        # Read the mail
        mail = agent.mail_read(mail_id)
        self.assert_not_none(mail, "Mail content retrieved")

        if mail:
            self.assert_equal(mail.get("subject"), "Test Mail", "Mail content correct")

        time.sleep(0.5)

        # Check it's marked as read
        inbox = agent.mail_list(folder="inbox", unread_only=False)
        matching_mail = [m for m in inbox if m.get("mail_id") == mail_id]

        if matching_mail:
            self.assert_equal(matching_mail[0].get("read"), True, "Mail marked as read")

    def test_3_mail_list_filters(self, agent):
        """Test 3: Mail listing with filters"""
        self.log("Test 3: Mail listing with filters", "TEST")

        # List all inbox mails
        all_inbox = agent.mail_list(folder="inbox", unread_only=False)
        self.log(f"Total inbox mails: {len(all_inbox)}", "INFO")

        # List only unread mails
        unread = agent.mail_list(folder="inbox", unread_only=True)
        self.log(f"Unread mails: {len(unread)}", "INFO")

        # Unread should be <= all inbox
        self.assert_true(len(unread) <= len(all_inbox), "Unread count <= total inbox")

        # List sent mails
        sent = agent.mail_list(folder="sent")
        self.log(f"Sent mails: {len(sent)}", "INFO")

        # List archive (should be empty initially)
        archive = agent.mail_list(folder="archive")
        self.assert_equal(len(archive), 0, "Archive initially empty")

    def test_4_mail_reply(self, agent1, agent2, original_mail_id):
        """Test 4: Replying to mail"""
        self.log("Test 4: Replying to mail (threading)", "TEST")

        # Agent2 reads the mail
        original = agent2.mail_read(original_mail_id)
        self.assert_not_none(original, "Original mail found")

        # Agent2 replies
        reply_id = agent2.mail_reply(original_mail_id, "Thanks for your message!")
        self.assert_not_none(reply_id, "Reply mail ID returned")

        time.sleep(0.5)

        # Check agent1's inbox for reply
        inbox = agent1.mail_list(folder="inbox")
        replies = [m for m in inbox if m.get("in_reply_to") == original_mail_id]

        self.assert_true(len(replies) > 0, "Reply appears in sender's inbox")

        if replies:
            reply = replies[0]
            self.assert_true(reply.get("subject").startswith("Re: "), "Reply has 'Re:' prefix")
            self.assert_equal(reply.get("body"), "Thanks for your message!", "Reply body correct")
            self.assert_equal(reply.get("thread_id"), original.get("thread_id"), "Thread ID maintained")
            self.assert_equal(reply.get("in_reply_to"), original_mail_id, "in_reply_to set correctly")

        return reply_id

    def test_5_mail_archive(self, agent, mail_id):
        """Test 5: Archiving mail"""
        self.log("Test 5: Archiving mail", "TEST")

        # Get inbox count before
        inbox_before = agent.mail_list(folder="inbox")
        inbox_count_before = len(inbox_before)

        # Archive the mail
        success = agent.mail_archive(mail_id)
        self.assert_true(success, "Archive operation successful")

        time.sleep(0.5)

        # Check inbox count after
        inbox_after = agent.mail_list(folder="inbox")
        inbox_count_after = len(inbox_after)

        self.assert_equal(inbox_count_after, inbox_count_before - 1, "Mail removed from inbox")

        # Check archive
        archive = agent.mail_list(folder="archive")
        archived_mail = [m for m in archive if m.get("mail_id") == mail_id]

        self.assert_true(len(archived_mail) > 0, "Mail appears in archive")

        if archived_mail:
            self.assert_equal(archived_mail[0].get("archived"), True, "Archived flag set")

    def test_6_mail_priority(self, agent1, agent2):
        """Test 6: Mail priority levels"""
        self.log("Test 6: Mail priority levels", "TEST")

        # Send urgent mail
        urgent_id = agent1.mail_send(
            to_agent_id=agent2.agent_id,
            subject="Urgent: Action Required",
            body="This is urgent",
            priority="urgent"
        )
        self.assert_not_none(urgent_id, "Urgent mail sent")

        # Send high priority mail
        high_id = agent1.mail_send(
            to_agent_id=agent2.agent_id,
            subject="High Priority Task",
            body="This is high priority",
            priority="high"
        )
        self.assert_not_none(high_id, "High priority mail sent")

        time.sleep(0.5)

        # Verify priorities
        inbox = agent2.mail_list(folder="inbox")
        urgent_mails = [m for m in inbox if m.get("priority") == "urgent"]
        high_mails = [m for m in inbox if m.get("priority") == "high"]

        self.assert_true(len(urgent_mails) > 0, "Urgent mail in inbox")
        self.assert_true(len(high_mails) > 0, "High priority mail in inbox")

    def test_7_mail_validation(self, agent1, agent2):
        """Test 7: Input validation"""
        self.log("Test 7: Input validation", "TEST")

        # Test empty subject
        try:
            agent1.mail_send(agent2.agent_id, "", "body", "normal")
            self.assert_true(False, "Empty subject rejected")
        except ValueError:
            self.assert_true(True, "Empty subject rejected")

        # Test empty body
        try:
            agent1.mail_send(agent2.agent_id, "subject", "", "normal")
            self.assert_true(False, "Empty body rejected")
        except ValueError:
            self.assert_true(True, "Empty body rejected")

        # Test invalid priority
        try:
            agent1.mail_send(agent2.agent_id, "subject", "body", "critical")
            self.assert_true(False, "Invalid priority rejected")
        except ValueError:
            self.assert_true(True, "Invalid priority rejected")

        # Test non-existent recipient
        try:
            agent1.mail_send("non-existent-agent", "subject", "body", "normal")
            self.assert_true(False, "Non-existent recipient rejected")
        except ValueError:
            self.assert_true(True, "Non-existent recipient rejected")

    def test_8_mail_threading(self, agent1, agent2):
        """Test 8: Mail threading (conversation)"""
        self.log("Test 8: Mail threading", "TEST")

        # Send initial mail
        mail1_id = agent1.mail_send(agent2.agent_id, "Project Discussion", "Let's discuss the project", "normal")
        self.assert_not_none(mail1_id, "Initial mail sent")

        time.sleep(0.5)

        # Read and get thread_id
        mail1 = agent2.mail_read(mail1_id)
        thread_id = mail1.get("thread_id")

        # Reply 1
        reply1_id = agent2.mail_reply(mail1_id, "Sure, what about it?")
        time.sleep(0.5)

        # Reply 2 (agent1 replies to reply1)
        reply1 = agent1.mail_read(reply1_id)
        reply2_id = agent1.mail_reply(reply1_id, "I have some ideas")
        time.sleep(0.5)

        # Verify all mails share same thread_id
        reply1_data = agent1.mail_read(reply1_id)
        reply2_data = agent2.mail_read(reply2_id)

        self.assert_equal(reply1_data.get("thread_id"), thread_id, "Reply 1 has same thread_id")
        self.assert_equal(reply2_data.get("thread_id"), thread_id, "Reply 2 has same thread_id")

    def test_9_concurrent_mail(self, agent1, agent2, agent3):
        """Test 9: Concurrent mail operations"""
        self.log("Test 9: Concurrent mail to multiple agents", "TEST")

        # Agent1 sends to multiple agents
        id1 = agent1.mail_send(agent2.agent_id, "Broadcast Test", "Message to agent2", "normal")
        id2 = agent1.mail_send(agent3.agent_id, "Broadcast Test", "Message to agent3", "normal")

        self.assert_not_none(id1, "Mail to agent2 sent")
        self.assert_not_none(id2, "Mail to agent3 sent")

        time.sleep(0.5)

        # Both agents should have the mail
        agent2_inbox = agent2.mail_list(folder="inbox")
        agent3_inbox = agent3.mail_list(folder="inbox")

        agent2_has_mail = any(m.get("subject") == "Broadcast Test" for m in agent2_inbox)
        agent3_has_mail = any(m.get("subject") == "Broadcast Test" for m in agent3_inbox)

        self.assert_true(agent2_has_mail, "Agent2 received mail")
        self.assert_true(agent3_has_mail, "Agent3 received mail")

    def run_all_tests(self):
        """Run complete test suite"""
        print("\n" + "=" * 70)
        print("  SARTOR NETWORK - AGENT MAIL SYSTEM TEST SUITE")
        print("  FEAT-001 Comprehensive Testing")
        print("=" * 70)

        # Setup: Create test agents
        self.log("Setting up test agents...", "INFO")

        agent1 = FirebaseMCPClient(agent_id="mail-test-agent-1")
        agent2 = FirebaseMCPClient(agent_id="mail-test-agent-2")
        agent3 = FirebaseMCPClient(agent_id="mail-test-agent-3")

        agent1.connect()
        agent2.connect()
        agent3.connect()

        self.log("Test agents connected", "INFO")
        time.sleep(1)

        # Run tests
        print("\n" + "-" * 70)

        # Test 1: Basic sending
        mail_id = self.test_1_mail_send_basic(agent1, agent2)

        # Test 2: Reading
        self.test_2_mail_read(agent2, mail_id)

        # Test 3: Listing with filters
        self.test_3_mail_list_filters(agent2)

        # Test 4: Replying
        reply_id = self.test_4_mail_reply(agent1, agent2, mail_id)

        # Test 5: Archiving
        self.test_5_mail_archive(agent2, mail_id)

        # Test 6: Priority
        self.test_6_mail_priority(agent1, agent2)

        # Test 7: Validation
        self.test_7_mail_validation(agent1, agent2)

        # Test 8: Threading
        self.test_8_mail_threading(agent1, agent2)

        # Test 9: Concurrent
        self.test_9_concurrent_mail(agent1, agent2, agent3)

        # Cleanup
        print("\n" + "-" * 70)
        self.log("Cleaning up test agents...", "INFO")
        agent1.disconnect()
        agent2.disconnect()
        agent3.disconnect()

        # Summary
        print("\n" + "=" * 70)
        print("  TEST RESULTS SUMMARY")
        print("=" * 70)
        print(f"  ✅ Tests Passed: {self.tests_passed}")
        print(f"  ❌ Tests Failed: {self.tests_failed}")
        print(f"  📊 Total Tests: {self.tests_passed + self.tests_failed}")

        if self.tests_failed == 0:
            print(f"\n  🎉 ALL TESTS PASSED! Mail system is fully functional.")
            success_rate = 100.0
        else:
            success_rate = (self.tests_passed / (self.tests_passed + self.tests_failed)) * 100
            print(f"\n  ⚠️  Some tests failed. Success rate: {success_rate:.1f}%")

        print("=" * 70)

        # Detailed results
        if self.tests_failed > 0:
            print("\n  Failed Tests:")
            for result in self.test_results:
                if result["result"] == "FAIL":
                    print(f"    - {result['test']}")
                    if "expected" in result:
                        print(f"      Expected: {result['expected']}, Got: {result['actual']}")

        return self.tests_failed == 0


if __name__ == "__main__":
    tester = MailSystemTester()
    success = tester.run_all_tests()

    # Exit with appropriate code
    sys.exit(0 if success else 1)
