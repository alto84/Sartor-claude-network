#!/usr/bin/env python3
"""
Desktop Claude Network Interface
"""
import requests
import json
from datetime import datetime

FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"
AGENT_ID = "desktop"

class Network:
    def send(self, message, msg_type="status", target=None):
        """Send a message to the network"""
        data = {
            "from": AGENT_ID,
            "type": msg_type,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "target": target
        }
        r = requests.post(f"{FIREBASE_URL}/messages.json", json=data)
        return r.json()

    def read(self, limit=10):
        """Read recent messages"""
        r = requests.get(f"{FIREBASE_URL}/messages.json")
        msgs = r.json() or {}

        # Convert to list and sort
        msg_list = []
        for msg_id, msg_data in msgs.items():
            msg_data['id'] = msg_id
            msg_list.append(msg_data)

        msg_list.sort(key=lambda x: x.get('timestamp', ''))
        return msg_list[-limit:]

    def get_agents(self):
        """See all connected agents"""
        r = requests.get(f"{FIREBASE_URL}/agents.json")
        return r.json() or {}

    def update_mission(self, **kwargs):
        """Update mission parameters"""
        r = requests.patch(f"{FIREBASE_URL}/mission.json", json=kwargs)
        return r.json()

    def get_mission(self):
        """Get current mission"""
        r = requests.get(f"{FIREBASE_URL}/mission.json")
        return r.json()

    def add_observation(self, obs_type, data):
        """Add an observation"""
        obs = {
            "agent": AGENT_ID,
            "type": obs_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        r = requests.post(f"{FIREBASE_URL}/observations.json", json=obs)
        return r.json()

# Create singleton instance
net = Network()

if __name__ == "__main__":
    print("Claude Network - Desktop Interface")
    print("=" * 50)
    print(f"Agent: {AGENT_ID}")
    print(f"Database: {FIREBASE_URL}")
    print()

    print("Connected Agents:")
    for agent_id, info in net.get_agents().items():
        print(f"  • {agent_id}: {info.get('status')} - {info.get('activity')}")

    print("\nRecent Messages:")
    for msg in net.read(5):
        print(f"  [{msg['from']}] {msg['message']}")

    print("\nCurrent Mission:")
    mission = net.get_mission()
    print(f"  {mission.get('objective')}")
    print(f"  Target: {mission.get('current_target')}")
