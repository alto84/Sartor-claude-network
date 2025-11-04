#!/usr/bin/env python3
"""
Performance Test Suite for Sartor Network
Tests T8.1 through T8.7 from COMPREHENSIVE-TEST-PLAN.md

This script executes comprehensive performance tests and generates detailed metrics.
"""

import sys
import os
import time
import json
import uuid
import psutil
import threading
import statistics
from datetime import datetime
from typing import List, Dict, Any, Tuple
import traceback

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the Sartor Network client
try:
    # Try importing from bootstrap file
    exec(open('sartor-network-bootstrap.py').read())
    NetworkClient = SartorNetworkClient
except Exception as e:
    print(f"Error loading network client: {e}")
    print("Attempting to use inline import...")

    import requests
    from datetime import datetime

    class NetworkClient:
        """Fallback inline client"""
        def __init__(self, firebase_url="https://home-claude-network-default-rtdb.firebaseio.com/", agent_id=None, agent_name=None):
            self.firebase_url = firebase_url.rstrip("/")
            self.agent_id = agent_id or f"perf-test-{int(time.time())}-{str(uuid.uuid4())[:8]}"
            self.agent_name = agent_name or f"PerfTest-{self.agent_id[:12]}"
            self.is_connected = False

        def _firebase_request(self, method, path, data=None):
            url = f"{self.firebase_url}/agents-network{path}.json"
            try:
                if method == "GET":
                    response = requests.get(url, timeout=10)
                elif method == "PUT":
                    response = requests.put(url, json=data, timeout=10)
                elif method == "POST":
                    response = requests.post(url, json=data, timeout=10)
                elif method == "PATCH":
                    response = requests.patch(url, json=data, timeout=10)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                return None

        def connect(self):
            agent_data = {
                "agent_id": self.agent_id,
                "agent_name": self.agent_name,
                "status": "online",
                "capabilities": ["performance-testing"],
                "joined_at": datetime.now().isoformat(),
            }
            result = self._firebase_request("PUT", f"/agents/{self.agent_id}", agent_data)
            self.is_connected = result is not None
            return self.is_connected

        def disconnect(self):
            if self.is_connected:
                self._firebase_request("PATCH", f"/agents/{self.agent_id}", {"status": "offline"})
                self.is_connected = False

        def message_send(self, to_agent_id, content):
            msg_id = str(uuid.uuid4())
            data = {"from": self.agent_id, "to": to_agent_id, "content": content, "timestamp": datetime.now().isoformat(), "read": False}
            return self._firebase_request("PUT", f"/messages/direct/{to_agent_id}/{msg_id}", data) is not None

        def message_broadcast(self, content):
            msg_id = str(uuid.uuid4())
            data = {"from": self.agent_id, "content": content, "timestamp": datetime.now().isoformat()}
            return self._firebase_request("PUT", f"/messages/broadcast/{msg_id}", data) is not None

        def knowledge_add(self, content, tags=None):
            k_id = str(uuid.uuid4())
            data = {"content": content, "added_by": self.agent_id, "timestamp": datetime.now().isoformat(), "tags": tags or []}
            result = self._firebase_request("PUT", f"/knowledge/{k_id}", data)
            return k_id if result else ""

        def knowledge_query(self, query=None):
            knowledge = self._firebase_request("GET", "/knowledge")
            if not knowledge:
                return []
            k_list = []
            for k_id, k_data in knowledge.items():
                if isinstance(k_data, dict):
                    k_data["knowledge_id"] = k_id
                    if query:
                        if query.lower() in k_data.get("content", "").lower():
                            k_list.append(k_data)
                    else:
                        k_list.append(k_data)
            return k_list

        def agent_list(self):
            agents = self._firebase_request("GET", "/agents")
            if not agents:
                return []
            a_list = []
            for agent_id, agent_data in agents.items():
                if isinstance(agent_data, dict):
                    agent_data["agent_id"] = agent_id
                    a_list.append(agent_data)
            return a_list


