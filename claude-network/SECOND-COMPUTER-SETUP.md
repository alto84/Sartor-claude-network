# Second Computer Setup Guide

## Overview

This guide walks you through connecting a second computer to the Claude Network. By the end, you'll have a fully-functional agent joining the multi-computer coordination system.

**Estimated time**: 15-20 minutes

## Prerequisites

Before you start, make sure you have:

1. **Python 3.9+** installed
2. **Git** installed
3. **Firebase credentials** from the first computer (see Step 2)
4. **Internet connection** (Firebase requires it)
5. **Claude Code CLI** (optional but recommended)

### Check Your Environment

```bash
# Check Python version
python3 --version

# Check Git
git --version
```

## Step 1: Clone the Repository

Get the code onto your second computer:

```bash
# Choose a location to work (or use your existing project path)
cd ~/Projects  # or wherever you keep code

# Clone the repository
git clone <REPOSITORY_URL> claude-network
cd claude-network
```

If this is a private repository, you may need to set up SSH or use a personal access token:

```bash
# For HTTPS with token:
git clone https://<TOKEN>@github.com/<USER>/claude-network.git

# For SSH:
git clone git@github.com:<USER>/claude-network.git
```

## Step 2: Set Up Firebase Credentials

The network uses Firebase Realtime Database. You need credentials from the first computer.

### 2a. Get Credentials from First Computer

On your **first computer** where Firebase is already configured:

```bash
cd /home/alton/vayu-learning-project/claude-network

# Copy the Firebase configuration file
cat config.yaml | grep -A 5 firebase

# OR if using environment variables:
env | grep FIREBASE
```

You need:

- Firebase database URL
- Firebase project ID
- Service account key (if available) or API key

### 2b. Set Up Credentials on Second Computer

You have two options:

#### Option 1: Environment Variables (Recommended)

```bash
# Set environment variables
export FIREBASE_URL="https://home-claude-network-default-rtdb.firebaseio.com"
export FIREBASE_PROJECT_ID="home-claude-network"

# Verify they're set
echo $FIREBASE_URL
```

Add to your shell profile (`.bashrc`, `.zshrc`, etc.) to make them permanent:

```bash
# Add to ~/.bashrc or ~/.zshrc
export FIREBASE_URL="https://home-claude-network-default-rtdb.firebaseio.com"
export FIREBASE_PROJECT_ID="home-claude-network"
```

#### Option 2: Configuration File

Copy the configuration file from the first computer:

```bash
# On second computer:
mkdir -p ~/.claude-network

# Copy config.yaml from first computer
# You can do this manually or:
scp user@firstcomputer:/home/user/.claude-network/config.yaml ~/.claude-network/

# Or copy to project directory:
cp config.example.yaml config.yaml
nano config.yaml  # Edit with your Firebase details
```

Example `config.yaml`:

```yaml
firebase:
  url: 'https://home-claude-network-default-rtdb.firebaseio.com'
  project_id: 'home-claude-network'
  timeout: 30
  max_retries: 3

agent:
  name: 'Claude-Agent-Laptop'
  capabilities:
    - 'communication'
    - 'task_execution'
    - 'monitoring'

network:
  heartbeat_interval: 30
  presence_update_interval: 15

security:
  use_message_signing: true
```

## Step 3: Install Python Dependencies

```bash
# Install required packages
pip3 install -r requirements.txt

# Or install individually:
pip3 install requests firebase-admin pyyaml pytest

# Verify installation
python3 -c "import requests; import firebase_admin; print('Dependencies OK')"
```

## Step 4: Run the Interactive Setup

The easiest way to configure your agent:

```bash
python3 setup_agent.py
```

This wizard will:

- Ask for your agent name
- Configure Firebase connection
- Set up agent capabilities
- Create necessary directories
- Test the connection
- Initialize the local cache

**Answer the prompts:**

```
Welcome to Claude Network Setup!

What is your agent name? laptop-claude
What surface type? [desktop/mobile/web] desktop
What are your capabilities? [communication, task_execution, monitoring]
Firebase URL? https://home-claude-network-default-rtdb.firebaseio.com
Firebase Project ID? home-claude-network
```

## Step 5: Verify Firebase Connection

Test that your agent can reach Firebase:

```bash
# Test connection
python3 -c "
from config_manager import ConfigManager
from firebase_schema import FirebaseSchema

config = ConfigManager()
print(f'Firebase URL: {config.firebase.url}')

schema = FirebaseSchema(config)
stats = schema.get_stats()
print(f'Database size: {stats}')
"
```

Expected output:

