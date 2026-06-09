# Connecting Local Inference Computer to Claude Network

## For Your Self-Hosted AI Node

When you're ready to connect your local inference computer, use this code:

### Python Connection Script

```python
#!/usr/bin/env python3
"""
Local Inference Node - Claude Network Connection
"""
import requests
from datetime import datetime

FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"
AGENT_ID = "local_inference"

def register():
    """Register this node with the network"""
    data = {
        "status": "online",
        "location": "local_network",
        "activity": "inference",
        "capabilities": ["llm_inference", "local_processing", "offline_mode"],
        "last_update": datetime.now().isoformat()
    }
    r = requests.put(f"{FIREBASE_URL}/agents/{AGENT_ID}.json", json=data)
    print(f"Registered: {r.status_code}")

def send_message(message):
    """Send a message to the network"""
    data = {
        "from": AGENT_ID,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    r = requests.post(f"{FIREBASE_URL}/messages.json", json=data)
    print(f"Message sent: {message}")

def listen():
    """Listen for messages directed to this node"""
    r = requests.get(f"{FIREBASE_URL}/messages.json")
    messages = r.json() or {}

    for msg_id, msg_data in messages.items():
        target = msg_data.get("target")
        if target == AGENT_ID or target is None:  # Broadcast or targeted
            print(f"[{msg_data['from']}]: {msg_data['message']}")

if __name__ == "__main__":
    print("Local Inference Node Starting...")
    register()
    send_message("Local inference node online. Ready for distributed AI tasks.")

    print("\nListening for network messages...")
    listen()
```

### Capabilities

Your local inference node can:
- Run models locally (no API calls needed)
- Process sensitive data offline
- Provide backup/redundancy
- Handle specialized models
- Coordinate with Desktop and iPad Claude

### Use Cases

1. **Privacy-sensitive processing** - Keep data local
2. **Offline operation** - Work without internet
3. **Custom models** - Run specialized/fine-tuned models
4. **High-throughput tasks** - Batch processing
5. **Experimentation** - Test new models/prompts

### Network Role

```
Desktop Claude ──→ Coordinates missions
       ↓
iPad Claude ──→ Collects observations
       ↓
Local Inference ──→ Processes data locally
       ↓
Results ──→ Back to network
```
