#!/usr/bin/env python3
"""
Agent Registry System for Claude Network
Manages agent registration, discovery, heartbeats, and presence tracking
"""
import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any, Callable
from dataclasses import dataclass, field, asdict
from enum import Enum
import logging
import requests
from pathlib import Path

from config_manager import Config, load_config

# Set up logging
logger = logging.getLogger(__name__)


class AgentStatus(Enum):
    """Agent status states"""
    OFFLINE = "offline"
    ONLINE = "online"
    BUSY = "busy"
    AWAY = "away"
    ERROR = "error"
    UNKNOWN = "unknown"


class AgentHealth(Enum):
    """Agent health states based on heartbeats"""
    HEALTHY = "healthy"  # Recent heartbeat
    WARNING = "warning"  # Missed 1-2 heartbeats
    CRITICAL = "critical"  # Missed 3+ heartbeats
    DEAD = "dead"  # No heartbeat for extended period


@dataclass
class AgentInfo:
    """Information about a registered agent"""
    agent_id: str
    agent_name: str
    status: AgentStatus = AgentStatus.OFFLINE
    health: AgentHealth = AgentHealth.DEAD
    capabilities: List[str] = field(default_factory=list)
    specialization: str = "general"
    surface: str = "cli"
    location: str = ""
    last_heartbeat: Optional[datetime] = None
    registered_at: datetime = field(default_factory=datetime.now)
    last_seen: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    task_count: int = 0
    error_count: int = 0
    success_rate: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        data = asdict(self)
        data["status"] = self.status.value
        data["health"] = self.health.value
        data["last_heartbeat"] = self.last_heartbeat.isoformat() if self.last_heartbeat else None
        data["registered_at"] = self.registered_at.isoformat()
        data["last_seen"] = self.last_seen.isoformat() if self.last_seen else None
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AgentInfo':
        """Create from dictionary"""
        # Convert string dates back to datetime
        if data.get("last_heartbeat"):
            data["last_heartbeat"] = datetime.fromisoformat(data["last_heartbeat"])
        if data.get("registered_at"):
            data["registered_at"] = datetime.fromisoformat(data["registered_at"])
        if data.get("last_seen"):
            data["last_seen"] = datetime.fromisoformat(data["last_seen"])

        # Convert status strings to enums
        if "status" in data:
            data["status"] = AgentStatus(data["status"])
        if "health" in data:
            data["health"] = AgentHealth(data["health"])

        return cls(**data)


