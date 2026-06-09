#!/usr/bin/env python3
"""
End-to-End Tests for MCP Server
================================
Tests complete workflows: start server, connect agent, execute tools,
shut down. Includes multi-agent scenarios and concurrent operations.
"""

import pytest
import asyncio
import sys
from pathlib import Path

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fixtures import (
    create_test_agent,
    create_test_task,
    create_test_message
)
from test_integration import MockMCPServer
from test_gateway_comprehensive import MockGatewayClient


# ==================== Basic E2E Workflow Tests ====================

class TestBasicE2EWorkflow:
    """Test basic end-to-end workflows."""

    @pytest.mark.asyncio
    async def test_complete_agent_lifecycle(self):
        """Test complete agent lifecycle: connect, work, disconnect."""
        # Start server
        server = MockMCPServer()

        # Connect agent
        gateway = MockGatewayClient()
        await gateway.discover_endpoints()
        connected = await gateway.connect()

        assert connected is True
        assert gateway.status == 'connected'

        # Execute some work
        result = await gateway.execute_tool('onboarding.welcome', {
            'agent_name': 'Test Agent'
        })

        assert result['success'] is True

        # Disconnect
        await gateway.disconnect()
        assert gateway.status == 'disconnected'

    @pytest.mark.asyncio
    async def test_server_agent_tool_workflow(self):
        """Test server initialization, agent connection, and tool execution."""
        # Initialize server
        server = MockMCPServer()

        # Initialize server
        init_response = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'initialize',
            'params': {'clientInfo': {'name': 'test-agent'}}
        })

        assert 'result' in init_response

        # List tools
        list_response = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'list_tools',
            'params': {}
        })

        assert 'result' in list_response
        assert len(list_response['result']['tools']) > 0

        # Execute tool
        tool_response = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 3,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': 'test/e2e',
                    'data': {'test': 'value'}
                }
            }
        })

        assert 'result' in tool_response

        # Shutdown
        shutdown_response = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 4,
            'method': 'shutdown',
            'params': {}
        })

        assert 'result' in shutdown_response


# ==================== Multi-Agent Scenarios ====================

class TestMultiAgentScenarios:
    """Test scenarios involving multiple agents."""

    @pytest.mark.asyncio
    async def test_multiple_agents_connect(self):
        """Test multiple agents connecting to server."""
        server = MockMCPServer()

        # Connect multiple agents
        agents = []
        for i in range(5):
            gateway = MockGatewayClient()
            await gateway.discover_endpoints()
            connected = await gateway.connect()

            assert connected is True
            agents.append(gateway)

        # All agents connected
        assert len(agents) == 5
        assert all(a.status == 'connected' for a in agents)

        # Disconnect all
        for agent in agents:
            await agent.disconnect()

    @pytest.mark.asyncio
    async def test_agents_collaborate_on_task(self):
        """Test multiple agents collaborating on a task."""
        server = MockMCPServer()

        # Create agents
        coordinator = MockGatewayClient()
        await coordinator.discover_endpoints()
        await coordinator.connect()

        worker1 = MockGatewayClient()
        await worker1.discover_endpoints()
        await worker1.connect()

        worker2 = MockGatewayClient()
        await worker2.discover_endpoints()
        await worker2.connect()

        # Coordinator creates a task
        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': 'tasks/collab-task',
                    'data': create_test_task(status='available')
                }
            }
        })

        # Worker 1 claims task
        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': 'tasks/collab-task/status',
                    'data': 'in_progress'
                }
            }
        })

        # Worker 2 assists
        # Both workers complete their parts
        # Task is marked complete

        # Verify workflow
        result = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 3,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.read',
                'arguments': {
                    'path': 'tasks/collab-task'
                }
            }
        })

        assert 'result' in result


# ==================== Concurrent Operations Tests ====================

class TestConcurrentOperations:
    """Test concurrent operations from multiple agents."""

    @pytest.mark.asyncio
    async def test_concurrent_tool_execution(self):
        """Test concurrent tool execution from multiple agents."""
        server = MockMCPServer()

        # Initialize server
        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 0,
            'method': 'initialize',
            'params': {}
        })

        # Execute multiple tools concurrently
        tasks = []
        for i in range(20):
            task = server.handle_request({
                'jsonrpc': '2.0',
                'id': i + 1,
                'method': 'call_tool',
                'params': {
                    'name': 'firebase.write',
                    'arguments': {
                        'path': f'concurrent/item{i}',
                        'data': {'index': i}
                    }
                }
            })
            tasks.append(task)

        results = await asyncio.gather(*tasks)

        # All should succeed
        assert all('result' in r for r in results)

    @pytest.mark.asyncio
    async def test_concurrent_reads_and_writes(self):
        """Test concurrent reads and writes."""
        server = MockMCPServer()

        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 0,
            'method': 'initialize',
            'params': {}
        })

        # Mix of concurrent reads and writes
        tasks = []

        # Writes
        for i in range(10):
            tasks.append(server.handle_request({
                'jsonrpc': '2.0',
                'id': f'write-{i}',
                'method': 'call_tool',
                'params': {
                    'name': 'firebase.write',
                    'arguments': {
                        'path': f'mixed/item{i}',
                        'data': {'value': i}
                    }
                }
            }))

        # Reads
        for i in range(10):
            tasks.append(server.handle_request({
                'jsonrpc': '2.0',
                'id': f'read-{i}',
                'method': 'call_tool',
                'params': {
                    'name': 'firebase.read',
                    'arguments': {
                        'path': f'mixed/item{i % 5}'
                    }
                }
            }))

        results = await asyncio.gather(*tasks)

        # All operations should complete
        assert len(results) == 20


