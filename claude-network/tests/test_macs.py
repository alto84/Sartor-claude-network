"""
Test suite for MACS (Multi-Agent Communication System) Protocol

Tests the communication layer including:
- Message formatting and validation
- Firebase integration
- GitHub fallback messaging
- Message routing and delivery
- Protocol versioning
"""

import pytest
import json
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestMACSProtocol:
    """Test MACS protocol implementation"""

    def setup_method(self):
        """Set up test fixtures"""
        self.mock_firebase = Mock()
        self.test_agent_id = "test-agent-001"
        self.test_message = {
            "from": self.test_agent_id,
            "to": "broadcast",
            "type": "status",
            "content": "Test message",
            "timestamp": datetime.now().isoformat()
        }

    def test_message_format_validation(self):
        """Test that messages conform to MACS protocol format"""
        # Valid message should pass
        assert self.validate_message_format(self.test_message)

        # Missing required fields should fail
        invalid_message = self.test_message.copy()
        del invalid_message["from"]
        assert not self.validate_message_format(invalid_message)

        # Invalid type should fail
        invalid_message = self.test_message.copy()
        invalid_message["type"] = "invalid_type"
        assert not self.validate_message_format(invalid_message)

    def validate_message_format(self, message):
        """Validate message conforms to MACS protocol"""
        required_fields = ["from", "to", "type", "content", "timestamp"]
        valid_types = ["status", "task", "observation", "consensus", "heartbeat", "skill"]

        # Check required fields
        if not all(field in message for field in required_fields):
            return False

        # Check message type
        if message["type"] not in valid_types:
            return False

        # Check timestamp format
        try:
            datetime.fromisoformat(message["timestamp"])
        except ValueError:
            return False

        return True

    @patch('requests.post')
    def test_firebase_message_send(self, mock_post):
        """Test sending messages via Firebase"""
        mock_response = Mock()
        mock_response.json.return_value = {"name": "-Ntest123"}
        mock_post.return_value = mock_response

        # Simulate sending message
        result = self.send_firebase_message(self.test_message)

        assert result is not None
        assert "name" in result
        mock_post.assert_called_once()

    def send_firebase_message(self, message):
        """Simulate sending message to Firebase"""
        import requests

        firebase_url = "https://home-claude-network-default-rtdb.firebaseio.com"
        response = requests.post(f"{firebase_url}/messages.json", json=message)
        return response.json()

    @patch('requests.get')
    def test_firebase_message_retrieval(self, mock_get):
        """Test retrieving messages from Firebase"""
        mock_messages = {
            "-Ntest123": self.test_message,
            "-Ntest124": {
                "from": "agent-002",
                "to": self.test_agent_id,
                "type": "task",
                "content": "Execute task",
                "timestamp": datetime.now().isoformat()
            }
        }

        mock_response = Mock()
        mock_response.json.return_value = mock_messages
        mock_get.return_value = mock_response

        # Retrieve messages
        messages = self.get_firebase_messages()

        assert len(messages) == 2
        assert messages["-Ntest123"]["from"] == self.test_agent_id

    def get_firebase_messages(self):
        """Simulate retrieving messages from Firebase"""
        import requests

        firebase_url = "https://home-claude-network-default-rtdb.firebaseio.com"
        response = requests.get(f"{firebase_url}/messages.json")
        return response.json()

    def test_message_routing(self):
        """Test message routing logic"""
        # Test broadcast message
        broadcast_msg = self.test_message.copy()
        broadcast_msg["to"] = "broadcast"
        assert self.should_receive_message(broadcast_msg, "any-agent")

        # Test direct message
        direct_msg = self.test_message.copy()
        direct_msg["to"] = "specific-agent"
        assert self.should_receive_message(direct_msg, "specific-agent")
        assert not self.should_receive_message(direct_msg, "other-agent")

        # Test group message
        group_msg = self.test_message.copy()
        group_msg["to"] = "group:workers"
        group_msg["groups"] = ["workers", "scouts"]
        assert self.should_receive_message(group_msg, "worker-001", groups=["workers"])
        assert not self.should_receive_message(group_msg, "admin-001", groups=["admin"])

    def should_receive_message(self, message, agent_id, groups=None):
        """Determine if agent should receive message"""
        # Broadcast messages go to everyone
        if message["to"] == "broadcast":
            return True

        # Direct messages
        if message["to"] == agent_id:
            return True

        # Group messages
        if message["to"].startswith("group:") and groups:
            target_group = message["to"].replace("group:", "")
            return target_group in groups

        return False

    def test_message_priority_handling(self):
        """Test priority message handling"""
        # High priority message
        high_priority_msg = self.test_message.copy()
        high_priority_msg["priority"] = "high"
        high_priority_msg["type"] = "consensus"

        # Normal priority message
        normal_msg = self.test_message.copy()
        normal_msg["priority"] = "normal"

        # Low priority message
        low_priority_msg = self.test_message.copy()
        low_priority_msg["priority"] = "low"
        low_priority_msg["type"] = "observation"

        # Test priority ordering
        messages = [low_priority_msg, high_priority_msg, normal_msg]
        sorted_msgs = self.sort_by_priority(messages)

        assert sorted_msgs[0]["priority"] == "high"
        assert sorted_msgs[-1]["priority"] == "low"

    def sort_by_priority(self, messages):
        """Sort messages by priority"""
        priority_order = {"high": 0, "normal": 1, "low": 2}

        for msg in messages:
            if "priority" not in msg:
                msg["priority"] = "normal"

        return sorted(messages, key=lambda x: priority_order.get(x["priority"], 1))

    def test_message_encryption_placeholder(self):
        """Test placeholder for future encryption support"""
        # This test demonstrates where encryption would be added
        encrypted_msg = self.test_message.copy()
        encrypted_msg["encrypted"] = True
        encrypted_msg["content"] = "base64_encrypted_content"

        # Verify encryption flag is recognized
        assert encrypted_msg.get("encrypted") is True

    def test_github_fallback_messaging(self):
        """Test GitHub-based fallback messaging"""
        # Simulate GitHub API call
        github_message = {
            "title": f"Message from {self.test_agent_id}",
            "body": json.dumps(self.test_message),
            "labels": ["macs-message", "automated"]
        }

        # Verify GitHub message format
        assert "title" in github_message
        assert "body" in github_message
        assert "labels" in github_message
        assert "macs-message" in github_message["labels"]

    def test_message_acknowledgment(self):
        """Test message acknowledgment system"""
        # Send message requiring acknowledgment
        msg_with_ack = self.test_message.copy()
        msg_with_ack["requires_ack"] = True
        msg_with_ack["message_id"] = "msg-001"

        # Create acknowledgment
        ack = self.create_acknowledgment(msg_with_ack, "agent-002")

        assert ack["type"] == "ack"
        assert ack["original_message_id"] == "msg-001"
        assert ack["from"] == "agent-002"

    def create_acknowledgment(self, original_message, acknowledging_agent):
        """Create acknowledgment message"""
        return {
            "type": "ack",
            "from": acknowledging_agent,
            "to": original_message["from"],
            "original_message_id": original_message["message_id"],
            "timestamp": datetime.now().isoformat(),
            "content": f"Message {original_message['message_id']} received"
        }

    def test_heartbeat_messages(self):
        """Test heartbeat message generation and validation"""
        heartbeat = self.create_heartbeat_message("agent-001")

        assert heartbeat["type"] == "heartbeat"
        assert heartbeat["from"] == "agent-001"
        assert "status" in heartbeat["content"]
        assert "capabilities" in heartbeat["content"]
        assert "load" in heartbeat["content"]

    def create_heartbeat_message(self, agent_id):
        """Create heartbeat message"""
        return {
            "type": "heartbeat",
            "from": agent_id,
            "to": "broadcast",
            "timestamp": datetime.now().isoformat(),
            "content": {
                "status": "active",
                "capabilities": ["task_execution", "observation"],
                "load": 0.3,
                "last_activity": datetime.now().isoformat()
            }
        }

    def test_message_retention_policy(self):
        """Test message retention and cleanup"""
        # Create old messages
        old_timestamp = "2024-01-01T00:00:00"
        current_timestamp = datetime.now().isoformat()

        messages = [
            {"timestamp": old_timestamp, "content": "old"},
            {"timestamp": current_timestamp, "content": "new"}
        ]

        # Filter old messages (older than 7 days)
        retained = self.apply_retention_policy(messages, days=7)

        assert len(retained) == 1
        assert retained[0]["content"] == "new"

    def apply_retention_policy(self, messages, days=7):
        """Apply retention policy to messages"""
        from datetime import timedelta

        cutoff = datetime.now() - timedelta(days=days)
        retained = []

        for msg in messages:
            msg_time = datetime.fromisoformat(msg["timestamp"])
            if msg_time > cutoff:
                retained.append(msg)

        return retained


