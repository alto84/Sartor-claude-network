#!/usr/bin/env python3
"""
Network status viewer - see what's happening on the Claude Network
"""
import requests
import json
from datetime import datetime

PROXY_URL = "http://localhost:8080"

def print_header(text):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def show_status():
    """Display network status"""

    print_header("CLAUDE NETWORK STATUS")

    # Get agents
    try:
        response = requests.get(f"{PROXY_URL}/agents")
        agents = response.json()

        print("\n📡 CONNECTED AGENTS:")
        if agents:
            for agent_id, info in agents.items():
                status = info.get('status', 'unknown')
                location = info.get('location', 'unknown')
                activity = info.get('activity', 'unknown')
                indicator = "🟢" if status == "online" else "🔴"
                print(f"  {indicator} {agent_id:15s} | {location:15s} | {activity}")
        else:
            print("  No agents connected")

    except Exception as e:
        print(f"  ✗ Error getting agents: {e}")

    # Get mission
    try:
        response = requests.get(f"{PROXY_URL}/mission")
        mission = response.json()

        print("\n🎯 CURRENT MISSION:")
        print(f"  Objective: {mission.get('objective', 'None')}")
        print(f"  Target: {mission.get('current_target', 'None')}")
        print(f"  Status: {mission.get('status', 'None')}")

    except Exception as e:
        print(f"  ✗ Error getting mission: {e}")

    # Get recent messages
    try:
        response = requests.get(f"{PROXY_URL}/messages?limit=5")
        messages = response.json()

        print("\n💬 RECENT MESSAGES:")
        if messages:
            for msg in messages:
                from_agent = msg.get('from', 'unknown')
                message = msg.get('message', '')
                timestamp = msg.get('timestamp', '')
                msg_type = msg.get('type', 'status')

                # Format timestamp
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    time_str = dt.strftime('%H:%M:%S')
                except:
                    time_str = timestamp

                print(f"  [{time_str}] {from_agent:10s} ({msg_type})")
                print(f"    → {message}")
        else:
            print("  No messages")

    except Exception as e:
        print(f"  ✗ Error getting messages: {e}")

    # Proxy info
    print("\n🔌 PROXY SERVER:")
    print(f"  URL: {PROXY_URL}")
    print(f"  Status page: {PROXY_URL}/status")

    print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    show_status()