# ==================== Message Passing Tests ====================

class TestMessagePassing:
    """Test message passing between agents."""

    @pytest.mark.asyncio
    async def test_broadcast_message(self):
        """Test broadcasting message to all agents."""
        server = MockMCPServer()

        # Connect multiple agents
        agents = []
        for i in range(3):
            gateway = MockGatewayClient()
            await gateway.discover_endpoints()
            await gateway.connect()
            agents.append(gateway)

        # Agent 0 broadcasts message
        message = create_test_message()
        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': 'messages/broadcast/msg1',
                    'data': message
                }
            }
        })

        # All agents should receive (in real implementation)
        # For mock, verify message was stored
        result = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.read',
                'arguments': {
                    'path': 'messages/broadcast/msg1'
                }
            }
        })

        assert 'result' in result

    @pytest.mark.asyncio
    async def test_direct_message(self):
        """Test direct message between two agents."""
        server = MockMCPServer()

        # Send direct message
        message = create_test_message(
            from_agent='agent-1',
            to_agent='agent-2'
        )

        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': 'messages/direct/agent-2',
                    'data': message
                }
            }
        })

        # Verify message
        result = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.read',
                'arguments': {
                    'path': 'messages/direct/agent-2'
                }
            }
        })

        assert 'result' in result


# ==================== Task Workflow Tests ====================

class TestTaskWorkflows:
    """Test complete task workflows."""

    @pytest.mark.asyncio
    async def test_task_creation_to_completion(self):
        """Test complete task lifecycle."""
        server = MockMCPServer()

        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 0,
            'method': 'initialize',
            'params': {}
        })

        # Create task
        task = create_test_task(status='available')
        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': f'tasks/{task["task_id"]}',
                    'data': task
                }
            }
        })

        # Agent claims task
        task['status'] = 'assigned'
        task['assigned_to'] = 'agent-1'
        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': f'tasks/{task["task_id"]}',
                    'data': task,
                    'merge': True
                }
            }
        })

        # Task execution (update progress)
        task['status'] = 'in_progress'
        task['progress'] = 50
        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 3,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': f'tasks/{task["task_id"]}',
                    'data': task,
                    'merge': True
                }
            }
        })

        # Task completion
        task['status'] = 'completed'
        task['progress'] = 100
        result = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 4,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': f'tasks/{task["task_id"]}',
                    'data': task,
                    'merge': True
                }
            }
        })

        assert 'result' in result


# ==================== Skill Execution Tests ====================

class TestSkillExecution:
    """Test skill execution workflows."""

    @pytest.mark.asyncio
    async def test_simple_skill_execution(self):
        """Test executing a simple skill."""
        gateway = MockGatewayClient()
        await gateway.discover_endpoints()
        await gateway.connect()

        # Execute welcome skill
        result = await gateway.execute_tool('onboarding.welcome', {
            'agent_name': 'Test Agent',
            'surface': 'cli'
        })

        assert result['success'] is True
        assert 'welcome_message' in result

    @pytest.mark.asyncio
    async def test_composite_skill_execution(self):
        """Test executing a composite skill (skill that calls other skills)."""
        gateway = MockGatewayClient()
        await gateway.discover_endpoints()
        await gateway.connect()

        # In a real system, would test skill composition
        # For now, test sequential execution

        # Step 1: Welcome
        result1 = await gateway.execute_tool('onboarding.welcome', {
            'agent_name': 'Test Agent'
        })

        assert result1['success'] is True

        # Step 2: List agents
        result2 = await gateway.execute_tool('navigation.list_agents', {
            'status': 'online'
        })

        assert result2['success'] is True


# ==================== Error Recovery Tests ====================

class TestErrorRecovery:
    """Test error recovery in end-to-end workflows."""

    @pytest.mark.asyncio
    async def test_tool_failure_recovery(self):
        """Test recovery from tool execution failure."""
        server = MockMCPServer()

        await server.handle_request({
            'jsonrpc': '2.0',
            'id': 0,
            'method': 'initialize',
            'params': {}
        })

        # Attempt invalid operation
        result = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'call_tool',
            'params': {
                'name': 'github.read_file',
                'arguments': {
                    'path': 'nonexistent.txt'
                }
            }
        })

        # Should get error
        assert 'error' in result

        # But server should still be functional
        result2 = await server.handle_request({
            'jsonrpc': '2.0',
            'id': 2,
            'method': 'call_tool',
            'params': {
                'name': 'firebase.write',
                'arguments': {
                    'path': 'recovery/test',
                    'data': {'recovered': True}
                }
            }
        })

        assert 'result' in result2

    @pytest.mark.asyncio
    async def test_connection_loss_recovery(self):
        """Test recovery from connection loss."""
        gateway = MockGatewayClient()
        await gateway.discover_endpoints()
        await gateway.connect()

        # Simulate connection loss
        await gateway.disconnect()

        # Reconnect
        reconnected = await gateway.connect()

        assert reconnected is True
        assert gateway.status == 'connected'


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