class AgentRegistry:
    """
    Manages agent registration, discovery, and health monitoring
    """

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize the agent registry

        Args:
            config: Configuration object (loads default if not provided)
        """
        self.config = config or load_config()
        self.firebase_url = self.config.firebase.url
        self.local_agent_id = self.config.agent.agent_id
        self.heartbeat_interval = self.config.agent.heartbeat_interval

        # Agent tracking
        self.agents: Dict[str, AgentInfo] = {}
        self.local_cache_file = Path.home() / ".claude-network" / "agent_cache.json"

        # Heartbeat management
        self.heartbeat_thread: Optional[threading.Thread] = None
        self.monitoring_thread: Optional[threading.Thread] = None
        self.stop_heartbeat = threading.Event()

        # Callbacks for agent events
        self.on_agent_online: List[Callable] = []
        self.on_agent_offline: List[Callable] = []
        self.on_agent_critical: List[Callable] = []

        # Load cached agents
        self._load_cache()

        # Sync with Firebase
        self.sync_agents()

    def register(self, agent_info: Optional[AgentInfo] = None) -> bool:
        """
        Register an agent with the network

        Args:
            agent_info: Agent information (uses config if not provided)

        Returns:
            True if registration successful
        """
        if agent_info is None:
            # Register self using config
            agent_info = AgentInfo(
                agent_id=self.config.agent.agent_id,
                agent_name=self.config.agent.agent_name,
                capabilities=self.config.agent.capabilities,
                specialization=self.config.agent.specialization,
                surface=self.config.agent.surface,
                location=self.config.agent.location,
                status=AgentStatus.ONLINE,
                health=AgentHealth.HEALTHY,
                last_heartbeat=datetime.now(),
                last_seen=datetime.now()
            )

        try:
            # Update Firebase
            agent_data = agent_info.to_dict()
            response = requests.put(
                f"{self.firebase_url}/agents/{agent_info.agent_id}.json",
                json=agent_data
            )
            response.raise_for_status()

            # Update local registry
            self.agents[agent_info.agent_id] = agent_info
            self._save_cache()

            logger.info(f"Registered agent: {agent_info.agent_id} ({agent_info.agent_name})")
            return True

        except Exception as e:
            logger.error(f"Failed to register agent {agent_info.agent_id}: {e}")
            return False

    def unregister(self, agent_id: str) -> bool:
        """
        Unregister an agent from the network

        Args:
            agent_id: ID of agent to unregister

        Returns:
            True if unregistration successful
        """
        try:
            # Update status before removal
            if agent_id in self.agents:
                self.update_status(agent_id, AgentStatus.OFFLINE)

            # Remove from Firebase
            response = requests.delete(f"{self.firebase_url}/agents/{agent_id}.json")
            response.raise_for_status()

            # Remove from local registry
            if agent_id in self.agents:
                del self.agents[agent_id]
                self._save_cache()

            logger.info(f"Unregistered agent: {agent_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to unregister agent {agent_id}: {e}")
            return False

    def update_status(self, agent_id: str, status: AgentStatus,
                     metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update an agent's status

        Args:
            agent_id: ID of agent to update
            status: New status
            metadata: Optional metadata to include

        Returns:
            True if update successful
        """
        if agent_id not in self.agents:
            logger.warning(f"Agent {agent_id} not found in registry")
            return False

        agent = self.agents[agent_id]
        old_status = agent.status
        agent.status = status
        agent.last_seen = datetime.now()

        if metadata:
            agent.metadata.update(metadata)

        try:
            # Update Firebase
            update_data = {
                "status": status.value,
                "last_seen": agent.last_seen.isoformat(),
                "metadata": agent.metadata
            }
            response = requests.patch(
                f"{self.firebase_url}/agents/{agent_id}.json",
                json=update_data
            )
            response.raise_for_status()

            # Trigger callbacks
            if old_status != AgentStatus.ONLINE and status == AgentStatus.ONLINE:
                self._trigger_callbacks(self.on_agent_online, agent_id)
            elif old_status != AgentStatus.OFFLINE and status == AgentStatus.OFFLINE:
                self._trigger_callbacks(self.on_agent_offline, agent_id)

            self._save_cache()
            logger.debug(f"Updated status for {agent_id}: {old_status.value} -> {status.value}")
            return True

        except Exception as e:
            logger.error(f"Failed to update status for {agent_id}: {e}")
            return False

    def send_heartbeat(self, agent_id: Optional[str] = None) -> bool:
        """
        Send a heartbeat for an agent

        Args:
            agent_id: ID of agent (uses local agent if not provided)

        Returns:
            True if heartbeat sent successfully
        """
        agent_id = agent_id or self.local_agent_id

        try:
            heartbeat_data = {
                "last_heartbeat": datetime.now().isoformat(),
                "health": AgentHealth.HEALTHY.value,
                "status": AgentStatus.ONLINE.value
            }

            response = requests.patch(
                f"{self.firebase_url}/agents/{agent_id}.json",
                json=heartbeat_data
            )
            response.raise_for_status()

            # Update local record
            if agent_id in self.agents:
                self.agents[agent_id].last_heartbeat = datetime.now()
                self.agents[agent_id].health = AgentHealth.HEALTHY
                self.agents[agent_id].status = AgentStatus.ONLINE

            logger.debug(f"Heartbeat sent for {agent_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to send heartbeat for {agent_id}: {e}")
            return False

    def start_heartbeat(self) -> None:
        """Start automatic heartbeat sending for local agent"""
        if self.heartbeat_thread and self.heartbeat_thread.is_alive():
            logger.warning("Heartbeat already running")
            return

        self.stop_heartbeat.clear()
        self.heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()
        logger.info(f"Started heartbeat (interval: {self.heartbeat_interval}s)")

    def stop_heartbeat_thread(self) -> None:
        """Stop automatic heartbeat sending"""
        if self.heartbeat_thread and self.heartbeat_thread.is_alive():
            self.stop_heartbeat.set()
            self.heartbeat_thread.join(timeout=5)
            logger.info("Stopped heartbeat")

    def _heartbeat_loop(self) -> None:
        """Internal heartbeat loop"""
        while not self.stop_heartbeat.is_set():
            self.send_heartbeat()
            self.stop_heartbeat.wait(self.heartbeat_interval)

    def start_monitoring(self, check_interval: int = 30) -> None:
        """
        Start monitoring agent health

        Args:
            check_interval: How often to check agent health (seconds)
        """
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            logger.warning("Monitoring already running")
            return

        self.stop_heartbeat.clear()
        self.monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            args=(check_interval,),
            daemon=True
        )
        self.monitoring_thread.start()
        logger.info(f"Started agent monitoring (interval: {check_interval}s)")

    def stop_monitoring(self) -> None:
        """Stop monitoring agent health"""
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            self.stop_heartbeat.set()
            self.monitoring_thread.join(timeout=5)
            logger.info("Stopped monitoring")

    def _monitoring_loop(self, check_interval: int) -> None:
        """Internal monitoring loop"""
        while not self.stop_heartbeat.is_set():
            self.check_agent_health()
            self.stop_heartbeat.wait(check_interval)

    def check_agent_health(self) -> Dict[str, AgentHealth]:
        """
        Check health of all registered agents

        Returns:
            Dictionary of agent IDs to health states
        """
        health_report = {}
        now = datetime.now()

        for agent_id, agent in self.agents.items():
            if not agent.last_heartbeat:
                agent.health = AgentHealth.DEAD
            else:
                time_since_heartbeat = now - agent.last_heartbeat
                expected_interval = timedelta(seconds=self.heartbeat_interval * 1.5)

                if time_since_heartbeat < expected_interval:
                    agent.health = AgentHealth.HEALTHY
                elif time_since_heartbeat < expected_interval * 2:
                    agent.health = AgentHealth.WARNING
                elif time_since_heartbeat < expected_interval * 3:
                    agent.health = AgentHealth.CRITICAL
                    self._trigger_callbacks(self.on_agent_critical, agent_id)
                else:
                    agent.health = AgentHealth.DEAD
                    if agent.status != AgentStatus.OFFLINE:
                        self.update_status(agent_id, AgentStatus.OFFLINE)

            health_report[agent_id] = agent.health

        logger.debug(f"Health check complete: {health_report}")
        return health_report

    def discover_agents(self, capability: Optional[str] = None,
                       specialization: Optional[str] = None,
                       surface: Optional[str] = None,
                       status: Optional[AgentStatus] = None) -> List[AgentInfo]:
        """
        Discover agents matching specified criteria

        Args:
            capability: Required capability
            specialization: Required specialization
            surface: Required surface type
            status: Required status

        Returns:
            List of matching agents
        """
        # Sync with Firebase first
        self.sync_agents()

        matches = []
        for agent in self.agents.values():
            # Check capability match
            if capability and capability not in agent.capabilities:
                continue

            # Check specialization match
            if specialization and agent.specialization != specialization:
                continue

            # Check surface match
            if surface and agent.surface != surface:
                continue

            # Check status match
            if status and agent.status != status:
                continue

            matches.append(agent)

        logger.debug(f"Discovered {len(matches)} matching agents")
        return matches

    def get_agent(self, agent_id: str) -> Optional[AgentInfo]:
        """
        Get information about a specific agent

        Args:
            agent_id: ID of agent to retrieve

        Returns:
            Agent information or None if not found
        """
        return self.agents.get(agent_id)

    def get_all_agents(self) -> Dict[str, AgentInfo]:
        """
        Get all registered agents

        Returns:
            Dictionary of agent IDs to agent information
        """
        self.sync_agents()
        return self.agents.copy()

    def get_online_agents(self) -> List[AgentInfo]:
        """
        Get all online agents

        Returns:
            List of online agents
        """
        return [agent for agent in self.agents.values()
                if agent.status == AgentStatus.ONLINE]

    def sync_agents(self) -> bool:
        """
        Sync local registry with Firebase

        Returns:
            True if sync successful
        """
        try:
            response = requests.get(f"{self.firebase_url}/agents.json")
            response.raise_for_status()

            firebase_agents = response.json() or {}

            # Update local registry
            for agent_id, agent_data in firebase_agents.items():
                if isinstance(agent_data, dict):
                    try:
                        agent_info = AgentInfo.from_dict(agent_data)
                        self.agents[agent_id] = agent_info
                    except Exception as e:
                        logger.warning(f"Failed to parse agent {agent_id}: {e}")

            self._save_cache()
            logger.debug(f"Synced {len(self.agents)} agents from Firebase")
            return True

        except Exception as e:
            logger.error(f"Failed to sync agents: {e}")
            return False

    def _load_cache(self) -> None:
        """Load agents from local cache"""
        if not self.local_cache_file.exists():
            return

        try:
            with open(self.local_cache_file, 'r') as f:
                cache_data = json.load(f)

            for agent_id, agent_data in cache_data.items():
                try:
                    self.agents[agent_id] = AgentInfo.from_dict(agent_data)
                except Exception as e:
                    logger.warning(f"Failed to load cached agent {agent_id}: {e}")

            logger.debug(f"Loaded {len(self.agents)} agents from cache")

        except Exception as e:
            logger.warning(f"Failed to load agent cache: {e}")

    def _save_cache(self) -> None:
        """Save agents to local cache"""
        try:
            self.local_cache_file.parent.mkdir(parents=True, exist_ok=True)

            cache_data = {
                agent_id: agent.to_dict()
                for agent_id, agent in self.agents.items()
            }

            with open(self.local_cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2)

        except Exception as e:
            logger.warning(f"Failed to save agent cache: {e}")

    def _trigger_callbacks(self, callbacks: List[Callable], agent_id: str) -> None:
        """Trigger callbacks for agent events"""
        for callback in callbacks:
            try:
                callback(agent_id, self.agents.get(agent_id))
            except Exception as e:
                logger.error(f"Callback error: {e}")

    def add_online_callback(self, callback: Callable) -> None:
        """Add callback for when agent comes online"""
        self.on_agent_online.append(callback)

    def add_offline_callback(self, callback: Callable) -> None:
        """Add callback for when agent goes offline"""
        self.on_agent_offline.append(callback)

    def add_critical_callback(self, callback: Callable) -> None:
        """Add callback for when agent health becomes critical"""
        self.on_agent_critical.append(callback)

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get registry statistics

        Returns:
            Dictionary of statistics
        """
        total = len(self.agents)
        online = len([a for a in self.agents.values() if a.status == AgentStatus.ONLINE])
        healthy = len([a for a in self.agents.values() if a.health == AgentHealth.HEALTHY])

        by_surface = {}
        by_specialization = {}

        for agent in self.agents.values():
            by_surface[agent.surface] = by_surface.get(agent.surface, 0) + 1
            by_specialization[agent.specialization] = by_specialization.get(agent.specialization, 0) + 1

        return {
            "total_agents": total,
            "online_agents": online,
            "healthy_agents": healthy,
            "by_surface": by_surface,
            "by_specialization": by_specialization,
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    # Example usage and testing
    import sys

    # Set up logging for demo
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Create registry
    registry = AgentRegistry()

    # Register self
    print("Registering local agent...")
    registry.register()

    # Start heartbeat
    print("Starting heartbeat...")
    registry.start_heartbeat()

    # Start monitoring
    print("Starting health monitoring...")
    registry.start_monitoring(check_interval=10)

    # Display agents
    print("\nRegistered agents:")
    for agent_id, agent in registry.get_all_agents().items():
        print(f"  {agent_id}: {agent.agent_name} ({agent.status.value}, {agent.health.value})")

    # Show statistics
    print("\nRegistry statistics:")
    stats = registry.get_statistics()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Keep running
    print("\nHeartbeat running. Press Ctrl+C to stop...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        registry.stop_heartbeat_thread()
        registry.stop_monitoring()
        sys.exit(0)