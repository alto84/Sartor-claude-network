# MCP Gateway System - Complete Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [Security Setup](#security-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)
9. [Maintenance](#maintenance)

## Overview

The MCP (Model Context Protocol) Gateway System provides a unified interface for Claude agents to connect and collaborate across your network. This guide covers production deployment from scratch to full operation.

### Architecture Summary

- **MCP Server**: Central coordination hub (Python/WebSocket)
- **Gateway Client**: Agent connection library
- **Tool Registry**: 22+ built-in tools for agent operations
- **Message Router**: Real-time communication backbone
- **Firebase Integration**: Cloud persistence and relay

### Deployment Time: 15-30 minutes

### Difficulty Level: Intermediate

## Prerequisites

### System Requirements

#### Hardware

- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: 500MB free space
- **Network**: Stable internet connection
- **CPU**: Any x64/ARM processor

#### Operating Systems

- Linux (Ubuntu 20.04+, Debian 10+, RHEL 8+)
- macOS (11.0 Big Sur+)
- Windows 10/11 with WSL2
- Docker-compatible systems

### Software Requirements

#### Required

```bash
# Check Python version (3.10+ required)
python3 --version

# Check pip availability
python3 -m pip --version

# Check git
git --version
```

#### Optional but Recommended

```bash
# Docker (for containerized deployment)
docker --version
docker-compose --version

# Screen/tmux (for background processes)
screen --version || tmux -V

# Firewall tools
ufw --version || iptables --version
```

### Network Requirements

- **Port 8080**: Default MCP server port (configurable)
- **WebSocket support**: For real-time communication
- **Outbound HTTPS**: For Firebase integration (optional)

### Account Requirements

- **GitHub access**: To clone repository
- **Firebase account** (optional): For cloud relay features
  - Free tier sufficient for <100 agents
  - Setup guide: See [Firebase Configuration](#firebase-configuration)

## Installation Methods

Choose the method that best fits your environment:

### Method 1: Zero-Dependency Bootstrap (RECOMMENDED)

**Best for**: Fresh systems, minimal dependencies, quick start

```bash
# Clone repository
git clone https://github.com/alto84/Sartor-claude-network.git
cd Sartor-claude-network/claude-network

# Run bootstrap script (uses only Python standard library)
python3 mcp/bootstrap.py
```

The bootstrap script will:

1. Install pip if missing
2. Set up virtual environment
3. Install all dependencies
4. Validate installation
5. Start MCP server

**Expected output**:

```
🚀 MCP Gateway Bootstrap
=======================
✓ Python 3.10+ detected
✓ Installing pip...
✓ Creating virtual environment...
✓ Installing dependencies...
✓ Validating installation...
✓ Starting MCP server...

🎉 MCP Gateway ready at http://localhost:8080
```

### Method 2: Docker Deployment (EASIEST)

**Best for**: Production, isolation, scaling

```bash
# Clone repository
git clone https://github.com/alto84/Sartor-claude-network.git
cd Sartor-claude-network/claude-network

# Build and start containers
docker-compose up -d

# Verify deployment
docker-compose ps
docker-compose logs mcp-server
```

**Docker Compose Configuration** (`docker-compose.yml`):

```yaml
version: '3.8'
services:
  mcp-server:
    build: ./mcp
    ports:
      - '8080:8080'
    environment:
      - MCP_HOST=0.0.0.0
      - MCP_PORT=8080
      - REQUIRE_AUTH=${REQUIRE_AUTH:-false}
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/mcp/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

### Method 3: Automated Installer

**Best for**: Standard Linux/macOS systems

```bash
# Clone repository
git clone https://github.com/alto84/Sartor-claude-network.git
cd Sartor-claude-network/claude-network

# Run installer
bash install.sh

# Follow prompts for configuration
```

The installer will:

1. Check system compatibility
2. Install Python dependencies
3. Configure environment
4. Set up systemd service (Linux)
5. Enable auto-start

### Method 4: Manual Installation

**Best for**: Custom environments, specific requirements

```bash
# Clone repository
git clone https://github.com/alto84/Sartor-claude-network.git
cd Sartor-claude-network/claude-network

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r mcp/requirements-complete.txt

# Validate installation
python mcp/validate_installation.py

# Start server
python mcp/mcp_server.py
```

## Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Server Configuration
MCP_HOST=0.0.0.0           # Listen on all interfaces
MCP_PORT=8080              # Server port
MCP_LOG_LEVEL=INFO         # DEBUG, INFO, WARNING, ERROR

# Security
REQUIRE_AUTH=false         # Enable authentication
SARTOR_API_KEY=            # API key if auth enabled
ALLOWED_ORIGINS=*          # CORS origins

# Firebase (Optional)
FIREBASE_PROJECT_ID=home-claude-network
FIREBASE_DATABASE_URL=https://home-claude-network-default-rtdb.firebaseio.com
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-key.json

# Performance
MAX_CONNECTIONS=100        # Max concurrent WebSocket connections
MESSAGE_TIMEOUT=30         # Message processing timeout (seconds)
WORKER_THREADS=4           # Background worker threads

# Features
ENABLE_METRICS=true        # Performance monitoring
ENABLE_HEALTH_CHECK=true   # Health endpoint
ENABLE_DISCOVERY=true      # Auto-discovery protocol
```

### Configuration File (config.yaml)

```yaml
# MCP Gateway Configuration
server:
  host: '0.0.0.0'
  port: 8080
  ssl:
    enabled: false
    cert_path: null
    key_path: null

authentication:
  enabled: false
  api_keys: []
  jwt_secret: null

firebase:
  enabled: true
  project_id: 'home-claude-network'
  database_url: 'https://home-claude-network-default-rtdb.firebaseio.com'

tools:
  enabled_categories:
    - communication
    - coordination
    - skills
    - knowledge
    - monitoring

  rate_limits:
    default: 100 # requests per minute
    by_tool:
      message_broadcast: 10
      consensus_propose: 5

logging:
  level: INFO
  file: logs/mcp_server.log
  max_size: 10MB
  backup_count: 5

performance:
  connection_pool_size: 100
  message_queue_size: 1000
  worker_threads: 4

monitoring:
  metrics_enabled: true
  health_check_interval: 30
  alert_webhooks: []
```

### Firebase Configuration

1. **Create Firebase Project**:

   ```bash
   # Visit https://console.firebase.google.com
   # Create new project: "home-claude-network"
   # Enable Realtime Database
   ```

2. **Get Service Account Key**:

   ```bash
   # Project Settings > Service Accounts
   # Generate New Private Key
   # Save as firebase-credentials.json
   ```

3. **Configure Database Rules**:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null",
       "agents": {
         ".indexOn": ["status", "last_heartbeat"]
       },
       "messages": {
         ".indexOn": ["timestamp", "from", "to"]
       }
     }
   }
   ```

## Security Setup

### Development Mode (Default)

Low security for local testing:

```bash
# No authentication required
REQUIRE_AUTH=false

