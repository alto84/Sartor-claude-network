"""
Test suite for Agent Registry System

Tests agent management including:
- Agent registration and discovery
- Capability tracking
- Health monitoring
- Load balancing
- Agent lifecycle management
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from enum import Enum
from typing import List, Dict, Any


class AgentStatus(Enum):
    """Agent status enumeration"""
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    IDLE = "idle"
    ERROR = "error"
    MAINTENANCE = "maintenance"


class TestAgentRegistry:
    """Test agent registry functionality"""

    def setup_method(self):
        """Set up test fixtures"""
        self.test_agent = {
            "agent_id": "agent-001",
            "name": "Desktop Agent",
            "type": "desktop",
            "status": AgentStatus.ONLINE.value,
            "capabilities": ["data_processing", "task_execution", "observation"],
            "resources": {
                "cpu_cores": 8,
                "memory_gb": 16,
                "gpu_available": False
            },
            "location": "mission_control",
            "registered_at": datetime.now().isoformat(),
            "last_heartbeat": datetime.now().isoformat(),
            "metadata": {
                "version": "1.0.0",
                "platform": "linux"
            }
        }

    def test_agent_registration(self):
        """Test agent registration process"""
        registry = AgentRegistry()

        # Register agent
        agent = registry.register_agent(
            agent_id="agent-002",
            name="Mobile Agent",
            agent_type="mobile",
            capabilities=["observation", "communication"]
        )

        assert agent["agent_id"] == "agent-002"
        assert agent["status"] == AgentStatus.ONLINE.value
        assert "observation" in agent["capabilities"]
        assert "registered_at" in agent

        # Test duplicate registration
        with pytest.raises(ValueError, match="already registered"):
            registry.register_agent("agent-002", "Duplicate", "mobile", [])

    def test_agent_discovery(self):
        """Test agent discovery mechanisms"""
        registry = AgentRegistry()

        # Register multiple agents
        registry.register_agent("agent-001", "Desktop", "desktop",
                              ["data_processing", "analysis"])
        registry.register_agent("agent-002", "Mobile", "mobile",
                              ["observation"])
        registry.register_agent("agent-003", "Worker", "worker",
                              ["data_processing", "task_execution"])

        # Discover by capability
        data_agents = registry.find_agents_by_capability("data_processing")
        assert len(data_agents) == 2
        assert all(a["agent_id"] in ["agent-001", "agent-003"] for a in data_agents)

        # Discover by type
        mobile_agents = registry.find_agents_by_type("mobile")
        assert len(mobile_agents) == 1
        assert mobile_agents[0]["agent_id"] == "agent-002"

        # Discover online agents
        online_agents = registry.get_online_agents()
        assert len(online_agents) == 3

    def test_agent_heartbeat(self):
        """Test agent heartbeat monitoring"""
        registry = AgentRegistry()
        agent = registry.register_agent("agent-001", "Test Agent", "worker", [])

        # Initial heartbeat
        initial_heartbeat = agent["last_heartbeat"]

        # Send heartbeat
        registry.heartbeat("agent-001", status=AgentStatus.IDLE, load=0.3)
        updated_agent = registry.get_agent("agent-001")

        assert updated_agent["last_heartbeat"] > initial_heartbeat
        assert updated_agent["status"] == AgentStatus.IDLE.value
        assert updated_agent["load"] == 0.3

    def test_agent_health_monitoring(self):
        """Test agent health detection"""
        registry = AgentRegistry(heartbeat_timeout=60)  # 60 seconds timeout

        # Register agent
        agent = registry.register_agent("agent-001", "Test", "worker", [])

        # Simulate old heartbeat
        agent["last_heartbeat"] = (datetime.now() - timedelta(seconds=120)).isoformat()
        registry.agents["agent-001"] = agent

        # Check health
        unhealthy = registry.get_unhealthy_agents()
        assert len(unhealthy) == 1
        assert unhealthy[0]["agent_id"] == "agent-001"

        # Send fresh heartbeat
        registry.heartbeat("agent-001")
        unhealthy = registry.get_unhealthy_agents()
        assert len(unhealthy) == 0

    def test_agent_capabilities_update(self):
        """Test updating agent capabilities"""
        registry = AgentRegistry()
        agent = registry.register_agent("agent-001", "Test", "worker",
                                      ["basic_task"])

        # Add capability
        registry.add_capability("agent-001", "advanced_task")
        updated_agent = registry.get_agent("agent-001")
        assert "advanced_task" in updated_agent["capabilities"]

        # Remove capability
        registry.remove_capability("agent-001", "basic_task")
        updated_agent = registry.get_agent("agent-001")
        assert "basic_task" not in updated_agent["capabilities"]

        # Update all capabilities
        registry.update_capabilities("agent-001", ["skill_a", "skill_b"])
        updated_agent = registry.get_agent("agent-001")
        assert set(updated_agent["capabilities"]) == {"skill_a", "skill_b"}

    def test_agent_load_tracking(self):
        """Test agent load monitoring and balancing"""
        registry = AgentRegistry()

        # Register agents with different loads
        registry.register_agent("agent-001", "Low Load", "worker", [])
        registry.register_agent("agent-002", "Medium Load", "worker", [])
        registry.register_agent("agent-003", "High Load", "worker", [])

        # Update loads
        registry.update_load("agent-001", 0.2)
        registry.update_load("agent-002", 0.5)
        registry.update_load("agent-003", 0.9)

        # Get agent with lowest load
        best_agent = registry.get_least_loaded_agent()
        assert best_agent["agent_id"] == "agent-001"

        # Get agents below load threshold
        available = registry.get_agents_below_load(0.6)
        assert len(available) == 2
        assert all(a["agent_id"] in ["agent-001", "agent-002"] for a in available)

    def test_agent_grouping(self):
        """Test agent group management"""
        registry = AgentRegistry()

        # Register agents
        registry.register_agent("agent-001", "Worker 1", "worker", [], groups=["workers"])
        registry.register_agent("agent-002", "Worker 2", "worker", [], groups=["workers"])
        registry.register_agent("agent-003", "Scout", "mobile", [], groups=["scouts"])
        registry.register_agent("agent-004", "Coordinator", "coordinator",
                              [], groups=["management", "workers"])

        # Get agents by group
        workers = registry.get_agents_in_group("workers")
        assert len(workers) == 3  # agent-001, agent-002, agent-004

        management = registry.get_agents_in_group("management")
        assert len(management) == 1
        assert management[0]["agent_id"] == "agent-004"

    def test_agent_deregistration(self):
        """Test agent removal from registry"""
        registry = AgentRegistry()

        # Register and deregister
        registry.register_agent("agent-001", "Test", "worker", [])
        assert registry.get_agent("agent-001") is not None

        registry.deregister_agent("agent-001")
        assert registry.get_agent("agent-001") is None

        # Deregistering non-existent agent should not raise error
        registry.deregister_agent("non-existent")  # Should handle gracefully

    def test_agent_status_transitions(self):
        """Test valid agent status transitions"""
        registry = AgentRegistry()
        agent = registry.register_agent("agent-001", "Test", "worker", [])

        # Valid transitions
        assert registry.update_status("agent-001", AgentStatus.IDLE)
        assert registry.update_status("agent-001", AgentStatus.BUSY)
        assert registry.update_status("agent-001", AgentStatus.IDLE)
        assert registry.update_status("agent-001", AgentStatus.OFFLINE)

        # Invalid transition (offline -> busy without going online first)
        registry.update_status("agent-001", AgentStatus.OFFLINE)
        assert not registry.update_status("agent-001", AgentStatus.BUSY,
                                         validate_transition=True)

    def test_agent_metrics(self):
        """Test agent performance metrics tracking"""
        registry = AgentRegistry()
        agent = registry.register_agent("agent-001", "Test", "worker", [])

        # Record task completions
        registry.record_task_completion("agent-001", success=True, duration=10.5)
        registry.record_task_completion("agent-001", success=True, duration=8.3)
        registry.record_task_completion("agent-001", success=False, duration=15.0)
        registry.record_task_completion("agent-001", success=True, duration=12.1)

        # Get metrics
        metrics = registry.get_agent_metrics("agent-001")

        assert metrics["total_tasks"] == 4
        assert metrics["successful_tasks"] == 3
        assert metrics["success_rate"] == 0.75
        assert abs(metrics["avg_duration"] - 11.475) < 0.01

    def test_agent_selection_strategy(self):
        """Test different agent selection strategies"""
        registry = AgentRegistry()

        # Register agents with different characteristics
        registry.register_agent("agent-001", "Fast", "worker",
                              ["task_a"], metadata={"speed": 10})
        registry.register_agent("agent-002", "Reliable", "worker",
                              ["task_a"], metadata={"reliability": 0.95})
        registry.register_agent("agent-003", "Efficient", "worker",
                              ["task_a"], metadata={"efficiency": 0.9})

        # Update loads
        registry.update_load("agent-001", 0.5)
        registry.update_load("agent-002", 0.3)
        registry.update_load("agent-003", 0.4)

        # Test different selection strategies
        # Load-based selection
        agent = registry.select_agent(capability="task_a", strategy="load")
        assert agent["agent_id"] == "agent-002"  # Lowest load

        # Round-robin selection
        selections = []
        for _ in range(6):
            agent = registry.select_agent(capability="task_a", strategy="round_robin")
            selections.append(agent["agent_id"])

        # Should cycle through all agents
        assert selections.count("agent-001") == 2
        assert selections.count("agent-002") == 2
        assert selections.count("agent-003") == 2

    def test_agent_resource_management(self):
        """Test agent resource tracking"""
        registry = AgentRegistry()

        agent = registry.register_agent(
            "agent-001", "Resource Agent", "worker", [],
            resources={
                "cpu_cores": 8,
                "memory_gb": 16,
                "disk_gb": 500,
                "gpu_available": True,
                "gpu_memory_gb": 8
            }
        )

        # Check resource availability
        assert registry.has_sufficient_resources(
            "agent-001",
            required={"cpu_cores": 4, "memory_gb": 8}
        )

        assert not registry.has_sufficient_resources(
            "agent-001",
            required={"cpu_cores": 16}  # More than available
        )

        # Allocate resources
        registry.allocate_resources("agent-001", {"cpu_cores": 4, "memory_gb": 8})
        agent = registry.get_agent("agent-001")
        assert agent["allocated_resources"]["cpu_cores"] == 4

        # Release resources
        registry.release_resources("agent-001", {"cpu_cores": 2})
        agent = registry.get_agent("agent-001")
        assert agent["allocated_resources"]["cpu_cores"] == 2


class AgentRegistry:
    """Simple agent registry for testing"""

    def __init__(self, heartbeat_timeout=60):
        self.agents = {}
        self.heartbeat_timeout = heartbeat_timeout
        self.round_robin_index = 0

    def register_agent(self, agent_id, name, agent_type, capabilities,
                      groups=None, resources=None, metadata=None):
        """Register new agent"""
        if agent_id in self.agents:
            raise ValueError(f"Agent {agent_id} already registered")

        agent = {
            "agent_id": agent_id,
            "name": name,
            "type": agent_type,
            "status": AgentStatus.ONLINE.value,
            "capabilities": capabilities,
            "groups": groups or [],
            "resources": resources or {},
            "allocated_resources": {},
            "registered_at": datetime.now().isoformat(),
            "last_heartbeat": datetime.now().isoformat(),
            "load": 0.0,
            "metadata": metadata or {},
            "metrics": {
                "total_tasks": 0,
                "successful_tasks": 0,
                "total_duration": 0
            }
        }

        self.agents[agent_id] = agent
        return agent

    def deregister_agent(self, agent_id):
        """Remove agent from registry"""
        if agent_id in self.agents:
            del self.agents[agent_id]

    def get_agent(self, agent_id):
        """Get agent by ID"""
        return self.agents.get(agent_id)

    def heartbeat(self, agent_id, status=None, load=None):
        """Update agent heartbeat"""
        if agent_id in self.agents:
            self.agents[agent_id]["last_heartbeat"] = datetime.now().isoformat()
            if status:
                self.agents[agent_id]["status"] = status.value
            if load is not None:
                self.agents[agent_id]["load"] = load

    def find_agents_by_capability(self, capability):
        """Find agents with specific capability"""
        return [a for a in self.agents.values()
                if capability in a["capabilities"]]

    def find_agents_by_type(self, agent_type):
        """Find agents by type"""
        return [a for a in self.agents.values()
                if a["type"] == agent_type]

    def get_online_agents(self):
        """Get all online agents"""
        return [a for a in self.agents.values()
                if a["status"] != AgentStatus.OFFLINE.value]

    def get_unhealthy_agents(self):
        """Get agents with stale heartbeats"""
        cutoff = datetime.now() - timedelta(seconds=self.heartbeat_timeout)
        unhealthy = []

        for agent in self.agents.values():
            last_heartbeat = datetime.fromisoformat(agent["last_heartbeat"])
            if last_heartbeat < cutoff:
                unhealthy.append(agent)

        return unhealthy

    def add_capability(self, agent_id, capability):
        """Add capability to agent"""
        if agent_id in self.agents:
            if capability not in self.agents[agent_id]["capabilities"]:
                self.agents[agent_id]["capabilities"].append(capability)

    def remove_capability(self, agent_id, capability):
        """Remove capability from agent"""
        if agent_id in self.agents:
            capabilities = self.agents[agent_id]["capabilities"]
            if capability in capabilities:
                capabilities.remove(capability)

    def update_capabilities(self, agent_id, capabilities):
        """Update agent capabilities"""
        if agent_id in self.agents:
            self.agents[agent_id]["capabilities"] = capabilities

    def update_load(self, agent_id, load):
        """Update agent load"""
        if agent_id in self.agents:
            self.agents[agent_id]["load"] = load

    def get_least_loaded_agent(self):
        """Get agent with lowest load"""
        online_agents = self.get_online_agents()
        if online_agents:
            return min(online_agents, key=lambda a: a.get("load", 0))
        return None

    def get_agents_below_load(self, threshold):
        """Get agents with load below threshold"""
        return [a for a in self.get_online_agents()
                if a.get("load", 0) < threshold]

    def get_agents_in_group(self, group):
        """Get agents in specific group"""
        return [a for a in self.agents.values()
                if group in a.get("groups", [])]

    def update_status(self, agent_id, status, validate_transition=False):
        """Update agent status"""
        if agent_id not in self.agents:
            return False

        current_status = self.agents[agent_id]["status"]

        if validate_transition:
            # Simple validation - offline agents must go online first
            if (current_status == AgentStatus.OFFLINE.value and
                status in [AgentStatus.BUSY, AgentStatus.IDLE]):
                return False

        self.agents[agent_id]["status"] = status.value
        return True

    def record_task_completion(self, agent_id, success, duration):
        """Record task completion metrics"""
        if agent_id in self.agents:
            metrics = self.agents[agent_id]["metrics"]
            metrics["total_tasks"] += 1
            if success:
                metrics["successful_tasks"] += 1
            metrics["total_duration"] += duration

    def get_agent_metrics(self, agent_id):
        """Get agent performance metrics"""
        if agent_id not in self.agents:
            return None

        metrics = self.agents[agent_id]["metrics"]
        total_tasks = metrics["total_tasks"]

        if total_tasks == 0:
            return {
                "total_tasks": 0,
                "successful_tasks": 0,
                "success_rate": 0,
                "avg_duration": 0
            }

        return {
            "total_tasks": total_tasks,
            "successful_tasks": metrics["successful_tasks"],
            "success_rate": metrics["successful_tasks"] / total_tasks,
            "avg_duration": metrics["total_duration"] / total_tasks
        }

    def select_agent(self, capability, strategy="load"):
        """Select agent based on strategy"""
        capable_agents = self.find_agents_by_capability(capability)

        if not capable_agents:
            return None

        if strategy == "load":
            return min(capable_agents, key=lambda a: a.get("load", 0))
        elif strategy == "round_robin":
            agent = capable_agents[self.round_robin_index % len(capable_agents)]
            self.round_robin_index += 1
            return agent

        return capable_agents[0]

    def has_sufficient_resources(self, agent_id, required):
        """Check if agent has sufficient resources"""
        if agent_id not in self.agents:
            return False

        agent = self.agents[agent_id]
        for resource, amount in required.items():
            available = agent["resources"].get(resource, 0)
            allocated = agent["allocated_resources"].get(resource, 0)
            if available - allocated < amount:
                return False

        return True

    def allocate_resources(self, agent_id, resources):
        """Allocate resources to task"""
        if agent_id in self.agents:
            for resource, amount in resources.items():
                current = self.agents[agent_id]["allocated_resources"].get(resource, 0)
                self.agents[agent_id]["allocated_resources"][resource] = current + amount

    def release_resources(self, agent_id, resources):
        """Release allocated resources"""
        if agent_id in self.agents:
            for resource, amount in resources.items():
                current = self.agents[agent_id]["allocated_resources"].get(resource, 0)
                self.agents[agent_id]["allocated_resources"][resource] = max(0, current - amount)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])