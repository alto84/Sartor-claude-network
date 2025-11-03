#!/usr/bin/env python3
"""
MACS - Multi-Agent Communication System
==============================================
Robust communication protocol for Firebase Realtime Database
enabling multi-agent Claude collaboration with message signing,
routing, queuing, and offline support.

Author: Communication Protocol Implementation Specialist
Date: 2025-11-03
Version: 1.0.0
"""

import json
import time
import hmac
import hashlib
import logging
import threading
import queue
from typing import Dict, List, Optional, Any, Callable, Union, Set, Tuple
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

class MACSConfig:
    """Central configuration for MACS protocol"""

    # Firebase configuration
    FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"
    FIREBASE_TIMEOUT = 30  # seconds

    # Message configuration
    MAX_MESSAGE_SIZE = 1024 * 256  # 256KB
    MESSAGE_TTL = 86400  # 24 hours
    MAX_RETRIES = 3
    RETRY_BACKOFF = [1, 2, 4]  # seconds

    # Queue configuration
    OFFLINE_QUEUE_SIZE = 1000
    OFFLINE_CACHE_PATH = Path.home() / ".claude-network" / "offline-queue.json"

    # Security configuration
    SHARED_SECRET = "MACS-SECRET-KEY-CHANGE-IN-PRODUCTION"  # TODO: Move to env var
    SIGNATURE_ALGORITHM = "sha256"

    # Heartbeat configuration
    HEARTBEAT_INTERVAL = 30  # seconds
    HEARTBEAT_TIMEOUT = 90  # seconds before agent considered offline

    # Performance configuration
    CONNECTION_POOL_SIZE = 10
    CONNECTION_MAX_RETRIES = 3

    @classmethod
    def get_firebase_session(cls) -> requests.Session:
        """Create a requests session with retry logic"""
        session = requests.Session()
        retry = Retry(
            total=cls.CONNECTION_MAX_RETRIES,
            read=cls.CONNECTION_MAX_RETRIES,
            connect=cls.CONNECTION_MAX_RETRIES,
            backoff_factor=0.3,
            status_forcelist=(500, 502, 504)
        )
        adapter = HTTPAdapter(
            pool_connections=cls.CONNECTION_POOL_SIZE,
            pool_maxsize=cls.CONNECTION_POOL_SIZE,
            max_retries=retry
        )
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session

# ============================================================================
# Message Types and Enums
# ============================================================================

class MessageType(Enum):
    """Standard message types in the MACS protocol"""
    TASK = "task"
    STATUS = "status"
    LEARNING = "learning"
    PATCH = "patch"
    CONSENSUS = "consensus"
    HEARTBEAT = "heartbeat"
    SYSTEM = "system"
    ERROR = "error"
    DISCOVERY = "discovery"

class RoutingType(Enum):
    """Message routing types"""
    DIRECT = "direct"        # To specific agent
    BROADCAST = "broadcast"  # To all agents
    MULTICAST = "multicast"  # To group of agents
    SYSTEM = "system"        # System messages

class Priority(Enum):
    """Message priority levels"""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3
    EMERGENCY = 4

class TaskStatus(Enum):
    """Task lifecycle states"""
    CREATED = "created"
    QUEUED = "queued"
    ASSIGNED = "assigned"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# ============================================================================
# Message Data Classes
# ============================================================================

@dataclass
class MessageHeader:
    """Standard message header with routing and metadata"""
    message_id: str
    timestamp: str
    sender_id: str
    message_type: MessageType
    priority: Priority = Priority.NORMAL
    ttl: int = MACSConfig.MESSAGE_TTL
    version: str = "1.0.0"
    correlation_id: Optional[str] = None
    reply_to: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "message_id": self.message_id,
            "timestamp": self.timestamp,
            "sender_id": self.sender_id,
            "message_type": self.message_type.value,
            "priority": self.priority.value,
            "ttl": self.ttl,
            "version": self.version,
            "correlation_id": self.correlation_id,
            "reply_to": self.reply_to
        }

