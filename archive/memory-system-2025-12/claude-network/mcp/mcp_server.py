#!/usr/bin/env python3
"""
MCP Server for Sartor Claude Network
Model Context Protocol server that handles agent connections and tool execution
"""

import os
import json
import asyncio
import logging
import uuid
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field, asdict
from datetime import datetime
import aiohttp
from aiohttp import web
import weakref

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('mcp_server')


@dataclass
class ConnectedAgent:
    """Connected agent information"""
    id: str
    device_type: str
    capabilities: List[str]
    connected_at: str
    websocket: Any  # WebSocket connection
    auth_token: Optional[str] = None
    last_heartbeat: Optional[str] = None


@dataclass
class MCPTool:
    """MCP tool definition"""
    name: str
    description: str
    handler: str
    params: Dict[str, Any] = field(default_factory=dict)
    requires_auth: bool = False


class MCPServer:
    """Main MCP server implementation"""

    def __init__(self, host: str = "0.0.0.0", port: int = 8080):
        """Initialize MCP server"""
        self.host = host
        self.port = port
        self.app = web.Application()
        self.agents: Dict[str, ConnectedAgent] = {}
        self.websockets: Set[web.WebSocketResponse] = weakref.WeakSet()
        self.tools: Dict[str, MCPTool] = {}

        # Initialize default tools
        self._register_default_tools()

        # Setup routes
        self._setup_routes()

    def _setup_routes(self):
        """Setup HTTP and WebSocket routes"""
        self.app.router.add_get('/mcp', self.websocket_handler)
        self.app.router.add_get('/mcp/health', self.health_check)
        self.app.router.add_get('/mcp/agents', self.list_agents)
        self.app.router.add_get('/mcp/tools', self.list_tools)
        self.app.router.add_post('/mcp/execute', self.execute_tool_http)

    def _register_default_tools(self):
        """Register default MCP tools"""
        default_tools = [
            # Communication tools
            MCPTool(
                name="message_send",
                description="Send a message to an agent or broadcast",
                handler="handle_message_send",
                params={"to": str, "content": str}
            ),
            MCPTool(
                name="message_broadcast",
                description="Broadcast message to all agents",
                handler="handle_message_broadcast",
                params={"content": str}
            ),
            MCPTool(
                name="message_subscribe",
                description="Subscribe to message topics",
                handler="handle_message_subscribe",
                params={"topics": list}
            ),

            # Task tools
            MCPTool(
                name="task_list",
                description="List available tasks",
                handler="handle_task_list",
                params={"status": str}
            ),
            MCPTool(
                name="task_claim",
                description="Claim a task",
                handler="handle_task_claim",
                params={"task_id": str}
            ),
            MCPTool(
                name="task_status",
                description="Update task status",
                handler="handle_task_status",
                params={"task_id": str, "status": str}
            ),
            MCPTool(
                name="task_complete",
                description="Mark task as complete",
                handler="handle_task_complete",
                params={"task_id": str, "result": Any}
            ),

            # Skill tools
            MCPTool(
                name="skill_list",
                description="List available skills",
                handler="handle_skill_list",
                params={"category": str}
            ),
            MCPTool(
                name="skill_execute",
                description="Execute a skill",
                handler="handle_skill_execute",
                params={"skill_id": str, "params": dict}
            ),
            MCPTool(
                name="skill_compose",
                description="Compose multiple skills",
                handler="handle_skill_compose",
                params={"skills": list, "params": dict}
            ),

            # Knowledge tools
            MCPTool(
                name="knowledge_query",
                description="Query the knowledge base",
                handler="handle_knowledge_query",
                params={"query": str}
            ),
            MCPTool(
                name="knowledge_add",
                description="Add to knowledge base",
                handler="handle_knowledge_add",
                params={"entry": dict}
            ),
            MCPTool(
                name="experience_share",
                description="Share an experience",
                handler="handle_experience_share",
                params={"experience": dict}
            ),

            # Monitoring tools
            MCPTool(
                name="agent_status",
                description="Get agent statuses",
                handler="handle_agent_status",
                params={}
            ),
            MCPTool(
                name="network_health",
                description="Check network health",
                handler="handle_network_health",
                params={}
            ),
            MCPTool(
                name="performance_metrics",
                description="Get performance metrics",
                handler="handle_performance_metrics",
                params={"period": str}
            ),

            # Evolution tools
            MCPTool(
                name="improvement_propose",
                description="Propose an improvement",
                handler="handle_improvement_propose",
                params={"proposal": dict}
            ),
            MCPTool(
                name="sandbox_test",
                description="Test in sandbox environment",
                handler="handle_sandbox_test",
                params={"code": str, "test": str}
            ),

            # Utility tools
            MCPTool(
                name="echo",
                description="Echo test tool",
                handler="handle_echo",
                params={"message": str}
            ),
            MCPTool(
                name="list_tools",
                description="List all available tools",
                handler="handle_list_tools",
                params={}
            )
        ]

        for tool in default_tools:
            self.tools[tool.name] = tool

    # ==================== HTTP Handlers ====================

    async def health_check(self, request):
        """Health check endpoint"""
        return web.json_response({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "agents_connected": len(self.agents),
            "tools_available": len(self.tools)
        })

    async def list_agents(self, request):
        """List connected agents"""
        agents_info = []
        for agent_id, agent in self.agents.items():
            agents_info.append({
                "id": agent_id,
                "device_type": agent.device_type,
                "capabilities": agent.capabilities,
                "connected_at": agent.connected_at
            })
        return web.json_response({"agents": agents_info})

    async def list_tools(self, request):
        """List available tools"""
        tools_info = {}
        for name, tool in self.tools.items():
            tools_info[name] = {
                "description": tool.description,
                "params": tool.params,
                "requires_auth": tool.requires_auth
            }
        return web.json_response({"tools": tools_info})

    async def execute_tool_http(self, request):
        """Execute tool via HTTP POST"""
        try:
            data = await request.json()
            tool_name = data.get("tool")
            params = data.get("params", {})
            agent_id = data.get("agent_id", "http-client")

            result = await self.execute_tool(agent_id, tool_name, params)
            return web.json_response(result)

        except Exception as e:
            return web.json_response({
                "success": False,
                "error": str(e)
            }, status=400)

    # ==================== WebSocket Handler ====================

    async def websocket_handler(self, request):
        """Handle WebSocket connections"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        self.websockets.add(ws)

        agent_id = None
        logger.info(f"New WebSocket connection from {request.remote}")

        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        response = await self.handle_message(data, ws)

                        # Track agent ID from auth
                        if data.get("type") == "auth" and response.get("success"):
                            agent_id = data.get("agent_id")

                        await ws.send_json(response)

                    except json.JSONDecodeError:
                        await ws.send_json({
                            "success": False,
                            "error": "Invalid JSON"
                        })
                    except Exception as e:
                        logger.error(f"Error handling message: {e}")
                        await ws.send_json({
                            "success": False,
                            "error": str(e)
                        })

                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f'WebSocket error: {ws.exception()}')

        except Exception as e:
            logger.error(f"WebSocket handler error: {e}")

        finally:
            # Clean up on disconnect
            if agent_id and agent_id in self.agents:
                del self.agents[agent_id]
                logger.info(f"Agent {agent_id} disconnected")

                # Notify other agents
                await self.broadcast({
                    "type": "agent_disconnected",
                    "agent_id": agent_id,
                    "timestamp": datetime.now().isoformat()
                }, exclude=ws)

        return ws

    # ==================== Message Handling ====================

    async def handle_message(self, data: Dict, ws: web.WebSocketResponse) -> Dict:
        """Handle incoming WebSocket messages"""
        msg_type = data.get("type")

        if msg_type == "auth":
            return await self.handle_auth(data, ws)

        elif msg_type == "list_tools":
            return await self.handle_list_tools_ws(data)

        elif msg_type == "execute_tool":
            tool_name = data.get("tool")
            params = data.get("params", {})
            agent_id = data.get("agent_id")
            return await self.execute_tool(agent_id, tool_name, params)

        elif msg_type == "heartbeat":
            return await self.handle_heartbeat(data)

        else:
            return {
                "success": False,
                "error": f"Unknown message type: {msg_type}"
            }

    async def handle_auth(self, data: Dict, ws: web.WebSocketResponse) -> Dict:
        """Handle agent authentication"""
        agent_id = data.get("agent_id", str(uuid.uuid4()))
        device_type = data.get("device_type", "unknown")
        capabilities = data.get("capabilities", [])
        api_key = data.get("api_key")

        # Simple auth check (extend as needed)
        auth_success = True
        auth_token = None

        if api_key:
            # Validate API key (placeholder)
            auth_token = f"token-{uuid.uuid4().hex[:16]}"

        if auth_success:
            # Register agent
            self.agents[agent_id] = ConnectedAgent(
                id=agent_id,
                device_type=device_type,
                capabilities=capabilities,
                connected_at=datetime.now().isoformat(),
                websocket=ws,
                auth_token=auth_token
            )

            logger.info(f"Agent {agent_id} authenticated successfully")

            # Notify other agents
            await self.broadcast({
                "type": "agent_connected",
                "agent_id": agent_id,
                "device_type": device_type,
                "capabilities": capabilities,
                "timestamp": datetime.now().isoformat()
            }, exclude=ws)

            return {
                "success": True,
                "agent_id": agent_id,
                "token": auth_token,
                "message": "Authentication successful"
            }
        else:
            return {
                "success": False,
                "error": "Authentication failed"
            }

    async def handle_list_tools_ws(self, data: Dict) -> Dict:
        """Handle list tools request via WebSocket"""
        tools_info = {}
        for name, tool in self.tools.items():
            tools_info[name] = {
                "description": tool.description,
                "params": tool.params,
                "requires_auth": tool.requires_auth
            }

        return {
            "success": True,
            "tools": tools_info
        }

    async def handle_heartbeat(self, data: Dict) -> Dict:
        """Handle agent heartbeat"""
        agent_id = data.get("agent_id")

        if agent_id in self.agents:
            self.agents[agent_id].last_heartbeat = datetime.now().isoformat()
            return {"success": True, "message": "Heartbeat received"}

        return {"success": False, "error": "Unknown agent"}

    # ==================== Tool Execution ====================

    async def execute_tool(self, agent_id: str, tool_name: str, params: Dict) -> Dict:
        """Execute a tool"""
        if tool_name not in self.tools:
            return {
                "success": False,
                "error": f"Unknown tool: {tool_name}"
            }

        tool = self.tools[tool_name]

        # Check authentication if required
        if tool.requires_auth and agent_id not in self.agents:
            return {
                "success": False,
                "error": "Authentication required"
            }

        # Get handler method
        handler_name = tool.handler
        handler = getattr(self, handler_name, None)

        if not handler:
            return {
                "success": False,
                "error": f"Handler not implemented: {handler_name}"
            }

        try:
            # Execute handler
            result = await handler(agent_id, params)
            return {
                "success": True,
                "result": result
            }

        except Exception as e:
            logger.error(f"Tool execution error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    # ==================== Tool Handlers ====================

    async def handle_echo(self, agent_id: str, params: Dict) -> Dict:
        """Echo test tool"""
        return {"echo": params.get("message", "")}

    async def handle_list_tools(self, agent_id: str, params: Dict) -> Dict:
        """List all tools"""
        return {name: tool.description for name, tool in self.tools.items()}

    async def handle_message_send(self, agent_id: str, params: Dict) -> Dict:
        """Send a message"""
        to = params.get("to")
        content = params.get("content")

        message = {
            "type": "message",
            "from": agent_id,
            "to": to,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }

        if to == "broadcast":
            await self.broadcast(message)
            return {"message": "Broadcast sent"}

        elif to in self.agents:
            agent = self.agents[to]
            await agent.websocket.send_json(message)
            return {"message": f"Message sent to {to}"}

        else:
            return {"error": f"Unknown recipient: {to}"}

    async def handle_message_broadcast(self, agent_id: str, params: Dict) -> Dict:
        """Broadcast a message"""
        content = params.get("content")

        message = {
            "type": "message",
            "from": agent_id,
            "to": "broadcast",
            "content": content,
            "timestamp": datetime.now().isoformat()
        }

        await self.broadcast(message)
        return {"message": "Broadcast sent"}

    async def handle_task_list(self, agent_id: str, params: Dict) -> Dict:
        """List tasks (placeholder)"""
        # This would connect to task manager
        return {
            "tasks": [
                {
                    "id": "task-001",
                    "description": "Scan kitchen inventory",
                    "status": "available",
                    "priority": "medium"
                },
                {
                    "id": "task-002",
                    "description": "Analyze sensor data",
                    "status": "available",
                    "priority": "high"
                }
            ]
        }

    async def handle_agent_status(self, agent_id: str, params: Dict) -> Dict:
        """Get agent statuses"""
        agents_info = []
        for aid, agent in self.agents.items():
            agents_info.append({
                "id": aid,
                "device_type": agent.device_type,
                "connected_at": agent.connected_at,
                "last_heartbeat": agent.last_heartbeat
            })
        return {"agents": agents_info}

    async def handle_network_health(self, agent_id: str, params: Dict) -> Dict:
        """Get network health status"""
        return {
            "status": "healthy",
            "agents_connected": len(self.agents),
            "tools_available": len(self.tools),
            "uptime_seconds": 0,  # Would track actual uptime
            "timestamp": datetime.now().isoformat()
        }

    # Placeholder handlers for other tools
    async def handle_message_subscribe(self, agent_id: str, params: Dict) -> Dict:
        return {"subscribed": params.get("topics", [])}

    async def handle_task_claim(self, agent_id: str, params: Dict) -> Dict:
        return {"claimed": params.get("task_id")}

    async def handle_task_status(self, agent_id: str, params: Dict) -> Dict:
        return {"updated": params.get("task_id")}

    async def handle_task_complete(self, agent_id: str, params: Dict) -> Dict:
        return {"completed": params.get("task_id")}

    async def handle_skill_list(self, agent_id: str, params: Dict) -> Dict:
        return {"skills": ["scan", "analyze", "report"]}

    async def handle_skill_execute(self, agent_id: str, params: Dict) -> Dict:
        return {"executed": params.get("skill_id")}

    async def handle_skill_compose(self, agent_id: str, params: Dict) -> Dict:
        return {"composed": params.get("skills")}

    async def handle_knowledge_query(self, agent_id: str, params: Dict) -> Dict:
        return {"results": [{"title": "Getting Started", "content": "Welcome!"}]}

    async def handle_knowledge_add(self, agent_id: str, params: Dict) -> Dict:
        return {"added": True}

    async def handle_experience_share(self, agent_id: str, params: Dict) -> Dict:
        return {"shared": True}

    async def handle_performance_metrics(self, agent_id: str, params: Dict) -> Dict:
        return {"metrics": {"cpu": 25, "memory": 512, "tasks_completed": 42}}

    async def handle_improvement_propose(self, agent_id: str, params: Dict) -> Dict:
        return {"proposal_id": f"prop-{uuid.uuid4().hex[:8]}"}

    async def handle_sandbox_test(self, agent_id: str, params: Dict) -> Dict:
        return {"test_result": "passed"}

    # ==================== Utility Methods ====================

    async def broadcast(self, message: Dict, exclude: Optional[web.WebSocketResponse] = None):
        """Broadcast message to all connected agents"""
        for ws in self.websockets:
            if ws != exclude:
                try:
                    await ws.send_json(message)
                except ConnectionResetError:
                    pass  # Client disconnected

    async def start(self):
        """Start the MCP server"""
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)
        await site.start()

        logger.info(f"🚀 MCP Server started on {self.host}:{self.port}")
        logger.info(f"📡 WebSocket endpoint: ws://{self.host}:{self.port}/mcp")
        logger.info(f"🔧 {len(self.tools)} tools available")
        logger.info(f"✅ Ready for agent connections!")

        # Keep server running
        while True:
            await asyncio.sleep(3600)


# ==================== Main Entry Point ====================

async def main():
    """Main entry point"""
    # Get configuration from environment
    host = os.environ.get("MCP_HOST", "0.0.0.0")
    port = int(os.environ.get("MCP_PORT", "8080"))

    # Create and start server
    server = MCPServer(host, port)

    try:
        await server.start()
    except KeyboardInterrupt:
        logger.info("\n👋 MCP Server shutting down...")


if __name__ == "__main__":
    asyncio.run(main())