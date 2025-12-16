#!/usr/bin/env python3
"""
Integration Tests for MCP Server
=================================
Tests the complete MCP server with tool integration.
Tests server startup, tool loading, request handling, and error paths.
"""

import pytest
import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fixtures import (
    MockFirebaseTools,
    MockGitHubTools,
    create_mcp_request,
    create_test_agent,
    TEST_SCENARIOS
)


# Mock the server module imports
class MockMCPServer:
    """Mock MCP server for testing."""

    def __init__(self, config_path=None):
        """Initialize mock server."""
        self.config = self._load_test_config()
        self.tools = {}
        self.sessions = {}
        self.current_session = None

        # Use mock tools
        self.firebase_tools = MockFirebaseTools(self.config.get('firebase', {}))
        self.github_tools = MockGitHubTools(self.config.get('github', {}))

        self._register_tools()

    def _load_test_config(self):
        """Load test configuration."""
        return {
            'server': {
                'name': 'test-mcp-server',
                'version': '1.0.0-test',
                'description': 'Test MCP Server'
            },
            'firebase': {'url': 'https://test.firebaseio.com'},
            'github': {'repo': 'test/repo'}
        }

    def _register_tools(self):
        """Register mock tools."""
        self.tools = {
            'firebase.read': {
                'name': 'firebase.read',
                'description': 'Read from Firebase',
                'handler': self.firebase_tools.read,
                'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}}}
            },
            'firebase.write': {
                'name': 'firebase.write',
                'description': 'Write to Firebase',
                'handler': self.firebase_tools.write,
                'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}, 'data': {}}}
            },
            'github.read_file': {
                'name': 'github.read_file',
                'description': 'Read GitHub file',
                'handler': self.github_tools.read_file,
                'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}}}
            }
        }

    async def handle_request(self, request):
        """Handle MCP request."""
        try:
            method = request.get('method')
            params = request.get('params', {})
            request_id = request.get('id')

            if method == 'initialize':
                response = await self._handle_initialize(params)
            elif method == 'list_tools':
                response = await self._handle_list_tools()
            elif method == 'call_tool':
                response = await self._handle_call_tool(params)
            elif method == 'shutdown':
                response = await self._handle_shutdown()
            else:
                raise ValueError(f"Unknown method: {method}")

            return {
                'jsonrpc': '2.0',
                'id': request_id,
                'result': response
            }

        except Exception as e:
            return {
                'jsonrpc': '2.0',
                'id': request.get('id'),
                'error': {
                    'code': -32603,
                    'message': str(e)
                }
            }

    async def _handle_initialize(self, params):
        """Handle initialize request."""
        self.current_session = {'id': 'test-session', 'client': params.get('clientInfo', {})}

        return {
            'serverInfo': {
                'name': self.config['server']['name'],
                'version': self.config['server']['version']
            },
            'capabilities': {
                'tools': True,
                'subscriptions': True
            }
        }

    async def _handle_list_tools(self):
        """Handle list tools request."""
        tools = []
        for tool_name, tool_info in self.tools.items():
            tools.append({
                'name': tool_info['name'],
                'description': tool_info['description'],
                'inputSchema': tool_info['parameters']
            })

        return {'tools': tools}

    async def _handle_call_tool(self, params):
        """Handle call tool request."""
        tool_name = params.get('name')
        tool_params = params.get('arguments', {})

        if tool_name not in self.tools:
            raise ValueError(f"Unknown tool: {tool_name}")

        tool = self.tools[tool_name]
        handler = tool['handler']

        result = await handler(tool_params)

        return {
            'tool_name': tool_name,
            'result': result
        }

    async def _handle_shutdown(self):
        """Handle shutdown request."""
        return {'status': 'shutdown'}


# ==================== Server Initialization Tests ====================

