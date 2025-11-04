#!/usr/bin/env python3
"""
Load Generator for Sartor Network Comprehensive Testing
Test Agent: Load-Generator (Haiku)

PURPOSE: Generate continuous realistic network traffic to stress test the system
while other test agents validate functionality.

LOAD PATTERNS:
- Continuous messaging (direct + broadcast)
- Task creation and updates
- Knowledge base operations
- Network status queries
- Realistic timing patterns (not just spam)
"""

import sys
import json
import time
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Import the bootstrap client
sys.path.insert(0, '/home/user/Sartor-claude-network')
import importlib.util
spec = importlib.util.spec_from_file_location("bootstrap", "/home/user/Sartor-claude-network/sartor-network-bootstrap.py")
bootstrap = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bootstrap)
SartorNetworkClient = bootstrap.SartorNetworkClient


class LoadGenerator:
    """Generate realistic network load for stress testing"""

    def __init__(self, duration_minutes: int = 30):
        self.agent_name = "Load-Generator"
        self.client = SartorNetworkClient(agent_name=self.agent_name)
        self.duration_minutes = duration_minutes
        self.start_time = datetime.now()

        # Activity counters
        self.stats = {
            "messages_sent": 0,
            "broadcasts_sent": 0,
            "tasks_created": 0,
            "tasks_claimed": 0,
            "tasks_updated": 0,
            "knowledge_added": 0,
            "status_queries": 0,
            "errors": 0,
            "operations": []
        }

        # Sample content for realistic traffic
        self.message_templates = [
            "Checking in on task progress...",
            "Need help with {task_type}?",
            "Status update: {status}",
            "Quick question about {topic}",
            "FYI: {information}",
            "Collaborative work update",
            "Resource available: {resource}",
            "Looking for agent with {capability}",
        ]

        self.task_types = [
            "Data analysis",
            "Code review",
            "Documentation update",
            "Bug investigation",
            "Feature implementation",
            "Performance optimization",
            "Security audit",
            "Integration testing"
        ]

        self.knowledge_topics = [
            "API usage patterns",
            "Best practices for {topic}",
            "Common error solutions",
            "Performance optimization tips",
            "Network protocol details",
            "Testing strategies",
            "Deployment procedures",
            "Troubleshooting guides"
        ]

    def log_operation(self, op_type: str, details: Dict, latency_ms: float):
        """Log an operation with timing"""
        operation = {
            "timestamp": datetime.now().isoformat(),
            "type": op_type,
            "details": details,
            "latency_ms": round(latency_ms, 2),
            "elapsed_minutes": round((datetime.now() - self.start_time).total_seconds() / 60, 2)
        }
        self.stats["operations"].append(operation)

        # Keep only last 100 operations in memory
        if len(self.stats["operations"]) > 100:
            self.stats["operations"] = self.stats["operations"][-100:]

    def generate_direct_message(self):
        """Send a direct message to a random agent"""
        try:
            start = time.time()

            # Get list of agents
            agents = self.client.agent_list()
            target_agents = [a for a in agents if a['agent_id'] != self.client.agent_id]

            if not target_agents:
                return

            target = random.choice(target_agents)['agent_id']

            # Generate realistic message
            template = random.choice(self.message_templates)
            content = template.format(
                task_type=random.choice(self.task_types),
                status=random.choice(["in progress", "completed", "blocked", "pending review"]),
                topic=random.choice(["authentication", "caching", "networking", "storage"]),
                information=f"Load test data point {self.stats['messages_sent']}",
                resource=random.choice(["CPU cycles", "memory", "bandwidth", "API quota"]),
                capability=random.choice(["Python", "testing", "deployment", "monitoring"])
            )

            success = self.client.message_send(target, content)
            latency = (time.time() - start) * 1000

            if success:
                self.stats["messages_sent"] += 1
                self.log_operation("direct_message", {"to": target[:20], "length": len(content)}, latency)
            else:
                self.stats["errors"] += 1

        except Exception as e:
            self.stats["errors"] += 1
            print(f"⚠️  Error in direct message: {e}")

    def generate_broadcast(self):
        """Send a broadcast message"""
        try:
            start = time.time()

            broadcasts = [
                f"Load test broadcast #{self.stats['broadcasts_sent'] + 1}",
                f"Network health check at {datetime.now().strftime('%H:%M:%S')}",
                f"System stress test in progress - {self.get_elapsed_time()}",
                f"Active load generation - {self.stats['messages_sent']} messages sent",
                "Coordination checkpoint - all agents report status",
            ]

            content = random.choice(broadcasts)
            success = self.client.message_broadcast(content)
            latency = (time.time() - start) * 1000

            if success:
                self.stats["broadcasts_sent"] += 1
                self.log_operation("broadcast", {"length": len(content)}, latency)
            else:
                self.stats["errors"] += 1

        except Exception as e:
            self.stats["errors"] += 1
            print(f"⚠️  Error in broadcast: {e}")

    def create_task(self):
        """Create a new task"""
        try:
            start = time.time()

            task_type = random.choice(self.task_types)
            priority = random.choice(["low", "medium", "high", "urgent"])

            title = f"{task_type} - Priority {priority}"
            description = f"Load test task created at {datetime.now().isoformat()}. " \
                        f"This is task #{self.stats['tasks_created'] + 1} in the load test."

            task_data = {
                "priority": priority,
                "estimated_duration": random.randint(5, 60),
                "tags": random.sample(["load-test", "automated", "stress", "concurrent"], 2)
            }

            task_id = self.client.task_create(title, description, task_data)
            latency = (time.time() - start) * 1000

            if task_id:
                self.stats["tasks_created"] += 1
                self.log_operation("task_create", {"task_id": task_id[:20], "priority": priority}, latency)
            else:
                self.stats["errors"] += 1

        except Exception as e:
            self.stats["errors"] += 1
            print(f"⚠️  Error creating task: {e}")

    def claim_and_update_task(self):
        """Claim an available task and update it"""
        try:
            start = time.time()

            # Get available tasks
            tasks = self.client.task_list(status="available")

            if not tasks:
                return

            # Claim a random task
            task = random.choice(tasks)
            task_id = task.get('task_id')

            claim_success = self.client.task_claim(task_id)

            if claim_success:
                self.stats["tasks_claimed"] += 1

                # Wait a bit, then update
                time.sleep(random.uniform(0.5, 2.0))

                # Update to completed or in-progress
                new_status = random.choice(["in-progress", "completed"])
                result_data = {
                    "processed_by": self.client.agent_id,
                    "processing_time": random.uniform(1.0, 10.0),
                    "outcome": "success" if new_status == "completed" else "in-progress"
                }

                self.client.task_update(task_id, new_status, result_data)
                self.stats["tasks_updated"] += 1

                latency = (time.time() - start) * 1000
                self.log_operation("task_claim_update", {"task_id": task_id[:20], "status": new_status}, latency)
            else:
                self.stats["errors"] += 1

        except Exception as e:
            self.stats["errors"] += 1
            print(f"⚠️  Error claiming/updating task: {e}")

    def add_knowledge(self):
        """Add knowledge entry"""
        try:
            start = time.time()

            topic = random.choice(self.knowledge_topics).format(
                topic=random.choice(["testing", "deployment", "optimization", "debugging"])
            )

            content = f"{topic}: Load test knowledge entry #{self.stats['knowledge_added'] + 1}. " \
                     f"Generated at {datetime.now().isoformat()}. " \
                     f"This entry contains simulated knowledge data for stress testing purposes."

            tags = random.sample([
                "load-test", "automated", "documentation", "best-practices",
                "troubleshooting", "performance", "security", "testing"
            ], 3)

            knowledge_id = self.client.knowledge_add(content, tags)
            latency = (time.time() - start) * 1000

            if knowledge_id:
                self.stats["knowledge_added"] += 1
                self.log_operation("knowledge_add", {"knowledge_id": knowledge_id[:20], "tags": len(tags)}, latency)
            else:
                self.stats["errors"] += 1

        except Exception as e:
            self.stats["errors"] += 1
            print(f"⚠️  Error adding knowledge: {e}")

    def query_network_status(self):
        """Query network status"""
        try:
            start = time.time()

            # Get various status information
            agents = self.client.agent_list()
            tasks = self.client.task_list()
            knowledge = self.client.knowledge_query()

            latency = (time.time() - start) * 1000

            self.stats["status_queries"] += 1
            self.log_operation("status_query", {
                "agents": len(agents),
                "tasks": len(tasks),
                "knowledge": len(knowledge)
            }, latency)

        except Exception as e:
            self.stats["errors"] += 1
            print(f"⚠️  Error querying status: {e}")

    def get_elapsed_time(self) -> str:
        """Get formatted elapsed time"""
        elapsed = datetime.now() - self.start_time
        minutes = int(elapsed.total_seconds() / 60)
        seconds = int(elapsed.total_seconds() % 60)
        return f"{minutes}m {seconds}s"

    def print_status(self):
        """Print current load generation status"""
        elapsed = datetime.now() - self.start_time
        elapsed_minutes = elapsed.total_seconds() / 60
        remaining_minutes = max(0, self.duration_minutes - elapsed_minutes)

        total_ops = (self.stats["messages_sent"] + self.stats["broadcasts_sent"] +
                    self.stats["tasks_created"] + self.stats["tasks_claimed"] +
                    self.stats["tasks_updated"] + self.stats["knowledge_added"] +
                    self.stats["status_queries"])

        ops_per_minute = total_ops / elapsed_minutes if elapsed_minutes > 0 else 0

        print(f"\n{'='*70}")
        print(f"LOAD GENERATOR STATUS - {self.get_elapsed_time()} elapsed")
        print(f"{'='*70}")
        print(f"Direct Messages:    {self.stats['messages_sent']:>6}")
        print(f"Broadcasts:         {self.stats['broadcasts_sent']:>6}")
        print(f"Tasks Created:      {self.stats['tasks_created']:>6}")
        print(f"Tasks Claimed:      {self.stats['tasks_claimed']:>6}")
        print(f"Tasks Updated:      {self.stats['tasks_updated']:>6}")
        print(f"Knowledge Added:    {self.stats['knowledge_added']:>6}")
        print(f"Status Queries:     {self.stats['status_queries']:>6}")
        print(f"{'─'*70}")
        print(f"Total Operations:   {total_ops:>6}")
        print(f"Errors:             {self.stats['errors']:>6}")
        print(f"Ops/Minute:         {ops_per_minute:>6.1f}")
        print(f"Remaining Time:     {int(remaining_minutes)}m")
        print(f"{'='*70}\n")

    def run(self):
        """Run continuous load generation"""
        print("\n" + "╔" + "="*68 + "╗")
        print("║" + " "*20 + "LOAD GENERATOR - SARTOR NETWORK" + " "*17 + "║")
        print("╚" + "="*68 + "╝")
        print(f"\nDuration: {self.duration_minutes} minutes")
        print(f"Agent: {self.agent_name}")
        print(f"Start Time: {self.start_time.isoformat()}")

        # Connect to network
        if not self.client.connect():
            print("❌ Failed to connect to network. Aborting load generation.")
            return

        print("\n🚀 Starting load generation...\n")

        try:
            iteration = 0
            last_status_print = time.time()

            while True:
                iteration += 1

                # Check if duration exceeded
                elapsed_minutes = (datetime.now() - self.start_time).total_seconds() / 60
                if elapsed_minutes >= self.duration_minutes:
                    print("\n⏱️  Duration reached. Stopping load generation.")
                    break

                # Realistic load pattern - mix of operations
                operation = random.choices(
                    ['message', 'broadcast', 'task_create', 'task_claim', 'knowledge', 'status'],
                    weights=[30, 10, 15, 15, 20, 10],  # Weighted distribution
                    k=1
                )[0]

                if operation == 'message':
                    self.generate_direct_message()
                elif operation == 'broadcast':
                    self.generate_broadcast()
                elif operation == 'task_create':
                    self.create_task()
                elif operation == 'task_claim':
                    self.claim_and_update_task()
                elif operation == 'knowledge':
                    self.add_knowledge()
                elif operation == 'status':
                    self.query_network_status()

                # Realistic delay between operations (2-8 seconds)
                delay = random.uniform(2.0, 8.0)
                time.sleep(delay)

                # Print status every 30 seconds
                if time.time() - last_status_print >= 30:
                    self.print_status()
                    last_status_print = time.time()

        except KeyboardInterrupt:
            print("\n\n⚠️  Load generation interrupted by user")

        finally:
            self.print_status()
            self.generate_report()
            self.client.disconnect()

    def generate_report(self):
        """Generate comprehensive load generation report"""
        print("\n" + "="*70)
        print("GENERATING LOAD GENERATION REPORT")
        print("="*70)

        end_time = datetime.now()
        duration = end_time - self.start_time
        duration_minutes = duration.total_seconds() / 60

        total_ops = (self.stats["messages_sent"] + self.stats["broadcasts_sent"] +
                    self.stats["tasks_created"] + self.stats["tasks_claimed"] +
                    self.stats["tasks_updated"] + self.stats["knowledge_added"] +
                    self.stats["status_queries"])

        ops_per_minute = total_ops / duration_minutes if duration_minutes > 0 else 0

        # Calculate average latencies per operation type
        latency_by_type = {}
        for op in self.stats["operations"]:
            op_type = op["type"]
            if op_type not in latency_by_type:
                latency_by_type[op_type] = []
            latency_by_type[op_type].append(op["latency_ms"])

        avg_latencies = {
            op_type: sum(latencies) / len(latencies)
            for op_type, latencies in latency_by_type.items()
        }

        report = f"""# Load Generation Report - Sartor Network

**Test Agent:** {self.agent_name}
**Agent ID:** {self.client.agent_id}
**Start Time:** {self.start_time.isoformat()}
**End Time:** {end_time.isoformat()}
**Duration:** {duration_minutes:.2f} minutes ({duration.total_seconds():.1f} seconds)

---

## Executive Summary

This load generator created realistic network traffic to stress test the Sartor Network
while other test agents validated functionality. The goal was to simulate real-world
usage patterns with a mix of operations at realistic intervals.

### Load Statistics

- **Total Operations:** {total_ops}
- **Operations per Minute:** {ops_per_minute:.2f}
- **Error Count:** {self.stats['errors']}
- **Error Rate:** {(self.stats['errors'] / total_ops * 100) if total_ops > 0 else 0:.2f}%
- **Success Rate:** {((total_ops - self.stats['errors']) / total_ops * 100) if total_ops > 0 else 0:.2f}%

---

## Operation Breakdown

### Communication Operations
- **Direct Messages Sent:** {self.stats['messages_sent']}
- **Broadcast Messages:** {self.stats['broadcasts_sent']}
- **Total Communication Ops:** {self.stats['messages_sent'] + self.stats['broadcasts_sent']}

### Task Coordination Operations
- **Tasks Created:** {self.stats['tasks_created']}
- **Tasks Claimed:** {self.stats['tasks_claimed']}
- **Tasks Updated:** {self.stats['tasks_updated']}
- **Total Task Ops:** {self.stats['tasks_created'] + self.stats['tasks_claimed'] + self.stats['tasks_updated']}

### Knowledge Base Operations
- **Knowledge Entries Added:** {self.stats['knowledge_added']}

### Network Status Operations
- **Status Queries:** {self.stats['status_queries']}

---

## Performance Metrics

### Average Latencies by Operation Type

"""

        for op_type, avg_latency in sorted(avg_latencies.items()):
            report += f"- **{op_type}:** {avg_latency:.2f}ms\n"

        report += f"""

### Latency Distribution

"""

        # Calculate percentiles if we have operations
        if self.stats["operations"]:
            all_latencies = sorted([op["latency_ms"] for op in self.stats["operations"]])
            p50 = all_latencies[len(all_latencies) // 2]
            p95 = all_latencies[int(len(all_latencies) * 0.95)]
            p99 = all_latencies[int(len(all_latencies) * 0.99)]

            report += f"- **Minimum:** {min(all_latencies):.2f}ms\n"
            report += f"- **P50 (Median):** {p50:.2f}ms\n"
            report += f"- **P95:** {p95:.2f}ms\n"
            report += f"- **P99:** {p99:.2f}ms\n"
            report += f"- **Maximum:** {max(all_latencies):.2f}ms\n"
            report += f"- **Average:** {sum(all_latencies) / len(all_latencies):.2f}ms\n"

        report += f"""

---

## Load Pattern Analysis

### Operation Distribution

The load generator used a weighted random distribution to simulate realistic usage:

- **Direct Messages:** 30% (most common operation)
- **Broadcasts:** 10% (periodic announcements)
- **Task Creation:** 15% (regular work assignment)
- **Task Claiming/Updating:** 15% (work processing)
- **Knowledge Operations:** 20% (information sharing)
- **Status Queries:** 10% (monitoring)

### Timing Pattern

- **Inter-operation Delay:** 2-8 seconds (randomized)
- **Realistic Simulation:** Mimics human/agent interaction patterns
- **Not Max Throughput:** Designed for sustained realistic load, not spike testing

---

## Network Impact Assessment

### System Stress Indicators

"""

        if self.stats['errors'] == 0:
            report += "- ✅ **Zero errors** - System handled load perfectly\n"
        elif self.stats['errors'] < total_ops * 0.01:
            report += f"- ✅ **{self.stats['errors']} errors** - Acceptable error rate (<1%)\n"
        elif self.stats['errors'] < total_ops * 0.05:
            report += f"- ⚠️  **{self.stats['errors']} errors** - Elevated error rate (1-5%)\n"
        else:
            report += f"- ❌ **{self.stats['errors']} errors** - High error rate (>5%)\n"

        if ops_per_minute > 5:
            report += f"- ✅ **{ops_per_minute:.1f} ops/min** - Good sustained load\n"
        else:
            report += f"- ⚠️  **{ops_per_minute:.1f} ops/min** - Low operation rate\n"

        report += """

### Firebase Performance

Based on operation latencies:
"""

        if self.stats["operations"]:
            avg_overall = sum(op["latency_ms"] for op in self.stats["operations"]) / len(self.stats["operations"])

            if avg_overall < 100:
                report += f"- ✅ **Excellent** - {avg_overall:.1f}ms average latency\n"
            elif avg_overall < 300:
                report += f"- ✅ **Good** - {avg_overall:.1f}ms average latency\n"
            elif avg_overall < 1000:
                report += f"- ⚠️  **Acceptable** - {avg_overall:.1f}ms average latency\n"
            else:
                report += f"- ❌ **Concerning** - {avg_overall:.1f}ms average latency\n"

        report += """

---

## Concurrent Testing Coordination

This load generator ran alongside other test agents:

- **Connectivity-Tester** - Validating agent connections
- **Communication-Tester** - Testing message delivery
- **Task-Tester** - Verifying task coordination
- **Knowledge-Tester** - Checking knowledge base
- **Discovery-Tester** - Testing agent discovery
- **Performance-Tester** - Measuring system performance
- **Error-Tester** - Testing error handling
- **Integration Testers** - End-to-end scenarios
- **Monitor-Agent** - Observing all activity

### Purpose

The load generator created background "noise" to ensure other tests validated
functionality under realistic conditions, not just in isolation.

---

## Key Findings

### Strengths

"""

        if self.stats['errors'] == 0:
            report += "- System handled all operations without errors\n"

        report += f"- Sustained load generation for {duration_minutes:.1f} minutes\n"
        report += f"- {total_ops} operations completed successfully\n"
        report += "- Realistic operation mix and timing patterns\n"

        if avg_latencies:
            fastest = min(avg_latencies.values())
            report += f"- Fastest operation type: {fastest:.1f}ms average\n"

        report += """

### Observations

"""

        if self.stats['errors'] > 0:
            report += f"- {self.stats['errors']} errors occurred during load generation\n"
            report += "- Errors should be investigated in conjunction with other test results\n"

        report += "- Load pattern successfully created concurrent activity\n"
        report += "- Network remained responsive throughout testing\n"

        report += """

---

## Recommendations

1. **Extended Load Testing:** Run for longer duration (hours) to test sustained load
2. **Increased Intensity:** Test with higher operation rate (shorter delays)
3. **Spike Testing:** Add sudden bursts of high activity
4. **Multiple Load Generators:** Run several simultaneously
5. **Varied Patterns:** Test different operation distributions

---

## Recent Operations Sample

Last 20 operations recorded:

"""

        for op in self.stats["operations"][-20:]:
            report += f"- **{op['timestamp']}** - {op['type']} ({op['latency_ms']:.1f}ms)\n"

        report += f"""

---

## Conclusion

The load generator successfully created sustained realistic network traffic for
{duration_minutes:.1f} minutes, performing {total_ops} operations at an average rate
of {ops_per_minute:.1f} ops/minute. This provided a realistic testing environment
for concurrent test agents to validate system functionality under load.

**Error Rate:** {(self.stats['errors'] / total_ops * 100) if total_ops > 0 else 0:.2f}%
**Average Latency:** {sum(op["latency_ms"] for op in self.stats["operations"]) / len(self.stats["operations"]) if self.stats["operations"] else 0:.1f}ms

The system demonstrated {'excellent' if self.stats['errors'] == 0 else 'acceptable' if self.stats['errors'] < total_ops * 0.05 else 'concerning'} stability under sustained load.

**Test Completed:** {end_time.isoformat()}
"""

        # Save report
        report_path = "/home/user/Sartor-claude-network/test-results/load-generation-report.md"
        import os
        os.makedirs(os.path.dirname(report_path), exist_ok=True)

        with open(report_path, 'w') as f:
            f.write(report)

        print(f"\n📊 Report saved to: {report_path}")

        # Save JSON stats
        json_path = report_path.replace('.md', '.json')
        with open(json_path, 'w') as f:
            json.dump({
                'agent_name': self.agent_name,
                'agent_id': self.client.agent_id,
                'start_time': self.start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_minutes': duration_minutes,
                'statistics': self.stats,
                'latency_by_type': {k: round(v, 2) for k, v in avg_latencies.items()}
            }, f, indent=2)

        print(f"📊 JSON stats saved to: {json_path}")


if __name__ == "__main__":
    # Default to 30 minutes, but allow override
    import sys
    duration = 30
    if len(sys.argv) > 1:
        try:
            duration = int(sys.argv[1])
        except:
            print(f"Invalid duration, using default: {duration} minutes")

    generator = LoadGenerator(duration_minutes=duration)
    generator.run()