# Local network only
MCP_HOST=127.0.0.1

# Basic firewall (Ubuntu/Debian)
sudo ufw allow from 192.168.0.0/16 to any port 8080
```

### Production Mode

High security for deployment:

#### 1. Enable Authentication

```bash
# Generate secure API key
export SARTOR_API_KEY=$(openssl rand -base64 32)

# Enable authentication
export REQUIRE_AUTH=true

# Save to .env
echo "SARTOR_API_KEY=$SARTOR_API_KEY" >> .env
echo "REQUIRE_AUTH=true" >> .env
```

#### 2. Configure SSL/TLS

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Or use Let's Encrypt (production)
sudo certbot certonly --standalone -d mcp.yourdomain.com

# Update configuration
MCP_SSL_CERT=/path/to/cert.pem
MCP_SSL_KEY=/path/to/key.pem
```

#### 3. Set Up Firewall

```bash
# Ubuntu/Debian with UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 8080/tcp
sudo ufw enable

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# iptables (generic)
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4
```

#### 4. Rate Limiting

```nginx
# Nginx reverse proxy with rate limiting
limit_req_zone $binary_remote_addr zone=mcp:10m rate=10r/s;

server {
    listen 443 ssl http2;
    server_name mcp.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /mcp {
        limit_req zone=mcp burst=20 nodelay;

        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. Monitoring & Alerts

```bash
# Set up monitoring
cat > monitor.sh << 'EOF'
#!/bin/bash
URL="http://localhost:8080/mcp/health"
WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

if ! curl -f -s $URL > /dev/null; then
    curl -X POST $WEBHOOK -H 'Content-Type: application/json' \
         -d '{"text":"⚠️ MCP Server is down!"}'
fi
EOF

chmod +x monitor.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /path/to/monitor.sh
```

## Verification

### Step 1: Check Server Status

```bash
# Check if server is running
curl http://localhost:8080/mcp/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 120,
  "connections": 0,
  "tools": 22
}
```

### Step 2: Run Validation Script

```bash
python mcp/validate_installation.py

# Expected output:
✅ Python version: 3.10.6
✅ All dependencies installed
✅ MCP files present
✅ Gateway client imports successfully
✅ Network connectivity OK
✅ Test structure intact
✅ Server responding at http://localhost:8080

