"""
Claude Network Coordination API
Simple Python helpers for Claude instances to communicate via Firebase
"""

import requests
import json
from datetime import datetime
import time

class ClaudeNetwork:
    """Coordination layer for multiple Claude instances"""

    def __init__(self, firebase_url, agent_id):
        """
        firebase_url: Your Firebase Realtime Database URL
        agent_id: Unique ID for this Claude instance (e.g., 'desktop', 'web', 'ipad')
        """
        self.base_url = firebase_url.rstrip('/')
        self.agent_id = agent_id

    def send_message(self, message, message_type="status", target=None):
        """Send a message to the network"""
        data = {
            "from": self.agent_id,
            "type": message_type,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "target": target  # None = broadcast, or specific agent ID
        }

        # Push to messages queue
        url = f"{self.base_url}/messages.json"
        response = requests.post(url, json=data)
        return response.json()

    def get_messages(self, since_timestamp=None, for_me=True):
        """Get messages from the network"""
        url = f"{self.base_url}/messages.json"
        response = requests.get(url)

        if response.status_code != 200:
            return []

        messages = response.json() or {}

        # Convert to list and filter
        msg_list = []
        for msg_id, msg_data in messages.items():
            # Filter: messages for me (broadcast or targeted)
            if for_me:
                if msg_data.get("target") and msg_data["target"] != self.agent_id:
                    continue
                if msg_data.get("from") == self.agent_id:
                    continue  # Don't return our own messages

            # Filter by timestamp if requested
            if since_timestamp:
                if msg_data.get("timestamp", "") <= since_timestamp:
                    continue

            msg_data["id"] = msg_id
            msg_list.append(msg_data)

        # Sort by timestamp
        msg_list.sort(key=lambda x: x.get("timestamp", ""))
        return msg_list

    def update_status(self, status, location=None, activity=None):
        """Update this agent's status"""
        data = {
            "status": status,
            "location": location,
            "activity": activity,
            "last_update": datetime.now().isoformat()
        }

        url = f"{self.base_url}/agents/{self.agent_id}.json"
        response = requests.patch(url, json=data)
        return response.json()

    def get_all_agents(self):
        """Get status of all agents in the network"""
        url = f"{self.base_url}/agents.json"
        response = requests.get(url)
        return response.json() or {}

    def share_observation(self, observation_type, data, photo_url=None):
        """Share an observation (for exploration missions)"""
        obs = {
            "agent": self.agent_id,
            "type": observation_type,
            "data": data,
            "photo_url": photo_url,
            "timestamp": datetime.now().isoformat()
        }

        url = f"{self.base_url}/observations.json"
        response = requests.post(url, json=obs)
        return response.json()

    def get_mission(self):
        """Get current mission from mission control"""
        url = f"{self.base_url}/mission.json"
        response = requests.get(url)
        return response.json()

    def set_mission(self, mission_data):
        """Set mission (mission control only)"""
        url = f"{self.base_url}/mission.json"
        response = requests.put(url, json=mission_data)
        return response.json()


# Example usage functions
def demo_desktop_claude(firebase_url):
    """Example: Desktop Claude as Mission Control"""
    network = ClaudeNetwork(firebase_url, "desktop")

    # Announce presence
    network.update_status("online", location="base_station", activity="mission_control")
    network.send_message("Desktop Claude online. Mission control ready.")

    # Set a mission
    network.set_mission({
        "objective": "Explore the house room by room",
        "current_target": "kitchen",
        "instructions": "Take photos and report interesting findings"
    })

    print("Mission control initialized!")

    # Listen for messages
    print("\nListening for messages...")
    last_check = datetime.now().isoformat()
    while True:
        messages = network.get_messages(since_timestamp=last_check)
        for msg in messages:
            print(f"\n[{msg['from']}]: {msg['message']}")
            last_check = msg['timestamp']
        time.sleep(2)


def demo_ipad_claude(firebase_url):
    """Example: iPad Claude as Scout"""
    network = ClaudeNetwork(firebase_url, "ipad")

    # Announce presence
    network.update_status("online", location="unknown", activity="awaiting_orders")
    network.send_message("iPad Scout online. Ready for exploration!")

    # Get mission
    mission = network.get_mission()
    print(f"Current mission: {mission}")

    # Share an observation
    network.share_observation(
        observation_type="room_discovery",
        data={"room_type": "kitchen", "features": ["sink", "refrigerator", "window"]}
    )

    network.send_message("Kitchen explored. Awaiting next target.", message_type="report")


if __name__ == "__main__":
    print("Claude Network API")
    print("------------------")
    print("\nTo use:")
    print("1. Set up Firebase Realtime Database")
    print("2. Get your database URL")
    print("3. Create a ClaudeNetwork instance with your URL and agent ID")
    print("\nExample:")
    print('  network = ClaudeNetwork("https://your-db.firebaseio.com/", "desktop")')
    print('  network.send_message("Hello from Desktop Claude!")')
