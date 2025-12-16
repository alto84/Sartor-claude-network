# MCP Gateway - 5-Minute Quick Start

Get your first Claude agent connected to the network in under 5 minutes!

## Prerequisites Check (30 seconds)

```bash
# Check Python (3.10+ required)
python3 --version

# Check Git
git --version
```

If missing, install:
- **Ubuntu/Debian**: `sudo apt update && sudo apt install python3 git`
- **macOS**: `brew install python3 git`
- **Windows**: Use WSL2 or install from python.org

## Step 1: Clone & Enter (30 seconds)

```bash
git clone https://github.com/alto84/Sartor-claude-network.git
cd Sartor-claude-network/claude-network
```

## Step 2: Bootstrap Everything (2 minutes)

```bash
# This single command does everything!
python3 mcp/bootstrap.py
```

What happens:
- ✅ Installs pip if needed
- ✅ Creates virtual environment
- ✅ Installs all dependencies
- ✅ Validates installation
- ✅ Starts MCP server

## Step 3: Verify It's Working (30 seconds)

Open a new terminal and run:

```bash
curl http://localhost:8080/mcp/health
```

You should see:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "tools": 22
}
```

## Step 4: Connect Your First Agent (1 minute)

```python
# Save as test_agent.py
from mcp.gateway_client import GatewayClient
import asyncio

async def main():
    client = GatewayClient()

    # Connect
    if await client.connect():
        print(f"✅ Connected as: {client.identity.id}")

        # Send a message
        await client.send_message("broadcast", "Hello, Network!")
        print("📨 Message sent!")

        # List tools
        print(f"🔧 {len(client.tools)} tools available")

        await client.disconnect()
    else:
        print("❌ Connection failed")

asyncio.run(main())
```

Run it:
```bash
python3 test_agent.py
```

## Step 5: Give Agent the Gateway Skill (30 seconds)

For ANY Claude Code CLI agent to join the network, just share this file:

```
/home/alton/vayu-learning-project/claude-network/skills/meta/gateway.yaml
```

The agent can then:
```python
# They run this
from skill_engine import SkillEngine
engine = SkillEngine()
await engine.execute_skill("gateway", {})

# Now they're connected!
```

## 🎉 You're Connected!

Your MCP Gateway is now running and agents can connect. The server will keep running until you stop it.

## What's Next?

### Explore Available Tools

```python
# List all tools
from mcp.gateway_client import GatewayClient
import asyncio

async def explore():
    async with GatewayClient() as client:
        for name, info in client.tools.items():
            print(f"{name}: {info['description']}")

asyncio.run(explore())
```

### Keep Server Running

To run the server in the background:

```bash
# Using nohup
nohup python3 mcp/mcp_server.py > mcp.log 2>&1 &

# Using screen
screen -S mcp
python3 mcp/mcp_server.py
# Press Ctrl+A, then D to detach

# Using systemd (Linux)
sudo cp mcp-gateway.service /etc/systemd/system/
sudo systemctl start mcp-gateway
sudo systemctl enable mcp-gateway
```

### Monitor the Network

```bash
# Watch connections in real-time
watch 'curl -s http://localhost:8080/mcp/metrics | python3 -m json.tool'

# Check logs
tail -f logs/mcp_server.log
```

## Quick Commands Reference

```bash
# Start server
python3 mcp/mcp_server.py

# Stop server
pkill -f mcp_server

# Test connection
curl http://localhost:8080/mcp/health

# Run tests
python3 mcp/test_gateway.py

# Validate installation
python3 mcp/validate_installation.py
```

## Troubleshooting

### Port Already in Use?
```bash
# Use different port
MCP_PORT=8081 python3 mcp/mcp_server.py
```

### Can't Import Modules?
```bash
# Re-run bootstrap
python3 mcp/bootstrap.py
```

### Connection Refused?
```bash
# Check server is running
ps aux | grep mcp_server

# Check firewall
sudo ufw status
```

## Environment Variables (Optional)

```bash
# Custom port
export MCP_PORT=8081

# Enable debug logging
export MCP_LOG_LEVEL=DEBUG

# Custom host
export MCP_HOST=0.0.0.0
```

## Docker Alternative

If you prefer Docker:

```bash
# Build and run
docker build -t mcp-gateway mcp/
docker run -d -p 8080:8080 --name mcp mcp-gateway

# Check status
docker ps
docker logs mcp
```

## Success Indicators

✅ **Server Running**: `http://localhost:8080/mcp/health` returns JSON
✅ **Agent Connected**: Test script shows agent ID
✅ **Tools Available**: 22+ tools listed
✅ **Messages Working**: Broadcast message succeeds
✅ **Logs Clean**: No errors in `logs/mcp_server.log`

## Next Steps

1. 📖 Read [Full Deployment Guide](MCP-DEPLOYMENT-GUIDE.md) for production setup
2. 🔧 Explore [System Overview](mcp/MCP-SYSTEM-OVERVIEW.md)
3. 🔐 Configure [Security Settings](MCP-DEPLOYMENT-GUIDE.md#security-setup)
4. 🚀 Connect more agents across your network
5. 📊 Set up monitoring and alerts

---

**Remember**: The MCP Gateway is your network's nervous system. Once it's running, any Claude agent can join with just the gateway.yaml file!

**Need Help?**
- Logs: `tail -f logs/mcp_server.log`
- Validation: `python3 mcp/validate_installation.py`
- Full Guide: [MCP-DEPLOYMENT-GUIDE.md](MCP-DEPLOYMENT-GUIDE.md)

---

*Quick Start Version: 1.0*
*Time to Connect: < 5 minutes*
*Last Updated: 2025-11-03*