🎉 Installation validated successfully!
```

### Step 3: Test Agent Connection

```bash
python mcp/test_gateway.py

# Expected output:
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

### Step 4: Connect First Agent

```python
# test_connection.py
from mcp.gateway_client import GatewayClient
import asyncio

async def test():
    client = GatewayClient()
    if await client.connect():
        print(f"✅ Connected! Agent ID: {client.identity.id}")

        # List available tools
        print(f"📦 {len(client.tools)} tools available")

        # Send test message
        result = await client.send_message("broadcast", "Hello Network!")
        print(f"📨 Message sent: {result}")

    await client.disconnect()

asyncio.run(test())
```

## Troubleshooting

### Common Issues and Solutions

#### Server Won't Start

**Error**: `Address already in use`

```bash
# Find process using port
lsof -i :8080
# or
netstat -tulpn | grep 8080

# Kill existing process
kill -9 <PID>

# Or use different port
MCP_PORT=8081 python mcp/mcp_server.py
```

**Error**: `ModuleNotFoundError`

```bash
# Reinstall dependencies
pip install -r mcp/requirements-complete.txt

# Or use bootstrap
python3 mcp/bootstrap.py
```

#### Connection Issues

**Error**: `Connection refused`

```bash
# Check server is running
ps aux | grep mcp_server

# Check firewall
sudo ufw status
sudo iptables -L

# Test locally first
curl http://localhost:8080/mcp/health
```

**Error**: `WebSocket connection failed`

```bash
# Enable debug logging
export MCP_LOG_LEVEL=DEBUG
python mcp/mcp_server.py

# Test WebSocket directly
python -c "
import asyncio
import websockets

async def test():
    uri = 'ws://localhost:8080/mcp'
    async with websockets.connect(uri) as ws:
        await ws.send('{\"type\": \"ping\"}')
        response = await ws.recv()
        print(f'Response: {response}')

asyncio.run(test())
"
```

#### Performance Issues

**Symptom**: Slow response times

```bash
# Check system resources
top
free -h
df -h

# Check server metrics
curl http://localhost:8080/mcp/metrics

# Increase worker threads
export WORKER_THREADS=8
```

**Symptom**: Memory leak

```bash
# Monitor memory usage
watch -n 1 'ps aux | grep mcp_server'

# Enable memory profiling
python -m memory_profiler mcp/mcp_server.py
```

### Debug Mode

Enable comprehensive debugging:

```bash
# Set all debug flags
export MCP_LOG_LEVEL=DEBUG
export MCP_DEBUG_WEBSOCKET=true
export MCP_DEBUG_TOOLS=true
export MCP_TRACE_MESSAGES=true

# Start with verbose output
python -u mcp/mcp_server.py 2>&1 | tee debug.log
```

## Rollback Procedures

### Quick Rollback (< 5 minutes)

1. **Stop current server**:

   ```bash
   # Find and kill process
   pkill -f mcp_server

   # Or stop service
   sudo systemctl stop mcp-gateway
   ```

2. **Restore previous version**:

   ```bash
   # Using git
   git checkout <previous-commit>

   # Or restore backup
   mv claude-network claude-network.broken
   tar -xzf claude-network-backup.tar.gz
   ```

3. **Restart with previous version**:
   ```bash
   cd claude-network
   python mcp/mcp_server.py
   ```

### Full Rollback with Data

1. **Create backup before changes**:

   ```bash
   # Backup code and config
   tar -czf backup-$(date +%Y%m%d).tar.gz claude-network/

   # Backup Firebase data (if used)
   firebase database:get / > firebase-backup.json
   ```

2. **Document current state**:

   ```bash
   # Save configuration
   cp .env .env.backup
   cp config.yaml config.yaml.backup

   # Note connected agents
   curl http://localhost:8080/mcp/agents > agents.json
   ```

3. **Rollback procedure**:

   ```bash
   # Stop all services
   docker-compose down  # if using Docker
   pkill -f mcp_server  # if running directly

   # Restore from backup
   rm -rf claude-network
   tar -xzf backup-YYYYMMDD.tar.gz

   # Restore configuration
   cp .env.backup .env
   cp config.yaml.backup config.yaml

   # Restore Firebase data
   firebase database:set / firebase-backup.json

   # Restart services
   python mcp/mcp_server.py
   ```

### Emergency Recovery

If system is completely broken:

```bash
# Fresh install from repository
git clone https://github.com/alto84/Sartor-claude-network.git claude-network-emergency
cd claude-network-emergency

# Minimal configuration
cat > .env << EOF
MCP_HOST=127.0.0.1
MCP_PORT=8080
REQUIRE_AUTH=false
EOF

# Quick start
python3 claude-network/mcp/bootstrap.py
```

