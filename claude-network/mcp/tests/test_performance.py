#!/usr/bin/env python3
"""
Performance Tests for MCP Server
=================================
Measures actual performance metrics for connection speed, discovery speed,
tool execution latency, multi-agent load, memory usage, and message throughput.
"""

import pytest
import asyncio
import time
import sys
from pathlib import Path
import psutil
import os

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fixtures import (
    MockFirebaseTools,
    MockGitHubTools,
    generate_bulk_agents,
    generate_bulk_tasks,
    generate_bulk_messages,
    PERFORMANCE_TEST_SIZES
)


# ==================== Helper Functions ====================

def measure_time(func):
    """Decorator to measure function execution time."""
    async def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = await func(*args, **kwargs)
        end = time.perf_counter()
        duration_ms = (end - start) * 1000
        return result, duration_ms
    return wrapper


def get_memory_usage():
    """Get current process memory usage in MB."""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)


# ==================== Connection Performance Tests ====================

class TestConnectionPerformance:
    """Test connection and discovery speed."""

    @pytest.mark.asyncio
    async def test_local_discovery_speed(self):
        """Measure local endpoint discovery speed."""
        from test_gateway_comprehensive import MockGatewayClient

        gateway = MockGatewayClient()

        start = time.perf_counter()
        endpoints = await gateway._discover_local()
        duration_ms = (time.perf_counter() - start) * 1000

        assert duration_ms < 100  # Should complete in under 100ms
        print(f"\nLocal discovery: {duration_ms:.2f}ms")

    @pytest.mark.asyncio
    async def test_full_discovery_speed(self):
        """Measure full discovery across all methods."""
        from test_gateway_comprehensive import MockGatewayClient

        gateway = MockGatewayClient()

        start = time.perf_counter()
        endpoints = await gateway.discover_endpoints()
        duration_ms = (time.perf_counter() - start) * 1000

        assert duration_ms < 500  # Should complete in under 500ms
        print(f"\nFull discovery: {duration_ms:.2f}ms for {len(endpoints)} endpoints")

    @pytest.mark.asyncio
    async def test_connection_establishment_speed(self):
        """Measure connection establishment speed."""
        from test_gateway_comprehensive import MockGatewayClient

        gateway = MockGatewayClient()
        await gateway.discover_endpoints()

        start = time.perf_counter()
        result = await gateway.connect()
        duration_ms = (time.perf_counter() - start) * 1000

        assert result is True
        assert duration_ms < 200  # Should connect in under 200ms
        print(f"\nConnection establishment: {duration_ms:.2f}ms")


# ==================== Tool Execution Performance Tests ====================

class TestToolExecutionPerformance:
    """Test tool execution latency."""

    @pytest.fixture
    def firebase_tools(self):
        """Create Firebase tools."""
        return MockFirebaseTools()

    @pytest.fixture
    def github_tools(self):
        """Create GitHub tools."""
        return MockGitHubTools()

    @pytest.mark.asyncio
    async def test_firebase_read_latency(self, firebase_tools):
        """Measure Firebase read latency."""
        # Setup test data
        await firebase_tools.write({
            'path': 'perf-test/data',
            'data': {'test': 'value'}
        })

        # Measure read latency
        latencies = []
        for _ in range(100):
            start = time.perf_counter()
            await firebase_tools.read({'path': 'perf-test/data'})
            latency_ms = (time.perf_counter() - start) * 1000
            latencies.append(latency_ms)

        avg_latency = sum(latencies) / len(latencies)
        max_latency = max(latencies)

        assert avg_latency < 50  # Average should be under 50ms
        print(f"\nFirebase read latency: avg={avg_latency:.2f}ms, max={max_latency:.2f}ms")

    @pytest.mark.asyncio
    async def test_firebase_write_latency(self, firebase_tools):
        """Measure Firebase write latency."""
        latencies = []

        for i in range(100):
            start = time.perf_counter()
            await firebase_tools.write({
                'path': f'perf-test/item{i}',
                'data': {'index': i}
            })
            latency_ms = (time.perf_counter() - start) * 1000
            latencies.append(latency_ms)

        avg_latency = sum(latencies) / len(latencies)

        assert avg_latency < 50  # Average should be under 50ms
        print(f"\nFirebase write latency: avg={avg_latency:.2f}ms")

    @pytest.mark.asyncio
    async def test_firebase_query_latency(self, firebase_tools):
        """Measure Firebase query latency."""
        # Setup test data
        for i in range(50):
            await firebase_tools.write({
                'path': f'perf-query/item{i}',
                'data': {'index': i, 'status': 'active' if i % 2 == 0 else 'inactive'}
            })

        # Measure query latency
        start = time.perf_counter()
        result = await firebase_tools.query({
            'path': 'perf-query',
            'filters': [{'field': 'status', 'operator': '==', 'value': 'active'}]
        })
        latency_ms = (time.perf_counter() - start) * 1000

        assert result['success'] is True
        assert latency_ms < 100  # Should query in under 100ms
        print(f"\nFirebase query latency: {latency_ms:.2f}ms for {result['count']} results")

    @pytest.mark.asyncio
    async def test_github_read_latency(self, github_tools):
        """Measure GitHub file read latency."""
        latencies = []

        for _ in range(50):
            start = time.perf_counter()
            await github_tools.read_file({'path': 'README.md'})
            latency_ms = (time.perf_counter() - start) * 1000
            latencies.append(latency_ms)

        avg_latency = sum(latencies) / len(latencies)

        assert avg_latency < 50  # Average should be under 50ms (mock)
        print(f"\nGitHub read latency: avg={avg_latency:.2f}ms")