```
Firebase URL: https://home-claude-network-default-rtdb.firebaseio.com
Database size: {'agents': 1, 'messages': 45, 'tasks': 12}
```

## Step 6: Register Your Agent

```bash
# Register with the network
python3 -c "
from agent_registry import AgentRegistry
from config_manager import ConfigManager

config = ConfigManager()
registry = AgentRegistry(config)
registry.register()
print('Agent registered successfully!')
"
```

Verify registration:

```bash
python3 -c "
from agent_registry import AgentRegistry
from config_manager import ConfigManager

config = ConfigManager()
registry = AgentRegistry(config)
agents = registry.get_agents()
for agent in agents:
    print(f\"- {agent['name']} ({agent['id']}) - {agent['status']}\")
"
```

## Step 7: Start the Heartbeat

The heartbeat keeps your agent visible on the network:

```bash
# Start heartbeat in background
python3 -c "
from agent_registry import AgentRegistry
from config_manager import ConfigManager

config = ConfigManager()
registry = AgentRegistry(config)
registry.start_heartbeat()
print('Heartbeat started. Press Ctrl+C to stop.')
" &
```

Or run in foreground for testing:

```bash
python3 -c "
from agent_registry import AgentRegistry
from config_manager import ConfigManager
import time

config = ConfigManager()
registry = AgentRegistry(config)
registry.start_heartbeat()

# Keep running for 60 seconds
for i in range(6):
    time.sleep(10)
    print(f'Heartbeat {i+1}...')
"
```

## Step 8: Monitor Network Status

In a new terminal, monitor the network:

```bash
python3 monitor.py
```

You should see:

- Your new agent appearing
- Status updates every 15 seconds
- Other connected agents
- Message flow

Expected output:

```
Claude Network Status Monitor
============================
Last update: 2025-11-03 14:23:45

Connected Agents (2):
  - desktop-claude [HEALTHY] Last heartbeat: 5s ago
  - laptop-claude [HEALTHY] Last heartbeat: 2s ago

Recent Messages (5):
  [14:23:40] desktop-claude -> broadcast: "Status check"
  [14:23:35] laptop-claude -> desktop-claude: "Agent ready"

Active Tasks: 3
Pending Messages: 0
```

## Step 9: Test Communication

Send a message from your new agent:

```bash
# Send a broadcast message
python3 -c "
from macs import MACSClient
from config_manager import ConfigManager

config = ConfigManager()
client = MACSClient(config.agent.name)

message_id = client.send_message(
    recipient='broadcast',
    content='Hello from second computer!',
    message_type='status'
)
print(f'Message sent: {message_id}')
"
```

Check if message was received on first computer:

```bash
python3 monitor.py  # on first computer
```

## Step 10: Run the Test Suite

Verify everything works correctly:

```bash
# Run all tests
pytest tests/ -v

# Run specific test suite
pytest tests/test_agent_registry.py -v
pytest tests/test_macs.py -v
pytest tests/test_config_manager.py -v
```

All tests should pass with PASSED status.

## Step 11: Set Up Persistent Services (Optional)

To run your agent continuously, create a system service:

### Linux/WSL

Create `/etc/systemd/system/claude-network.service`:

```ini
[Unit]
Description=Claude Network Agent
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/claude-network
ExecStart=/usr/bin/python3 /path/to/claude-network/monitor.py
Restart=always
RestartSec=10
Environment=FIREBASE_URL=https://home-claude-network-default-rtdb.firebaseio.com
Environment=FIREBASE_PROJECT_ID=home-claude-network

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable claude-network
sudo systemctl start claude-network
sudo systemctl status claude-network
```

### macOS

Create `~/Library/LaunchAgents/com.claudenetwork.agent.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claudenetwork.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>/path/to/monitor.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/claude-network.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/claude-network-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>FIREBASE_URL</key>
        <string>https://home-claude-network-default-rtdb.firebaseio.com</string>
        <key>FIREBASE_PROJECT_ID</key>
        <string>home-claude-network</string>
    </dict>
</dict>
</plist>
```

Enable:

```bash
launchctl load ~/Library/LaunchAgents/com.claudenetwork.agent.plist
```

## Troubleshooting

### Firebase Connection Issues

**Error: "Firebase connection failed"**

```bash
# Test basic connectivity
python3 -c "
import requests
url = 'https://home-claude-network-default-rtdb.firebaseio.com/.json'
try:
    response = requests.get(url, timeout=5)
    print(f'Status: {response.status_code}')
except Exception as e:
    print(f'Connection error: {e}')
"
```

**Solution:**

- Verify Firebase URL is correct
- Check internet connection
- Verify Firebase database is accessible
- Check if database has authentication enabled