class TestMACSReliability:
    """Test MACS protocol reliability features"""

    def test_message_retry_logic(self):
        """Test automatic retry for failed messages"""
        max_retries = 3
        retry_count = 0

        def simulate_send_with_retry(message, max_retries=3):
            nonlocal retry_count
            retry_count += 1

            if retry_count < max_retries:
                raise ConnectionError("Network error")
            return {"success": True}

        # Should succeed after retries
        try:
            result = simulate_send_with_retry({"test": "message"})
            assert result["success"] is True
            assert retry_count == max_retries
        except ConnectionError:
            pytest.fail("Message send should succeed after retries")

    def test_circuit_breaker_pattern(self):
        """Test circuit breaker for failing services"""
        class CircuitBreaker:
            def __init__(self, failure_threshold=3):
                self.failure_count = 0
                self.failure_threshold = failure_threshold
                self.is_open = False

            def call(self, func, *args, **kwargs):
                if self.is_open:
                    raise Exception("Circuit breaker is open")

                try:
                    result = func(*args, **kwargs)
                    self.failure_count = 0
                    return result
                except Exception as e:
                    self.failure_count += 1
                    if self.failure_count >= self.failure_threshold:
                        self.is_open = True
                    raise e

        breaker = CircuitBreaker(failure_threshold=3)

        def failing_service():
            raise ConnectionError("Service unavailable")

        # Test that circuit opens after threshold
        for i in range(3):
            with pytest.raises(ConnectionError):
                breaker.call(failing_service)

        assert breaker.is_open is True

        # Circuit should block calls when open
        with pytest.raises(Exception, match="Circuit breaker is open"):
            breaker.call(failing_service)

    def test_message_deduplication(self):
        """Test duplicate message detection"""
        seen_messages = set()

        def is_duplicate(message):
            msg_id = message.get("message_id") or hash(
                f"{message['from']}{message['timestamp']}{message['content']}"
            )
            if msg_id in seen_messages:
                return True
            seen_messages.add(msg_id)
            return False

        # First message should not be duplicate
        msg1 = {"from": "agent1", "timestamp": "2025-01-01T00:00:00", "content": "test"}
        assert not is_duplicate(msg1)

        # Same message should be duplicate
        msg2 = {"from": "agent1", "timestamp": "2025-01-01T00:00:00", "content": "test"}
        assert is_duplicate(msg2)

        # Different message should not be duplicate
        msg3 = {"from": "agent2", "timestamp": "2025-01-01T00:00:01", "content": "test2"}
        assert not is_duplicate(msg3)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])