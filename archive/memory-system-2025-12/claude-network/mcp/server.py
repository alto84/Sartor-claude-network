#!/usr/bin/env python3
"""
MCP Server for Sartor Claude Network
=====================================
Production-grade Model Context Protocol server implementation
with Firebase, GitHub, onboarding, and navigation capabilities.

This server provides tools for Claude agents to interact with
the Sartor Claude Network infrastructure via MCP protocol.

Author: MCP Server Implementation Specialist
Date: 2025-11-03
Version: 1.0.0
"""

import json
import sys
import logging
import asyncio
import traceback
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import existing modules
sys.path.append(str(Path(__file__).parent.parent))

# Import existing Claude Network modules
from config_manager import load_config
from macs import MACSClient
from firebase_schema import FirebaseSchema
from agent_registry import AgentRegistry
from task_manager import TaskManager
from skill_engine import SkillEngine

# Import MCP tool modules
from tools.firebase_tools import FirebaseTools
from tools.github_tools import GitHubTools
from tools.onboarding_tools import OnboardingTools
from tools.navigation_tools import NavigationTools

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler('/tmp/mcp-server.log')
    ]
)
logger = logging.getLogger(__name__)


class MCPServer:
    """
    Main MCP Server implementation using stdio transport.

    Provides comprehensive tools for Firebase operations, GitHub integration,
    onboarding assistance, and system navigation for Claude agents.
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the MCP server with configuration.

        Args:
            config_path: Optional path to configuration file
        """
        self.config = self._load_configuration(config_path)
        self.tools = {}
        self.sessions = {}
        self.current_session = None

        # Initialize tool modules
        self._initialize_tools()

        # Initialize network components
        self._initialize_network()

        logger.info("MCP Server initialized successfully")

    def _load_configuration(self, config_path: Optional[str] = None) -> Dict:
        """
        Load configuration from file or defaults.

        Args:
            config_path: Optional path to configuration file

        Returns:
            Configuration dictionary
        """
        default_config = {
            "server": {
                "name": "sartor-claude-network",
                "version": "1.0.0",
                "description": "MCP Server for Sartor Claude Network",
                "max_concurrent_requests": 10,
                "request_timeout": 60
            },
            "firebase": {
                "url": "https://home-claude-network-default-rtdb.firebaseio.com",
                "timeout": 30,
                "max_retries": 3
            },
            "github": {
                "repo": "alto84/Sartor-claude-network",
                "default_branch": "main",
                "api_timeout": 30
            },
            "logging": {
                "level": "INFO",
                "file": "/tmp/mcp-server.log",
                "max_size": 10485760,  # 10MB
                "backup_count": 5
            },
            "rate_limiting": {
                "enabled": True,
                "max_requests_per_minute": 60,
                "max_requests_per_hour": 1000
            }
        }

        if config_path and Path(config_path).exists():
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                    # Merge user config with defaults
                    return self._merge_configs(default_config, user_config)
            except Exception as e:
                logger.error(f"Error loading config from {config_path}: {e}")
                logger.info("Using default configuration")

        return default_config

    def _merge_configs(self, default: Dict, user: Dict) -> Dict:
        """
        Recursively merge user configuration with defaults.

        Args:
            default: Default configuration
            user: User configuration

        Returns:
            Merged configuration
        """
        result = default.copy()
        for key, value in user.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
        return result

    def _initialize_tools(self):
        """Initialize all MCP tool modules."""
        try:
            # Initialize Firebase tools
            self.firebase_tools = FirebaseTools(self.config.get('firebase', {}))
            self._register_firebase_tools()

            # Initialize GitHub tools
            self.github_tools = GitHubTools(self.config.get('github', {}))
            self._register_github_tools()

            # Initialize onboarding tools
            self.onboarding_tools = OnboardingTools(self.config)
            self._register_onboarding_tools()

            # Initialize navigation tools
            self.navigation_tools = NavigationTools(self.config)
            self._register_navigation_tools()

            logger.info(f"Initialized {len(self.tools)} MCP tools")

        except Exception as e:
            logger.error(f"Error initializing tools: {e}")
            raise

    def _initialize_network(self):
        """Initialize Claude Network components."""
        try:
            # Load network configuration
            self.network_config = load_config()

            # Initialize MACS protocol
            self.macs = MACSClient(
                agent_id=self.config['server']['name'],
                capabilities=['mcp_server', 'coordination', 'tool_provider']
            )

            # Initialize agent registry
            self.agent_registry = AgentRegistry(self.network_config)

            # Initialize task manager
            self.task_manager = TaskManager(self.network_config)

            # Initialize skill engine
            self.skill_engine = SkillEngine()

            logger.info("Network components initialized")

        except Exception as e:
            logger.warning(f"Could not initialize all network components: {e}")
            # Continue anyway - MCP server can still function

    def _register_firebase_tools(self):
        """Register Firebase-related MCP tools."""
        self.tools['firebase.read'] = {
            'name': 'firebase.read',
            'description': 'Read data from Firebase Realtime Database',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'Database path to read from'
                    },
                    'query': {
                        'type': 'object',
                        'description': 'Optional query parameters',
                        'properties': {
                            'orderBy': {'type': 'string'},
                            'limitToFirst': {'type': 'number'},
                            'limitToLast': {'type': 'number'},
                            'startAt': {'type': 'string'},
                            'endAt': {'type': 'string'}
                        }
                    }
                },
                'required': ['path']
            },
            'handler': self.firebase_tools.read
        }

        self.tools['firebase.write'] = {
            'name': 'firebase.write',
            'description': 'Write data to Firebase Realtime Database',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'Database path to write to'
                    },
                    'data': {
                        'type': ['object', 'array', 'string', 'number', 'boolean', 'null'],
                        'description': 'Data to write'
                    },
                    'merge': {
                        'type': 'boolean',
                        'description': 'Whether to merge with existing data',
                        'default': False
                    }
                },
                'required': ['path', 'data']
            },
            'handler': self.firebase_tools.write
        }

        self.tools['firebase.delete'] = {
            'name': 'firebase.delete',
            'description': 'Delete data from Firebase Realtime Database',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'Database path to delete'
                    }
                },
                'required': ['path']
            },
            'handler': self.firebase_tools.delete
        }

        self.tools['firebase.subscribe'] = {
            'name': 'firebase.subscribe',
            'description': 'Subscribe to real-time updates from Firebase',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'Database path to subscribe to'
                    },
                    'event_type': {
                        'type': 'string',
                        'enum': ['value', 'child_added', 'child_changed', 'child_removed'],
                        'description': 'Type of events to listen for',
                        'default': 'value'
                    }
                },
                'required': ['path']
            },
            'handler': self.firebase_tools.subscribe
        }

        self.tools['firebase.query'] = {
            'name': 'firebase.query',
            'description': 'Query Firebase with complex filters',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'Database path to query'
                    },
                    'filters': {
                        'type': 'array',
                        'description': 'List of filter conditions',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'field': {'type': 'string'},
                                'operator': {
                                    'type': 'string',
                                    'enum': ['==', '!=', '<', '<=', '>', '>=', 'in', 'contains']
                                },
                                'value': {}
                            },
                            'required': ['field', 'operator', 'value']
                        }
                    },
                    'order_by': {
                        'type': 'string',
                        'description': 'Field to order results by'
                    },
                    'limit': {
                        'type': 'number',
                        'description': 'Maximum number of results'
                    }
                },
                'required': ['path']
            },
            'handler': self.firebase_tools.query
        }

    def _register_github_tools(self):
        """Register GitHub-related MCP tools."""
        self.tools['github.read_file'] = {
            'name': 'github.read_file',
            'description': 'Read a file from GitHub repository',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'File path in the repository'
                    },
                    'branch': {
                        'type': 'string',
                        'description': 'Branch to read from',
                        'default': 'main'
                    }
                },
                'required': ['path']
            },
            'handler': self.github_tools.read_file
        }

        self.tools['github.search'] = {
            'name': 'github.search',
            'description': 'Search for content in GitHub repository',
            'parameters': {
                'type': 'object',
                'properties': {
                    'query': {
                        'type': 'string',
                        'description': 'Search query'
                    },
                    'type': {
                        'type': 'string',
                        'enum': ['code', 'issues', 'commits', 'files'],
                        'description': 'Type of search',
                        'default': 'code'
                    },
                    'path': {
                        'type': 'string',
                        'description': 'Limit search to specific path'
                    }
                },
                'required': ['query']
            },
            'handler': self.github_tools.search
        }

        self.tools['github.get_history'] = {
            'name': 'github.get_history',
            'description': 'Get commit history for a file or path',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'File or directory path'
                    },
                    'limit': {
                        'type': 'number',
                        'description': 'Maximum number of commits',
                        'default': 10
                    }
                },
                'required': ['path']
            },
            'handler': self.github_tools.get_history
        }

        self.tools['github.list_files'] = {
            'name': 'github.list_files',
            'description': 'List files in a GitHub directory',
            'parameters': {
                'type': 'object',
                'properties': {
                    'path': {
                        'type': 'string',
                        'description': 'Directory path',
                        'default': '/'
                    },
                    'branch': {
                        'type': 'string',
                        'description': 'Branch to list from',
                        'default': 'main'
                    },
                    'recursive': {
                        'type': 'boolean',
                        'description': 'List files recursively',
                        'default': False
                    }
                },
                'required': []
            },
            'handler': self.github_tools.list_files
        }

    def _register_onboarding_tools(self):
        """Register onboarding-related MCP tools."""
        self.tools['onboarding.welcome'] = {
            'name': 'onboarding.welcome',
            'description': 'Get welcome message and initial setup information',
            'parameters': {
                'type': 'object',
                'properties': {
                    'agent_name': {
                        'type': 'string',
                        'description': 'Name of the agent being onboarded'
                    },
                    'surface': {
                        'type': 'string',
                        'enum': ['cli', 'web', 'mobile', 'desktop'],
                        'description': 'Agent surface type'
                    }
                },
                'required': ['agent_name']
            },
            'handler': self.onboarding_tools.welcome
        }

        self.tools['onboarding.checklist'] = {
            'name': 'onboarding.checklist',
            'description': 'Get onboarding checklist for new agents',
            'parameters': {
                'type': 'object',
                'properties': {
                    'role': {
                        'type': 'string',
                        'enum': ['coordinator', 'worker', 'scout', 'analyst'],
                        'description': 'Agent role',
                        'default': 'worker'
                    }
                },
                'required': []
            },
            'handler': self.onboarding_tools.get_checklist
        }

        self.tools['onboarding.setup_guide'] = {
            'name': 'onboarding.setup_guide',
            'description': 'Get detailed setup guide for specific components',
            'parameters': {
                'type': 'object',
                'properties': {
                    'component': {
                        'type': 'string',
                        'enum': ['firebase', 'github', 'macs', 'skills', 'tasks'],
                        'description': 'Component to get setup guide for'
                    }
                },
                'required': ['component']
            },
            'handler': self.onboarding_tools.get_setup_guide
        }

        self.tools['onboarding.verify_setup'] = {
            'name': 'onboarding.verify_setup',
            'description': 'Verify that agent setup is complete and correct',
            'parameters': {
                'type': 'object',
                'properties': {
                    'agent_id': {
                        'type': 'string',
                        'description': 'Agent ID to verify'
                    }
                },
                'required': ['agent_id']
            },
            'handler': self.onboarding_tools.verify_setup
        }

    def _register_navigation_tools(self):
        """Register navigation-related MCP tools."""
        self.tools['navigation.list_agents'] = {
            'name': 'navigation.list_agents',
            'description': 'List all agents in the network',
            'parameters': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['all', 'online', 'offline', 'busy'],
                        'description': 'Filter by agent status',
                        'default': 'all'
                    },
                    'role': {
                        'type': 'string',
                        'description': 'Filter by agent role'
                    }
                },
                'required': []
            },
            'handler': self.navigation_tools.list_agents
        }

        self.tools['navigation.list_skills'] = {
            'name': 'navigation.list_skills',
            'description': 'List available skills in the system',
            'parameters': {
                'type': 'object',
                'properties': {
                    'category': {
                        'type': 'string',
                        'enum': ['core', 'house', 'science', 'meta', 'all'],
                        'description': 'Skill category',
                        'default': 'all'
                    },
                    'search': {
                        'type': 'string',
                        'description': 'Search term for skills'
                    }
                },
                'required': []
            },
            'handler': self.navigation_tools.list_skills
        }

        self.tools['navigation.list_tasks'] = {
            'name': 'navigation.list_tasks',
            'description': 'List tasks in the system',
            'parameters': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['available', 'assigned', 'in_progress', 'completed', 'failed', 'all'],
                        'description': 'Task status filter',
                        'default': 'all'
                    },
                    'assigned_to': {
                        'type': 'string',
                        'description': 'Filter by assigned agent'
                    },
                    'limit': {
                        'type': 'number',
                        'description': 'Maximum number of tasks',
                        'default': 20
                    }
                },
                'required': []
            },
            'handler': self.navigation_tools.list_tasks
        }

        self.tools['navigation.get_status'] = {
            'name': 'navigation.get_status',
            'description': 'Get overall system status and health',
            'parameters': {
                'type': 'object',
                'properties': {
                    'include_metrics': {
                        'type': 'boolean',
                        'description': 'Include performance metrics',
                        'default': True
                    }
                },
                'required': []
            },
            'handler': self.navigation_tools.get_system_status
        }

        self.tools['navigation.find_expert'] = {
            'name': 'navigation.find_expert',
            'description': 'Find the best agent for a specific capability',
            'parameters': {
                'type': 'object',
                'properties': {
                    'capability': {
                        'type': 'string',
                        'description': 'Required capability'
                    },
                    'available_only': {
                        'type': 'boolean',
                        'description': 'Only return available agents',
                        'default': True
                    }
                },
                'required': ['capability']
            },
            'handler': self.navigation_tools.find_expert
        }

    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle incoming MCP request.

        Args:
            request: MCP request object

        Returns:
            MCP response object
        """
        try:
            # Extract request details
            method = request.get('method')
            params = request.get('params', {})
            request_id = request.get('id')

            # Route to appropriate handler
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

            # Build response
            return {
                'jsonrpc': '2.0',
                'id': request_id,
                'result': response
            }

        except Exception as e:
            logger.error(f"Error handling request: {e}\n{traceback.format_exc()}")
            return {
                'jsonrpc': '2.0',
                'id': request.get('id'),
                'error': {
                    'code': -32603,
                    'message': str(e)
                }
            }

    async def _handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle initialization request.

        Args:
            params: Initialization parameters

        Returns:
            Initialization response
        """
        client_info = params.get('clientInfo', {})
        self.current_session = {
            'id': datetime.now().isoformat(),
            'client': client_info,
            'start_time': datetime.now()
        }

        return {
            'serverInfo': {
                'name': self.config['server']['name'],
                'version': self.config['server']['version'],
                'description': self.config['server']['description']
            },
            'capabilities': {
                'tools': True,
                'subscriptions': True,
                'configuration': True
            }
        }

    async def _handle_list_tools(self) -> Dict[str, Any]:
        """
        Handle list tools request.

        Returns:
            List of available tools
        """
        tools = []
        for tool_name, tool_info in self.tools.items():
            tools.append({
                'name': tool_info['name'],
                'description': tool_info['description'],
                'inputSchema': tool_info['parameters']
            })

        return {'tools': tools}

    async def _handle_call_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle tool call request.

        Args:
            params: Tool call parameters

        Returns:
            Tool execution result
        """
        tool_name = params.get('name')
        tool_params = params.get('arguments', {})

        if tool_name not in self.tools:
            raise ValueError(f"Unknown tool: {tool_name}")

        tool = self.tools[tool_name]
        handler = tool['handler']

        # Execute tool
        try:
            result = await handler(tool_params)
            return {
                'tool_name': tool_name,
                'result': result
            }
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            raise

    async def _handle_shutdown(self) -> Dict[str, Any]:
        """
        Handle shutdown request.

        Returns:
            Shutdown acknowledgment
        """
        logger.info("Shutdown requested")

        # Clean up resources
        if hasattr(self, 'firebase_tools'):
            await self.firebase_tools.cleanup()
        if hasattr(self, 'github_tools'):
            await self.github_tools.cleanup()

        return {'status': 'shutdown'}

    async def run(self):
        """
        Main server loop using stdio transport.
        """
        logger.info("MCP Server starting with stdio transport")

        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        await asyncio.get_running_loop().connect_read_pipe(
            lambda: protocol, sys.stdin
        )

        writer = sys.stdout

        while True:
            try:
                # Read request from stdin
                line = await reader.readline()
                if not line:
                    break

                # Parse JSON-RPC request
                request = json.loads(line.decode('utf-8'))
                logger.debug(f"Received request: {request}")

                # Handle request
                response = await self.handle_request(request)

                # Send response to stdout
                response_str = json.dumps(response) + '\n'
                writer.write(response_str)
                writer.flush()

                logger.debug(f"Sent response: {response}")

            except KeyboardInterrupt:
                logger.info("Server interrupted by user")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}\n{traceback.format_exc()}")
                error_response = {
                    'jsonrpc': '2.0',
                    'error': {
                        'code': -32603,
                        'message': f"Internal error: {str(e)}"
                    }
                }
                writer.write(json.dumps(error_response) + '\n')
                writer.flush()

        logger.info("MCP Server shutting down")


def main():
    """Main entry point for MCP server."""
    import argparse

    parser = argparse.ArgumentParser(description='MCP Server for Sartor Claude Network')
    parser.add_argument(
        '--config',
        type=str,
        help='Path to configuration file',
        default=None
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug logging'
    )

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Create and run server
    server = MCPServer(config_path=args.config)

    # Run the async event loop
    try:
        asyncio.run(server.run())
    except KeyboardInterrupt:
        logger.info("Server shutdown by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()