@dataclass
class MessageRouting:
    """Message routing information"""
    routing_type: RoutingType
    recipients: List[str] = field(default_factory=list)
    groups: List[str] = field(default_factory=list)
    exclude: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "routing_type": self.routing_type.value,
            "recipients": self.recipients,
            "groups": self.groups,
            "exclude": self.exclude
        }

@dataclass
class MessageSecurity:
    """Message security information"""
    signature: str
    signed_at: str
    signer_id: str
    algorithm: str = MACSConfig.SIGNATURE_ALGORITHM

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return asdict(self)

@dataclass
class Message:
    """Complete MACS message structure"""
    header: MessageHeader
    routing: MessageRouting
    payload: Dict[str, Any]
    security: Optional[MessageSecurity] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "header": self.header.to_dict(),
            "routing": self.routing.to_dict(),
            "payload": self.payload,
            "security": self.security.to_dict() if self.security else None
        }

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        """Create Message from dictionary"""
        header = MessageHeader(
            message_id=data["header"]["message_id"],
            timestamp=data["header"]["timestamp"],
            sender_id=data["header"]["sender_id"],
            message_type=MessageType(data["header"]["message_type"]),
            priority=Priority(data["header"]["priority"]),
            ttl=data["header"]["ttl"],
            version=data["header"]["version"],
            correlation_id=data["header"].get("correlation_id"),
            reply_to=data["header"].get("reply_to")
        )

        routing = MessageRouting(
            routing_type=RoutingType(data["routing"]["routing_type"]),
            recipients=data["routing"].get("recipients", []),
            groups=data["routing"].get("groups", []),
            exclude=data["routing"].get("exclude", [])
        )

        security = None
        if data.get("security"):
            security = MessageSecurity(**data["security"])

        return cls(header=header, routing=routing, payload=data["payload"], security=security)

# ============================================================================
# Specialized Message Types
# ============================================================================

class TaskMessage:
    """Task assignment and management messages"""

    @staticmethod
    def create_task(
        sender_id: str,
        task_id: str,
        task_type: str,
        description: str,
        requirements: Dict[str, Any],
        priority: Priority = Priority.NORMAL,
        deadline: Optional[str] = None,
        dependencies: List[str] = None
    ) -> Message:
        """Create a new task message"""
        header = MessageHeader(
            message_id=f"task-{task_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.TASK,
            priority=priority
        )

        routing = MessageRouting(
            routing_type=RoutingType.BROADCAST
        )

        payload = {
            "action": "create",
            "task_id": task_id,
            "task_type": task_type,
            "description": description,
            "requirements": requirements,
            "status": TaskStatus.CREATED.value,
            "deadline": deadline,
            "dependencies": dependencies or []
        }

        return Message(header=header, routing=routing, payload=payload)

    @staticmethod
    def claim_task(sender_id: str, task_id: str, estimated_duration: int) -> Message:
        """Claim a task for execution"""
        header = MessageHeader(
            message_id=f"claim-{task_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.TASK,
            priority=Priority.HIGH
        )

        routing = MessageRouting(
            routing_type=RoutingType.BROADCAST
        )

        payload = {
            "action": "claim",
            "task_id": task_id,
            "agent_id": sender_id,
            "estimated_duration": estimated_duration,
            "status": TaskStatus.ASSIGNED.value
        }

        return Message(header=header, routing=routing, payload=payload)

