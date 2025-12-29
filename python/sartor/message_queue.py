"""
File-based message queue for inter-agent communication.
Works across Windows (Executive Claude) and Linux (GPU Agents).
"""

import json
import os
import time
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, Callable
from enum import Enum


class MessageStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MessageType(Enum):
    TASK = "task"
    RESULT = "result"
    STATUS = "status"
    HEARTBEAT = "heartbeat"
    COMMAND = "command"


@dataclass
class Message:
    """A message in the queue."""
    id: str
    from_agent: str
    to_agent: str
    type: MessageType
    content: Dict[str, Any]
    timestamp: str
    status: MessageStatus = MessageStatus.PENDING
    priority: int = 0
    ttl_seconds: int = 3600

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "from": self.from_agent,
            "to": self.to_agent,
            "type": self.type.value,
            "content": self.content,
            "timestamp": self.timestamp,
            "status": self.status.value,
            "priority": self.priority,
            "ttl_seconds": self.ttl_seconds
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Message":
        return cls(
            id=data["id"],
            from_agent=data["from"],
            to_agent=data["to"],
            type=MessageType(data["type"]),
            content=data["content"],
            timestamp=data["timestamp"],
            status=MessageStatus(data.get("status", "pending")),
            priority=data.get("priority", 0),
            ttl_seconds=data.get("ttl_seconds", 3600)
        )