## Maintenance

### Daily Tasks

1. **Check health**:

   ```bash
   curl http://localhost:8080/mcp/health
   ```

2. **Review logs**:

   ```bash
   tail -f logs/mcp_server.log
   ```

3. **Monitor connections**:
   ```bash
   watch 'curl -s http://localhost:8080/mcp/metrics | jq .connections'
   ```

### Weekly Tasks

1. **Backup configuration**:

   ```bash
   tar -czf weekly-backup-$(date +%Y%m%d).tar.gz config/ .env
   ```

2. **Check for updates**:

   ```bash
   git fetch origin
   git log HEAD..origin/main --oneline
   ```

3. **Review performance**:
   ```bash
   # Generate report
   python scripts/performance_report.py --days 7
   ```

### Monthly Tasks

1. **Update dependencies**:

   ```bash
   pip list --outdated
   pip install --upgrade -r requirements-complete.txt
   ```

2. **Rotate logs**:

   ```bash
   # Archive old logs
   tar -czf logs-$(date +%Y%m).tar.gz logs/*.log
   rm logs/*.log
   ```

3. **Security audit**:

   ```bash
   # Check for vulnerabilities
   pip install safety
   safety check

   # Review access logs
   grep "auth_failed" logs/*.log
   ```

### Monitoring Script

Create `monitor_mcp.sh`:

```bash
#!/bin/bash
# MCP Gateway Monitoring Script

URL="http://localhost:8080/mcp/health"
LOG="/var/log/mcp_monitor.log"
ALERT_EMAIL="admin@example.com"

# Check health
RESPONSE=$(curl -s -w "\n%{http_code}" $URL)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date)] ERROR: Server returned $HTTP_CODE" >> $LOG
    echo "MCP Gateway is down! HTTP $HTTP_CODE" | mail -s "MCP Alert" $ALERT_EMAIL

    # Attempt restart
    systemctl restart mcp-gateway
    sleep 10

    # Check again
    if curl -f -s $URL > /dev/null; then
        echo "[$(date)] INFO: Successfully restarted" >> $LOG
    else
        echo "[$(date)] CRITICAL: Restart failed" >> $LOG
    fi
else
    # Parse JSON response
    STATUS=$(echo "$BODY" | jq -r '.status')
    CONNECTIONS=$(echo "$BODY" | jq -r '.connections')

    echo "[$(date)] OK: Status=$STATUS, Connections=$CONNECTIONS" >> $LOG

    # Alert if too many connections
    if [ "$CONNECTIONS" -gt 90 ]; then
        echo "Warning: High connection count: $CONNECTIONS" | mail -s "MCP Warning" $ALERT_EMAIL
    fi
fi
```

### Systemd Service

Create `/etc/systemd/system/mcp-gateway.service`:

```ini
[Unit]
Description=MCP Gateway Server
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=5
User=mcp
Group=mcp
WorkingDirectory=/opt/claude-network
ExecStart=/usr/bin/python3 /opt/claude-network/mcp/mcp_server.py
StandardOutput=append:/var/log/mcp-gateway.log
StandardError=append:/var/log/mcp-gateway.error.log
Environment="MCP_HOST=0.0.0.0"
Environment="MCP_PORT=8080"
EnvironmentFile=/opt/claude-network/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mcp-gateway
sudo systemctl start mcp-gateway
sudo systemctl status mcp-gateway
```

## Support Resources

### Documentation

- [Quick Start Guide](QUICK-START-MCP.md)
- [System Overview](mcp/MCP-SYSTEM-OVERVIEW.md)
- [API Reference](mcp/MCP-TOOLS-SPEC.md)
- [Architecture Documentation](CLAUDE.md)

### Getting Help

1. Check server logs: `logs/mcp_server.log`
2. Run diagnostics: `python mcp/validate_installation.py`
3. Test reports: `mcp/tests/*-TEST-REPORT.md`
4. GitHub Issues: https://github.com/alto84/Sartor-claude-network/issues

### Community

- Discord: [Join Server](https://discord.gg/claude-network)
- Forum: https://forum.claude-network.org
- Email: support@claude-network.org

---

**Deployment Checklist**

- [ ] Prerequisites verified
- [ ] Installation method chosen
- [ ] Server installed and started
- [ ] Configuration completed
- [ ] Security configured
- [ ] First agent connected
- [ ] Monitoring set up
- [ ] Backup procedure tested
- [ ] Documentation bookmarked

---

_Last Updated: 2025-11-03_
_MCP Gateway Version: 1.0.0_
_Documentation Version: 1.0_