### Agent Not Appearing in Registry

**Problem: Agent doesn't show up in `registry.get_agents()`**

```bash
# Check agent registration
python3 -c "
from agent_registry import AgentRegistry
from config_manager import ConfigManager

config = ConfigManager()
registry = AgentRegistry(config)

# Try to register
result = registry.register()
print(f'Registration result: {result}')

# Check agents
agents = registry.get_agents()
print(f'Total agents: {len(agents)}')
"
```

**Solution:**

- Make sure `setup_agent.py` was run
- Verify config.yaml or environment variables are set
- Check Firebase connectivity (see above)
- Ensure agent name is unique

### Heartbeat Not Running

**Problem: Heartbeat doesn't stay running**

```bash
# Check heartbeat status
python3 -c "
from agent_registry import AgentRegistry
from config_manager import ConfigManager
import threading

config = ConfigManager()
registry = AgentRegistry(config)

# Check if heartbeat thread exists
print(f'Heartbeat thread: {registry._heartbeat_thread}')
print(f'Heartbeat active: {registry._heartbeat_active if hasattr(registry, \"_heartbeat_active\") else \"N/A\"}')
"
```

**Solution:**

- Run `start_heartbeat()` explicitly
- Check for exceptions in heartbeat thread
- Verify Firebase connectivity

### Messages Not Delivered

**Problem: Message fails to send**

```bash
# Check message status
python3 -c "
from macs import MACSClient
from config_manager import ConfigManager

config = ConfigManager()
client = MACSClient(config.agent.name)

# Send with error tracking
try:
    msg_id = client.send_message(
        recipient='broadcast',
        content='Test',
        message_type='test'
    )
    print(f'Sent: {msg_id}')
except Exception as e:
    print(f'Error: {e}')
"
```

**Solution:**

- Verify recipient agent exists
- Check message size (max 256KB)
- Review offline queue
- Check MACS configuration

### Python Import Errors

**Error: "No module named 'firebase_admin'"**

```bash
# Reinstall dependencies
pip3 install --upgrade -r requirements.txt

# Or install specific package
pip3 install firebase-admin
```

### Permission Denied Errors

**Error on creating cache directories**

```bash
# Create required directories manually
mkdir -p ~/.claude-network
chmod 755 ~/.claude-network

# Check permissions
ls -la ~/.claude-network
```

## Common Tasks

### Add Your Agent to an Existing Task

```bash
from task_manager import TaskManager
from config_manager import ConfigManager

config = ConfigManager()
manager = TaskManager(config)

# Get available task
tasks = manager.list_tasks(status='queued')
if tasks:
    task = tasks[0]
    manager.assign_task(task['id'], config.agent.name)
    print(f"Assigned task {task['id']}")
```

### Create a New Task from Second Computer

```bash
from task_manager import TaskManager
from config_manager import ConfigManager

config = ConfigManager()
manager = TaskManager(config)

task = manager.create_task(
    title="Analyze Network Status",
    description="Check health of all connected agents",
    task_type="analysis",
    priority=2,
    required_capabilities=["monitoring"]
)
print(f"Created task: {task['id']}")
```

### Execute a Skill

```bash
import asyncio
from skill_engine import SkillEngine, SkillContext
from config_manager import ConfigManager

async def run():
    config = ConfigManager()
    engine = SkillEngine()
    context = SkillContext(
        agent_id=config.agent.name,
        session_id="session_001"
    )

    result = await engine.execute_skill(
        "send_message",
        context,
        {
            "recipient": "broadcast",
            "message": "Hello from laptop!",
            "message_type": "status"
        }
    )
    print(f"Result: {result}")

asyncio.run(run())
```

## Next Steps

1. **Configure persistence**: Set up services to run at startup
2. **Load custom skills**: Add domain-specific skills for your tasks
3. **Set up automation**: Create scheduled tasks for regular work
4. **Monitor performance**: Use metrics dashboard
5. **Integrate with first computer**: Create coordinated workflows

## Additional Resources

- **README.md** - System overview and quick reference
- **ARCHITECTURE-OVERVIEW.md** - Detailed system architecture
- **CONFIG_REGISTRY_README.md** - Configuration and registry details
- **TASK_MANAGER_README.md** - Task management system guide
- **SKILL-GUIDE.md** - Complete skill system documentation

## Getting Help

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review logs in `~/.claude-network/logs/`
3. Run `pytest tests/ -v` to check system health
4. Check Firebase console for data consistency
5. Verify all prerequisites are installed

---

**Congratulations!** Your second computer is now part of the Claude Network. You can now coordinate work between multiple computers and agents.
