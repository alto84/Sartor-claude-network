# MCP Gateway - Instant Network Access

## 🚀 Quick Start

### Prerequisites

- Python 3.10 or higher
- Internet connection
- 5 minutes

### Installation (Choose One)

#### Option 1: Zero-Dependency Bootstrap (Recommended)
```bash
python3 bootstrap.py
```
This uses ONLY Python standard library - no external tools needed!

#### Option 2: Automated Installer
```bash
bash install.sh
```

#### Option 3: Docker (Easiest)
```bash
docker-compose up -d
```

#### Option 4: Manual Installation
```bash
pip install -r requirements-complete.txt
python validate_installation.py
```

### The One-File Solution

After installation, give ANY Claude agent this single file to connect them to the network:
```
/claude-network/skills/meta/gateway.yaml
```

That's it! They're in! 🎉

## 📦 What's Included

### Core Components

1. **gateway.yaml** - The magic file
   - Self-contained skill definition
   - Auto-discovery configuration
   - Tool definitions
   - Error handling

2. **gateway_client.py** - Python implementation
   - WebSocket connection manager
   - Tool execution framework
   - Auto-reconnection logic
   - Interactive onboarding

3. **mcp_server.py** - MCP server
   - WebSocket & HTTP endpoints
   - Tool registry
   - Agent management
   - Message routing

4. **test_gateway.py** - Test suite
   - Connection testing
   - New agent simulation
   - Tool verification

## 🎯 How It Works

### For New Agents

```python
# Agent receives gateway.yaml
skill = load_skill("gateway.yaml")

# Execute the skill
await skill.execute()

# Now they have full access!
# All MCP tools are available
```

### What Happens Behind the Scenes

```
1. Discovery (5-10 sec)
   ↓ Find MCP servers

2. Connection (2-5 sec)
   ↓ Establish WebSocket

3. Authentication (1-2 sec)
   ↓ Register identity

4. Tool Loading (3-5 sec)
   ↓ Enable all tools

5. Verification (2-3 sec)
   ↓ Test operations

✅ CONNECTED! (Total: ~20 seconds)
```

## 🔧 Starting the MCP Server

### Basic Start
```bash
cd /home/alton/vayu-learning-project/claude-network
python mcp/mcp_server.py
```

### With Options
```bash
# Custom port
MCP_PORT=8081 python mcp/mcp_server.py

# Custom host
MCP_HOST=0.0.0.0 python mcp/mcp_server.py

# Both
MCP_HOST=192.168.1.100 MCP_PORT=8082 python mcp/mcp_server.py
```

### Keep Running in Background
```bash
# Using nohup
nohup python mcp/mcp_server.py > mcp.log 2>&1 &

# Using screen
screen -S mcp
python mcp/mcp_server.py
# Press Ctrl+A, D to detach

# Using tmux
tmux new -s mcp
python mcp/mcp_server.py
# Press Ctrl+B, D to detach
```

## 🧪 Testing the Gateway

### Run Test Suite
```bash
cd /home/alton/vayu-learning-project/claude-network
python mcp/test_gateway.py
```

Expected output:
```
🧪 GATEWAY SKILL TEST
==============================================================
1️⃣ Testing Discovery...
   ✅ Found 3 endpoints
2️⃣ Testing Connection...
   ✅ Connected to http://localhost:8080/mcp
3️⃣ Testing Tools...
   📦 22 tools available
4️⃣ Testing Basic Operations...
   ✅ All tests passed!
```

### Interactive Testing
```bash
# Start Python
python

# Test connection
from mcp.gateway_client import GatewayClient
import asyncio

async def test():
    client = GatewayClient()
    if await client.connect():
        print(f"Connected! Agent ID: {client.identity.id}")
        # Try some tools
        result = await client.send_message("broadcast", "Test!")
        print(result)
    await client.disconnect()

asyncio.run(test())
```

## 🌐 Network Topology

