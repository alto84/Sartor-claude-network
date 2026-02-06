"""
Gateway: Single Control Plane for Multi-Agent Coordination
Inspired by OpenClaw's Gateway architecture.

The Gateway serves as the central hub for:
- Agent session management and routing
- Tool execution coordination
- Event streaming between agents
- Health monitoring and heartbeats
- Memory flush coordination

Usage:
    gateway = Gateway(port=18789)
    gateway.register_agent("researcher", capabilities=["web_search", "read_files"])
    gateway.register_agent("implementer", capabilities=["write_files", "run_tests"])
    await gateway.start()
"""

import asyncio
import json
import time
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any
from enum import Enum

logger = logging.getLogger("gateway")


class AgentStatus(Enum):
    IDLE = "idle"
    BUSY = "busy"
    OFFLINE = "offline"
    ERROR = "error"


@dataclass
class AgentSession:
    name: str
    capabilities: List[str]
    status: AgentStatus = AgentStatus.IDLE
    last_heartbeat: float = 0.0
    current_task: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TaskRequest:
    id: str
    method: str
    params: Dict[str, Any]
    source_agent: str
    target_agent: Optional[str] = None
    timestamp: float = 0.0
    status: str = "pending"
    result: Optional[Any] = None


class Gateway:
    """Central control plane for agent coordination."""

    def __init__(self, port: int = 18789):
        self.port = port
        self.agents: Dict[str, AgentSession] = {}
        self.task_queue: List[TaskRequest] = []
        self.completed_tasks: List[TaskRequest] = []
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.heartbeat_interval = 30  # seconds
        self.heartbeat_timeout = 90  # seconds before marking offline
        self._running = False
        self._task_counter = 0

    def register_agent(self, name: str, capabilities: List[str] = None, **metadata):
        """Register an agent with the gateway."""
        session = AgentSession(
            name=name,
            capabilities=capabilities or [],
            last_heartbeat=time.time(),
            metadata=metadata,
        )
        self.agents[name] = session
        self._emit("agent_registered", {"agent": name, "capabilities": capabilities})
        logger.info(f"Agent registered: {name} with capabilities {capabilities}")
        return session

    def unregister_agent(self, name: str):
        """Remove an agent from the gateway."""
        if name in self.agents:
            del self.agents[name]
            self._emit("agent_unregistered", {"agent": name})

    def heartbeat(self, agent_name: str, status: AgentStatus = None):
        """Update agent heartbeat timestamp."""
        if agent_name in self.agents:
            self.agents[agent_name].last_heartbeat = time.time()
            if status:
                self.agents[agent_name].status = status

    def submit_task(self, method: str, params: Dict[str, Any],
                    source_agent: str, target_agent: str = None) -> str:
        """Submit a task for execution."""
        self._task_counter += 1
        task = TaskRequest(
            id=f"task_{self._task_counter}",
            method=method,
            params=params,
            source_agent=source_agent,
            target_agent=target_agent,
            timestamp=time.time(),
        )
        self.task_queue.append(task)
        self._emit("task_submitted", {"task_id": task.id, "method": method})
        return task.id

    def route_task(self, task: TaskRequest) -> Optional[str]:
        """Route a task to the best available agent."""
        if task.target_agent:
            agent = self.agents.get(task.target_agent)
            if agent and agent.status == AgentStatus.IDLE:
                return task.target_agent
            return None

        # Find agent with matching capability
        for name, agent in self.agents.items():
            if agent.status == AgentStatus.IDLE:
                if not task.method or task.method in agent.capabilities:
                    return name
        return None

    def complete_task(self, task_id: str, result: Any):
        """Mark a task as completed."""
        for task in self.task_queue:
            if task.id == task_id:
                task.status = "completed"
                task.result = result
                self.task_queue.remove(task)
                self.completed_tasks.append(task)
                self._emit("task_completed", {"task_id": task_id})
                return

    def get_status(self) -> Dict[str, Any]:
        """Get gateway status summary."""
        return {
            "agents": {
                name: {
                    "status": agent.status.value,
                    "capabilities": agent.capabilities,
                    "current_task": agent.current_task,
                    "last_heartbeat_age": time.time() - agent.last_heartbeat,
                }
                for name, agent in self.agents.items()
            },
            "pending_tasks": len(self.task_queue),
            "completed_tasks": len(self.completed_tasks),
        }

    def on(self, event: str, handler: Callable):
        """Register an event handler."""
        if event not in self.event_handlers:
            self.event_handlers[event] = []
        self.event_handlers[event].append(handler)

    def _emit(self, event: str, data: Dict[str, Any]):
        """Emit an event to all registered handlers."""
        for handler in self.event_handlers.get(event, []):
            try:
                handler(data)
            except Exception as e:
                logger.error(f"Event handler error: {e}")

    def check_heartbeats(self):
        """Check for stale agents and mark them offline."""
        now = time.time()
        for name, agent in self.agents.items():
            if agent.status != AgentStatus.OFFLINE:
                if now - agent.last_heartbeat > self.heartbeat_timeout:
                    agent.status = AgentStatus.OFFLINE
                    self._emit("agent_timeout", {"agent": name})
                    logger.warning(f"Agent {name} timed out")

    def process_queue(self):
        """Process pending tasks in the queue."""
        for task in list(self.task_queue):
            if task.status == "pending":
                target = self.route_task(task)
                if target:
                    task.status = "assigned"
                    task.target_agent = target
                    self.agents[target].status = AgentStatus.BUSY
                    self.agents[target].current_task = task.id
                    self._emit("task_assigned", {
                        "task_id": task.id,
                        "agent": target,
                    })