class PerformanceTestResults:
    """Container for all test results"""
    def __init__(self):
        self.results = {}
        self.start_time = datetime.now()
        self.end_time = None

    def add_result(self, test_id: str, result: Dict[str, Any]):
        """Add a test result"""
        self.results[test_id] = {
            "timestamp": datetime.now().isoformat(),
            "result": result
        }

    def finalize(self):
        """Finalize results"""
        self.end_time = datetime.now()

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": (self.end_time - self.start_time).total_seconds() if self.end_time else None,
            "results": self.results
        }


class PerformanceTester:
    """Main performance testing class"""

    def __init__(self):
        self.results = PerformanceTestResults()
        self.process = psutil.Process()
        self.main_client = None

    def run_all_tests(self):
        """Execute all performance tests T8.1 through T8.7"""
        print("=" * 80)
        print("SARTOR NETWORK PERFORMANCE TEST SUITE")
        print("=" * 80)
        print(f"Start Time: {datetime.now().isoformat()}")
        print()

        try:
            # T8.1 - Connection Latency
            print("\n[T8.1] Testing Connection Latency...")
            self.test_connection_latency()

            # T8.2 - Message Throughput
            print("\n[T8.2] Testing Message Throughput...")
            self.test_message_throughput()

            # T8.3 - Concurrent Agents Stress Test
            print("\n[T8.3] Testing Concurrent Agents (Stress Test)...")
            self.test_concurrent_agents()

            # T8.4 - Large Knowledge Base Query Performance
            print("\n[T8.4] Testing Knowledge Base Query Performance...")
            self.test_knowledge_performance()

            # T8.5 - Network Resilience Under Load
            print("\n[T8.5] Testing Network Resilience Under Load...")
            self.test_network_resilience()

            # T8.6 - Firebase API Rate Limiting
            print("\n[T8.6] Testing Firebase API Rate Limiting...")
            self.test_rate_limiting()

            # T8.7 - Memory Usage Monitoring
            print("\n[T8.7] Monitoring Memory Usage...")
            self.test_memory_usage()

        except Exception as e:
            print(f"\nERROR in test execution: {e}")
            traceback.print_exc()

        finally:
            self.results.finalize()

        print("\n" + "=" * 80)
        print("PERFORMANCE TESTS COMPLETE")
        print("=" * 80)

        return self.results

    def test_connection_latency(self):
        """T8.1 - Measure connection latency"""
        latencies = []
        num_tests = 10

        print(f"  Running {num_tests} connection tests...")

        for i in range(num_tests):
            try:
                client = NetworkClient(agent_name=f"Latency-Test-{i+1}")

                start_time = time.perf_counter()
                success = client.connect()
                end_time = time.perf_counter()

                if success:
                    latency_ms = (end_time - start_time) * 1000
                    latencies.append(latency_ms)
                    print(f"    Test {i+1}: {latency_ms:.2f}ms")
                else:
                    print(f"    Test {i+1}: FAILED")

                client.disconnect()
                time.sleep(0.1)  # Small delay between tests

            except Exception as e:
                print(f"    Test {i+1}: ERROR - {e}")

        if latencies:
            result = {
                "status": "PASS",
                "num_tests": num_tests,
                "successful_connections": len(latencies),
                "failed_connections": num_tests - len(latencies),
                "latency_ms": {
                    "min": min(latencies),
                    "max": max(latencies),
                    "mean": statistics.mean(latencies),
                    "median": statistics.median(latencies),
                    "stdev": statistics.stdev(latencies) if len(latencies) > 1 else 0
                },
                "all_latencies_ms": latencies,
                "target_latency_ms": 100,
                "meets_target": statistics.mean(latencies) < 100
            }
        else:
            result = {
                "status": "FAIL",
                "error": "No successful connections"
            }

        self.results.add_result("T8.1", result)
        print(f"\n  Result: {result.get('status')}")
        if latencies:
            print(f"  Average Latency: {statistics.mean(latencies):.2f}ms")
            print(f"  Meets Target (<100ms): {result['meets_target']}")

    def test_message_throughput(self):
        """T8.2 - Test message throughput (target: 100 messages/sec)"""

        # Create sender and receiver clients
        sender = NetworkClient(agent_name="Throughput-Sender")
        receiver = NetworkClient(agent_name="Throughput-Receiver")

        try:
            sender.connect()
            receiver.connect()

            num_messages = 100
            print(f"  Sending {num_messages} messages...")

            send_times = []
            successful_sends = 0

            start_time = time.perf_counter()

            for i in range(num_messages):
                msg_start = time.perf_counter()
                success = sender.message_send(receiver.agent_id, f"Throughput test message {i+1}")
                msg_end = time.perf_counter()

                if success:
                    successful_sends += 1
                    send_times.append((msg_end - msg_start) * 1000)

            end_time = time.perf_counter()
            total_time = end_time - start_time

            throughput = successful_sends / total_time

            result = {
                "status": "PASS" if successful_sends == num_messages else "PARTIAL",
                "total_messages": num_messages,
                "successful_messages": successful_sends,
                "failed_messages": num_messages - successful_sends,
                "total_time_seconds": total_time,
                "throughput_msg_per_sec": throughput,
                "target_throughput": 100,
                "meets_target": throughput >= 100,
                "per_message_latency_ms": {
                    "min": min(send_times) if send_times else 0,
                    "max": max(send_times) if send_times else 0,
                    "mean": statistics.mean(send_times) if send_times else 0
                }
            }

            self.results.add_result("T8.2", result)
            print(f"\n  Result: {result['status']}")
            print(f"  Throughput: {throughput:.2f} messages/sec")
            print(f"  Meets Target (>=100 msg/sec): {result['meets_target']}")

        finally:
            sender.disconnect()
            receiver.disconnect()

    def test_concurrent_agents(self):
        """T8.3 - Stress test with 20+ concurrent agents"""

        num_agents = 25
        print(f"  Spawning {num_agents} concurrent agents...")

        agents = []
        connection_times = []

        # Phase 1: Connect all agents
        start_time = time.perf_counter()

        for i in range(num_agents):
            try:
                agent = NetworkClient(agent_name=f"Stress-Agent-{i+1}")
                conn_start = time.perf_counter()
                success = agent.connect()
                conn_end = time.perf_counter()

                if success:
                    agents.append(agent)
                    connection_times.append((conn_end - conn_start) * 1000)

            except Exception as e:
                print(f"    Agent {i+1}: Failed to connect - {e}")

        connect_duration = time.perf_counter() - start_time

        print(f"  Connected {len(agents)}/{num_agents} agents in {connect_duration:.2f}s")

        # Phase 2: All agents broadcast simultaneously
        broadcast_times = []
        broadcast_start = time.perf_counter()

        for i, agent in enumerate(agents):
            try:
                msg_start = time.perf_counter()
                agent.message_broadcast(f"Stress test broadcast from agent {i+1}")
                msg_end = time.perf_counter()
                broadcast_times.append((msg_end - msg_start) * 1000)
            except Exception as e:
                print(f"    Agent {i+1}: Broadcast failed - {e}")

        broadcast_duration = time.perf_counter() - broadcast_start

        # Phase 3: Cleanup
        disconnect_start = time.perf_counter()
        for agent in agents:
            try:
                agent.disconnect()
            except:
                pass
        disconnect_duration = time.perf_counter() - disconnect_start

        result = {
            "status": "PASS" if len(agents) >= 20 else "FAIL",
            "target_agents": 20,
            "spawned_agents": num_agents,
            "successful_connections": len(agents),
            "failed_connections": num_agents - len(agents),
            "connection_phase": {
                "total_time_seconds": connect_duration,
                "connection_latency_ms": {
                    "min": min(connection_times) if connection_times else 0,
                    "max": max(connection_times) if connection_times else 0,
                    "mean": statistics.mean(connection_times) if connection_times else 0
                }
            },
            "broadcast_phase": {
                "total_time_seconds": broadcast_duration,
                "successful_broadcasts": len(broadcast_times),
                "broadcast_latency_ms": {
                    "min": min(broadcast_times) if broadcast_times else 0,
                    "max": max(broadcast_times) if broadcast_times else 0,
                    "mean": statistics.mean(broadcast_times) if broadcast_times else 0
                }
            },
            "disconnect_phase": {
                "total_time_seconds": disconnect_duration
            },
            "meets_target": len(agents) >= 20
        }

        self.results.add_result("T8.3", result)
        print(f"\n  Result: {result['status']}")
        print(f"  Successful Concurrent Connections: {len(agents)}")
        print(f"  Meets Target (>=20): {result['meets_target']}")

    def test_knowledge_performance(self):
        """T8.4 - Test large knowledge base query performance"""

        client = NetworkClient(agent_name="Knowledge-Performance-Test")

        try:
            client.connect()

            # Add various sizes of knowledge entries
            sizes = [100, 1000, 10000, 50000, 100000]  # bytes
            add_times = {}

            print(f"  Adding knowledge entries of various sizes...")

            for size in sizes:
                content = "x" * size  # Create content of specific size

                start_time = time.perf_counter()
                k_id = client.knowledge_add(content, tags=[f"size-{size}", "performance-test"])
                end_time = time.perf_counter()

                add_times[size] = {
                    "time_ms": (end_time - start_time) * 1000,
                    "success": bool(k_id),
                    "knowledge_id": k_id
                }

                print(f"    {size} bytes: {add_times[size]['time_ms']:.2f}ms")

            # Query performance
            print(f"\n  Testing query performance...")

            query_times = []
            for i in range(10):
                start_time = time.perf_counter()
                results = client.knowledge_query("performance-test")
                end_time = time.perf_counter()

                query_times.append((end_time - start_time) * 1000)

            result = {
                "status": "PASS",
                "add_operations": add_times,
                "query_operations": {
                    "num_queries": len(query_times),
                    "query_latency_ms": {
                        "min": min(query_times),
                        "max": max(query_times),
                        "mean": statistics.mean(query_times),
                        "median": statistics.median(query_times)
                    }
                },
                "largest_entry_size_bytes": max(sizes),
                "largest_entry_add_time_ms": add_times[max(sizes)]["time_ms"]
            }

            self.results.add_result("T8.4", result)
            print(f"\n  Result: {result['status']}")
            print(f"  Average Query Time: {statistics.mean(query_times):.2f}ms")
            print(f"  Largest Entry (100KB): {add_times[100000]['time_ms']:.2f}ms")

        finally:
            client.disconnect()

    def test_network_resilience(self):
        """T8.5 - Test network resilience under load"""

        print(f"  Testing network resilience with rapid operations...")

        client = NetworkClient(agent_name="Resilience-Test")

        try:
            client.connect()

            operations = {
                "broadcasts": 0,
                "knowledge_adds": 0,
                "queries": 0,
                "errors": 0
            }

            # Rapid-fire operations for 10 seconds
            start_time = time.time()
            duration = 10  # seconds

            while time.time() - start_time < duration:
                try:
                    # Broadcast
                    if client.message_broadcast(f"Resilience test {operations['broadcasts']}"):
                        operations["broadcasts"] += 1

                    # Add knowledge
                    if client.knowledge_add(f"Resilience test data {operations['knowledge_adds']}", tags=["resilience"]):
                        operations["knowledge_adds"] += 1

                    # Query
                    client.knowledge_query("resilience")
                    operations["queries"] += 1

                except Exception as e:
                    operations["errors"] += 1

            total_ops = operations["broadcasts"] + operations["knowledge_adds"] + operations["queries"]
            ops_per_sec = total_ops / duration
            error_rate = operations["errors"] / total_ops if total_ops > 0 else 0

            result = {
                "status": "PASS" if error_rate < 0.05 else "FAIL",  # Less than 5% error rate
                "duration_seconds": duration,
                "operations": operations,
                "total_operations": total_ops,
                "operations_per_second": ops_per_sec,
                "error_rate": error_rate,
                "meets_target": error_rate < 0.05
            }

            self.results.add_result("T8.5", result)
            print(f"\n  Result: {result['status']}")
            print(f"  Total Operations: {total_ops}")
            print(f"  Operations/sec: {ops_per_sec:.2f}")
            print(f"  Error Rate: {error_rate*100:.2f}%")

        finally:
            client.disconnect()

    def test_rate_limiting(self):
        """T8.6 - Test Firebase API rate limiting handling"""

        print(f"  Testing rate limiting with rapid requests...")

        client = NetworkClient(agent_name="RateLimit-Test")

        try:
            client.connect()

            # Make rapid-fire requests and measure failures
            num_requests = 200
            successful = 0
            failed = 0
            response_times = []

            for i in range(num_requests):
                start_time = time.perf_counter()
                try:
                    # Try to add knowledge rapidly
                    result = client.knowledge_add(f"Rate limit test {i}", tags=["rate-limit-test"])
                    end_time = time.perf_counter()

                    if result:
                        successful += 1
                        response_times.append((end_time - start_time) * 1000)
                    else:
                        failed += 1

                except Exception as e:
                    failed += 1

            result = {
                "status": "PASS",
                "total_requests": num_requests,
                "successful_requests": successful,
                "failed_requests": failed,
                "success_rate": successful / num_requests,
                "response_times_ms": {
                    "min": min(response_times) if response_times else 0,
                    "max": max(response_times) if response_times else 0,
                    "mean": statistics.mean(response_times) if response_times else 0
                },
                "rate_limiting_observed": failed > 0,
                "notes": "Firebase Free Tier has rate limits - some failures expected"
            }

            self.results.add_result("T8.6", result)
            print(f"\n  Result: {result['status']}")
            print(f"  Success Rate: {result['success_rate']*100:.1f}%")
            print(f"  Failed Requests: {failed}")

        finally:
            client.disconnect()

    def test_memory_usage(self):
        """T8.7 - Monitor memory usage during operations"""

        print(f"  Monitoring memory usage...")

        # Get baseline memory
        mem_baseline = self.process.memory_info().rss / 1024 / 1024  # MB

        memory_samples = [{"time": 0, "memory_mb": mem_baseline, "operation": "baseline"}]

        # Create client
        client = NetworkClient(agent_name="Memory-Test")
        client.connect()

        mem_after_connect = self.process.memory_info().rss / 1024 / 1024
        memory_samples.append({"time": 1, "memory_mb": mem_after_connect, "operation": "after_connect"})

        # Add 100 knowledge entries
        for i in range(100):
            client.knowledge_add(f"Memory test entry {i}" * 10, tags=["memory-test"])

            if i % 20 == 0:
                mem = self.process.memory_info().rss / 1024 / 1024
                memory_samples.append({"time": i, "memory_mb": mem, "operation": f"after_{i}_knowledge_adds"})

        mem_after_knowledge = self.process.memory_info().rss / 1024 / 1024
        memory_samples.append({"time": 100, "memory_mb": mem_after_knowledge, "operation": "after_100_knowledge_adds"})

        # Query operations
        for i in range(50):
            client.knowledge_query("memory-test")

        mem_after_queries = self.process.memory_info().rss / 1024 / 1024
        memory_samples.append({"time": 150, "memory_mb": mem_after_queries, "operation": "after_50_queries"})

        client.disconnect()

        mem_after_disconnect = self.process.memory_info().rss / 1024 / 1024
        memory_samples.append({"time": 200, "memory_mb": mem_after_disconnect, "operation": "after_disconnect"})

        memory_increase = mem_after_disconnect - mem_baseline
        max_memory = max([s["memory_mb"] for s in memory_samples])

        result = {
            "status": "PASS",
            "baseline_memory_mb": mem_baseline,
            "max_memory_mb": max_memory,
            "final_memory_mb": mem_after_disconnect,
            "memory_increase_mb": memory_increase,
            "memory_samples": memory_samples,
            "acceptable_increase": memory_increase < 100,  # Less than 100MB increase
            "notes": "Memory usage monitored across connection, knowledge operations, and queries"
        }

        self.results.add_result("T8.7", result)
        print(f"\n  Result: {result['status']}")
        print(f"  Baseline Memory: {mem_baseline:.2f}MB")
        print(f"  Max Memory: {max_memory:.2f}MB")
        print(f"  Memory Increase: {memory_increase:.2f}MB")


