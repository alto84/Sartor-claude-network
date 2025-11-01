"""
Simplest Possible Multi-Claude Coordination
Uses a single JSON file in Dropbox/OneDrive/iCloud
"""

import json
from datetime import datetime
from pathlib import Path

# Path to shared cloud folder
SHARED_FILE = Path("/path/to/Dropbox/claude-network/coordination.json")

def send_message(agent_id, message, message_type="status"):
    """Add a message to the coordination file"""
    # Read current state
    if SHARED_FILE.exists():
        with open(SHARED_FILE) as f:
            data = json.load(f)
    else:
        data = {"messages": [], "agents": {}, "observations": []}

    # Add message
    data["messages"].append({
        "from": agent_id,
        "type": message_type,
        "message": message,
        "timestamp": datetime.now().isoformat()
    })

    # Update agent status
    data["agents"][agent_id] = {
        "last_seen": datetime.now().isoformat(),
        "status": "online"
    }

    # Keep only last 100 messages
    data["messages"] = data["messages"][-100:]

    # Write back
    with open(SHARED_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_messages(agent_id, last_n=10):
    """Get recent messages (excluding own)"""
    if not SHARED_FILE.exists():
        return []

    with open(SHARED_FILE) as f:
        data = json.load(f)

    messages = data.get("messages", [])
    # Filter out own messages
    messages = [m for m in messages if m.get("from") != agent_id]
    return messages[-last_n:]

def get_all_agents():
    """See who's online"""
    if not SHARED_FILE.exists():
        return {}

    with open(SHARED_FILE) as f:
        data = json.load(f)

    return data.get("agents", {})


# Example usage:
if __name__ == "__main__":
    # Desktop Claude
    send_message("desktop", "Mission control online")

    # iPad Claude
    send_message("ipad", "Scout ready for exploration")

    # Web Claude
    send_message("web", "Analysis node ready")

    # Read messages
    print("Recent messages:")
    for msg in get_messages("desktop"):
        print(f"  [{msg['from']}] {msg['message']}")