```
         [MCP Server]
              |
    ┌─────────┼─────────┐
    ↓         ↓         ↓
[Desktop] [Laptop]  [iPad]
 Claude    Claude   Claude
    ↓         ↓         ↓
    └─────────┼─────────┘
              ↓
      [Shared Tools & Knowledge]
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Issue: "No module named 'pip'"
**Solution**: Run the bootstrap script which installs pip automatically:
```bash
python3 bootstrap.py
```

#### Issue: "ModuleNotFoundError: No module named 'aiohttp'"
**Solution**: Dependencies not installed. Run:
```bash
pip install -r requirements-complete.txt
# OR use the bootstrap script
python3 bootstrap.py
```

#### Issue: Tests won't run - "pytest not found"
**Solution**: Install test dependencies:
```bash
pip install pytest pytest-asyncio psutil
```

#### Issue: "Connection refused on port 8080"
**Solution**: MCP server not running. Start it:
```bash
python mcp_server.py
```

#### Issue: Gateway discovery times out
**Solution**: Check firewall settings and ensure port 8080 is open:
```bash
# Linux
sudo ufw allow 8080
# Windows
netsh advfirewall firewall add rule name="MCP Server" dir=in action=allow protocol=TCP localport=8080
```

#### Issue: Docker build fails
**Solution**: Ensure Docker is installed and running:
```bash
docker --version
docker-compose --version
# If not installed, visit https://docs.docker.com/get-docker/
```

### Validation Commands

Check if everything is installed correctly:
```bash
python validate_installation.py
```

This will check:
- Python version
- All required dependencies
- MCP files present
- Gateway client imports
- Network connectivity
- Test structure

### Getting Help

1. Check the audit findings: `tests/AUDIT-FINDINGS.md`
2. Review test reports: `tests/*-TEST-REPORT.md`
3. Check logs: `logs/mcp_server.log`
4. File an issue: https://github.com/alto84/Sartor-claude-network/issues

## 🔌 Connection Methods

### 1. Local Connection (Fastest)
```python
# Automatically tries:
- http://localhost:8080/mcp
- http://127.0.0.1:8080/mcp
- http://0.0.0.0:8080/mcp
```

### 2. Network Scan (Auto-discovery)
```python
# Scans local network:
- 192.168.1.1-254:8080-8082
- Finds all MCP servers
- Connects to fastest
```

### 3. Firebase Relay (Internet)
```python
# Via cloud:
- https://firebase.../mcp_servers
- Works across internet
- Slightly higher latency
```

### 4. Manual Endpoint (Override)
```bash
export MCP_ENDPOINT="http://192.168.1.100:8080/mcp"
python gateway_client.py
```

## 📊 Available Tools After Connection

### Communication (5 tools)
- `message_send` - Direct messages
- `message_broadcast` - Network-wide
- `message_subscribe` - Topic subscriptions

### Coordination (7 tools)
- `task_list` - Available tasks
- `task_claim` - Claim work
- `task_status` - Update progress
- `consensus_propose` - Proposals

### Skills (3 tools)
- `skill_list` - Browse skills
- `skill_execute` - Run skills
- `skill_compose` - Chain skills

### Knowledge (3 tools)
- `knowledge_query` - Search
- `knowledge_add` - Contribute
- `experience_share` - Share lessons

### Monitoring (3 tools)
- `agent_status` - Who's online
- `network_health` - System status
- `performance_metrics` - Stats

### Evolution (2 tools)
- `improvement_propose` - Suggest changes
- `sandbox_test` - Safe testing

## 🛠️ Troubleshooting

### Server Won't Start
```bash
# Check port in use
lsof -i :8080

# Kill existing process
kill -9 <PID>

# Try different port
MCP_PORT=8081 python mcp/mcp_server.py
```

### Can't Connect
```bash
# Check server is running
curl http://localhost:8080/mcp/health

# Check firewall
sudo ufw status
sudo ufw allow 8080

# Test with curl
curl -X POST http://localhost:8080/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "echo", "params": {"message": "test"}}'
```

### WebSocket Issues
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Check WebSocket directly
import websockets
async def test():
    ws = await websockets.connect("ws://localhost:8080/mcp")
    await ws.send('{"type": "list_tools"}')
    response = await ws.recv()
    print(response)
```

## 📈 Performance

### Typical Metrics
- Discovery: 2-5 seconds
- Connection: <1 second (local)
- Tool loading: 2-3 seconds
- Message latency: <50ms (local)
- Memory usage: ~50MB per agent
- CPU usage: <5% idle, 10-20% active

### Scaling
- Single server: 50-100 agents
- With Redis: 500+ agents
- Clustered: Unlimited

## 🔐 Security

### Development Mode (Default)
- No authentication required
- Full tool access
- Local network only

### Production Mode
```bash
# Set API key requirement
export REQUIRE_AUTH=true
export SARTOR_API_KEY="secret-key-here"

# Agents must authenticate
export SARTOR_API_KEY="secret-key-here"
python gateway_client.py
```

### Best Practices
- ✅ Use authentication in production
- ✅ Run behind firewall
- ✅ Use HTTPS/WSS for internet
- ✅ Rotate API keys regularly
- ❌ Don't expose ports publicly
- ❌ Don't disable security checks

## 🎓 Examples

### Example 1: Minimal Connection
```python
from mcp.gateway_client import GatewayClient
import asyncio

async def connect():
    async with GatewayClient() as client:
        print("Connected!")
        await client.send_message("broadcast", "Hello!")

asyncio.run(connect())
```

### Example 2: Custom Agent
```python
client = GatewayClient()
client.identity.device_type = "researcher"
client.identity.capabilities = ["analysis", "reporting"]

await client.connect()
print(f"Researcher agent {client.identity.id} online")
```

### Example 3: Tool Discovery
```python
async with GatewayClient() as client:
    # List all tools
    for name, info in client.tools.items():
        print(f"{name}: {info['description']}")

    # Execute specific tool
    result = await client.execute_tool("network_health", {})
    print(f"Network status: {result}")
```

## 📚 Further Reading

- [Gateway Skill Usage](../GATEWAY-SKILL-USAGE.md) - Detailed usage guide
- [CLAUDE.md](../CLAUDE.md) - Philosophy & architecture
- [MASTER-PLAN.md](../MASTER-PLAN.md) - Project roadmap
- [Skills Guide](../SKILL-GUIDE.md) - Creating skills

## 💡 Tips

1. **Start Simple**: Just run the server and client first
2. **Use Test Script**: `test_gateway.py` validates everything
3. **Check Logs**: Enable debug logging when troubleshooting
4. **Monitor Health**: Use `/mcp/health` endpoint
5. **Keep Updated**: Pull latest gateway.yaml regularly

## 🆘 Getting Help

- **Issues**: Check server logs first
- **Questions**: See GATEWAY-SKILL-USAGE.md
- **Bugs**: File GitHub issue with logs
- **Ideas**: Propose via improvement tools

---

**Remember**: The gateway skill is the key to the kingdom. One file, instant access, unlimited possibilities! 🚀

*Last Updated: 2025-11-03*
*Gateway Version: 1.0.0*
*MCP Protocol: v1*