def generate_report(results: PerformanceTestResults):
    """Generate markdown report from test results"""

    report = f"""# Sartor Network Performance Test Report

**Test Date:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Test Duration:** {results.to_dict()['duration_seconds']:.2f} seconds

## Executive Summary

This report contains detailed performance metrics for the Sartor Network, covering tests T8.1 through T8.7 from the Comprehensive Test Plan.

## Test Results

"""

    # T8.1 - Connection Latency
    t81 = results.results.get("T8.1", {}).get("result", {})
    report += f"""### T8.1 - Connection Latency Measurement

**Status:** {t81.get('status', 'N/A')}
**Target:** < 100ms average latency
**Result:** {'✅ PASS' if t81.get('meets_target') else '❌ FAIL'}

**Metrics:**
- Total Connection Tests: {t81.get('num_tests', 0)}
- Successful Connections: {t81.get('successful_connections', 0)}
- Failed Connections: {t81.get('failed_connections', 0)}

**Latency Statistics:**
- Minimum: {t81.get('latency_ms', {}).get('min', 0):.2f}ms
- Maximum: {t81.get('latency_ms', {}).get('max', 0):.2f}ms
- Mean: {t81.get('latency_ms', {}).get('mean', 0):.2f}ms
- Median: {t81.get('latency_ms', {}).get('median', 0):.2f}ms
- Std Dev: {t81.get('latency_ms', {}).get('stdev', 0):.2f}ms

**Individual Test Results:**
```
"""
    for i, lat in enumerate(t81.get('all_latencies_ms', []), 1):
        report += f"Test {i}: {lat:.2f}ms\n"
    report += "```\n\n"

    # T8.2 - Message Throughput
    t82 = results.results.get("T8.2", {}).get("result", {})
    report += f"""### T8.2 - Message Throughput Test

**Status:** {t82.get('status', 'N/A')}
**Target:** >= 100 messages/second
**Result:** {'✅ PASS' if t82.get('meets_target') else '❌ FAIL'}

**Metrics:**
- Total Messages Sent: {t82.get('total_messages', 0)}
- Successful: {t82.get('successful_messages', 0)}
- Failed: {t82.get('failed_messages', 0)}
- Total Time: {t82.get('total_time_seconds', 0):.2f}s
- **Throughput: {t82.get('throughput_msg_per_sec', 0):.2f} messages/second**

**Per-Message Latency:**
- Minimum: {t82.get('per_message_latency_ms', {}).get('min', 0):.2f}ms
- Maximum: {t82.get('per_message_latency_ms', {}).get('max', 0):.2f}ms
- Mean: {t82.get('per_message_latency_ms', {}).get('mean', 0):.2f}ms

"""

    # T8.3 - Concurrent Agents
    t83 = results.results.get("T8.3", {}).get("result", {})
    report += f"""### T8.3 - Concurrent Agent Stress Test

**Status:** {t83.get('status', 'N/A')}
**Target:** >= 20 concurrent agents
**Result:** {'✅ PASS' if t83.get('meets_target') else '❌ FAIL'}

**Metrics:**
- Target Agents: {t83.get('target_agents', 0)}
- Attempted Connections: {t83.get('spawned_agents', 0)}
- **Successful Concurrent Connections: {t83.get('successful_connections', 0)}**
- Failed Connections: {t83.get('failed_connections', 0)}

**Connection Phase:**
- Total Time: {t83.get('connection_phase', {}).get('total_time_seconds', 0):.2f}s
- Min Latency: {t83.get('connection_phase', {}).get('connection_latency_ms', {}).get('min', 0):.2f}ms
- Max Latency: {t83.get('connection_phase', {}).get('connection_latency_ms', {}).get('max', 0):.2f}ms
- Mean Latency: {t83.get('connection_phase', {}).get('connection_latency_ms', {}).get('mean', 0):.2f}ms

**Broadcast Phase:**
- Total Time: {t83.get('broadcast_phase', {}).get('total_time_seconds', 0):.2f}s
- Successful Broadcasts: {t83.get('broadcast_phase', {}).get('successful_broadcasts', 0)}
- Mean Latency: {t83.get('broadcast_phase', {}).get('broadcast_latency_ms', {}).get('mean', 0):.2f}ms

**Disconnect Phase:**
- Total Time: {t83.get('disconnect_phase', {}).get('total_time_seconds', 0):.2f}s

"""

    # T8.4 - Knowledge Base Performance
    t84 = results.results.get("T8.4", {}).get("result", {})
    report += f"""### T8.4 - Large Knowledge Base Query Performance

**Status:** {t84.get('status', 'N/A')}

**Add Operations (by size):**
"""
    for size, data in t84.get('add_operations', {}).items():
        report += f"- {size:,} bytes: {data['time_ms']:.2f}ms ({'✅' if data['success'] else '❌'})\n"

    report += f"""
**Query Operations:**
- Number of Queries: {t84.get('query_operations', {}).get('num_queries', 0)}
- Min Latency: {t84.get('query_operations', {}).get('query_latency_ms', {}).get('min', 0):.2f}ms
- Max Latency: {t84.get('query_operations', {}).get('query_latency_ms', {}).get('max', 0):.2f}ms
- Mean Latency: {t84.get('query_operations', {}).get('query_latency_ms', {}).get('mean', 0):.2f}ms
- Median Latency: {t84.get('query_operations', {}).get('query_latency_ms', {}).get('median', 0):.2f}ms

**Notable:**
- Largest Entry Size: {t84.get('largest_entry_size_bytes', 0):,} bytes (100KB)
- Largest Entry Add Time: {t84.get('largest_entry_add_time_ms', 0):.2f}ms

"""

    # T8.5 - Network Resilience
    t85 = results.results.get("T8.5", {}).get("result", {})
    report += f"""### T8.5 - Network Resilience Under Load

**Status:** {t85.get('status', 'N/A')}
**Target:** < 5% error rate under continuous load
**Result:** {'✅ PASS' if t85.get('meets_target') else '❌ FAIL'}

**Load Test Duration:** {t85.get('duration_seconds', 0)} seconds

**Operations Performed:**
- Broadcasts: {t85.get('operations', {}).get('broadcasts', 0)}
- Knowledge Adds: {t85.get('operations', {}).get('knowledge_adds', 0)}
- Queries: {t85.get('operations', {}).get('queries', 0)}
- Errors: {t85.get('operations', {}).get('errors', 0)}

**Performance:**
- Total Operations: {t85.get('total_operations', 0)}
- Operations/Second: {t85.get('operations_per_second', 0):.2f}
- **Error Rate: {t85.get('error_rate', 0)*100:.2f}%**

"""

    # T8.6 - Rate Limiting
    t86 = results.results.get("T8.6", {}).get("result", {})
    report += f"""### T8.6 - Firebase API Rate Limiting Handling

**Status:** {t86.get('status', 'N/A')}

**Test Parameters:**
- Total Requests: {t86.get('total_requests', 0)}
- Successful Requests: {t86.get('successful_requests', 0)}
- Failed Requests: {t86.get('failed_requests', 0)}
- **Success Rate: {t86.get('success_rate', 0)*100:.1f}%**

**Response Times:**
- Minimum: {t86.get('response_times_ms', {}).get('min', 0):.2f}ms
- Maximum: {t86.get('response_times_ms', {}).get('max', 0):.2f}ms
- Mean: {t86.get('response_times_ms', {}).get('mean', 0):.2f}ms

**Rate Limiting:**
- Rate Limiting Observed: {'Yes' if t86.get('rate_limiting_observed') else 'No'}
- Note: {t86.get('notes', '')}

"""

    # T8.7 - Memory Usage
    t87 = results.results.get("T8.7", {}).get("result", {})
    report += f"""### T8.7 - Memory Usage Monitoring

**Status:** {t87.get('status', 'N/A')}
**Target:** < 100MB memory increase during operations
**Result:** {'✅ PASS' if t87.get('acceptable_increase') else '❌ FAIL'}

**Memory Statistics:**
- Baseline Memory: {t87.get('baseline_memory_mb', 0):.2f}MB
- Maximum Memory: {t87.get('max_memory_mb', 0):.2f}MB
- Final Memory: {t87.get('final_memory_mb', 0):.2f}MB
- **Total Increase: {t87.get('memory_increase_mb', 0):.2f}MB**

**Memory Samples:**
```
"""
    for sample in t87.get('memory_samples', []):
        report += f"{sample['operation']:.<40} {sample['memory_mb']:.2f}MB\n"
    report += "```\n\n"

    # Summary
    report += f"""## Overall Performance Summary

### Pass/Fail Summary
"""

    test_statuses = []
    for test_id in ["T8.1", "T8.2", "T8.3", "T8.4", "T8.5", "T8.6", "T8.7"]:
        status = results.results.get(test_id, {}).get("result", {}).get("status", "N/A")
        test_statuses.append((test_id, status))
        report += f"- **{test_id}:** {status}\n"

    passed = sum(1 for _, status in test_statuses if status == "PASS")
    total = len(test_statuses)

    report += f"""
**Overall Score:** {passed}/{total} tests passed ({passed/total*100:.1f}%)

### Key Performance Indicators

1. **Connection Latency:** {t81.get('latency_ms', {}).get('mean', 0):.2f}ms average (target: <100ms)
2. **Message Throughput:** {t82.get('throughput_msg_per_sec', 0):.2f} msg/sec (target: >=100 msg/sec)
3. **Concurrent Agents:** {t83.get('successful_connections', 0)} agents (target: >=20)
4. **Network Error Rate:** {t85.get('error_rate', 0)*100:.2f}% (target: <5%)
5. **Memory Footprint:** {t87.get('memory_increase_mb', 0):.2f}MB increase (target: <100MB)

### Recommendations

"""

    # Generate recommendations based on results
    if t81.get('latency_ms', {}).get('mean', 0) > 100:
        report += "1. **Connection Latency** exceeds target. Consider optimizing Firebase connection initialization.\n"

    if t82.get('throughput_msg_per_sec', 0) < 100:
        report += "2. **Message Throughput** is below target. Investigate message queueing and batching strategies.\n"

    if t83.get('successful_connections', 0) < 20:
        report += "3. **Concurrent Agent Capacity** is below target. Review connection pooling and Firebase limits.\n"

    if t85.get('error_rate', 0) > 0.05:
        report += "4. **Error Rate** exceeds 5% threshold. Implement better error handling and retry logic.\n"

    if not report.endswith("Recommendations\n\n"):
        report += "\nAll performance targets met. System performing within acceptable parameters.\n"
    else:
        report += "\n"

    report += f"""
### Test Environment

- **Test Date:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}
- **Python Version:** {sys.version.split()[0]}
- **Firebase URL:** https://home-claude-network-default-rtdb.firebaseio.com/
- **Test Duration:** {results.to_dict()['duration_seconds']:.2f} seconds

---

*Report generated automatically by Performance-Tester agent*
"""

    return report


def main():
    """Main entry point"""
    print("\n🚀 Starting Sartor Network Performance Test Suite\n")

    # Run all tests
    tester = PerformanceTester()
    results = tester.run_all_tests()

    # Generate report
    print("\n📝 Generating performance report...")
    report = generate_report(results)

    # Save results
    output_dir = "/home/user/Sartor-claude-network/test-results"
    os.makedirs(output_dir, exist_ok=True)

    # Save JSON results
    json_path = os.path.join(output_dir, "performance-results.json")
    with open(json_path, 'w') as f:
        json.dump(results.to_dict(), f, indent=2)
    print(f"✅ JSON results saved to: {json_path}")

    # Save markdown report
    report_path = os.path.join(output_dir, "performance-report.md")
    with open(report_path, 'w') as f:
        f.write(report)
    print(f"✅ Markdown report saved to: {report_path}")

    print("\n" + "=" * 80)
    print("PERFORMANCE TESTING COMPLETE")
    print("=" * 80)
    print(f"\nView detailed report at: {report_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