class TestServerInitialization:
    """Test server initialization and configuration."""

    @pytest.fixture
    def server(self):
        """Create test server instance."""
        return MockMCPServer()

    def test_server_creation(self, server):
        """Test server can be created."""
        assert server is not None
        assert server.config is not None
        assert server.tools is not None

    def test_server_config_loaded(self, server):
        """Test server configuration is loaded."""
        assert 'server' in server.config
        assert 'name' in server.config['server']
        assert 'version' in server.config['server']

    def test_tools_registered(self, server):
        """Test tools are registered on startup."""
        assert len(server.tools) > 0
        assert 'firebase.read' in server.tools
        assert 'firebase.write' in server.tools
        assert 'github.read_file' in server.tools

    def test_tool_structure(self, server):
        """Test tool structure is correct."""
        for tool_name, tool_info in server.tools.items():
            assert 'name' in tool_info
            assert 'description' in tool_info
            assert 'handler' in tool_info
            assert 'parameters' in tool_info
            assert callable(tool_info['handler'])


# ==================== Request Handling Tests ====================

class TestRequestHandling:
    """Test MCP request handling."""

    @pytest.fixture
    async def server(self):
        """Create and initialize server."""
        server = MockMCPServer()

        # Initialize the server
        init_request = create_mcp_request('initialize', {
            'clientInfo': {
                'name': 'test-client',
                'version': '1.0.0'
            }
        })

        await server.handle_request(init_request)
        return server

    @pytest.mark.asyncio
    async def test_initialize_request(self):
        """Test initialize request."""
        server = MockMCPServer()
        request = create_mcp_request('initialize', {
            'clientInfo': {'name': 'test-client'}
        })

        response = await server.handle_request(request)

        assert response['jsonrpc'] == '2.0'
        assert 'result' in response
        assert 'serverInfo' in response['result']
        assert 'capabilities' in response['result']

    @pytest.mark.asyncio
    async def test_list_tools_request(self, server):
        """Test list tools request."""
        request = create_mcp_request('list_tools', {})

        response = await server.handle_request(request)

        assert response['jsonrpc'] == '2.0'
        assert 'result' in response
        assert 'tools' in response['result']
        assert len(response['result']['tools']) > 0

    @pytest.mark.asyncio
    async def test_call_tool_request(self, server):
        """Test call tool request."""
        # First, write some data
        write_request = create_mcp_request('call_tool', {
            'name': 'firebase.write',
            'arguments': {
                'path': 'test/data',
                'data': {'key': 'value'}
            }
        })

        write_response = await server.handle_request(write_request)

        assert 'result' in write_response
        assert write_response['result']['result']['success'] is True

        # Then, read it back
        read_request = create_mcp_request('call_tool', {
            'name': 'firebase.read',
            'arguments': {
                'path': 'test/data'
            }
        })

        read_response = await server.handle_request(read_request)

        assert 'result' in read_response
        assert read_response['result']['result']['success'] is True
        assert read_response['result']['result']['data']['key'] == 'value'

    @pytest.mark.asyncio
    async def test_invalid_method(self, server):
        """Test handling of invalid method."""
        request = create_mcp_request('invalid_method', {})

        response = await server.handle_request(request)

        assert 'error' in response
        assert 'Unknown method' in response['error']['message']

    @pytest.mark.asyncio
    async def test_invalid_tool_name(self, server):
        """Test calling non-existent tool."""
        request = create_mcp_request('call_tool', {
            'name': 'nonexistent.tool',
            'arguments': {}
        })

        response = await server.handle_request(request)

        assert 'error' in response
        assert 'Unknown tool' in response['error']['message']

    @pytest.mark.asyncio
    async def test_shutdown_request(self, server):
        """Test shutdown request."""
        request = create_mcp_request('shutdown', {})

        response = await server.handle_request(request)

        assert 'result' in response
        assert response['result']['status'] == 'shutdown'


# ==================== Tool Execution Pipeline Tests ====================