class MessageQueue:
    """
    File-based message queue for cross-platform agent communication.

    Directory structure:
        queue_dir/
            {agent_name}/
                inbox/
                    {message_id}.json
                outbox/
                    {message_id}.json
                processed/
                    {message_id}.json
    """

    def __init__(self, queue_dir: str, agent_name: str):
        self.queue_dir = Path(queue_dir)
        self.agent_name = agent_name
        self.inbox_dir = self.queue_dir / agent_name / "inbox"
        self.outbox_dir = self.queue_dir / agent_name / "outbox"
        self.processed_dir = self.queue_dir / agent_name / "processed"

        # Ensure directories exist
        for dir_path in [self.inbox_dir, self.outbox_dir, self.processed_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

    def send(
        self,
        to_agent: str,
        message_type: MessageType,
        content: Dict[str, Any],
        priority: int = 0,
        ttl_seconds: int = 3600
    ) -> Message:
        """Send a message to another agent."""
        msg = Message(
            id=str(uuid.uuid4())[:8],
            from_agent=self.agent_name,
            to_agent=to_agent,
            type=message_type,
            content=content,
            timestamp=datetime.utcnow().isoformat(),
            status=MessageStatus.PENDING,
            priority=priority,
            ttl_seconds=ttl_seconds
        )

        # Write to sender's outbox
        outbox_file = self.outbox_dir / f"{msg.id}.json"
        with open(outbox_file, "w") as f:
            json.dump(msg.to_dict(), f, indent=2)

        # Write to recipient's inbox
        recipient_inbox = self.queue_dir / to_agent / "inbox"
        recipient_inbox.mkdir(parents=True, exist_ok=True)
        inbox_file = recipient_inbox / f"{msg.id}.json"
        with open(inbox_file, "w") as f:
            json.dump(msg.to_dict(), f, indent=2)

        return msg

    def receive(self, mark_processing: bool = True) -> Optional[Message]:
        """Receive the next message from inbox (highest priority first)."""
        messages = self.list_inbox()
        if not messages:
            return None

        # Sort by priority (descending) then timestamp (ascending)
        messages.sort(key=lambda m: (-m.priority, m.timestamp))
        msg = messages[0]

        if mark_processing:
            msg.status = MessageStatus.PROCESSING
            self._update_message(msg)

        return msg

    def list_inbox(self) -> List[Message]:
        """List all messages in inbox."""
        messages = []
        for file_path in self.inbox_dir.glob("*.json"):
            try:
                with open(file_path) as f:
                    data = json.load(f)
                msg = Message.from_dict(data)
                # Check TTL
                msg_time = datetime.fromisoformat(msg.timestamp)
                age = (datetime.utcnow() - msg_time).total_seconds()
                if age < msg.ttl_seconds:
                    messages.append(msg)
                else:
                    # Expired - move to processed
                    msg.status = MessageStatus.FAILED
                    msg.content["error"] = "TTL expired"
                    self.complete(msg)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
        return messages

    def complete(self, message: Message, result: Optional[Dict[str, Any]] = None):
        """Mark a message as completed and archive it."""
        message.status = MessageStatus.COMPLETED
        if result:
            message.content["result"] = result

        # Move from inbox to processed
        inbox_file = self.inbox_dir / f"{message.id}.json"
        processed_file = self.processed_dir / f"{message.id}.json"

        with open(processed_file, "w") as f:
            json.dump(message.to_dict(), f, indent=2)

        if inbox_file.exists():
            inbox_file.unlink()

    def fail(self, message: Message, error: str):
        """Mark a message as failed."""
        message.status = MessageStatus.FAILED
        message.content["error"] = error
        self.complete(message)

    def _update_message(self, message: Message):
        """Update a message in place."""
        inbox_file = self.inbox_dir / f"{message.id}.json"
        if inbox_file.exists():
            with open(inbox_file, "w") as f:
                json.dump(message.to_dict(), f, indent=2)

    def send_task(
        self,
        to_agent: str,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        priority: int = 0
    ) -> Message:
        """Convenience method to send a task."""
        content = {"task": task}
        if context:
            content["context"] = context
        return self.send(to_agent, MessageType.TASK, content, priority)

    def send_result(
        self,
        to_agent: str,
        task_id: str,
        result: Any,
        success: bool = True
    ) -> Message:
        """Convenience method to send a task result."""
        content = {
            "task_id": task_id,
            "result": result,
            "success": success
        }
        return self.send(to_agent, MessageType.RESULT, content)

    def wait_for_result(
        self,
        task_id: str,
        timeout: int = 300,
        poll_interval: float = 1.0
    ) -> Optional[Message]:
        """Wait for a result message for a specific task."""
        start = time.time()
        while time.time() - start < timeout:
            for msg in self.list_inbox():
                if (msg.type == MessageType.RESULT and
                    msg.content.get("task_id") == task_id):
                    return msg
            time.sleep(poll_interval)
        return None

    def process_loop(
        self,
        handler: Callable[[Message], Optional[Dict[str, Any]]],
        poll_interval: float = 1.0
    ):
        """Run a processing loop for incoming messages."""
        print(f"[{self.agent_name}] Starting message processing loop...")
        while True:
            msg = self.receive()
            if msg:
                print(f"[{self.agent_name}] Processing message {msg.id} from {msg.from_agent}")
                try:
                    result = handler(msg)
                    self.complete(msg, result)
                    print(f"[{self.agent_name}] Completed message {msg.id}")
                except Exception as e:
                    self.fail(msg, str(e))
                    print(f"[{self.agent_name}] Failed message {msg.id}: {e}")
            time.sleep(poll_interval)


# Example usage
if __name__ == "__main__":
    # Example: Executive Claude sending task to GPU Agent
    exec_queue = MessageQueue("/tmp/sartor/queue", "executive-claude")

    # Send a task
    task = exec_queue.send_task(
        to_agent="gpu-agent",
        task="Analyze GPU capabilities and run inference test",
        context={"model": "phi-3", "test_type": "benchmark"},
        priority=1
    )
    print(f"Sent task: {task.id}")

    # GPU Agent side would do:
    # gpu_queue = MessageQueue("/tmp/sartor/queue", "gpu-agent")
    # msg = gpu_queue.receive()
    # ... process ...
    # gpu_queue.send_result("executive-claude", msg.id, {"result": "..."})