class StatusMessage:
    """Agent status and progress messages"""

    @staticmethod
    def update_status(
        sender_id: str,
        status: str,
        activity: str,
        progress: Optional[float] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> Message:
        """Update agent status"""
        header = MessageHeader(
            message_id=f"status-{sender_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.STATUS,
            priority=Priority.NORMAL
        )

        routing = MessageRouting(
            routing_type=RoutingType.BROADCAST
        )

        payload = {
            "status": status,
            "activity": activity,
            "progress": progress,
            "details": details or {}
        }

        return Message(header=header, routing=routing, payload=payload)

    @staticmethod
    def heartbeat(sender_id: str, capabilities: List[str]) -> Message:
        """Send heartbeat signal"""
        header = MessageHeader(
            message_id=f"heartbeat-{sender_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.HEARTBEAT,
            priority=Priority.LOW,
            ttl=120  # Short TTL for heartbeats
        )

        routing = MessageRouting(
            routing_type=RoutingType.SYSTEM
        )

        payload = {
            "agent_id": sender_id,
            "capabilities": capabilities,
            "timestamp": datetime.now().isoformat()
        }

        return Message(header=header, routing=routing, payload=payload)

class LearningMessage:
    """Knowledge sharing and learning messages"""

    @staticmethod
    def share_experience(
        sender_id: str,
        experience_type: str,
        context: str,
        outcome: str,
        lessons: List[str],
        tags: List[str]
    ) -> Message:
        """Share learned experience"""
        header = MessageHeader(
            message_id=f"learn-{sender_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.LEARNING,
            priority=Priority.NORMAL
        )

        routing = MessageRouting(
            routing_type=RoutingType.BROADCAST
        )

        payload = {
            "experience_type": experience_type,
            "context": context,
            "outcome": outcome,
            "lessons": lessons,
            "tags": tags,
            "confidence": 0.0  # Must be measured, not fabricated
        }

        return Message(header=header, routing=routing, payload=payload)

class PatchMessage:
    """Code improvement and patch messages"""

    @staticmethod
    def propose_patch(
        sender_id: str,
        patch_id: str,
        target_file: str,
        patch_content: str,
        description: str,
        test_results: Dict[str, Any]
    ) -> Message:
        """Propose a code patch"""
        header = MessageHeader(
            message_id=f"patch-{patch_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.PATCH,
            priority=Priority.NORMAL
        )

        routing = MessageRouting(
            routing_type=RoutingType.BROADCAST
        )

        payload = {
            "patch_id": patch_id,
            "target_file": target_file,
            "patch_content": patch_content,
            "description": description,
            "test_results": test_results,
            "status": "proposed"
        }

        return Message(header=header, routing=routing, payload=payload)

class ConsensusMessage:
    """Consensus and voting messages"""

    @staticmethod
    def propose_consensus(
        sender_id: str,
        proposal_id: str,
        proposal_type: str,
        description: str,
        options: List[str],
        deadline: str,
        quorum: float = 0.67
    ) -> Message:
        """Propose a consensus decision"""
        header = MessageHeader(
            message_id=f"consensus-{proposal_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.CONSENSUS,
            priority=Priority.HIGH
        )

        routing = MessageRouting(
            routing_type=RoutingType.BROADCAST
        )

        payload = {
            "action": "propose",
            "proposal_id": proposal_id,
            "proposal_type": proposal_type,
            "description": description,
            "options": options,
            "deadline": deadline,
            "quorum": quorum,
            "votes": {}
        }

        return Message(header=header, routing=routing, payload=payload)

    @staticmethod
    def vote(
        sender_id: str,
        proposal_id: str,
        vote: str,
        reasoning: Optional[str] = None
    ) -> Message:
        """Cast a vote on a proposal"""
        header = MessageHeader(
            message_id=f"vote-{proposal_id}-{sender_id}-{int(time.time())}",
            timestamp=datetime.now().isoformat(),
            sender_id=sender_id,
            message_type=MessageType.CONSENSUS,
            priority=Priority.HIGH,
            correlation_id=proposal_id
        )

        routing = MessageRouting(
            routing_type=RoutingType.BROADCAST
        )

        payload = {
            "action": "vote",
            "proposal_id": proposal_id,
            "vote": vote,
            "reasoning": reasoning
        }

        return Message(header=header, routing=routing, payload=payload)

# ============================================================================
# Agent Registration and Discovery
# ============================================================================

@dataclass
class AgentProfile:
    """Agent capabilities and metadata"""
    agent_id: str
    agent_type: str  # desktop, mobile, web, etc.
    capabilities: List[str]
    specializations: List[str] = field(default_factory=list)
    status: str = "online"
    last_seen: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AgentProfile':
        """Create AgentProfile from dictionary"""
        return cls(**data)

# ============================================================================
# Message Security
# ============================================================================

class MessageSigner:
    """Handle message signing and verification"""

    @staticmethod
    def sign_message(message: Message, agent_id: str) -> MessageSecurity:
        """Sign a message with HMAC-SHA256"""
        # Create signing payload (header + routing + payload)
        signing_data = json.dumps({
            "header": message.header.to_dict(),
            "routing": message.routing.to_dict(),
            "payload": message.payload
        }, sort_keys=True)

        # Generate signature
        signature = hmac.new(
            MACSConfig.SHARED_SECRET.encode(),
            signing_data.encode(),
            hashlib.sha256
        ).hexdigest()

        return MessageSecurity(
            signature=signature,
            signed_at=datetime.now().isoformat(),
            signer_id=agent_id,
            algorithm=MACSConfig.SIGNATURE_ALGORITHM
        )

    @staticmethod
    def verify_signature(message: Message) -> bool:
        """Verify message signature"""
        if not message.security:
            logger.warning(f"Message {message.header.message_id} has no signature")
            return False

        # Recreate signing payload
        signing_data = json.dumps({
            "header": message.header.to_dict(),
            "routing": message.routing.to_dict(),
            "payload": message.payload
        }, sort_keys=True)

        # Calculate expected signature
        expected_signature = hmac.new(
            MACSConfig.SHARED_SECRET.encode(),
            signing_data.encode(),
            hashlib.sha256
        ).hexdigest()

        # Compare signatures
        return hmac.compare_digest(
            message.security.signature,
            expected_signature
        )

# ============================================================================
# Offline Queue Management
# ============================================================================

class OfflineQueue:
    """Manage offline message queue with persistence"""

    def __init__(self, max_size: int = MACSConfig.OFFLINE_QUEUE_SIZE):
        self.max_size = max_size
        self.queue: queue.Queue = queue.Queue(maxsize=max_size)
        self.cache_path = MACSConfig.OFFLINE_CACHE_PATH
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self._load_from_cache()

    def _load_from_cache(self):
        """Load queued messages from disk cache"""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, 'r') as f:
                    cached_messages = json.load(f)
                    for msg_data in cached_messages:
                        message = Message.from_dict(msg_data)
                        if not self.queue.full():
                            self.queue.put(message)
                    logger.info(f"Loaded {len(cached_messages)} messages from cache")
            except Exception as e:
                logger.error(f"Failed to load offline cache: {e}")

    def _save_to_cache(self):
        """Save current queue to disk cache"""
        messages = []
        temp_queue = []

        # Extract all messages
        while not self.queue.empty():
            try:
                msg = self.queue.get_nowait()
                temp_queue.append(msg)
                messages.append(msg.to_dict())
            except queue.Empty:
                break

        # Put messages back
        for msg in temp_queue:
            self.queue.put(msg)

        # Save to disk
        try:
            with open(self.cache_path, 'w') as f:
                json.dump(messages, f)
            logger.debug(f"Saved {len(messages)} messages to cache")
        except Exception as e:
            logger.error(f"Failed to save offline cache: {e}")

    def add(self, message: Message) -> bool:
        """Add message to offline queue"""
        try:
            self.queue.put_nowait(message)
            self._save_to_cache()
            logger.debug(f"Added message {message.header.message_id} to offline queue")
            return True
        except queue.Full:
            logger.warning(f"Offline queue full, dropping message {message.header.message_id}")
            return False

    def get_all(self) -> List[Message]:
        """Get all messages from queue"""
        messages = []
        while not self.queue.empty():
            try:
                messages.append(self.queue.get_nowait())
            except queue.Empty:
                break

        # Clear cache after retrieving
        if messages:
            self._save_to_cache()

        return messages

    def size(self) -> int:
        """Get current queue size"""
        return self.queue.qsize()

