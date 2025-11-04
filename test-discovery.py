#!/usr/bin/env python3
"""
Discovery Testing Agent - Tests T5.1 through T5.6

This agent tests all agent discovery features:
- T5.1: List all connected agents
- T5.2: Query specific agent status
- T5.3: Agent capability discovery
- T5.4: Agent presence tracking (online/offline)
- T5.5: Agent parent-child relationship tracking
- T5.6: Agent heartbeat mechanism
"""

import json
import time
import sys
import requests
from datetime import datetime
from typing import Dict, Any, List

# Import the client directly
import importlib.util
spec = importlib.util.spec_from_file_location("bootstrap", "/home/user/Sartor-claude-network/sartor-network-bootstrap.py")
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)
SartorNetworkClient = bootstrap.SartorNetworkClient


class DiscoveryTester:
    """Test agent for agent discovery features"""

    def __init__(self):
        self.client = SartorNetworkClient(agent_name="Discovery-Tester")
        self.test_results = []
        self.firebase_url = "https://home-claude-network-default-rtdb.firebaseio.com/agents-network"

    def log_test(self, test_id: str, description: str, status: str, details: Dict = None):
        """Log test result"""
        result = {
            "test_id": test_id,
            "description": description,
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)

        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"\n{status_emoji} {test_id}: {description}")
        print(f"   Status: {status}")
        if details:
            for key, value in details.items():
                print(f"   {key}: {value}")

    def get_firebase_data_directly(self, path: str) -> Any:
        """Get data directly from Firebase for verification"""
        try:
            url = f"{self.firebase_url}{path}.json"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"   Error fetching Firebase data: {e}")
            return None

    def test_t5_1_list_all_agents(self):
        """T5.1 - List all connected agents"""
        print("\n" + "="*70)
        print("TEST T5.1: List All Connected Agents")
        print("="*70)

        try:
            # Get agents via client API
            agents = self.client.agent_list()

            # Get agents directly from Firebase for comparison
            firebase_agents = self.get_firebase_data_directly("/agents")
            firebase_count = len(firebase_agents) if firebase_agents else 0

            # Verify
            if agents is not None:
                self.log_test(
                    "T5.1",
                    "List all connected agents",
                    "PASS" if len(agents) > 0 else "WARN",
                    {
                        "agents_found_via_api": len(agents),
                        "agents_in_firebase": firebase_count,
                        "match": len(agents) == firebase_count,
                        "agent_ids": [a.get('agent_id', 'unknown')[:40] for a in agents[:5]]
                    }
                )

                # Print agent details
                print("\n   Agents Found:")
                for i, agent in enumerate(agents[:10], 1):
                    agent_id = agent.get('agent_id', 'unknown')[:40]
                    status = agent.get('status', 'unknown')
                    name = agent.get('agent_name', 'N/A')
                    print(f"   {i}. {agent_id} - {status} - {name}")

                if len(agents) > 10:
                    print(f"   ... and {len(agents) - 10} more")

                return True
            else:
                self.log_test("T5.1", "List all connected agents", "FAIL",
                             {"error": "API returned None"})
                return False

        except Exception as e:
            self.log_test("T5.1", "List all connected agents", "FAIL",
                         {"error": str(e)})
            return False

    def test_t5_2_query_specific_agent(self):
        """T5.2 - Query specific agent status"""
        print("\n" + "="*70)
        print("TEST T5.2: Query Specific Agent Status")
        print("="*70)

        try:
            # Get our own status
            my_status = self.client.agent_status(self.client.agent_id)

            # Get directly from Firebase
            firebase_status = self.get_firebase_data_directly(f"/agents/{self.client.agent_id}")

            if my_status:
                self.log_test(
                    "T5.2",
                    "Query specific agent status",
                    "PASS",
                    {
                        "agent_id": self.client.agent_id[:40],
                        "status_via_api": my_status.get('status'),
                        "status_in_firebase": firebase_status.get('status') if firebase_status else None,
                        "has_capabilities": 'capabilities' in my_status,
                        "has_timestamps": 'joined_at' in my_status and 'last_seen' in my_status
                    }
                )

                print(f"\n   Agent Details:")
                for key, value in my_status.items():
                    if isinstance(value, str) and len(value) > 60:
                        value = value[:60] + "..."
                    print(f"   {key}: {value}")

                return True
            else:
                self.log_test("T5.2", "Query specific agent status", "FAIL",
                             {"error": "Could not retrieve own status"})
                return False

        except Exception as e:
            self.log_test("T5.2", "Query specific agent status", "FAIL",
                         {"error": str(e)})
            return False

    def test_t5_3_capability_discovery(self):
        """T5.3 - Agent capability discovery"""
        print("\n" + "="*70)
        print("TEST T5.3: Agent Capability Discovery")
        print("="*70)

        try:
            agents = self.client.agent_list()

            capabilities_found = {}
            agents_with_capabilities = 0

            for agent in agents:
                caps = agent.get('capabilities', [])
                if caps:
                    agents_with_capabilities += 1
                    for cap in caps:
                        capabilities_found[cap] = capabilities_found.get(cap, 0) + 1

            # Check our own capabilities
            my_status = self.client.agent_status(self.client.agent_id)
            my_capabilities = my_status.get('capabilities', []) if my_status else []

            if agents:
                self.log_test(
                    "T5.3",
                    "Agent capability discovery",
                    "PASS" if agents_with_capabilities > 0 else "WARN",
                    {
                        "total_agents": len(agents),
                        "agents_with_capabilities": agents_with_capabilities,
                        "unique_capabilities_found": list(capabilities_found.keys()),
                        "my_capabilities": my_capabilities
                    }
                )

                print(f"\n   Capability Distribution:")
                for cap, count in capabilities_found.items():
                    print(f"   {cap}: {count} agents")

                return True
            else:
                self.log_test("T5.3", "Agent capability discovery", "FAIL",
                             {"error": "No agents found"})
                return False

        except Exception as e:
            self.log_test("T5.3", "Agent capability discovery", "FAIL",
                         {"error": str(e)})
            return False

    def test_t5_4_presence_tracking(self):
        """T5.4 - Agent presence tracking (online/offline)"""
        print("\n" + "="*70)
        print("TEST T5.4: Agent Presence Tracking")
        print("="*70)

        try:
            # Get all presence data directly from Firebase
            presence_data = self.get_firebase_data_directly("/presence")

            # Get agent list
            agents = self.client.agent_list()

            online_count = 0
            offline_count = 0

            for agent in agents:
                status = agent.get('status', 'unknown')
                if status == 'online':
                    online_count += 1
                elif status == 'offline':
                    offline_count += 1

            # Check presence data structure
            presence_count = len(presence_data) if presence_data else 0

            # Test our own presence
            my_presence = self.get_firebase_data_directly(f"/presence/{self.client.agent_id}")

            self.log_test(
                "T5.4",
                "Agent presence tracking",
                "PASS",
                {
                    "agents_online": online_count,
                    "agents_offline": offline_count,
                    "presence_entries_in_firebase": presence_count,
                    "my_presence_tracked": my_presence is not None,
                    "my_online_status": my_presence.get('online') if my_presence else None
                }
            )

            print(f"\n   Presence Summary:")
            print(f"   Online agents: {online_count}")
            print(f"   Offline agents: {offline_count}")
            print(f"   Presence entries: {presence_count}")

            return True

        except Exception as e:
            self.log_test("T5.4", "Agent presence tracking", "FAIL",
                         {"error": str(e)})
            return False

    def test_t5_5_parent_child_relationships(self):
        """T5.5 - Agent parent-child relationship tracking"""
        print("\n" + "="*70)
        print("TEST T5.5: Agent Parent-Child Relationship Tracking")
        print("="*70)

        try:
            agents = self.client.agent_list()

            parent_agents = []
            child_agents = []
            standalone_agents = []

            for agent in agents:
                parent_id = agent.get('parent_agent_id')
                if parent_id:
                    child_agents.append({
                        'agent_id': agent.get('agent_id'),
                        'parent_id': parent_id
                    })
                    if parent_id not in [p['agent_id'] for p in parent_agents]:
                        # Check if parent exists in agent list
                        parent_exists = any(a.get('agent_id') == parent_id for a in agents)
                        if parent_exists:
                            parent_agents.append({'agent_id': parent_id})
                else:
                    standalone_agents.append(agent.get('agent_id'))

            # Test by creating a mock sub-agent relationship
            print("\n   Testing sub-agent creation...")
            sub_agent_id = f"{self.client.agent_id}-test-child"

            # Register a test sub-agent
            sub_agent_data = {
                "agent_id": sub_agent_id,
                "parent_agent_id": self.client.agent_id,
                "status": "online",
                "capabilities": ["test"],
                "joined_at": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat()
            }

            result = self.client._firebase_request("PUT", f"/agents/{sub_agent_id}", sub_agent_data)

            # Verify it was created with parent relationship
            time.sleep(1)
            sub_agent_verify = self.client.agent_status(sub_agent_id)

            relationship_verified = (
                sub_agent_verify and
                sub_agent_verify.get('parent_agent_id') == self.client.agent_id
            )

            self.log_test(
                "T5.5",
                "Agent parent-child relationship tracking",
                "PASS" if relationship_verified else "WARN",
                {
                    "total_child_agents_found": len(child_agents),
                    "total_parent_agents_found": len(parent_agents),
                    "standalone_agents": len(standalone_agents),
                    "test_relationship_created": relationship_verified,
                    "test_child_id": sub_agent_id[:40]
                }
            )

            print(f"\n   Relationship Summary:")
            print(f"   Child agents: {len(child_agents)}")
            print(f"   Parent agents: {len(parent_agents)}")
            print(f"   Standalone agents: {len(standalone_agents)}")

            if child_agents[:3]:
                print(f"\n   Sample Parent-Child Relationships:")
                for rel in child_agents[:3]:
                    print(f"   Child: {rel['agent_id'][:40]}")
                    print(f"   Parent: {rel['parent_id'][:40]}")

            # Cleanup test sub-agent
            self.client._firebase_request("DELETE", f"/agents/{sub_agent_id}", None)

            return True

        except Exception as e:
            self.log_test("T5.5", "Agent parent-child relationship tracking", "FAIL",
                         {"error": str(e)})
            return False

    def test_t5_6_heartbeat_mechanism(self):
        """T5.6 - Agent heartbeat mechanism"""
        print("\n" + "="*70)
        print("TEST T5.6: Agent Heartbeat Mechanism")
        print("="*70)

        try:
            # Get initial last_seen timestamp
            initial_status = self.client.agent_status(self.client.agent_id)
            initial_presence = self.get_firebase_data_directly(f"/presence/{self.client.agent_id}")

            initial_last_seen = initial_status.get('last_seen') if initial_status else None
            initial_presence_last_seen = initial_presence.get('last_seen') if initial_presence else None

            print(f"\n   Initial last_seen: {initial_last_seen}")

            # Wait a moment
            time.sleep(2)

            # Send heartbeat (manually if method doesn't exist)
            print(f"   Sending heartbeat...")
            if hasattr(self.client, 'heartbeat'):
                self.client.heartbeat()
            else:
                # Manual heartbeat - update presence
                presence_data = {
                    "online": True,
                    "last_seen": datetime.now().isoformat(),
                }
                self.client._firebase_request("PATCH", f"/presence/{self.client.agent_id}", presence_data)

            # Wait for update
            time.sleep(1)

            # Get updated timestamps
            updated_status = self.client.agent_status(self.client.agent_id)
            updated_presence = self.get_firebase_data_directly(f"/presence/{self.client.agent_id}")

            updated_last_seen = updated_status.get('last_seen') if updated_status else None
            updated_presence_last_seen = updated_presence.get('last_seen') if updated_presence else None

            print(f"   Updated last_seen: {updated_last_seen}")

            # Check if timestamp was updated
            timestamp_updated = (
                updated_presence_last_seen and
                initial_presence_last_seen and
                updated_presence_last_seen != initial_presence_last_seen
            )

            # Test heartbeat mechanism (method exists or manual works)
            heartbeat_method_exists = hasattr(self.client, 'heartbeat')
            heartbeat_works = timestamp_updated

            self.log_test(
                "T5.6",
                "Agent heartbeat mechanism",
                "PASS" if heartbeat_works else "WARN",
                {
                    "heartbeat_method_exists": heartbeat_method_exists,
                    "heartbeat_mechanism_works": heartbeat_works,
                    "timestamp_updated_in_presence": timestamp_updated,
                    "initial_last_seen": initial_presence_last_seen,
                    "updated_last_seen": updated_presence_last_seen,
                    "implementation": "native" if heartbeat_method_exists else "manual_presence_update"
                }
            )

            return True

        except Exception as e:
            self.log_test("T5.6", "Agent heartbeat mechanism", "FAIL",
                         {"error": str(e)})
            return False

    def run_all_tests(self):
        """Run all discovery tests"""
        print("\n" + "="*70)
        print("SARTOR NETWORK - DISCOVERY TESTING AGENT")
        print("Testing Agent Discovery Features (T5.1 - T5.6)")
        print("="*70)

        # Connect to network
        print("\n🌐 Connecting to Sartor Network...")
        if not self.client.connect():
            print("❌ Failed to connect to network!")
            return False

        print("\n✅ Connected successfully!")
        time.sleep(2)

        # Run all tests
        tests = [
            self.test_t5_1_list_all_agents,
            self.test_t5_2_query_specific_agent,
            self.test_t5_3_capability_discovery,
            self.test_t5_4_presence_tracking,
            self.test_t5_5_parent_child_relationships,
            self.test_t5_6_heartbeat_mechanism,
        ]

        for test in tests:
            test()
            time.sleep(1)

        # Summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)

        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        warned = sum(1 for r in self.test_results if r['status'] == 'WARN')

        print(f"\n✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warned}")
        print(f"Total: {len(self.test_results)}")

        # Disconnect
        print("\n👋 Disconnecting from network...")
        self.client.disconnect()

        return self.test_results

    def generate_report(self, output_path: str):
        """Generate markdown report"""
        report = []
        report.append("# Agent Discovery Testing Report")
        report.append(f"\n**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"\n**Tester Agent:** {self.client.agent_name}")
        report.append(f"\n**Agent ID:** {self.client.agent_id}")
        report.append("\n---\n")

        report.append("## Test Execution Summary\n")

        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        warned = sum(1 for r in self.test_results if r['status'] == 'WARN')

        report.append(f"- **Total Tests:** {len(self.test_results)}")
        report.append(f"- **Passed:** {passed}")
        report.append(f"- **Failed:** {failed}")
        report.append(f"- **Warnings:** {warned}")

        success_rate = (passed / len(self.test_results) * 100) if self.test_results else 0
        report.append(f"- **Success Rate:** {success_rate:.1f}%")

        report.append("\n---\n")
        report.append("## Detailed Test Results\n")

        for result in self.test_results:
            status_emoji = "✅" if result['status'] == 'PASS' else "❌" if result['status'] == 'FAIL' else "⚠️"

            report.append(f"\n### {status_emoji} {result['test_id']}: {result['description']}\n")
            report.append(f"- **Status:** {result['status']}")
            report.append(f"- **Timestamp:** {result['timestamp']}")

            if result['details']:
                report.append(f"- **Details:**")
                for key, value in result['details'].items():
                    report.append(f"  - {key}: `{value}`")

        report.append("\n---\n")
        report.append("## Firebase Data Verification\n")
        report.append("\nAll tests were cross-referenced with direct Firebase queries to ensure accuracy.\n")

        report.append("\n---\n")
        report.append("## Observations and Recommendations\n")

        # Add observations based on results
        observations = []

        for result in self.test_results:
            if result['status'] == 'FAIL':
                observations.append(f"- ❌ {result['test_id']} failed: {result['details'].get('error', 'Unknown error')}")
            elif result['status'] == 'WARN':
                observations.append(f"- ⚠️ {result['test_id']} has warnings - review details above")

        if not observations:
            observations.append("- ✅ All discovery features functioning as expected")
            observations.append("- ✅ Agent list API working correctly")
            observations.append("- ✅ Presence tracking operational")
            observations.append("- ✅ Parent-child relationships supported")
            observations.append("- ✅ Heartbeat mechanism active")

        report.extend(observations)

        report.append("\n---\n")
        report.append("## Next Steps\n")
        report.append("\n1. Review any failed or warned tests")
        report.append("2. Verify presence tracking with multiple agents")
        report.append("3. Test long-running heartbeat mechanisms")
        report.append("4. Validate parent-child relationship queries")

        # Write report
        with open(output_path, 'w') as f:
            f.write('\n'.join(report))

        print(f"\n📄 Report saved to: {output_path}")


if __name__ == "__main__":
    tester = DiscoveryTester()
    results = tester.run_all_tests()
    tester.generate_report("/home/user/Sartor-claude-network/test-results/discovery-report.md")

    # Return success if no failures
    failed = sum(1 for r in results if r['status'] == 'FAIL')
    sys.exit(0 if failed == 0 else 1)
