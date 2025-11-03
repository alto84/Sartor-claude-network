#!/usr/bin/env python3
"""
Gateway Client for Sartor Claude Network
Single-file MCP client for instant network onboarding
"""

import os
import json
import yaml
import uuid
import socket
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import aiohttp
import websockets
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('gateway_client')


class ConnectionStatus(Enum):
    """Connection status states"""
    DISCONNECTED = "disconnected"
    DISCOVERING = "discovering"
    CONNECTING = "connecting"
    AUTHENTICATING = "authenticating"
    CONNECTED = "connected"
    READY = "ready"
    ERROR = "error"


@dataclass
class MCPEndpoint:
    """MCP server endpoint information"""
    url: str
    type: str  # local, network, firebase, github
    priority: int = 0
    available: bool = False
    latency_ms: Optional[float] = None

    def __lt__(self, other):
        """Sort by priority then latency"""
        if self.priority != other.priority:
            return self.priority < other.priority
        if self.latency_ms and other.latency_ms:
            return self.latency_ms < other.latency_ms
        return False


@dataclass
class AgentIdentity:
    """Agent identity information"""
    id: str = field(default_factory=lambda: f"agent-{uuid.uuid4().hex[:8]}")
    device_type: str = "unknown"
    capabilities: List[str] = field(default_factory=lambda: ["basic"])
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    auth_token: Optional[str] = None


@dataclass
class GatewayConfig:
    """Gateway configuration"""
    discovery_timeout: float = 5.0
    connection_timeout: float = 10.0
    retry_count: int = 3
    retry_delay: float = 2.0

    # Default endpoints
    local_endpoints: List[str] = field(default_factory=lambda: [
        "http://localhost:8080/mcp",
        "http://127.0.0.1:8080/mcp",
        "http://0.0.0.0:8080/mcp"
    ])

    firebase_url: str = "https://home-claude-network-default-rtdb.firebaseio.com/"
    github_repo: str = "https://github.com/alto84/Sartor-claude-network"