# ============================================================================
# Main MACS Client
# ============================================================================

class MACSClient:
    """Main client for MACS protocol communication"""

    def __init__(
        self,
        agent_id: str,
        agent_type: str = "generic",
        capabilities: List[str] = None,
        auto_heartbeat: bool = True
    ):
        """
        Initialize MACS client

        Args:
            agent_id: Unique identifier for this agent
            agent_type: Type of agent (desktop, mobile, web, etc.)
            capabilities: List of agent capabilities
            auto_heartbeat: Whether to automatically send heartbeats
        """
        self.agent_id = agent_id
        self.agent_profile = AgentProfile(
            agent_id=agent_id,
            agent_type=agent_type,
            capabilities=capabilities or [],
            status="initializing"
        )

        # Initialize components
        self.session = MACSConfig.get_firebase_session()
        self.signer = MessageSigner()
        self.offline_queue = OfflineQueue()

        # Message handlers
        self.handlers: Dict[MessageType, List[Callable]] = {
            msg_type: [] for msg_type in MessageType
        }

        # State management
        self.is_online = False
        self.listeners: Dict[str, threading.Thread] = {}
        self.stop_event = threading.Event()

        # Initialize connection
        self._test_connection()

        # Register agent
        self.register()

        # Start heartbeat if requested
        if auto_heartbeat:
            self.start_heartbeat()

    def _test_connection(self) -> bool:
        """Test Firebase connection"""
        try:
            response = self.session.get(
                f"{MACSConfig.FIREBASE_URL}/.json",
                timeout=5
            )
            self.is_online = response.status_code == 200
            if self.is_online:
                logger.info(f"Connected to Firebase")
            return self.is_online
        except Exception as e:
            logger.warning(f"Firebase connection test failed: {e}")
            self.is_online = False
            return False

    def register(self) -> bool:
        """Register agent with the network"""
        try:
            self.agent_profile.status = "online"
            self.agent_profile.last_seen = datetime.now().isoformat()

            response = self.session.put(
                f"{MACSConfig.FIREBASE_URL}/agents-network/registry/{self.agent_id}.json",
                json=self.agent_profile.to_dict(),
                timeout=MACSConfig.FIREBASE_TIMEOUT
            )

            if response.status_code == 200:
                logger.info(f"Agent {self.agent_id} registered successfully")
                return True
            else:
                logger.error(f"Failed to register agent: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Registration failed: {e}")
            return False

    def send_message(
        self,
        message: Message,
        sign: bool = True,
        retry: bool = True
    ) -> Tuple[bool, Optional[str]]:
        """
        Send a message through the network

        Args:
            message: Message to send
            sign: Whether to sign the message
            retry: Whether to retry on failure

        Returns:
            Tuple of (success, message_id)
        """
        # Sign message if requested
        if sign:
            message.security = self.signer.sign_message(message, self.agent_id)

        # Check message size
        message_size = len(message.to_json())
        if message_size > MACSConfig.MAX_MESSAGE_SIZE:
            logger.error(f"Message {message.header.message_id} exceeds size limit")
            return False, None

        # Try to send online
        if self.is_online:
            for attempt in range(MACSConfig.MAX_RETRIES if retry else 1):
                try:
                    # Determine Firebase path based on routing
                    if message.routing.routing_type == RoutingType.DIRECT:
                        path = f"messages/direct/{message.routing.recipients[0]}"
                    elif message.routing.routing_type == RoutingType.BROADCAST:
                        path = "messages/broadcast"
                    elif message.routing.routing_type == RoutingType.MULTICAST:
                        path = "messages/multicast"
                    else:
                        path = "messages/system"

                    # Send to Firebase
                    response = self.session.post(
                        f"{MACSConfig.FIREBASE_URL}/agents-network/{path}.json",
                        json=message.to_dict(),
                        timeout=MACSConfig.FIREBASE_TIMEOUT
                    )

                    if response.status_code == 200:
                        firebase_id = response.json().get("name")
                        logger.info(f"Message {message.header.message_id} sent successfully")
                        return True, firebase_id
                    else:
                        logger.warning(f"Failed to send message: {response.status_code}")

                except Exception as e:
                    logger.warning(f"Send attempt {attempt + 1} failed: {e}")

                # Backoff before retry
                if attempt < MACSConfig.MAX_RETRIES - 1:
                    time.sleep(MACSConfig.RETRY_BACKOFF[attempt])

        # If online send failed or offline, queue the message
        if self.offline_queue.add(message):
            logger.info(f"Message {message.header.message_id} queued for offline delivery")
            return True, message.header.message_id

        return False, None

    def receive_messages(
        self,
        message_types: Optional[List[MessageType]] = None,
        since: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Message]:
        """
        Receive messages from the network

        Args:
            message_types: Filter by message types
            since: Get messages since this timestamp
            limit: Maximum number of messages to retrieve

        Returns:
            List of messages
        """
        messages = []

        if not self.is_online:
            logger.warning("Cannot receive messages while offline")
            return messages

        try:
            # Get all message paths to check
            paths = ["messages/broadcast", f"messages/direct/{self.agent_id}"]

            for path in paths:
                response = self.session.get(
                    f"{MACSConfig.FIREBASE_URL}/agents-network/{path}.json",
                    timeout=MACSConfig.FIREBASE_TIMEOUT
                )

                if response.status_code == 200:
                    data = response.json()
                    if data:
                        for msg_id, msg_data in data.items():
                            try:
                                message = Message.from_dict(msg_data)

                                # Apply filters
                                if message_types and message.header.message_type not in message_types:
                                    continue

                                if since:
                                    msg_time = datetime.fromisoformat(message.header.timestamp)
                                    if msg_time <= since:
                                        continue

                                # Verify signature
                                if message.security and not self.signer.verify_signature(message):
                                    logger.warning(f"Invalid signature for message {message.header.message_id}")
                                    continue

                                messages.append(message)

                                if len(messages) >= limit:
                                    return messages

                            except Exception as e:
                                logger.error(f"Failed to parse message {msg_id}: {e}")

        except Exception as e:
            logger.error(f"Failed to receive messages: {e}")

        return messages

    def subscribe(
        self,
        message_types: List[MessageType],
        handler: Callable[[Message], None],
        group: Optional[str] = None
    ) -> str:
        """
        Subscribe to specific message types

        Args:
            message_types: Types of messages to subscribe to
            handler: Callback function for received messages
            group: Optional group subscription

        Returns:
            Subscription ID
        """
        subscription_id = f"sub-{self.agent_id}-{int(time.time())}"

        # Register handler for each message type
        for msg_type in message_types:
            self.handlers[msg_type].append(handler)

        logger.info(f"Created subscription {subscription_id} for {message_types}")
        return subscription_id

    def start_listener(self, poll_interval: int = 5):
        """
        Start background message listener

        Args:
            poll_interval: Seconds between polls
        """
        def listener_loop():
            last_check = datetime.now()

            while not self.stop_event.is_set():
                try:
                    # Check for new messages
                    messages = self.receive_messages(since=last_check)
                    last_check = datetime.now()

                    # Process messages through handlers
                    for message in messages:
                        msg_type = message.header.message_type
                        for handler in self.handlers.get(msg_type, []):
                            try:
                                handler(message)
                            except Exception as e:
                                logger.error(f"Handler error for message {message.header.message_id}: {e}")

                    # Process offline queue if back online
                    if self.is_online and self.offline_queue.size() > 0:
                        self._flush_offline_queue()

                except Exception as e:
                    logger.error(f"Listener error: {e}")

                time.sleep(poll_interval)

        listener_thread = threading.Thread(target=listener_loop, daemon=True)
        listener_thread.start()
        self.listeners["main"] = listener_thread
        logger.info("Message listener started")

    def _flush_offline_queue(self):
        """Send queued messages when back online"""
        messages = self.offline_queue.get_all()
        logger.info(f"Flushing {len(messages)} offline messages")

        for message in messages:
            self.send_message(message, sign=False, retry=False)

    def start_heartbeat(self):
        """Start automatic heartbeat sender"""
        def heartbeat_loop():
            while not self.stop_event.is_set():
                if self.is_online:
                    heartbeat = StatusMessage.heartbeat(
                        self.agent_id,
                        self.agent_profile.capabilities
                    )
                    self.send_message(heartbeat, retry=False)

                time.sleep(MACSConfig.HEARTBEAT_INTERVAL)

        heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
        heartbeat_thread.start()
        self.listeners["heartbeat"] = heartbeat_thread
        logger.info("Heartbeat started")

    def get_active_agents(self) -> List[AgentProfile]:
        """Get list of active agents from registry"""
        agents = []

        if not self.is_online:
            logger.warning("Cannot get agents while offline")
            return agents

        try:
            response = self.session.get(
                f"{MACSConfig.FIREBASE_URL}/agents-network/registry.json",
                timeout=MACSConfig.FIREBASE_TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                if data:
                    for agent_id, agent_data in data.items():
                        try:
                            agent = AgentProfile.from_dict(agent_data)

                            # Check if agent is still active
                            if agent.last_seen:
                                last_seen_time = datetime.fromisoformat(agent.last_seen)
                                if (datetime.now() - last_seen_time).total_seconds() < MACSConfig.HEARTBEAT_TIMEOUT:
                                    agents.append(agent)
                        except Exception as e:
                            logger.error(f"Failed to parse agent {agent_id}: {e}")

        except Exception as e:
            logger.error(f"Failed to get active agents: {e}")

        return agents

    def cleanup(self):
        """Clean shutdown of MACS client"""
        logger.info(f"Shutting down MACS client {self.agent_id}")

        # Stop all threads
        self.stop_event.set()

        # Update agent status
        try:
            self.agent_profile.status = "offline"
            self.session.patch(
                f"{MACSConfig.FIREBASE_URL}/agents-network/registry/{self.agent_id}.json",
                json={"status": "offline", "last_seen": datetime.now().isoformat()},
                timeout=5
            )
        except:
            pass

        # Save offline queue
        self.offline_queue._save_to_cache()

        logger.info("MACS client shutdown complete")

# ============================================================================
# Usage Examples
# ============================================================================

def example_usage():
    """Example usage of MACS protocol"""

    # Initialize client
    client = MACSClient(
        agent_id="desktop-main",
        agent_type="desktop",
        capabilities=["vision", "code_execution", "file_access"]
    )

    # Send a task message
    task = TaskMessage.create_task(
        sender_id=client.agent_id,
        task_id="task-001",
        task_type="house_inspection",
        description="Check kitchen inventory and report",
        requirements={"skills": ["vision", "reporting"]},
        priority=Priority.NORMAL,
        deadline=(datetime.now() + timedelta(hours=2)).isoformat()
    )

    success, msg_id = client.send_message(task)
    print(f"Task sent: {success}, ID: {msg_id}")

    # Share learning experience
    learning = LearningMessage.share_experience(
        sender_id=client.agent_id,
        experience_type="task_completion",
        context="Kitchen inventory check",
        outcome="Successfully identified 15 items",
        lessons=["Use better lighting for photos", "Group items by category"],
        tags=["house", "inventory", "kitchen"]
    )

    client.send_message(learning)

    # Propose consensus
    consensus = ConsensusMessage.propose_consensus(
        sender_id=client.agent_id,
        proposal_id="consensus-001",
        proposal_type="system_upgrade",
        description="Upgrade to MACS protocol v2.0",
        options=["approve", "reject", "defer"],
        deadline=(datetime.now() + timedelta(hours=24)).isoformat()
    )

    client.send_message(consensus)

    # Subscribe to task messages
    def handle_task(message: Message):
        print(f"Received task: {message.payload}")

    client.subscribe([MessageType.TASK], handle_task)

    # Start listening for messages
    client.start_listener()

    # Get active agents
    agents = client.get_active_agents()
    for agent in agents:
        print(f"Active agent: {agent.agent_id} - {agent.status}")

    # Clean shutdown
    # client.cleanup()

if __name__ == "__main__":
    # Run example
    example_usage()