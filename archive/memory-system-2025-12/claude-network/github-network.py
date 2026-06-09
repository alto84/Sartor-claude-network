#!/usr/bin/env python3
"""
GitHub-based Claude Network
Simple file-based message passing using git
"""
import json
import subprocess
import os
from datetime import datetime
from pathlib import Path

NETWORK_DIR = Path(__file__).parent
MESSAGES_DIR = NETWORK_DIR / "messages"
AGENTS_DIR = NETWORK_DIR / "agents"
MISSION_FILE = NETWORK_DIR / "mission.json"

class GitHubNetwork:
    def __init__(self, agent_id="desktop"):
        self.agent_id = agent_id
        self.message_counter = self._get_message_count()

    def _get_message_count(self):
        """Count existing messages from this agent"""
        pattern = f"{self.agent_id}-*.json"
        existing = list(MESSAGES_DIR.glob(pattern))
        if not existing:
            return 1
        # Get highest number
        numbers = []
        for f in existing:
            try:
                num = int(f.stem.split('-')[1])
                numbers.append(num)
            except:
                pass
        return max(numbers) + 1 if numbers else 1

    def _git(self, *args):
        """Run git command"""
        result = subprocess.run(
            ['git'] + list(args),
            cwd=NETWORK_DIR.parent,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr

    def sync(self):
        """Pull latest changes from remote"""
        print("📥 Syncing with network...")
        success, stdout, stderr = self._git('pull', '--rebase')
        if success:
            print("✓ Sync complete")
            return True
        else:
            # If no remote configured, that's okay
            if 'no tracking information' in stderr.lower() or 'not a git repository' in stderr.lower():
                print("⚠ No remote configured (local only mode)")
                return True
            print(f"✗ Sync failed: {stderr}")
            return False

    def send_message(self, message, msg_type="status", target="all"):
        """Send a message to the network"""
        # Create message file
        msg_id = f"{self.agent_id}-{self.message_counter:03d}"
        msg_file = MESSAGES_DIR / f"{msg_id}.json"

        msg_data = {
            "id": msg_id,
            "from": self.agent_id,
            "to": target,
            "type": msg_type,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }

        with open(msg_file, 'w') as f:
            json.dump(msg_data, f, indent=2)

        # Git add, commit, push
        self._git('add', str(msg_file.relative_to(NETWORK_DIR.parent)))
        commit_msg = f"{self.agent_id}: {message[:50]}"
        self._git('commit', '-m', commit_msg)

        # Try to push (may fail if no remote)
        success, stdout, stderr = self._git('push')
        if not success and 'no configured push destination' in stderr.lower():
            print(f"✓ Message saved locally: {msg_id}")
            print("  (No remote configured - push manually when ready)")
        elif success:
            print(f"✓ Message sent to network: {msg_id}")
        else:
            print(f"⚠ Message saved locally but push failed: {stderr}")

        self.message_counter += 1
        return msg_id

    def read_messages(self, limit=10, from_agent=None):
        """Read recent messages"""
        messages = []

        for msg_file in MESSAGES_DIR.glob("*.json"):
            if msg_file.name == '.gitkeep':
                continue

            try:
                with open(msg_file) as f:
                    msg_data = json.load(f)

                # Filter by agent if specified
                if from_agent and msg_data.get('from') != from_agent:
                    continue

                # Don't show own messages
                if msg_data.get('from') == self.agent_id:
                    continue

                messages.append(msg_data)
            except Exception as e:
                print(f"⚠ Error reading {msg_file}: {e}")

        # Sort by timestamp
        messages.sort(key=lambda x: x.get('timestamp', ''))
        return messages[-limit:]

    def update_status(self, status="online", location=None, activity=None):
        """Update agent status"""
        agent_file = AGENTS_DIR / f"{self.agent_id}.json"

        if agent_file.exists():
            with open(agent_file) as f:
                agent_data = json.load(f)
        else:
            agent_data = {
                "agent_id": self.agent_id,
                "capabilities": []
            }

        agent_data.update({
            "status": status,
            "last_update": datetime.now().isoformat()
        })

        if location:
            agent_data["location"] = location
        if activity:
            agent_data["activity"] = activity

        with open(agent_file, 'w') as f:
            json.dump(agent_data, f, indent=2)

        # Commit change
        self._git('add', str(agent_file.relative_to(NETWORK_DIR.parent)))
        self._git('commit', '-m', f"{self.agent_id}: status update")
        self._git('push')

        print(f"✓ Status updated: {status}")

    def get_all_agents(self):
        """Get all agent statuses"""
        agents = {}

        for agent_file in AGENTS_DIR.glob("*.json"):
            try:
                with open(agent_file) as f:
                    agent_data = json.load(f)
                    agent_id = agent_data.get('agent_id', agent_file.stem)
                    agents[agent_id] = agent_data
            except Exception as e:
                print(f"⚠ Error reading {agent_file}: {e}")

        return agents

    def get_mission(self):
        """Get current mission"""
        if MISSION_FILE.exists():
            with open(MISSION_FILE) as f:
                return json.load(f)
        return {}

    def update_mission(self, **updates):
        """Update mission (mission control only)"""
        if MISSION_FILE.exists():
            with open(MISSION_FILE) as f:
                mission = json.load(f)
        else:
            mission = {}

        mission.update(updates)
        mission['updated'] = datetime.now().isoformat()

        with open(MISSION_FILE, 'w') as f:
            json.dump(mission, f, indent=2)

        self._git('add', str(MISSION_FILE.relative_to(NETWORK_DIR.parent)))
        self._git('commit', '-m', f"Mission update: {', '.join(updates.keys())}")
        self._git('push')

        print(f"✓ Mission updated")

def main():
    import sys

    if len(sys.argv) < 2:
        print("GitHub Claude Network")
        print("\nUsage:")
        print("  python3 github-network.py sync                    - Sync with network")
        print('  python3 github-network.py send "message"          - Send message')
        print("  python3 github-network.py read [agent]            - Read messages")
        print("  python3 github-network.py status [status]         - Update status")
        print("  python3 github-network.py mission                 - Show mission")
        return

    net = GitHubNetwork()
    command = sys.argv[1]

    if command == "sync":
        net.sync()

    elif command == "send":
        if len(sys.argv) < 3:
            print("Error: Provide a message")
            return
        message = " ".join(sys.argv[2:])
        net.send_message(message)

    elif command == "read":
        net.sync()
        from_agent = sys.argv[2] if len(sys.argv) > 2 else None
        messages = net.read_messages(from_agent=from_agent)

        if messages:
            print("\n📨 Messages:\n")
            for msg in messages:
                print(f"[{msg.get('timestamp', 'N/A')}] {msg.get('from', '?')} → {msg.get('to', 'all')}")
                print(f"  {msg.get('message', '')}\n")
        else:
            print("No messages found")

    elif command == "status":
        status = sys.argv[2] if len(sys.argv) > 2 else "online"
        net.update_status(status)

    elif command == "mission":
        mission = net.get_mission()
        print("\n🎯 Current Mission:")
        print(f"  Objective: {mission.get('objective', 'None')}")
        print(f"  Target: {mission.get('current_target', 'None')}")
        print(f"  Status: {mission.get('status', 'None')}")

    elif command == "agents":
        agents = net.get_all_agents()
        print("\n📡 Agents:")
        for agent_id, info in agents.items():
            status = "🟢" if info.get('status') == 'online' else "🔴"
            print(f"  {status} {agent_id}: {info.get('activity', 'unknown')}")

    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()
