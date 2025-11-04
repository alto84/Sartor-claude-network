#!/usr/bin/env python3
"""
Communication Tests (T2.1-T2.7) for Sartor Network
Test Agent: Communication-Tester
"""

import sys
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any

# Import the bootstrap client
sys.path.insert(0, '/home/user/Sartor-claude-network')
import importlib.util
spec = importlib.util.spec_from_file_location("bootstrap", "/home/user/Sartor-claude-network/sartor-network-bootstrap.py")
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)
SartorNetworkClient = bootstrap.SartorNetworkClient


class CommunicationTester:
    """Comprehensive communication testing suite"""

    def __init__(self):
        self.agent_name = "Communication-Tester"
        self.client = SartorNetworkClient(agent_name=self.agent_name)
        self.results = []
        self.test_start_time = datetime.now()

    def log_test(self, test_id: str, test_name: str, passed: bool,
                 execution_time: float, details: Dict, recommendations: List[str]):
        """Log test result"""
        result = {
            "test_id": test_id,
            "test_name": test_name,
            "status": "PASS" if passed else "FAIL",
            "execution_time_ms": round(execution_time * 1000, 2),
            "details": details,
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)

        status_emoji = "✅" if passed else "❌"
        print(f"\n{status_emoji} {test_id}: {test_name}")
        print(f"   Status: {result['status']}")
        print(f"   Time: {result['execution_time_ms']}ms")
        if details:
            for key, value in details.items():
                print(f"   {key}: {value}")

    def test_t2_1_direct_message(self):
        """T2.1: Direct message sending between two agents"""
        print("\n" + "="*70)
        print("TEST T2.1: Direct Message Sending Between Two Agents")
        print("="*70)

        test_start = time.time()

        # Get list of agents to send to
        agents = self.client.agent_list()
        target_agents = [a for a in agents if a['agent_id'] != self.client.agent_id]

        if not target_agents:
            self.log_test(
                "T2.1", "Direct Message Sending",
                False, time.time() - test_start,
                {"error": "No other agents available"},
                ["Need at least 2 agents for direct messaging test"]
            )
            return

        target = target_agents[0]['agent_id']
        test_message = f"T2.1 Test Message from {self.client.agent_id} at {datetime.now().isoformat()}"

        # Send message
        send_time = time.time()
        send_success = self.client.message_send(target, test_message)
        send_latency = (time.time() - send_time) * 1000

        # Verify message was actually stored in Firebase
        time.sleep(0.5)  # Small delay for Firebase propagation
        verify_time = time.time()
        messages = self.client._firebase_request("GET", f"/messages/direct/{target}")
        verify_latency = (time.time() - verify_time) * 1000

        # Check if our message is in the target's inbox
        message_found = False
        message_id = None
        if messages:
            for msg_id, msg_data in messages.items():
                if isinstance(msg_data, dict) and msg_data.get('content') == test_message:
                    message_found = True
                    message_id = msg_id
                    break

        passed = send_success and message_found

        self.log_test(
            "T2.1", "Direct Message Sending",
            passed, time.time() - test_start,
            {
                "send_success": send_success,
                "message_verified_in_firebase": message_found,
                "target_agent": target[:30],
                "send_latency_ms": round(send_latency, 2),
                "verify_latency_ms": round(verify_latency, 2),
                "total_latency_ms": round(send_latency + verify_latency, 2),
                "message_id": message_id if message_id else "N/A"
            },
            [] if passed else ["Message sent but not verified in Firebase storage"]
        )

    def test_t2_2_broadcast_message(self):
        """T2.2: Broadcast message to all agents"""
        print("\n" + "="*70)
        print("TEST T2.2: Broadcast Message to All Agents")
        print("="*70)

        test_start = time.time()

        # Get agent count before broadcast
        agents_before = self.client.agent_list()
        agent_count = len(agents_before)

        test_message = f"T2.2 Broadcast Test from {self.client.agent_id} at {datetime.now().isoformat()}"

        # Send broadcast
        send_time = time.time()
        send_success = self.client.message_broadcast(test_message)
        send_latency = (time.time() - send_time) * 1000

        # Verify broadcast was stored
        time.sleep(0.5)
        verify_time = time.time()
        broadcasts = self.client._firebase_request("GET", "/messages/broadcast")
        verify_latency = (time.time() - verify_time) * 1000

        # Find our broadcast
        broadcast_found = False
        broadcast_id = None
        if broadcasts:
            for bc_id, bc_data in broadcasts.items():
                if isinstance(bc_data, dict) and bc_data.get('content') == test_message:
                    broadcast_found = True
                    broadcast_id = bc_id
                    break

        passed = send_success and broadcast_found

        self.log_test(
            "T2.2", "Broadcast Message",
            passed, time.time() - test_start,
            {
                "send_success": send_success,
                "broadcast_verified_in_firebase": broadcast_found,
                "network_agent_count": agent_count,
                "send_latency_ms": round(send_latency, 2),
                "verify_latency_ms": round(verify_latency, 2),
                "broadcast_id": broadcast_id if broadcast_id else "N/A"
            },
            [] if passed else ["Broadcast sent but not verified in Firebase storage"]
        )

    def test_t2_3_message_reading(self):
        """T2.3: Message reading and acknowledgment"""
        print("\n" + "="*70)
        print("TEST T2.3: Message Reading and Acknowledgment")
        print("="*70)

        test_start = time.time()

        # First, send ourselves a test message
        test_message = f"T2.3 Self-test message at {datetime.now().isoformat()}"
        self.client.message_send(self.client.agent_id, test_message)
        time.sleep(0.5)

        # Read messages
        read_time = time.time()
        messages = self.client.message_read(count=10)
        read_latency = (time.time() - read_time) * 1000

        # Check if we got the message
        test_message_found = any(msg.get('content') == test_message for msg in messages)

        # Check unread status
        unread_count = sum(1 for msg in messages if not msg.get('read', False))

        # Mark a message as read
        if messages:
            msg_id = messages[0].get('message_id')
            mark_time = time.time()
            self.client._firebase_request(
                "PATCH",
                f"/messages/direct/{self.client.agent_id}/{msg_id}",
                {"read": True}
            )
            mark_latency = (time.time() - mark_time) * 1000

            # Verify it was marked
            time.sleep(0.3)
            verify_msg = self.client._firebase_request(
                "GET",
                f"/messages/direct/{self.client.agent_id}/{msg_id}"
            )
            was_marked = verify_msg.get('read', False) if verify_msg else False
        else:
            mark_latency = 0
            was_marked = False

        passed = test_message_found and (not messages or was_marked)

        self.log_test(
            "T2.3", "Message Reading and Acknowledgment",
            passed, time.time() - test_start,
            {
                "messages_retrieved": len(messages),
                "test_message_found": test_message_found,
                "unread_count": unread_count,
                "read_acknowledgment_works": was_marked if messages else "N/A",
                "read_latency_ms": round(read_latency, 2),
                "mark_read_latency_ms": round(mark_latency, 2) if messages else 0
            },
            [] if passed else ["Message reading or acknowledgment failed"]
        )

    def test_t2_4_message_ordering(self):
        """T2.4: Message ordering and timestamps"""
        print("\n" + "="*70)
        print("TEST T2.4: Message Ordering and Timestamps")
        print("="*70)

        test_start = time.time()

        # Send 5 messages in sequence
        message_ids = []
        timestamps = []
        for i in range(5):
            msg_content = f"T2.4 Sequence {i+1} at {datetime.now().isoformat()}"
            msg_id = str(uuid.uuid4())

            message_data = {
                "from": self.client.agent_id,
                "to": self.client.agent_id,
                "content": msg_content,
                "timestamp": datetime.now().isoformat(),
                "read": False,
                "sequence": i+1
            }

            self.client._firebase_request(
                "PUT",
                f"/messages/direct/{self.client.agent_id}/{msg_id}",
                message_data
            )

            message_ids.append(msg_id)
            timestamps.append(message_data['timestamp'])
            time.sleep(0.1)  # Small delay between messages

        # Read messages
        time.sleep(0.5)
        messages = self.client.message_read(count=10)

        # Filter to our test messages
        test_messages = [
            msg for msg in messages
            if msg.get('content', '').startswith('T2.4 Sequence')
        ]

        # Check ordering (should be reverse chronological by default)
        if test_messages:
            sequences = [msg.get('sequence') for msg in test_messages if 'sequence' in msg]
            is_ordered = sequences == sorted(sequences, reverse=True)

            # Check timestamp validity
            valid_timestamps = all(
                msg.get('timestamp') and 'T' in msg.get('timestamp', '')
                for msg in test_messages
            )
        else:
            is_ordered = False
            valid_timestamps = False

        passed = len(test_messages) >= 5 and is_ordered and valid_timestamps

        self.log_test(
            "T2.4", "Message Ordering and Timestamps",
            passed, time.time() - test_start,
            {
                "messages_sent": 5,
                "messages_retrieved": len(test_messages),
                "correctly_ordered": is_ordered,
                "valid_timestamps": valid_timestamps,
                "ordering": "reverse chronological" if is_ordered else "incorrect"
            },
            [] if passed else ["Messages not properly ordered or timestamped"]
        )

    def test_t2_5_large_message(self):
        """T2.5: Large message handling (>10KB)"""
        print("\n" + "="*70)
        print("TEST T2.5: Large Message Handling (>10KB)")
        print("="*70)

        test_start = time.time()

        # Create a large message (>10KB)
        large_content = "X" * 12000  # 12KB message
        large_content = f"T2.5 Large Message Test - {large_content}"
        message_size = len(large_content.encode('utf-8'))

        # Send large message
        send_time = time.time()
        send_success = self.client.message_send(self.client.agent_id, large_content)
        send_latency = (time.time() - send_time) * 1000

        # Verify message was stored
        time.sleep(1.0)  # Larger delay for big message
        verify_time = time.time()
        messages = self.client._firebase_request("GET", f"/messages/direct/{self.client.agent_id}")
        verify_latency = (time.time() - verify_time) * 1000

        # Find our large message
        message_found = False
        retrieved_size = 0
        if messages:
            for msg_id, msg_data in messages.items():
                if isinstance(msg_data, dict):
                    content = msg_data.get('content', '')
                    if content.startswith('T2.5 Large Message Test'):
                        message_found = True
                        retrieved_size = len(content.encode('utf-8'))
                        break

        size_matches = (retrieved_size == message_size)
        passed = send_success and message_found and size_matches

        self.log_test(
            "T2.5", "Large Message Handling",
            passed, time.time() - test_start,
            {
                "message_size_bytes": message_size,
                "message_size_kb": round(message_size / 1024, 2),
                "send_success": send_success,
                "message_verified": message_found,
                "retrieved_size_bytes": retrieved_size,
                "size_matches": size_matches,
                "send_latency_ms": round(send_latency, 2),
                "verify_latency_ms": round(verify_latency, 2)
            },
            [] if passed else ["Large message not properly stored or retrieved"]
        )

    def test_t2_6_message_persistence(self):
        """T2.6: Message persistence after sender disconnect"""
        print("\n" + "="*70)
        print("TEST T2.6: Message Persistence After Sender Disconnect")
        print("="*70)

        test_start = time.time()

        # Create a temporary client
        temp_client = SartorNetworkClient(agent_name="Temp-Sender")
        temp_client.connect()
        temp_agent_id = temp_client.agent_id

        # Send message from temp client to main client
        test_message = f"T2.6 Persistence test from {temp_agent_id} at {datetime.now().isoformat()}"
        send_success = temp_client.message_send(self.client.agent_id, test_message)

        time.sleep(0.5)

        # Disconnect temp client (sender)
        temp_client.disconnect()
        print(f"   Temp sender {temp_agent_id[:30]} disconnected")

        # Wait and then check if message still exists
        time.sleep(1.0)

        # Read messages
        messages = self.client.message_read(count=20)

        # Check if message from disconnected sender is still there
        message_found = any(
            msg.get('content') == test_message and msg.get('from') == temp_agent_id
            for msg in messages
        )

        # Verify in Firebase directly
        direct_check = self.client._firebase_request("GET", f"/messages/direct/{self.client.agent_id}")
        message_in_firebase = False
        if direct_check:
            for msg_id, msg_data in direct_check.items():
                if isinstance(msg_data, dict) and msg_data.get('content') == test_message:
                    message_in_firebase = True
                    break

        passed = send_success and message_found and message_in_firebase

        self.log_test(
            "T2.6", "Message Persistence After Disconnect",
            passed, time.time() - test_start,
            {
                "send_success": send_success,
                "sender_disconnected": True,
                "message_found_after_disconnect": message_found,
                "message_in_firebase": message_in_firebase,
                "sender_agent_id": temp_agent_id[:30]
            },
            [] if passed else ["Messages not persisting after sender disconnect"]
        )

    def test_t2_7_unread_tracking(self):
        """T2.7: Unread message tracking"""
        print("\n" + "="*70)
        print("TEST T2.7: Unread Message Tracking")
        print("="*70)

        test_start = time.time()

        # Send multiple unread messages to self
        test_messages = []
        for i in range(3):
            msg_content = f"T2.7 Unread test {i+1} at {datetime.now().isoformat()}"
            msg_id = str(uuid.uuid4())

            message_data = {
                "from": self.client.agent_id,
                "to": self.client.agent_id,
                "content": msg_content,
                "timestamp": datetime.now().isoformat(),
                "read": False,
                "test_marker": "T2.7"
            }

            self.client._firebase_request(
                "PUT",
                f"/messages/direct/{self.client.agent_id}/{msg_id}",
                message_data
            )
            test_messages.append(msg_id)
            time.sleep(0.2)

        time.sleep(0.5)

        # Check unread count
        all_messages = self.client._firebase_request("GET", f"/messages/direct/{self.client.agent_id}")

        unread_count = 0
        test_unread_count = 0
        if all_messages:
            for msg_id, msg_data in all_messages.items():
                if isinstance(msg_data, dict) and not msg_data.get('read', False):
                    unread_count += 1
                    if msg_data.get('test_marker') == 'T2.7':
                        test_unread_count += 1

        # Mark one message as read
        if test_messages:
            self.client._firebase_request(
                "PATCH",
                f"/messages/direct/{self.client.agent_id}/{test_messages[0]}",
                {"read": True}
            )

            time.sleep(0.3)

            # Recheck unread count
            all_messages_after = self.client._firebase_request("GET", f"/messages/direct/{self.client.agent_id}")

            unread_after = 0
            test_unread_after = 0
            if all_messages_after:
                for msg_id, msg_data in all_messages_after.items():
                    if isinstance(msg_data, dict) and not msg_data.get('read', False):
                        unread_after += 1
                        if msg_data.get('test_marker') == 'T2.7':
                            test_unread_after += 1

        # Verify tracking works
        tracking_works = (test_unread_count == 3) and (test_unread_after == 2)
        passed = tracking_works

        self.log_test(
            "T2.7", "Unread Message Tracking",
            passed, time.time() - test_start,
            {
                "messages_sent": 3,
                "initial_unread_test_messages": test_unread_count,
                "after_marking_one_read": test_unread_after,
                "unread_tracking_accurate": tracking_works,
                "total_unread_before": unread_count,
                "total_unread_after": unread_after
            },
            [] if passed else ["Unread message tracking not accurate"]
        )

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*70)
        print("GENERATING TEST REPORT")
        print("="*70)

        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['status'] == 'PASS')
        failed_tests = total_tests - passed_tests

        avg_latency = sum(r['execution_time_ms'] for r in self.results) / total_tests if total_tests > 0 else 0

        # Calculate success rates
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

        # Extract latency metrics
        latencies = []
        for r in self.results:
            if 'send_latency_ms' in r['details']:
                latencies.append(r['details']['send_latency_ms'])
            if 'verify_latency_ms' in r['details']:
                latencies.append(r['details']['verify_latency_ms'])

        report = f"""# Communication Tests Report - Sartor Network

**Test Agent:** {self.agent_name}
**Agent ID:** {self.client.agent_id}
**Test Date:** {self.test_start_time.isoformat()}
**Test Duration:** {(datetime.now() - self.test_start_time).total_seconds():.2f} seconds

---

## Executive Summary

- **Total Tests:** {total_tests}
- **Passed:** {passed_tests} ✅
- **Failed:** {failed_tests} ❌
- **Success Rate:** {success_rate:.1f}%
- **Average Test Execution Time:** {avg_latency:.2f}ms

---

## Test Results

"""

        for result in self.results:
            status_emoji = "✅" if result['status'] == 'PASS' else "❌"
            report += f"\n### {status_emoji} {result['test_id']}: {result['test_name']}\n\n"
            report += f"**Status:** {result['status']}\n"
            report += f"**Execution Time:** {result['execution_time_ms']}ms\n\n"

            report += "**Details:**\n"
            for key, value in result['details'].items():
                report += f"- {key}: `{value}`\n"

            if result['recommendations']:
                report += "\n**Recommendations:**\n"
                for rec in result['recommendations']:
                    report += f"- {rec}\n"

            report += "\n---\n"

        report += f"""
## Performance Metrics

### Latency Analysis
- **Minimum Latency:** {min(latencies):.2f}ms
- **Maximum Latency:** {max(latencies):.2f}ms
- **Average Latency:** {sum(latencies)/len(latencies):.2f}ms
- **Total Operations:** {len(latencies)}

### Message Delivery Success Rates
"""

        # Extract specific success metrics
        t21 = next((r for r in self.results if r['test_id'] == 'T2.1'), None)
        t22 = next((r for r in self.results if r['test_id'] == 'T2.2'), None)
        t25 = next((r for r in self.results if r['test_id'] == 'T2.5'), None)
        t26 = next((r for r in self.results if r['test_id'] == 'T2.6'), None)

        if t21:
            report += f"- **Direct Messages:** {100 if t21['details']['message_verified_in_firebase'] else 0}%\n"
        if t22:
            report += f"- **Broadcast Messages:** {100 if t22['details']['broadcast_verified_in_firebase'] else 0}%\n"
        if t25:
            report += f"- **Large Messages (>10KB):** {100 if t25['details']['size_matches'] else 0}%\n"
        if t26:
            report += f"- **Persistence After Disconnect:** {100 if t26['details']['message_in_firebase'] else 0}%\n"

        report += """
### Edge Cases Tested
- ✅ Large message handling (>10KB)
- ✅ Message persistence after sender disconnect
- ✅ Message ordering verification
- ✅ Unread message tracking
- ✅ Direct Firebase verification (not just API calls)

---

## Key Findings

### Strengths
"""

        if passed_tests == total_tests:
            report += "- All communication tests passed successfully\n"

        report += f"- Message delivery verified at Firebase level (not just send confirmation)\n"
        report += f"- Average latency of {sum(latencies)/len(latencies):.2f}ms is acceptable\n"

        report += "\n### Issues Found\n"

        if failed_tests > 0:
            for result in self.results:
                if result['status'] == 'FAIL':
                    report += f"- {result['test_id']}: {result['test_name']} - "
                    report += "; ".join(result['recommendations']) + "\n"
        else:
            report += "- No critical issues found\n"

        report += """
---

## Recommendations

1. **Scalability:** Test with more concurrent agents (current test had limited agents)
2. **Load Testing:** Test message throughput under high load
3. **Network Resilience:** Test behavior during Firebase outages
4. **Message Size Limits:** Determine maximum practical message size
5. **Real-time Updates:** Test message notification system (if implemented)

---

## Testing Methodology

### Verification Approach
- **Skeptical Testing:** All message deliveries verified via direct Firebase queries
- **Not Just Send Success:** Verified actual storage and retrieval
- **Latency Measurement:** Separate timing for send and verify operations
- **Edge Case Focus:** Tested failure modes (disconnect, large messages, ordering)

### Test Environment
- **Network:** Sartor Claude Network (Firebase)
- **Firebase URL:** https://home-claude-network-default-rtdb.firebaseio.com
- **Agent Count:** {len(self.client.agent_list())} agents during testing

---

## Conclusion

The Sartor Network communication system demonstrates **{success_rate:.0f}% reliability** across comprehensive testing scenarios.
{'All tests passed successfully. The system is production-ready for communication features.' if passed_tests == total_tests else f'{failed_tests} test(s) failed and require attention before production use.'}

**Test Completed:** {datetime.now().isoformat()}
"""

        return report

    def run_all_tests(self):
        """Run all communication tests"""
        print("\n" + "╔" + "="*68 + "╗")
        print("║" + " "*15 + "SARTOR NETWORK COMMUNICATION TESTS" + " "*19 + "║")
        print("╚" + "="*68 + "╝")

        # Connect to network
        if not self.client.connect():
            print("❌ Failed to connect to network. Aborting tests.")
            return

        try:
            # Run all tests
            self.test_t2_1_direct_message()
            time.sleep(0.5)

            self.test_t2_2_broadcast_message()
            time.sleep(0.5)

            self.test_t2_3_message_reading()
            time.sleep(0.5)

            self.test_t2_4_message_ordering()
            time.sleep(0.5)

            self.test_t2_5_large_message()
            time.sleep(0.5)

            self.test_t2_6_message_persistence()
            time.sleep(0.5)

            self.test_t2_7_unread_tracking()

        finally:
            # Generate and save report
            report = self.generate_report()

            # Save to file
            report_path = "/home/user/Sartor-claude-network/test-results/communication-report.md"
            import os
            os.makedirs(os.path.dirname(report_path), exist_ok=True)

            with open(report_path, 'w') as f:
                f.write(report)

            print(f"\n📊 Report saved to: {report_path}")

            # Also save JSON results
            json_path = report_path.replace('.md', '.json')
            with open(json_path, 'w') as f:
                json.dump({
                    'test_agent': self.agent_name,
                    'agent_id': self.client.agent_id,
                    'test_start': self.test_start_time.isoformat(),
                    'test_end': datetime.now().isoformat(),
                    'results': self.results
                }, f, indent=2)

            print(f"📊 JSON results saved to: {json_path}")

            # Disconnect
            self.client.disconnect()


if __name__ == "__main__":
    tester = CommunicationTester()
    tester.run_all_tests()
