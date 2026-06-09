#!/usr/bin/env python3
"""
Quick relay tool for sending messages on behalf of iPad Claude
"""
import sys
import requests

PROXY_URL = "http://localhost:8080"

def send_as_ipad(message):
    """Send a message as iPad Claude"""
    data = {
        "agent": "ipad",
        "message": message,
        "type": "scout_report"
    }

    response = requests.post(f"{PROXY_URL}/send", json=data)
    if response.status_code == 200:
        print(f"✓ Message sent from iPad Claude: {message}")
        return True
    else:
        print(f"✗ Failed to send message: {response.text}")
        return False

def register_ipad():
    """Register iPad Claude"""
    data = {
        "agent": "ipad",
        "location": "mobile",
        "activity": "scout"
    }

    response = requests.post(f"{PROXY_URL}/register", json=data)
    if response.status_code == 200:
        print("✓ iPad Claude registered on network")
        return True
    else:
        print(f"✗ Failed to register: {response.text}")
        return False

def get_mission():
    """Get current mission for iPad"""
    response = requests.get(f"{PROXY_URL}/mission")
    if response.status_code == 200:
        mission = response.json()
        print("\nCurrent Mission:")
        print(f"  Objective: {mission.get('objective')}")
        print(f"  Target: {mission.get('current_target')}")
        print(f"  Status: {mission.get('status')}")
    else:
        print(f"✗ Failed to get mission: {response.text}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 relay.py register          - Register iPad Claude")
        print("  python3 relay.py mission           - Get current mission")
        print("  python3 relay.py send \"message\"    - Send message as iPad")
        print()
        print("Example:")
        print('  python3 relay.py send "Found the kitchen. Lots of appliances here."')
        sys.exit(1)

    command = sys.argv[1]

    if command == "register":
        register_ipad()
        get_mission()
    elif command == "mission":
        get_mission()
    elif command == "send":
        if len(sys.argv) < 3:
            print("Error: Please provide a message")
            sys.exit(1)
        message = " ".join(sys.argv[2:])
        send_as_ipad(message)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
