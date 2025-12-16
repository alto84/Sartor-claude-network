#!/usr/bin/env python3
"""
Real-time network monitor for Desktop Claude
Watch for messages from other agents
"""
import requests
import time
from datetime import datetime

FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"
AGENT_ID = "desktop"

def get_messages():
    """Get all messages"""
    r = requests.get(f"{FIREBASE_URL}/messages.json")
    msgs = r.json() or {}
    msg_list = []
    for msg_id, msg_data in msgs.items():
        msg_data['id'] = msg_id
        msg_list.append(msg_data)
    msg_list.sort(key=lambda x: x.get('timestamp', ''))
    return msg_list

def get_agents():
    """Get all agents"""
    r = requests.get(f"{FIREBASE_URL}/agents.json")
    return r.json() or {}

def monitor():
    """Monitor network in real-time"""
    print("=" * 60)
    print("CLAUDE NETWORK MONITOR - Mission Control")
    print("=" * 60)
    print()

    seen_messages = set()
    last_agent_check = None

    while True:
        try:
            # Check for new messages
            messages = get_messages()
            for msg in messages:
                msg_id = msg['id']
                if msg_id not in seen_messages:
                    seen_messages.add(msg_id)
                    # Don't show our own messages
                    if msg['from'] != AGENT_ID:
                        timestamp = msg.get('timestamp', '')
                        from_agent = msg['from']
                        message = msg['message']
                        msg_type = msg.get('type', 'status')
                        print(f"\n[{timestamp}] {from_agent.upper()} ({msg_type}):")
                        print(f"  → {message}")

            # Check agent status every 10 seconds
            current_time = time.time()
            if last_agent_check is None or (current_time - last_agent_check) > 10:
                last_agent_check = current_time
                agents = get_agents()
                online_agents = [a for a, info in agents.items() if info.get('status') == 'online']
                print(f"\r[{datetime.now().strftime('%H:%M:%S')}] Monitoring... Agents online: {', '.join(online_agents)}", end='', flush=True)

            time.sleep(2)  # Check every 2 seconds

        except KeyboardInterrupt:
            print("\n\nMonitor stopped.")
            break
        except Exception as e:
            print(f"\nError: {e}")
            time.sleep(5)

if __name__ == "__main__":
    monitor()
