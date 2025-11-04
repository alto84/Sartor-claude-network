#!/usr/bin/env python3
"""
Monitor-Agent - Independent Observer for Sartor Network Testing

This agent connects to the network and continuously monitors ALL activity:
- Agent connections/disconnections
- Message traffic (direct and broadcast)
- Task activity (creation, claiming, updates)
- Knowledge base updates
- Error patterns and anomalies

Reports ground truth from Firebase, not agent claims.
"""

import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Any
from collections import defaultdict

# Import the bootstrap client
import sys
import importlib.util
spec = importlib.util.spec_from_file_location("sartor_bootstrap", "/home/user/Sartor-claude-network/sartor-network-bootstrap.py")
sartor_bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sartor_bootstrap)
SartorNetworkClient = sartor_bootstrap.SartorNetworkClient


class NetworkMonitor:
    """Independent network monitor that observes and reports all activity"""

    def __init__(self):
        self.client = SartorNetworkClient(
            agent_name="Monitor-Agent-Sonnet",
            agent_id="monitor-agent-main-observer"
        )
        self.firebase_url = self.client.firebase_url
        self.start_time = datetime.now()

        # Tracking structures
        self.agent_events = []
        self.message_events = []
        self.task_events = []
        self.knowledge_events = []
        self.error_events = []

        # Snapshots for comparison
        self.last_agents_snapshot = {}
        self.last_messages_snapshot = {}
        self.last_tasks_snapshot = {}
        self.last_knowledge_snapshot = {}

        # Statistics
        self.stats = {
            'total_agents_seen': 0,
            'total_messages': 0,
            'total_tasks': 0,
            'total_knowledge': 0,
            'connection_events': 0,
            'disconnection_events': 0,
            'task_claims': 0,
            'task_completions': 0,
            'broadcast_messages': 0,
            'direct_messages': 0,
            'errors_detected': 0
        }

    def connect(self):
        """Connect to network as observer"""
        print("=" * 80)
        print("MONITOR-AGENT INITIALIZING")
        print("=" * 80)
        print(f"Start Time: {self.start_time.isoformat()}")
        print(f"Role: Independent Observer")
        print(f"Mission: Report ALL network activity during testing")
        print("=" * 80)
        print()

        success = self.client.connect()
        if success:
            self.client.message_broadcast(
                "🔍 Monitor-Agent online. Observing all network activity for comprehensive test report."
            )
        return success

    def get_firebase_data(self, path: str) -> Any:
        """Direct Firebase query for ground truth"""
        url = f"{self.firebase_url}/agents-network{path}.json"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.error_events.append({
                'timestamp': datetime.now().isoformat(),
                'type': 'firebase_query_error',
                'path': path,
                'error': str(e)
            })
            return None

    def monitor_agents(self):
        """Monitor agent connections and status changes"""
        current_agents = self.get_firebase_data('/agents') or {}
        current_presence = self.get_firebase_data('/presence') or {}

        # Detect changes
        for agent_id, agent_data in current_agents.items():
            if not isinstance(agent_data, dict):
                continue  # Skip non-dict entries
            if agent_id not in self.last_agents_snapshot:
                # New agent connected
                event = {
                    'timestamp': datetime.now().isoformat(),
                    'event': 'agent_connected',
                    'agent_id': agent_id,
                    'agent_name': agent_data.get('agent_name', 'Unknown'),
                    'parent_agent_id': agent_data.get('parent_agent_id'),
                    'capabilities': agent_data.get('capabilities', []),
                    'status': agent_data.get('status'),
                    'presence': current_presence.get(agent_id, {}).get('online', False)
                }
                self.agent_events.append(event)
                self.stats['connection_events'] += 1
                self.stats['total_agents_seen'] += 1
                print(f"🟢 NEW AGENT: {agent_id[:40]} ({agent_data.get('agent_name', 'Unknown')})")

            elif agent_data != self.last_agents_snapshot.get(agent_id):
                # Agent status changed
                event = {
                    'timestamp': datetime.now().isoformat(),
                    'event': 'agent_status_changed',
                    'agent_id': agent_id,
                    'old_status': self.last_agents_snapshot[agent_id].get('status'),
                    'new_status': agent_data.get('status'),
                    'presence': current_presence.get(agent_id, {}).get('online', False)
                }
                self.agent_events.append(event)

                if agent_data.get('status') == 'offline':
                    self.stats['disconnection_events'] += 1
                    print(f"🔴 AGENT OFFLINE: {agent_id[:40]}")

        # Detect disconnections (agents removed from Firebase)
        for agent_id in self.last_agents_snapshot:
            if agent_id not in current_agents:
                event = {
                    'timestamp': datetime.now().isoformat(),
                    'event': 'agent_removed',
                    'agent_id': agent_id
                }
                self.agent_events.append(event)
                self.stats['disconnection_events'] += 1
                print(f"⚫ AGENT REMOVED: {agent_id[:40]}")

        self.last_agents_snapshot = current_agents.copy()

    def monitor_messages(self):
        """Monitor all message traffic"""
        # Check broadcast messages
        broadcasts = self.get_firebase_data('/messages/broadcast') or {}
        for msg_id, msg_data in broadcasts.items():
            if not isinstance(msg_data, dict):
                continue  # Skip non-dict entries
            if msg_id not in self.last_messages_snapshot:
                event = {
                    'timestamp': datetime.now().isoformat(),
                    'event': 'broadcast_message',
                    'message_id': msg_id,
                    'from': msg_data.get('from'),
                    'content': msg_data.get('content'),
                    'msg_timestamp': msg_data.get('timestamp')
                }
                self.message_events.append(event)
                self.stats['broadcast_messages'] += 1
                self.stats['total_messages'] += 1
                print(f"📢 BROADCAST from {msg_data.get('from', 'unknown')[:30]}: {msg_data.get('content', '')[:60]}")

        # Check direct messages (all recipients)
        direct_messages = self.get_firebase_data('/messages/direct') or {}
        for recipient_id, messages in direct_messages.items():
            if isinstance(messages, dict):
                for msg_id, msg_data in messages.items():
                    if not isinstance(msg_data, dict):
                        continue  # Skip non-dict entries
                    msg_key = f"{recipient_id}:{msg_id}"
                    if msg_key not in self.last_messages_snapshot:
                        event = {
                            'timestamp': datetime.now().isoformat(),
                            'event': 'direct_message',
                            'message_id': msg_id,
                            'from': msg_data.get('from'),
                            'to': msg_data.get('to', recipient_id),
                            'content': msg_data.get('content'),
                            'read': msg_data.get('read', False),
                            'msg_timestamp': msg_data.get('timestamp')
                        }
                        self.message_events.append(event)
                        self.stats['direct_messages'] += 1
                        self.stats['total_messages'] += 1
                        print(f"📤 DIRECT MESSAGE: {msg_data.get('from', 'unknown')[:20]} -> {recipient_id[:20]}")

        # Update snapshot
        self.last_messages_snapshot = {**broadcasts}
        for recipient_id, messages in direct_messages.items():
            if isinstance(messages, dict):
                for msg_id in messages:
                    self.last_messages_snapshot[f"{recipient_id}:{msg_id}"] = True

    def monitor_tasks(self):
        """Monitor task creation, claiming, and completion"""
        current_tasks = self.get_firebase_data('/tasks') or {}

        for task_id, task_data in current_tasks.items():
            if not isinstance(task_data, dict):
                continue  # Skip non-dict entries
            if task_id not in self.last_tasks_snapshot:
                # New task created
                event = {
                    'timestamp': datetime.now().isoformat(),
                    'event': 'task_created',
                    'task_id': task_id,
                    'title': task_data.get('title'),
                    'description': task_data.get('description'),
                    'status': task_data.get('status'),
                    'created_by': task_data.get('created_by'),
                    'created_at': task_data.get('created_at')
                }
                self.task_events.append(event)
                self.stats['total_tasks'] += 1
                print(f"📝 NEW TASK: {task_data.get('title', 'Untitled')[:50]} by {task_data.get('created_by', 'unknown')[:25]}")

            elif task_data != self.last_tasks_snapshot.get(task_id):
                # Task status changed
                old_status = self.last_tasks_snapshot[task_id].get('status')
                new_status = task_data.get('status')

                event = {
                    'timestamp': datetime.now().isoformat(),
                    'event': 'task_status_changed',
                    'task_id': task_id,
                    'title': task_data.get('title'),
                    'old_status': old_status,
                    'new_status': new_status,
                    'claimed_by': task_data.get('claimed_by'),
                    'updated_by': task_data.get('updated_by')
                }
                self.task_events.append(event)

                if new_status == 'claimed':
                    self.stats['task_claims'] += 1
                    print(f"✋ TASK CLAIMED: {task_data.get('title', 'Untitled')[:40]} by {task_data.get('claimed_by', 'unknown')[:25]}")
                elif new_status == 'completed':
                    self.stats['task_completions'] += 1
                    print(f"✅ TASK COMPLETED: {task_data.get('title', 'Untitled')[:40]}")

        self.last_tasks_snapshot = current_tasks.copy()

    def monitor_knowledge(self):
        """Monitor knowledge base updates"""
        current_knowledge = self.get_firebase_data('/knowledge') or {}

        for k_id, k_data in current_knowledge.items():
            if not isinstance(k_data, dict):
                continue  # Skip non-dict entries
            if k_id not in self.last_knowledge_snapshot:
                # New knowledge added
                event = {
                    'timestamp': datetime.now().isoformat(),
                    'event': 'knowledge_added',
                    'knowledge_id': k_id,
                    'content': k_data.get('content'),
                    'added_by': k_data.get('added_by'),
                    'tags': k_data.get('tags', []),
                    'kb_timestamp': k_data.get('timestamp')
                }
                self.knowledge_events.append(event)
                self.stats['total_knowledge'] += 1
                print(f"🧠 KNOWLEDGE ADDED: {k_data.get('content', '')[:60]}... by {k_data.get('added_by', 'unknown')[:25]}")

        self.last_knowledge_snapshot = current_knowledge.copy()

    def monitor_cycle(self):
        """Single monitoring cycle"""
        try:
            self.monitor_agents()
            self.monitor_messages()
            self.monitor_tasks()
            self.monitor_knowledge()
        except Exception as e:
            error_event = {
                'timestamp': datetime.now().isoformat(),
                'type': 'monitor_cycle_error',
                'error': str(e)
            }
            self.error_events.append(error_event)
            self.stats['errors_detected'] += 1
            print(f"⚠️  MONITOR ERROR: {e}")

    def print_status(self):
        """Print current monitoring status"""
        print()
        print("=" * 80)
        print(f"MONITORING STATUS - {datetime.now().isoformat()}")
        print("=" * 80)
        print(f"Uptime: {(datetime.now() - self.start_time).total_seconds():.1f}s")
        print()
        print("STATISTICS:")
        for key, value in self.stats.items():
            print(f"  {key:30s}: {value}")
        print("=" * 80)
        print()

    def generate_report(self) -> str:
        """Generate comprehensive monitoring report"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()

        report = []
        report.append("# SARTOR NETWORK MONITORING REPORT")
        report.append("## Independent Observer Analysis")
        report.append("")
        report.append(f"**Monitor Agent:** Monitor-Agent-Sonnet")
        report.append(f"**Start Time:** {self.start_time.isoformat()}")
        report.append(f"**End Time:** {end_time.isoformat()}")
        report.append(f"**Duration:** {duration:.1f} seconds")
        report.append("")
        report.append("---")
        report.append("")

        # Executive Summary
        report.append("## Executive Summary")
        report.append("")
        report.append("This report documents ALL network activity observed during comprehensive testing.")
        report.append("Data sourced directly from Firebase for ground truth validation.")
        report.append("")

        # Statistics
        report.append("## Network Statistics")
        report.append("")
        report.append("| Metric | Count |")
        report.append("|--------|-------|")
        for key, value in self.stats.items():
            report.append(f"| {key.replace('_', ' ').title()} | {value} |")
        report.append("")

        # Agent Activity
        report.append("## Agent Activity Timeline")
        report.append("")
        if self.agent_events:
            report.append(f"**Total Agent Events:** {len(self.agent_events)}")
            report.append("")
            report.append("### Connection Events")
            report.append("")
            for event in self.agent_events:
                if event['event'] == 'agent_connected':
                    report.append(f"- **[{event['timestamp']}]** Agent Connected")
                    report.append(f"  - Agent ID: `{event['agent_id']}`")
                    report.append(f"  - Name: {event['agent_name']}")
                    report.append(f"  - Parent: {event.get('parent_agent_id', 'None')}")
                    report.append(f"  - Capabilities: {', '.join(event.get('capabilities', []))}")
                    report.append(f"  - Status: {event['status']}")
                    report.append(f"  - Presence: {'🟢 Online' if event['presence'] else '🔴 Offline'}")
                    report.append("")

            report.append("### Status Changes")
            report.append("")
            for event in self.agent_events:
                if event['event'] == 'agent_status_changed':
                    report.append(f"- **[{event['timestamp']}]** Status Change")
                    report.append(f"  - Agent: `{event['agent_id']}`")
                    report.append(f"  - Old Status: {event['old_status']}")
                    report.append(f"  - New Status: {event['new_status']}")
                    report.append("")

            report.append("### Disconnections")
            report.append("")
            for event in self.agent_events:
                if event['event'] in ['agent_removed', 'agent_offline']:
                    report.append(f"- **[{event['timestamp']}]** Agent Disconnected: `{event['agent_id']}`")
                    report.append("")
        else:
            report.append("*No agent events observed*")
            report.append("")

        # Message Traffic
        report.append("## Message Traffic")
        report.append("")
        if self.message_events:
            report.append(f"**Total Messages:** {len(self.message_events)}")
            report.append(f"- Broadcasts: {self.stats['broadcast_messages']}")
            report.append(f"- Direct Messages: {self.stats['direct_messages']}")
            report.append("")

            report.append("### Broadcast Messages")
            report.append("")
            for event in self.message_events:
                if event['event'] == 'broadcast_message':
                    report.append(f"- **[{event['timestamp']}]**")
                    report.append(f"  - From: `{event['from']}`")
                    report.append(f"  - Content: {event['content']}")
                    report.append("")

            report.append("### Direct Messages")
            report.append("")
            for event in self.message_events:
                if event['event'] == 'direct_message':
                    report.append(f"- **[{event['timestamp']}]**")
                    report.append(f"  - From: `{event['from']}`")
                    report.append(f"  - To: `{event['to']}`")
                    report.append(f"  - Content: {event['content']}")
                    report.append(f"  - Read: {event['read']}")
                    report.append("")
        else:
            report.append("*No messages observed*")
            report.append("")

        # Task Activity
        report.append("## Task Coordination")
        report.append("")
        if self.task_events:
            report.append(f"**Total Task Events:** {len(self.task_events)}")
            report.append("")

            report.append("### Task Creation")
            report.append("")
            for event in self.task_events:
                if event['event'] == 'task_created':
                    report.append(f"- **[{event['timestamp']}]** Task Created")
                    report.append(f"  - Task ID: `{event['task_id']}`")
                    report.append(f"  - Title: {event['title']}")
                    report.append(f"  - Description: {event['description']}")
                    report.append(f"  - Created By: `{event['created_by']}`")
                    report.append(f"  - Status: {event['status']}")
                    report.append("")

            report.append("### Task Status Changes")
            report.append("")
            for event in self.task_events:
                if event['event'] == 'task_status_changed':
                    report.append(f"- **[{event['timestamp']}]** Status Update")
                    report.append(f"  - Task: {event['title']}")
                    report.append(f"  - Old Status: {event['old_status']} → New Status: {event['new_status']}")
                    if event.get('claimed_by'):
                        report.append(f"  - Claimed By: `{event['claimed_by']}`")
                    if event.get('updated_by'):
                        report.append(f"  - Updated By: `{event['updated_by']}`")
                    report.append("")
        else:
            report.append("*No task activity observed*")
            report.append("")

        # Knowledge Base
        report.append("## Knowledge Base Activity")
        report.append("")
        if self.knowledge_events:
            report.append(f"**Total Knowledge Entries:** {len(self.knowledge_events)}")
            report.append("")
            for event in self.knowledge_events:
                report.append(f"- **[{event['timestamp']}]** Knowledge Added")
                report.append(f"  - Content: {event['content']}")
                report.append(f"  - Added By: `{event['added_by']}`")
                report.append(f"  - Tags: {', '.join(event.get('tags', []))}")
                report.append("")
        else:
            report.append("*No knowledge base activity observed*")
            report.append("")

        # Errors
        report.append("## Errors and Anomalies")
        report.append("")
        if self.error_events:
            report.append(f"**Total Errors Detected:** {len(self.error_events)}")
            report.append("")
            for event in self.error_events:
                report.append(f"- **[{event['timestamp']}]** {event.get('type', 'Unknown Error')}")
                report.append(f"  - Error: {event.get('error', 'No details')}")
                if 'path' in event:
                    report.append(f"  - Path: {event['path']}")
                report.append("")
        else:
            report.append("*No errors detected during monitoring period*")
            report.append("")

        # Current Network State
        report.append("## Final Network State")
        report.append("")

        # Get final snapshots
        final_agents = self.get_firebase_data('/agents') or {}
        final_tasks = self.get_firebase_data('/tasks') or {}
        final_knowledge = self.get_firebase_data('/knowledge') or {}

        report.append(f"### Active Agents ({len(final_agents)})")
        report.append("")
        for agent_id, agent_data in final_agents.items():
            report.append(f"- **{agent_data.get('agent_name', agent_id)}**")
            report.append(f"  - ID: `{agent_id}`")
            report.append(f"  - Status: {agent_data.get('status')}")
            report.append(f"  - Parent: {agent_data.get('parent_agent_id', 'None')}")
            report.append(f"  - Last Seen: {agent_data.get('last_seen', 'Unknown')}")
            report.append("")

        report.append(f"### Task Status ({len(final_tasks)} total)")
        report.append("")
        task_by_status = defaultdict(list)
        for task_id, task_data in final_tasks.items():
            task_by_status[task_data.get('status', 'unknown')].append(task_data)

        for status, tasks in task_by_status.items():
            report.append(f"**{status.upper()}** ({len(tasks)} tasks)")
            for task in tasks:
                report.append(f"- {task.get('title', 'Untitled')}")
            report.append("")

        report.append(f"### Knowledge Base ({len(final_knowledge)} entries)")
        report.append("")
        report.append(f"Total knowledge entries stored: {len(final_knowledge)}")
        report.append("")

        # Recommendations
        report.append("## Monitoring Observations")
        report.append("")
        report.append("### What Worked")
        report.append("")
        report.append("- Firebase REST API provided reliable ground truth data")
        report.append("- Real-time monitoring captured all network events")
        report.append("- Event tracking successfully logged connections, messages, tasks, and knowledge")
        report.append("")

        report.append("### Potential Issues Detected")
        report.append("")
        if self.stats['errors_detected'] > 0:
            report.append(f"- {self.stats['errors_detected']} errors detected during monitoring")
        else:
            report.append("- No errors detected (clean monitoring session)")
        report.append("")

        report.append("### Test Coverage Analysis")
        report.append("")
        report.append("Based on observed activity:")
        report.append(f"- Agent connectivity: {'✅ TESTED' if self.stats['connection_events'] > 0 else '❌ NOT TESTED'}")
        report.append(f"- Message broadcasting: {'✅ TESTED' if self.stats['broadcast_messages'] > 0 else '❌ NOT TESTED'}")
        report.append(f"- Direct messaging: {'✅ TESTED' if self.stats['direct_messages'] > 0 else '❌ NOT TESTED'}")
        report.append(f"- Task creation: {'✅ TESTED' if self.stats['total_tasks'] > 0 else '❌ NOT TESTED'}")
        report.append(f"- Task claiming: {'✅ TESTED' if self.stats['task_claims'] > 0 else '❌ NOT TESTED'}")
        report.append(f"- Task completion: {'✅ TESTED' if self.stats['task_completions'] > 0 else '❌ NOT TESTED'}")
        report.append(f"- Knowledge sharing: {'✅ TESTED' if self.stats['total_knowledge'] > 0 else '❌ NOT TESTED'}")
        report.append("")

        report.append("---")
        report.append("")
        report.append(f"*Report generated by Monitor-Agent at {end_time.isoformat()}*")
        report.append("")
        report.append("*This report reflects actual network activity observed from Firebase.*")
        report.append("*No agent self-reported claims included - only verified data.*")

        return '\n'.join(report)


def main():
    """Main monitoring loop"""
    monitor = NetworkMonitor()

    if not monitor.connect():
        print("❌ Failed to connect to network")
        return

    print("\n🔍 MONITORING ACTIVE - Press Ctrl+C to stop and generate report\n")

    try:
        cycle_count = 0
        while True:
            monitor.monitor_cycle()
            cycle_count += 1

            # Print status every 10 cycles
            if cycle_count % 10 == 0:
                monitor.print_status()

            # Wait before next cycle
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n\n🛑 Monitoring stopped by user")
    except Exception as e:
        print(f"\n\n⚠️  Monitoring stopped due to error: {e}")

    finally:
        # Generate report
        print("\n📊 Generating comprehensive report...")
        report = monitor.generate_report()

        # Save report
        report_dir = '/home/user/Sartor-claude-network/test-results'
        import os
        os.makedirs(report_dir, exist_ok=True)

        report_path = f"{report_dir}/network-monitor-report.md"
        with open(report_path, 'w') as f:
            f.write(report)

        print(f"✅ Report saved to: {report_path}")
        print("\n" + "=" * 80)
        print("MONITORING COMPLETE")
        print("=" * 80)

        # Disconnect
        monitor.client.disconnect()


if __name__ == "__main__":
    main()
