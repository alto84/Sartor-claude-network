#!/usr/bin/env python3
"""
Firebase MCP Client - Implements MCP protocol using Firebase Realtime Database
This allows Claude agents to communicate without a dedicated MCP server
"""

import json
import time
import uuid
import requests
from datetime import datetime
from typing import Dict, Any, Optional, Callable, List
from urllib.parse import urljoin


class FirebaseMCPClient:
    """
    MCP Client that uses Firebase Realtime Database as the transport layer.
    No separate MCP server needed - Firebase IS the MCP.
    """

    def __init__(
        self,
        firebase_url: str = "https://home-claude-network-default-rtdb.firebaseio.com/",
        agent_id: Optional[str] = None,
        parent_agent_id: Optional[str] = None,
    ):
        self.firebase_url = firebase_url.rstrip("/")
        self.agent_id = agent_id or self._generate_agent_id()
        self.parent_agent_id = parent_agent_id
        self.base_path = "/agents-network"
        self.message_callbacks: Dict[str, Callable] = {}
        self.is_connected = False

    def _generate_agent_id(self) -> str:
        """Generate unique agent ID"""
        timestamp = int(time.time())
        random_id = str(uuid.uuid4())[:8]
        return f"claude-{timestamp}-{random_id}"

    def _firebase_path(self, path: str) -> str:
        """Construct full Firebase path"""
        return f"{self.base_path}{path}.json"

    def _firebase_request(
        self, method: str, path: str, data: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make HTTP request to Firebase REST API"""
        url = f"{self.firebase_url}{self._firebase_path(path)}"

        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
            elif method == "PATCH":
                response = requests.patch(url, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            print(f"Firebase request failed: {e}")
            return None

    def connect(self) -> bool:
        """
        Connect to Firebase network and register agent.
        This is the equivalent of connecting to an MCP server.
        """
        print(f"Connecting agent {self.agent_id} to Firebase network...")

        # Register agent in the network
        agent_data = {
            "agent_id": self.agent_id,
            "status": "online",
            "capabilities": ["communication", "tasks", "skills", "knowledge"],
            "parent_agent_id": self.parent_agent_id,
            "joined_at": datetime.now().isoformat(),
            "last_seen": datetime.now().isoformat(),
        }

        result = self._firebase_request("PUT", f"/agents/{self.agent_id}", agent_data)

        if result:
            # Set presence
            presence_data = {"online": True, "last_seen": datetime.now().isoformat()}
            self._firebase_request("PUT", f"/presence/{self.agent_id}", presence_data)

            self.is_connected = True
            print(f"✅ Agent {self.agent_id} connected to Firebase network")
            return True
        else:
            print(f"❌ Failed to connect agent {self.agent_id}")
            return False

    def disconnect(self):
        """Disconnect from network and mark agent offline"""
        if not self.is_connected:
            return

        # Update status
        self._firebase_request(
            "PATCH",
            f"/agents/{self.agent_id}",
            {"status": "offline", "last_seen": datetime.now().isoformat()},
        )

        # Update presence
        self._firebase_request(
            "PATCH",
            f"/presence/{self.agent_id}",
            {"online": False, "last_seen": datetime.now().isoformat()},
        )

        self.is_connected = False
        print(f"Agent {self.agent_id} disconnected")

    # === MCP Tool Implementations ===

    def message_send(self, to_agent_id: str, content: str) -> bool:
        """Send direct message to another agent"""
        message_id = str(uuid.uuid4())
        message_data = {
            "from": self.agent_id,
            "to": to_agent_id,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "read": False,
        }

        result = self._firebase_request(
            "PUT", f"/messages/direct/{to_agent_id}/{message_id}", message_data
        )

        success = result is not None
        if success:
            print(f"📤 Message sent to {to_agent_id}")
        return success

    def message_broadcast(self, content: str) -> bool:
        """Broadcast message to all agents"""
        message_id = str(uuid.uuid4())
        message_data = {
            "from": self.agent_id,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        }

        result = self._firebase_request(
            "PUT", f"/messages/broadcast/{message_id}", message_data
        )

        success = result is not None
        if success:
            print(f"📢 Broadcast sent: {content}")
        return success

    def message_read(self, count: int = 10) -> List[Dict]:
        """Read messages for this agent"""
        messages = self._firebase_request("GET", f"/messages/direct/{self.agent_id}")

        if not messages:
            return []

        # Convert to list and sort by timestamp
        message_list = []
        for msg_id, msg_data in messages.items():
            if isinstance(msg_data, dict):
                msg_data["message_id"] = msg_id
                message_list.append(msg_data)

        message_list.sort(
            key=lambda x: x.get("timestamp", ""), reverse=True
        )
        return message_list[:count]

    def task_list(self, status: str = "available") -> List[Dict]:
        """List tasks with given status"""
        tasks = self._firebase_request("GET", "/tasks")

        if not tasks:
            return []

        # Filter by status
        task_list = []
        for task_id, task_data in tasks.items():
            if isinstance(task_data, dict) and task_data.get("status") == status:
                task_data["task_id"] = task_id
                task_list.append(task_data)

        return task_list

    def task_claim(self, task_id: str) -> bool:
        """Claim an available task"""
        # First check if task is available
        task = self._firebase_request("GET", f"/tasks/{task_id}")

        if not task or task.get("status") != "available":
            print(f"❌ Task {task_id} not available")
            return False

        # Claim the task
        claim_data = {
            "status": "claimed",
            "claimed_by": self.agent_id,
            "claimed_at": datetime.now().isoformat(),
        }

        result = self._firebase_request("PATCH", f"/tasks/{task_id}", claim_data)

        success = result is not None
        if success:
            print(f"✅ Claimed task {task_id}")
        return success

    def task_create(
        self, title: str, description: str, task_data: Optional[Dict] = None
    ) -> str:
        """Create a new task"""
        task_id = str(uuid.uuid4())
        task = {
            "task_id": task_id,
            "title": title,
            "description": description,
            "status": "available",
            "created_by": self.agent_id,
            "created_at": datetime.now().isoformat(),
            "data": task_data or {},
        }

        result = self._firebase_request("PUT", f"/tasks/{task_id}", task)

        if result:
            print(f"📝 Created task: {title}")
            return task_id
        return ""

    def task_update(self, task_id: str, status: str, result: Optional[Dict] = None):
        """Update task status"""
        update_data = {
            "status": status,
            "updated_by": self.agent_id,
            "updated_at": datetime.now().isoformat(),
        }

        if result:
            update_data["result"] = result

        self._firebase_request("PATCH", f"/tasks/{task_id}", update_data)
        print(f"📊 Updated task {task_id} to {status}")

    def knowledge_add(self, content: str, tags: List[str] = None) -> str:
        """Add knowledge to collective knowledge base"""
        knowledge_id = str(uuid.uuid4())
        knowledge_data = {
            "content": content,
            "added_by": self.agent_id,
            "timestamp": datetime.now().isoformat(),
            "tags": tags or [],
        }

        result = self._firebase_request(
            "PUT", f"/knowledge/{knowledge_id}", knowledge_data
        )

        if result:
            print(f"🧠 Added knowledge: {content[:50]}...")
            return knowledge_id
        return ""

    def knowledge_query(self, query: str = None) -> List[Dict]:
        """Query knowledge base"""
        knowledge = self._firebase_request("GET", "/knowledge")

        if not knowledge:
            return []

        # Convert to list
        knowledge_list = []
        for k_id, k_data in knowledge.items():
            if isinstance(k_data, dict):
                k_data["knowledge_id"] = k_id

                # Simple text search if query provided
                if query:
                    content = k_data.get("content", "").lower()
                    if query.lower() in content:
                        knowledge_list.append(k_data)
                else:
                    knowledge_list.append(k_data)

        return knowledge_list

    def agent_list(self) -> List[Dict]:
        """List all online agents"""
        agents = self._firebase_request("GET", "/agents")

        if not agents:
            return []

        # Filter online agents
        agent_list = []
        for agent_id, agent_data in agents.items():
            if isinstance(agent_data, dict):
                agent_data["agent_id"] = agent_id
                agent_list.append(agent_data)

        return agent_list

    def heartbeat(self):
        """Send heartbeat to maintain presence"""
        if not self.is_connected:
            return

        presence_data = {
            "online": True,
            "last_seen": datetime.now().isoformat(),
        }

        self._firebase_request("PATCH", f"/presence/{self.agent_id}", presence_data)

    # === Sub-Agent Support ===

    def create_sub_agent_context(self, task_description: str = "") -> Dict[str, str]:
        """
        Create context for a sub-agent to inherit network connection.
        This enables automatic onboarding of sub-agents.
        """
        return {
            "SARTOR_FIREBASE_URL": self.firebase_url,
            "SARTOR_PARENT_AGENT_ID": self.agent_id,
            "SARTOR_NETWORK_MODE": "firebase",
            "SARTOR_TASK_DESCRIPTION": task_description,
        }

    def get_sub_agent_prompt_injection(self, sub_agent_id: str = None) -> str:
        """
        Get prompt text to inject into sub-agent for automatic onboarding.
        This is the KEY to ensuring sub-agents are network-aware!
        """
        if not sub_agent_id:
            sub_agent_id = f"{self.agent_id}-subagent-{int(time.time())}"

        return f"""
[SARTOR NETWORK CONTEXT - AUTO-ONBOARDING]

You are a sub-agent in the Sartor Claude Network.
Parent Agent: {self.agent_id}
Your Agent ID: {sub_agent_id}
Firebase URL: {self.firebase_url}

NETWORK ACCESS:
You are automatically connected to the network via Firebase.
Use the FirebaseMCPClient to interact with the network:

```python
from firebase_mcp_client import FirebaseMCPClient

# Initialize (you're already registered!)
client = FirebaseMCPClient(
    firebase_url="{self.firebase_url}",
    agent_id="{sub_agent_id}",
    parent_agent_id="{self.agent_id}"
)

# Connect to network
client.connect()

# Use network tools
client.message_broadcast("Sub-agent reporting!")
client.task_list()
client.knowledge_query("relevant information")
```

AVAILABLE MCP TOOLS:
- message_send(to, content) - Send direct message
- message_broadcast(content) - Broadcast to all agents
- task_list(status) - List tasks
- task_claim(task_id) - Claim a task
- knowledge_query(query) - Search knowledge
- knowledge_add(content, tags) - Share knowledge
- agent_list() - See all agents

You have full network access. Coordinate with other agents as needed.
"""

    def spawn_network_aware_subagent(
        self, task_prompt: str, agent_type: str = "general-purpose"
    ) -> str:
        """
        Helper to spawn a sub-agent with automatic network onboarding.
        Returns the sub-agent ID.
        """
        sub_agent_id = f"{self.agent_id}-subagent-{int(time.time())}"

        # Register sub-agent in Firebase
        sub_agent_data = {
            "agent_id": sub_agent_id,
            "status": "spawning",
            "parent_agent_id": self.agent_id,
            "capabilities": ["communication", "tasks"],
            "joined_at": datetime.now().isoformat(),
        }

        self._firebase_request("PUT", f"/agents/{sub_agent_id}", sub_agent_data)

        # Create enhanced prompt with network context
        enhanced_prompt = (
            self.get_sub_agent_prompt_injection(sub_agent_id) + "\n\n" + task_prompt
        )

        print(f"🚀 Spawning network-aware sub-agent: {sub_agent_id}")
        print(f"📝 Enhanced prompt includes Firebase onboarding")

        return sub_agent_id


def example_usage():
    """Example of how to use the Firebase MCP Client"""

    # Parent agent connects
    print("=== Parent Agent Onboarding ===")
    parent = FirebaseMCPClient()
    parent.connect()

    # Send a message
    parent.message_broadcast("Parent agent online!")

    # Add knowledge
    parent.knowledge_add("Firebase can be used as MCP transport", ["mcp", "firebase"])

    # Create a task
    task_id = parent.task_create(
        "Analyze codebase", "Find all TODO comments", {"path": "/src"}
    )

    # === SUB-AGENT SPAWNING WITH AUTO-ONBOARDING ===
    print("\n=== Spawning Sub-Agent with Network Access ===")

    # Get the prompt injection for sub-agent
    sub_agent_prompt = parent.get_sub_agent_prompt_injection()

    print("Sub-agent will receive this onboarding context:")
    print(sub_agent_prompt)

    # In practice, you would use Task tool with this prompt:
    # Task(
    #     description="Analyze code",
    #     prompt=sub_agent_prompt + "\n\nYour actual task...",
    #     subagent_type="Explore"
    # )

    # Simulate sub-agent connecting
    print("\n=== Sub-Agent Auto-Connecting ===")
    sub_agent_id = f"{parent.agent_id}-subagent-1"
    sub_agent = FirebaseMCPClient(
        agent_id=sub_agent_id, parent_agent_id=parent.agent_id
    )
    sub_agent.connect()

    # Sub-agent uses network
    sub_agent.message_broadcast("Sub-agent reporting for duty!")
    sub_agent.task_claim(task_id)

    # List all agents
    print("\n=== Network Agents ===")
    agents = parent.agent_list()
    for agent in agents:
        print(f"  - {agent.get('agent_id')}: {agent.get('status')}")

    # Cleanup
    print("\n=== Disconnecting ===")
    sub_agent.disconnect()
    parent.disconnect()


if __name__ == "__main__":
    example_usage()