class GatewayClient:
    """Main gateway client for MCP network connection"""

    def __init__(self, config: Optional[GatewayConfig] = None):
        """Initialize gateway client"""
        self.config = config or GatewayConfig()
        self.identity = AgentIdentity()
        self.status = ConnectionStatus.DISCONNECTED
        self.endpoints: List[MCPEndpoint] = []
        self.current_endpoint: Optional[MCPEndpoint] = None
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.session: Optional[aiohttp.ClientSession] = None
        self.tools: Dict[str, Dict] = {}
        self.message_handlers: Dict[str, Any] = {}

    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.disconnect()

    # ==================== Discovery Methods ====================

    async def discover_endpoints(self) -> List[MCPEndpoint]:
        """Discover all available MCP endpoints"""
        logger.info("🔍 Discovering MCP server endpoints...")
        self.status = ConnectionStatus.DISCOVERING

        tasks = [
            self._discover_local(),
            self._discover_network(),
            self._discover_firebase(),
            self._discover_github(),
            self._discover_env()
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten results and filter out errors
        all_endpoints = []
        for result in results:
            if isinstance(result, list):
                all_endpoints.extend(result)
            elif isinstance(result, MCPEndpoint):
                all_endpoints.append(result)

        # Test endpoint availability
        await self._test_endpoints(all_endpoints)

        # Sort by availability and latency
        self.endpoints = sorted(
            [ep for ep in all_endpoints if ep.available],
            key=lambda x: (not x.available, x.priority, x.latency_ms or 999999)
        )

        logger.info(f"✅ Found {len(self.endpoints)} available endpoints")
        return self.endpoints

    async def _discover_local(self) -> List[MCPEndpoint]:
        """Discover local MCP servers"""
        endpoints = []
        for url in self.config.local_endpoints:
            endpoints.append(MCPEndpoint(
                url=url,
                type="local",
                priority=1
            ))
        return endpoints

    async def _discover_network(self) -> List[MCPEndpoint]:
        """Scan local network for MCP servers"""
        endpoints = []

        # Get local IP
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            network_prefix = '.'.join(local_ip.split('.')[:-1])

            # Scan common ports
            for port in [8080, 8081, 8082]:
                for i in range(1, 255):
                    ip = f"{network_prefix}.{i}"
                    url = f"http://{ip}:{port}/mcp"
                    endpoints.append(MCPEndpoint(
                        url=url,
                        type="network",
                        priority=2
                    ))
        except Exception as e:
            logger.debug(f"Network scan failed: {e}")

        return endpoints

    async def _discover_firebase(self) -> List[MCPEndpoint]:
        """Discover MCP servers via Firebase"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.config.firebase_url}/agents-network/mcp_servers.json"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data:
                            endpoints = []
                            for server_id, info in data.items():
                                endpoints.append(MCPEndpoint(
                                    url=info.get('url', ''),
                                    type="firebase",
                                    priority=3
                                ))
                            return endpoints
        except Exception as e:
            logger.debug(f"Firebase discovery failed: {e}")
        return []

    async def _discover_github(self) -> List[MCPEndpoint]:
        """Fetch MCP endpoints from GitHub"""
        try:
            url = f"{self.config.github_repo}/raw/main/config/mcp_endpoints.json"
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        endpoints = []
                        for ep in data.get('endpoints', []):
                            endpoints.append(MCPEndpoint(
                                url=ep['url'],
                                type="github",
                                priority=4
                            ))
                        return endpoints
        except Exception as e:
            logger.debug(f"GitHub discovery failed: {e}")
        return []

    async def _discover_env(self) -> List[MCPEndpoint]:
        """Check environment variables for MCP endpoint"""
        mcp_endpoint = os.environ.get('MCP_ENDPOINT')
        if mcp_endpoint:
            return [MCPEndpoint(
                url=mcp_endpoint,
                type="env",
                priority=0  # Highest priority
            )]
        return []

    async def _test_endpoints(self, endpoints: List[MCPEndpoint]):
        """Test endpoint availability and measure latency"""
        async def test_endpoint(endpoint: MCPEndpoint):
            try:
                start = asyncio.get_event_loop().time()
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        f"{endpoint.url}/health",
                        timeout=aiohttp.ClientTimeout(total=2)
                    ) as response:
                        if response.status in [200, 404]:  # 404 is ok, means server exists
                            endpoint.available = True
                            endpoint.latency_ms = (asyncio.get_event_loop().time() - start) * 1000
            except:
                endpoint.available = False

        await asyncio.gather(*[test_endpoint(ep) for ep in endpoints])

    # ==================== Connection Methods ====================

    async def connect(self, endpoint: Optional[MCPEndpoint] = None) -> bool:
        """Connect to MCP server"""
        self.status = ConnectionStatus.CONNECTING

        # Use provided endpoint or discover
        if not endpoint:
            await self.discover_endpoints()
            if not self.endpoints:
                logger.error("❌ No MCP servers found")
                self.status = ConnectionStatus.ERROR
                return False
            endpoint = self.endpoints[0]

        self.current_endpoint = endpoint
        logger.info(f"🔌 Connecting to {endpoint.url}")

        try:
            # Try WebSocket connection
            ws_url = endpoint.url.replace('http://', 'ws://').replace('https://', 'wss://')
            self.websocket = await websockets.connect(ws_url)

            # Authenticate
            await self._authenticate()

            # Get available tools
            await self._discover_tools()

            self.status = ConnectionStatus.READY
            logger.info(f"✅ Connected to MCP server at {endpoint.url}")
            logger.info(f"🎯 Agent ID: {self.identity.id}")
            logger.info(f"🔧 Tools available: {len(self.tools)}")

            return True

        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            self.status = ConnectionStatus.ERROR

            # Try next endpoint
            if len(self.endpoints) > 1:
                self.endpoints.pop(0)
                return await self.connect(self.endpoints[0])

            return False

    async def _authenticate(self) -> bool:
        """Authenticate with MCP server"""
        self.status = ConnectionStatus.AUTHENTICATING

        # Check for API key
        api_key = os.environ.get('SARTOR_API_KEY')

        auth_message = {
            "type": "auth",
            "agent_id": self.identity.id,
            "device_type": self.identity.device_type,
            "capabilities": self.identity.capabilities,
            "api_key": api_key
        }

        await self.websocket.send(json.dumps(auth_message))

        response = await self.websocket.recv()
        data = json.loads(response)

        if data.get('success'):
            self.identity.auth_token = data.get('token')
            logger.info("✅ Authenticated successfully")
            return True
        else:
            logger.warning("⚠️ Authentication failed, running in open mode")
            return True  # Continue anyway

    async def _discover_tools(self) -> Dict[str, Dict]:
        """Discover available MCP tools"""
        request = {
            "type": "list_tools",
            "agent_id": self.identity.id
        }

        await self.websocket.send(json.dumps(request))
        response = await self.websocket.recv()
        data = json.loads(response)

        if data.get('success'):
            self.tools = data.get('tools', {})
            logger.info(f"🔧 Discovered {len(self.tools)} tools")

        return self.tools

    async def disconnect(self):
        """Disconnect from MCP server"""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None

        if self.session:
            await self.session.close()
            self.session = None

        self.status = ConnectionStatus.DISCONNECTED
        logger.info("👋 Disconnected from MCP server")

    # ==================== Tool Execution ====================

    async def execute_tool(self, tool_name: str, params: Optional[Dict] = None) -> Dict:
        """Execute an MCP tool"""
        if self.status != ConnectionStatus.READY:
            raise RuntimeError(f"Not connected. Status: {self.status}")

        if tool_name not in self.tools:
            raise ValueError(f"Unknown tool: {tool_name}")

        request = {
            "type": "execute_tool",
            "tool": tool_name,
            "params": params or {},
            "agent_id": self.identity.id
        }

        await self.websocket.send(json.dumps(request))
        response = await self.websocket.recv()

        return json.loads(response)

    # ==================== Convenience Methods ====================

    async def send_message(self, to: str, content: str) -> Dict:
        """Send a message to another agent or broadcast"""
        return await self.execute_tool("message_send", {
            "to": to,
            "content": content
        })

    async def claim_task(self, task_id: str) -> Dict:
        """Claim a task"""
        return await self.execute_tool("task_claim", {
            "task_id": task_id
        })

    async def execute_skill(self, skill_id: str, params: Optional[Dict] = None) -> Dict:
        """Execute a skill"""
        return await self.execute_tool("skill_execute", {
            "skill_id": skill_id,
            "params": params or {}
        })

    async def query_knowledge(self, query: str) -> Dict:
        """Query the knowledge base"""
        return await self.execute_tool("knowledge_query", {
            "query": query
        })

    # ==================== Interactive Mode ====================

    async def interactive_onboarding(self):
        """Interactive onboarding process"""
        print("\n" + "="*60)
        print("🌟 SARTOR CLAUDE NETWORK - GATEWAY ACTIVATION 🌟")
        print("="*60)

        # Discover endpoints
        print("\n🔍 Discovering MCP servers...")
        endpoints = await self.discover_endpoints()

        if not endpoints:
            print("\n❌ No MCP servers found!")
            print("\nTroubleshooting:")
            print("1. Start MCP server: python mcp_server.py")
            print("2. Set MCP_ENDPOINT environment variable")
            print("3. Check network connectivity")
            return False

        print(f"\n✅ Found {len(endpoints)} endpoints:")
        for i, ep in enumerate(endpoints[:5]):
            print(f"  {i+1}. {ep.url} ({ep.type}, {ep.latency_ms:.0f}ms)")

        # Connect
        print(f"\n🔌 Connecting to best endpoint...")
        if await self.connect():
            print("\n✅ CONNECTION SUCCESSFUL!")
            print(f"\n📊 Network Status:")
            print(f"  • Agent ID: {self.identity.id}")
            print(f"  • Server: {self.current_endpoint.url}")
            print(f"  • Tools Available: {len(self.tools)}")

            # Test basic operations
            print("\n🧪 Testing basic operations...")

            # Send hello message
            print("  • Sending hello message...")
            result = await self.send_message("broadcast", "Hello network! New agent online!")
            if result.get('success'):
                print("    ✅ Message sent successfully")

            # List available tasks
            print("  • Checking available tasks...")
            result = await self.execute_tool("task_list", {})
            if result.get('success'):
                tasks = result.get('tasks', [])
                print(f"    ✅ Found {len(tasks)} available tasks")

            # Query knowledge base
            print("  • Querying knowledge base...")
            result = await self.query_knowledge("getting_started")
            if result.get('success'):
                print("    ✅ Knowledge base accessible")

            print("\n" + "="*60)
            print("🎉 GATEWAY ACTIVATION COMPLETE! 🎉")
            print("="*60)
            print("\nYou are now connected to the Sartor Claude Network!")
            print("\nNext steps:")
            print("1. Explore available tools: client.tools")
            print("2. Send messages: await client.send_message('broadcast', 'Hello!')")
            print("3. Claim tasks: await client.claim_task('task-id')")
            print("4. Execute skills: await client.execute_skill('skill.id')")
            print("\nHappy collaborating! 🚀")

            return True

        return False


# ==================== Main Entry Point ====================

async def main():
    """Main entry point for gateway client"""
    # Load skill file if provided
    import sys

    skill_file = None
    if len(sys.argv) > 1:
        skill_file = sys.argv[1]

        # Load and validate skill file
        try:
            with open(skill_file, 'r') as f:
                if skill_file.endswith('.yaml') or skill_file.endswith('.yml'):
                    skill_data = yaml.safe_load(f)
                else:
                    skill_data = json.load(f)

            print(f"📄 Loaded skill: {skill_data['skill']['name']}")
            print(f"📝 Description: {skill_data['skill']['description']}")

        except Exception as e:
            print(f"❌ Failed to load skill file: {e}")
            sys.exit(1)

    # Create and run gateway client
    client = GatewayClient()

    try:
        # Run interactive onboarding
        success = await client.interactive_onboarding()

        if success:
            # Keep connection open for interactive use
            print("\n💡 Client is connected. Press Ctrl+C to disconnect.")

            # Start message listener
            async def listen_for_messages():
                while client.status == ConnectionStatus.READY:
                    try:
                        message = await client.websocket.recv()
                        data = json.loads(message)
                        if data.get('type') == 'message':
                            print(f"\n📨 Message from {data.get('from')}: {data.get('content')}")
                    except:
                        break

            await listen_for_messages()

    except KeyboardInterrupt:
        print("\n\n👋 Disconnecting...")
    finally:
        await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())