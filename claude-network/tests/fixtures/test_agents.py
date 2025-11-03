"""
Test agent configurations and utilities

Provides pre-configured test agents for various testing scenarios.
"""

from datetime import datetime
from typing import List, Dict, Any
import uuid


class TestAgent:
    """Test agent with configurable properties"""

    def __init__(self, agent_id: str = None, name: str = None,
                 agent_type: str = "worker", capabilities: List[str] = None,
                 status: str = "online", load: float = 0.0):
        """Initialize test agent"""
        self.agent_id = agent_id or f"test-agent-{uuid.uuid4().hex[:8]}"
        self.name = name or f"Test Agent {self.agent_id}"
        self.type = agent_type
        self.capabilities = capabilities or ["basic_task"]
        self.status = status
        self.load = load
        self.registered_at = datetime.now().isoformat()
        self.last_heartbeat = datetime.now().isoformat()
        self.metadata = {}
        self.tasks = []
        self.messages_sent = []
        self.messages_received = []

    def to_dict(self) -> Dict[str, Any]:
        """Convert agent to dictionary"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "type": self.type,
            "capabilities": self.capabilities,
            "status": self.status,
            "load": self.load,
            "registered_at": self.registered_at,
            "last_heartbeat": self.last_heartbeat,
            "metadata": self.metadata
        }

    def send_message(self, to: str, content: str, msg_type: str = "status") -> Dict:
        """Send a message"""
        message = {
            "from": self.agent_id,
            "to": to,
            "type": msg_type,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        self.messages_sent.append(message)
        return message

    def receive_message(self, message: Dict):
        """Receive a message"""
        self.messages_received.append(message)

    def execute_task(self, task: Dict) -> Dict:
        """Execute a task"""
        self.tasks.append(task)
        return {
            "task_id": task.get("task_id"),
            "status": "completed",
            "result": f"Task executed by {self.agent_id}"
        }

    def update_status(self, new_status: str):
        """Update agent status"""
        self.status = new_status
        self.last_heartbeat = datetime.now().isoformat()

    def update_load(self, new_load: float):
        """Update agent load"""
        self.load = min(1.0, max(0.0, new_load))


# Pre-configured test agents

def create_desktop_agent() -> TestAgent:
    """Create desktop/mission control agent"""
    return TestAgent(
        agent_id="desktop-001",
        name="Desktop Mission Control",
        agent_type="desktop",
        capabilities=[
            "coordination",
            "task_management",
            "data_processing",
            "visualization",
            "consensus_leadership"
        ],
        status="online",
        load=0.3
    )


def create_mobile_agent() -> TestAgent:
    """Create mobile/iPad agent"""
    return TestAgent(
        agent_id="mobile-001",
        name="Mobile Scout",
        agent_type="mobile",
        capabilities=[
            "observation",
            "image_capture",
            "location_tracking",
            "communication"
        ],
        status="online",
        load=0.2
    )


def create_worker_agent(index: int = 1) -> TestAgent:
    """Create worker agent"""
    return TestAgent(
        agent_id=f"worker-{index:03d}",
        name=f"Worker Agent {index}",
        agent_type="worker",
        capabilities=[
            "task_execution",
            "data_processing",
            "analysis",
            "reporting"
        ],
        status="online",
        load=0.5
    )


def create_specialized_agent(specialization: str) -> TestAgent:
    """Create agent with specific specialization"""
    specializations = {
        "vision": {
            "capabilities": ["image_processing", "object_detection", "face_recognition"],
            "type": "vision_specialist"
        },
        "nlp": {
            "capabilities": ["text_analysis", "sentiment_analysis", "translation"],
            "type": "nlp_specialist"
        },
        "data": {
            "capabilities": ["data_cleaning", "statistical_analysis", "visualization"],
            "type": "data_specialist"
        },
        "hardware": {
            "capabilities": ["sensor_reading", "device_control", "gpio_interface"],
            "type": "hardware_specialist"
        }
    }

    spec = specializations.get(specialization, specializations["data"])

    return TestAgent(
        agent_id=f"{specialization}-specialist-001",
        name=f"{specialization.title()} Specialist",
        agent_type=spec["type"],
        capabilities=spec["capabilities"],
        status="online",
        load=0.4
    )


def create_faulty_agent() -> TestAgent:
    """Create agent that simulates errors"""
    agent = TestAgent(
        agent_id="faulty-001",
        name="Faulty Agent",
        agent_type="worker",
        capabilities=["unreliable_task"],
        status="error",
        load=0.9
    )
    agent.metadata["error_rate"] = 0.5
    agent.metadata["last_error"] = "Connection timeout"
    return agent


def create_offline_agent() -> TestAgent:
    """Create offline agent"""
    return TestAgent(
        agent_id="offline-001",
        name="Offline Agent",
        agent_type="worker",
        capabilities=["task_execution"],
        status="offline",
        load=0.0
    )


def create_overloaded_agent() -> TestAgent:
    """Create overloaded agent"""
    return TestAgent(
        agent_id="overloaded-001",
        name="Overloaded Agent",
        agent_type="worker",
        capabilities=["task_execution", "data_processing"],
        status="busy",
        load=0.95
    )


def create_agent_network(size: int = 5) -> List[TestAgent]:
    """Create a network of diverse agents"""
    agents = []

    # Always include core agents
    agents.append(create_desktop_agent())
    agents.append(create_mobile_agent())

    # Add workers
    for i in range(1, min(size - 1, 4)):
        agents.append(create_worker_agent(i))

    # Add specialists if size allows
    if size > 5:
        agents.append(create_specialized_agent("vision"))
    if size > 6:
        agents.append(create_specialized_agent("nlp"))
    if size > 7:
        agents.append(create_specialized_agent("data"))

    # Add problematic agents for testing
    if size > 8:
        agents.append(create_faulty_agent())
    if size > 9:
        agents.append(create_offline_agent())

    return agents[:size]


class MockAgentCoordinator:
    """Mock agent coordinator for testing"""

    def __init__(self, agents: List[TestAgent] = None):
        """Initialize coordinator with agents"""
        self.agents = agents or []
        self.task_queue = []
        self.consensus_proposals = []

    def add_agent(self, agent: TestAgent):
        """Add agent to coordination"""
        self.agents.append(agent)

    def remove_agent(self, agent_id: str):
        """Remove agent from coordination"""
        self.agents = [a for a in self.agents if a.agent_id != agent_id]

    def get_agent(self, agent_id: str) -> TestAgent:
        """Get agent by ID"""
        for agent in self.agents:
            if agent.agent_id == agent_id:
                return agent
        return None

    def get_available_agents(self, capability: str = None) -> List[TestAgent]:
        """Get available agents with optional capability filter"""
        available = []
        for agent in self.agents:
            if agent.status in ["online", "idle"]:
                if capability is None or capability in agent.capabilities:
                    available.append(agent)
        return available

    def assign_task(self, task: Dict) -> TestAgent:
        """Assign task to best available agent"""
        required_capability = task.get("required_capability", "task_execution")
        available = self.get_available_agents(required_capability)

        if not available:
            return None

        # Select agent with lowest load
        best_agent = min(available, key=lambda a: a.load)
        best_agent.tasks.append(task)
        best_agent.load += 0.1  # Increase load

        return best_agent

    def broadcast_message(self, from_agent: str, content: str, msg_type: str = "status"):
        """Broadcast message to all agents"""
        sender = self.get_agent(from_agent)
        if not sender:
            return

        message = sender.send_message("broadcast", content, msg_type)

        for agent in self.agents:
            if agent.agent_id != from_agent:
                agent.receive_message(message)

    def initiate_consensus(self, proposal: Dict) -> Dict:
        """Initiate consensus among agents"""
        proposal_id = f"proposal-{uuid.uuid4().hex[:8]}"
        consensus = {
            "proposal_id": proposal_id,
            "proposal": proposal,
            "votes": {},
            "status": "voting",
            "initiated_at": datetime.now().isoformat()
        }

        # Collect votes from online agents
        for agent in self.agents:
            if agent.status == "online":
                # Simulate voting (simple majority for testing)
                vote = "approve" if agent.load < 0.7 else "reject"
                consensus["votes"][agent.agent_id] = vote

        # Determine outcome
        approve_count = sum(1 for v in consensus["votes"].values() if v == "approve")
        total_votes = len(consensus["votes"])

        if approve_count > total_votes / 2:
            consensus["status"] = "approved"
        else:
            consensus["status"] = "rejected"

        self.consensus_proposals.append(consensus)
        return consensus

    def get_network_health(self) -> Dict:
        """Get network health metrics"""
        total_agents = len(self.agents)
        online_agents = sum(1 for a in self.agents if a.status == "online")
        avg_load = sum(a.load for a in self.agents) / total_agents if total_agents > 0 else 0

        return {
            "total_agents": total_agents,
            "online_agents": online_agents,
            "offline_agents": total_agents - online_agents,
            "average_load": avg_load,
            "health_score": online_agents / total_agents if total_agents > 0 else 0
        }


# Test scenario generators

def create_high_load_scenario() -> MockAgentCoordinator:
    """Create scenario with high system load"""
    agents = [
        create_overloaded_agent(),
        create_worker_agent(1),
        create_worker_agent(2)
    ]

    # Set high loads
    agents[1].load = 0.8
    agents[2].load = 0.85

    return MockAgentCoordinator(agents)


def create_partial_failure_scenario() -> MockAgentCoordinator:
    """Create scenario with some agents failing"""
    agents = [
        create_desktop_agent(),
        create_offline_agent(),
        create_faulty_agent(),
        create_worker_agent(1)
    ]

    return MockAgentCoordinator(agents)


def create_consensus_test_scenario() -> MockAgentCoordinator:
    """Create scenario for consensus testing"""
    agents = []

    # Create agents with varying loads for voting behavior
    for i in range(5):
        agent = create_worker_agent(i)
        agent.load = 0.3 + (i * 0.15)  # Gradual load increase
        agents.append(agent)

    return MockAgentCoordinator(agents)


if __name__ == "__main__":
    # Example usage
    print("Creating test agents...")

    # Create individual agents
    desktop = create_desktop_agent()
    print(f"Desktop Agent: {desktop.to_dict()}")

    mobile = create_mobile_agent()
    print(f"Mobile Agent: {mobile.to_dict()}")

    # Create agent network
    network = create_agent_network(7)
    print(f"\nCreated network with {len(network)} agents")

    # Test coordinator
    coordinator = MockAgentCoordinator(network)

    # Test task assignment
    test_task = {
        "task_id": "task-001",
        "title": "Process data",
        "required_capability": "data_processing"
    }

    assigned = coordinator.assign_task(test_task)
    if assigned:
        print(f"\nTask assigned to: {assigned.agent_id}")

    # Test consensus
    proposal = {"action": "update_config", "parameter": "max_agents", "value": 20}
    consensus = coordinator.initiate_consensus(proposal)
    print(f"\nConsensus result: {consensus['status']}")

    # Network health
    health = coordinator.get_network_health()
    print(f"\nNetwork health: {health}")