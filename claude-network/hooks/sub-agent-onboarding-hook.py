#!/usr/bin/env python3
"""
Sub-Agent Onboarding Hook

This hook automatically onboards sub-agents to the Sartor Claude Network
when they are spawned via the Task tool.

USAGE:
Configure this as a pre-task hook in Claude Code settings to ensure
all sub-agents are automatically network-aware.

Hook Type: pre-task-execution
Trigger: Before Task tool execution
Effect: Injects network context into sub-agent prompt
"""

import os
import sys
import json
from pathlib import Path


def load_network_context():
    """Load parent agent's network context"""
    context_file = Path.home() / ".sartor-network" / "context.json"

    if context_file.exists():
        with open(context_file, "r") as f:
            return json.load(f)

    # Check environment variables as fallback
    if os.getenv("SARTOR_FIREBASE_URL"):
        return {
            "firebase_url": os.getenv("SARTOR_FIREBASE_URL"),
            "agent_id": os.getenv("SARTOR_AGENT_ID", "unknown"),
            "parent_agent_id": os.getenv("SARTOR_PARENT_AGENT_ID"),
            "network_mode": "firebase",
        }

    return None


def generate_onboarding_injection(parent_context, sub_agent_id):
    """Generate the prompt injection for sub-agent onboarding"""

    firebase_url = parent_context.get("firebase_url")
    parent_id = parent_context.get("agent_id")

    return f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 SARTOR NETWORK - AUTOMATIC SUB-AGENT ONBOARDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a sub-agent in the Sartor Claude Network with full network access.

NETWORK IDENTITY:
├─ Your Agent ID: {sub_agent_id}
├─ Parent Agent:  {parent_id}
├─ Network Mode:  Firebase Realtime Database
└─ Firebase URL:  {firebase_url}

CONNECTION STATUS: ✅ AUTOMATICALLY CONNECTED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE NETWORK TOOLS (MCP via Firebase)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Communication:
  • message_send(to_agent, content)  - Send direct message
  • message_broadcast(content)       - Broadcast to all agents
  • message_read()                   - Read your messages

Task Coordination:
  • task_list(status="available")    - List tasks
  • task_claim(task_id)              - Claim a task
  • task_update(task_id, status)     - Update task status
  • task_create(title, description)  - Create new task

Knowledge Base:
  • knowledge_query(query)           - Search knowledge
  • knowledge_add(content, tags)     - Share knowledge

Agent Discovery:
  • agent_list()                     - See all agents
  • agent_status(agent_id)           - Check agent status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK START CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To use network tools, import the Firebase MCP client:

```python
from firebase_mcp_client import FirebaseMCPClient

# You're already registered! Just connect:
client = FirebaseMCPClient(
    firebase_url="{firebase_url}",
    agent_id="{sub_agent_id}",
    parent_agent_id="{parent_id}"
)
client.connect()

# Example: Send status update
client.message_broadcast("Sub-agent {sub_agent_id} ready!")

# Example: Query knowledge
results = client.knowledge_query("relevant topic")

# Example: Claim a task
tasks = client.task_list(status="available")
if tasks:
    client.task_claim(tasks[0]["task_id"])
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ You have FULL network access - use it freely
✓ Your parent agent ({parent_id}) can see your activity
✓ Coordinate with other agents via messages and tasks
✓ Share useful findings via knowledge_add()
✓ All network operations are logged for debugging

⚠️  Remember: You're part of a multi-agent system
⚠️  Communicate important findings to other agents
⚠️  Check for relevant tasks before starting new work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now proceeding with your assigned task...

"""


def hook_pre_task_execution(task_prompt, task_metadata):
    """
    Hook that runs before Task tool execution.
    Modifies the prompt to include network onboarding.

    Args:
        task_prompt: Original prompt for the sub-agent
        task_metadata: Metadata about the task (agent type, description, etc.)

    Returns:
        Modified prompt with network context injected
    """

    # Load parent's network context
    context = load_network_context()

    if not context:
        # Parent not connected to network - skip onboarding
        print("⚠️  Parent agent not connected to network - sub-agent will run without network access")
        return task_prompt

    # Generate sub-agent ID
    import time

    parent_id = context.get("agent_id", "unknown")
    timestamp = int(time.time())
    sub_agent_id = f"{parent_id}-subagent-{timestamp}"

    # Generate onboarding injection
    injection = generate_onboarding_injection(context, sub_agent_id)

    # Register sub-agent in Firebase (if possible)
    try:
        register_sub_agent_in_firebase(context, sub_agent_id, task_metadata)
    except Exception as e:
        print(f"Warning: Could not register sub-agent in Firebase: {e}")

    # Return modified prompt with network context
    modified_prompt = injection + "\n\n" + task_prompt

    print(f"✅ Sub-agent {sub_agent_id} will be onboarded automatically")
    return modified_prompt


def register_sub_agent_in_firebase(context, sub_agent_id, task_metadata):
    """Pre-register the sub-agent in Firebase"""
    import requests
    from datetime import datetime

    firebase_url = context.get("firebase_url")
    parent_id = context.get("agent_id")

    if not firebase_url:
        return

    # Create agent record
    agent_data = {
        "agent_id": sub_agent_id,
        "status": "spawning",
        "parent_agent_id": parent_id,
        "task_description": task_metadata.get("description", ""),
        "agent_type": task_metadata.get("subagent_type", "general-purpose"),
        "capabilities": ["communication", "tasks", "knowledge"],
        "joined_at": datetime.now().isoformat(),
    }

    url = f"{firebase_url}/agents-network/agents/{sub_agent_id}.json"
    requests.put(url, json=agent_data, timeout=5)

    print(f"📝 Pre-registered sub-agent {sub_agent_id} in Firebase")


def main():
    """
    Main entry point for the hook.
    Reads task info from stdin, outputs modified prompt to stdout.
    """

    # Read task info from stdin (provided by Claude Code)
    task_info = json.loads(sys.stdin.read())

    task_prompt = task_info.get("prompt", "")
    task_metadata = task_info.get("metadata", {})

    # Apply onboarding hook
    modified_prompt = hook_pre_task_execution(task_prompt, task_metadata)

    # Output modified prompt
    output = {"prompt": modified_prompt, "metadata": task_metadata}

    print(json.dumps(output), file=sys.stdout)


if __name__ == "__main__":
    # For testing, demonstrate the hook
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("Testing sub-agent onboarding hook...\n")

        # Simulate parent context
        test_context = {
            "firebase_url": "https://home-claude-network-default-rtdb.firebaseio.com/",
            "agent_id": "claude-test-parent",
            "network_mode": "firebase",
        }

        # Save test context
        context_dir = Path.home() / ".sartor-network"
        context_dir.mkdir(exist_ok=True)
        with open(context_dir / "context.json", "w") as f:
            json.dump(test_context, f, indent=2)

        # Test the hook
        test_task_metadata = {
            "description": "Test task",
            "subagent_type": "Explore",
        }

        test_prompt = "Find all TODO comments in the codebase"

        modified = hook_pre_task_execution(test_prompt, test_task_metadata)

        print(modified)
        print("\n" + "=" * 60)
        print("Hook test complete!")
    else:
        main()