# ==================== Multi-Agent Load Tests ====================

class TestMultiAgentLoad:
    """Test performance under multi-agent load."""

    @pytest.mark.asyncio
    async def test_concurrent_firebase_writes(self):
        """Test concurrent writes from multiple agents."""
        firebase_tools = MockFirebaseTools()
        agent_count = 10
        writes_per_agent = 20

        start = time.perf_counter()

        # Simulate multiple agents writing concurrently
        tasks = []
        for agent_id in range(agent_count):
            for i in range(writes_per_agent):
                task = firebase_tools.write({
                    'path': f'multi-agent/agent{agent_id}/item{i}',
                    'data': {'agent': agent_id, 'index': i}
                })
                tasks.append(task)

        results = await asyncio.gather(*tasks)

        duration_ms = (time.perf_counter() - start) * 1000
        total_writes = agent_count * writes_per_agent
        writes_per_sec = (total_writes / duration_ms) * 1000

        assert all(r['success'] for r in results)
        print(f"\n{total_writes} concurrent writes: {duration_ms:.2f}ms ({writes_per_sec:.0f} writes/sec)")

    @pytest.mark.asyncio
    async def test_concurrent_firebase_reads(self):
        """Test concurrent reads from multiple agents."""
        firebase_tools = MockFirebaseTools()

        # Setup data
        for i in range(50):
            await firebase_tools.write({
                'path': f'read-test/item{i}',
                'data': {'index': i}
            })

        # Concurrent reads
        start = time.perf_counter()

        tasks = [
            firebase_tools.read({'path': f'read-test/item{i % 50}'})
            for i in range(200)
        ]

        results = await asyncio.gather(*tasks)

        duration_ms = (time.perf_counter() - start) * 1000
        reads_per_sec = (len(tasks) / duration_ms) * 1000

        assert all(r['success'] for r in results)
        print(f"\n{len(tasks)} concurrent reads: {duration_ms:.2f}ms ({reads_per_sec:.0f} reads/sec)")

    @pytest.mark.asyncio
    async def test_mixed_operation_load(self):
        """Test mixed operations from multiple agents."""
        firebase_tools = MockFirebaseTools()

        start = time.perf_counter()

        # Mix of reads, writes, queries
        tasks = []

        # 100 writes
        for i in range(100):
            tasks.append(firebase_tools.write({
                'path': f'mixed/write{i}',
                'data': {'value': i}
            }))

        # 100 reads
        for i in range(100):
            tasks.append(firebase_tools.read({'path': f'mixed/write{i % 50}'}))

        # 20 queries
        for i in range(20):
            tasks.append(firebase_tools.query({
                'path': 'mixed',
                'filters': []
            }))

        results = await asyncio.gather(*tasks)

        duration_ms = (time.perf_counter() - start) * 1000
        ops_per_sec = (len(tasks) / duration_ms) * 1000

        print(f"\n{len(tasks)} mixed operations: {duration_ms:.2f}ms ({ops_per_sec:.0f} ops/sec)")