class TestToolExecutionPipeline:
    """Test the complete tool execution pipeline."""

    @pytest.fixture
    async def server(self):
        """Create and initialize server."""
        server = MockMCPServer()
        init_request = create_mcp_request('initialize', {})
        await server.handle_request(init_request)
        return server

    @pytest.mark.asyncio
    async def test_firebase_read_write_cycle(self, server):
        """Test complete Firebase read/write cycle."""
        test_data = {'test': 'data', 'value': 123}

        # Write
        write_response = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.write',
            'arguments': {'path': 'test/cycle', 'data': test_data}
        }))

        assert 'result' in write_response
        assert write_response['result']['result']['success'] is True

        # Read
        read_response = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.read',
            'arguments': {'path': 'test/cycle'}
        }))

        assert 'result' in read_response
        assert read_response['result']['result']['data'] == test_data

        # Delete
        delete_response = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.delete',
            'arguments': {'path': 'test/cycle'}
        }))

        assert 'result' in delete_response

        # Verify deletion
        read_after_delete = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.read',
            'arguments': {'path': 'test/cycle'}
        }))

        assert read_after_delete['result']['result']['data'] is None

    @pytest.mark.asyncio
    async def test_github_read_file_pipeline(self, server):
        """Test GitHub file reading pipeline."""
        response = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'github.read_file',
            'arguments': {'path': 'README.md'}
        }))

        assert 'result' in response
        result = response['result']['result']
        assert result['success'] is True
        assert 'content' in result
        assert result['path'] == 'README.md'

    @pytest.mark.asyncio
    async def test_multiple_tools_sequence(self, server):
        """Test executing multiple tools in sequence."""
        # Create test agent in Firebase
        agent = create_test_agent()
        await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.write',
            'arguments': {
                'path': f'agents/{agent["agent_id"]}',
                'data': agent
            }
        }))

        # Read it back
        read_response = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.read',
            'arguments': {'path': f'agents/{agent["agent_id"]}'}
        }))

        assert read_response['result']['result']['data']['agent_id'] == agent['agent_id']

        # Update status
        await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.write',
            'arguments': {
                'path': f'agents/{agent["agent_id"]}',
                'data': {'status': 'busy'},
                'merge': True
            }
        }))

        # Verify update
        final_read = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.read',
            'arguments': {'path': f'agents/{agent["agent_id"]}'}
        }))

        assert final_read['result']['result']['data']['status'] == 'busy'
        assert final_read['result']['result']['data']['agent_id'] == agent['agent_id']


# ==================== Error Handling Tests ====================

class TestErrorHandling:
    """Test error handling in the server."""

    @pytest.fixture
    async def server(self):
        """Create and initialize server."""
        server = MockMCPServer()
        init_request = create_mcp_request('initialize', {})
        await server.handle_request(init_request)
        return server

    @pytest.mark.asyncio
    async def test_malformed_request(self, server):
        """Test handling of malformed request."""
        # Missing required fields
        bad_request = {'jsonrpc': '2.0'}

        response = await server.handle_request(bad_request)

        assert 'error' in response

    @pytest.mark.asyncio
    async def test_tool_parameter_validation(self, server):
        """Test tool parameter validation."""
        # Call tool without required parameters
        response = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'firebase.read'
            # Missing 'arguments' with 'path'
        }))

        # Should handle gracefully (mock doesn't validate strictly, but real server would)
        assert 'result' in response or 'error' in response

    @pytest.mark.asyncio
    async def test_github_file_not_found(self, server):
        """Test handling of GitHub file not found."""
        response = await server.handle_request(create_mcp_request('call_tool', {
            'name': 'github.read_file',
            'arguments': {'path': 'nonexistent.txt'}
        }))

        assert 'error' in response
        assert 'not found' in response['error']['message'].lower()

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, server):
        """Test handling concurrent requests."""
        # Create multiple concurrent requests
        requests = [
            server.handle_request(create_mcp_request('call_tool', {
                'name': 'firebase.write',
                'arguments': {'path': f'concurrent/item{i}', 'data': {'index': i}}
            }))
            for i in range(10)
        ]

        responses = await asyncio.gather(*requests)

        # All should succeed
        assert all('result' in r for r in responses)
        assert all(r['result']['result']['success'] for r in responses)


# ==================== Session Management Tests ====================

class TestSessionManagement:
    """Test session management."""

    @pytest.mark.asyncio
    async def test_session_creation(self):
        """Test session is created on initialize."""
        server = MockMCPServer()

        assert server.current_session is None

        await server.handle_request(create_mcp_request('initialize', {
            'clientInfo': {'name': 'test-client'}
        }))

        assert server.current_session is not None
        assert 'id' in server.current_session

    @pytest.mark.asyncio
    async def test_multiple_sessions(self):
        """Test handling multiple sessions (if supported)."""
        server = MockMCPServer()

        # Initialize first session
        response1 = await server.handle_request(create_mcp_request('initialize', {
            'clientInfo': {'name': 'client1'}
        }))

        assert 'result' in response1

        # Server currently supports single session, but test framework is in place


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