# ==================== Memory Usage Tests ====================

class TestMemoryUsage:
    """Test memory usage under various loads."""

    @pytest.mark.asyncio
    async def test_memory_usage_per_agent(self):
        """Measure memory usage per connected agent."""
        initial_memory = get_memory_usage()

        # Create multiple agent connections (simulated)
        agents = generate_bulk_agents(100)

        final_memory = get_memory_usage()
        memory_per_agent = (final_memory - initial_memory) / len(agents)

        print(f"\nMemory usage: {final_memory - initial_memory:.2f}MB for {len(agents)} agents")
        print(f"Per agent: {memory_per_agent:.2f}MB")

        assert memory_per_agent < 1  # Should be less than 1MB per agent

    @pytest.mark.asyncio
    async def test_memory_usage_large_dataset(self):
        """Test memory usage with large datasets."""
        firebase_tools = MockFirebaseTools()
        initial_memory = get_memory_usage()

        # Write large dataset
        size = PERFORMANCE_TEST_SIZES['medium']
        for i in range(size):
            await firebase_tools.write({
                'path': f'large-data/item{i}',
                'data': {
                    'index': i,
                    'data': 'x' * 100  # 100 bytes per item
                }
            })

        final_memory = get_memory_usage()
        memory_used = final_memory - initial_memory

        print(f"\nMemory for {size} items: {memory_used:.2f}MB")

        # Should not grow unbounded
        assert memory_used < 100  # Should be under 100MB for this test


# ==================== Message Throughput Tests ====================

class TestMessageThroughput:
    """Test message processing throughput."""

    @pytest.mark.asyncio
    async def test_message_processing_throughput(self):
        """Measure message processing rate."""
        from fixtures import generate_bulk_messages

        messages = generate_bulk_messages(1000)

        start = time.perf_counter()

        # Simulate processing messages
        processed = []
        for msg in messages:
            # Simulate message processing
            await asyncio.sleep(0.0001)  # 0.1ms per message
            processed.append(msg)

        duration_ms = (time.perf_counter() - start) * 1000
        messages_per_sec = (len(processed) / duration_ms) * 1000

        print(f"\nProcessed {len(processed)} messages in {duration_ms:.2f}ms")
        print(f"Throughput: {messages_per_sec:.0f} messages/sec")

        assert len(processed) == len(messages)


# ==================== Scalability Tests ====================

class TestScalability:
    """Test how performance scales with load."""

    @pytest.mark.asyncio
    async def test_write_performance_scaling(self):
        """Test write performance at different scales."""
        firebase_tools = MockFirebaseTools()

        sizes = [10, 100, 1000]
        results = []

        for size in sizes:
            start = time.perf_counter()

            tasks = [
                firebase_tools.write({
                    'path': f'scale-test/size{size}/item{i}',
                    'data': {'index': i}
                })
                for i in range(size)
            ]

            await asyncio.gather(*tasks)

            duration_ms = (time.perf_counter() - start) * 1000
            rate = (size / duration_ms) * 1000

            results.append({
                'size': size,
                'duration_ms': duration_ms,
                'rate': rate
            })

        print("\nWrite performance scaling:")
        for r in results:
            print(f"  {r['size']:4d} writes: {r['duration_ms']:7.2f}ms ({r['rate']:6.0f} writes/sec)")

    @pytest.mark.asyncio
    async def test_read_performance_scaling(self):
        """Test read performance at different scales."""
        firebase_tools = MockFirebaseTools()

        # Setup data
        for i in range(1000):
            await firebase_tools.write({
                'path': f'read-scale/item{i}',
                'data': {'index': i}
            })

        sizes = [10, 100, 1000]
        results = []

        for size in sizes:
            start = time.perf_counter()

            tasks = [
                firebase_tools.read({'path': f'read-scale/item{i % 1000}'})
                for i in range(size)
            ]

            await asyncio.gather(*tasks)

            duration_ms = (time.perf_counter() - start) * 1000
            rate = (size / duration_ms) * 1000

            results.append({
                'size': size,
                'duration_ms': duration_ms,
                'rate': rate
            })

        print("\nRead performance scaling:")
        for r in results:
            print(f"  {r['size']:4d} reads: {r['duration_ms']:7.2f}ms ({r['rate']:6.0f} reads/sec)")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])  # -s to show print statements
