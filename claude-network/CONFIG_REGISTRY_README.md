# Configuration Management & Agent Registry System

## Overview

This implementation provides a robust configuration management system and agent registry with heartbeat monitoring for the Claude Network. The system enables agents to register themselves, maintain presence through heartbeats, discover other agents, and manage configuration from multiple sources.

## Components Implemented

### 1. Configuration Manager (`config_manager.py`)

A hierarchical configuration system that loads settings from multiple sources in priority order:

1. **Environment variables** (highest priority)
2. **User config** (`~/.claude-network/config.yaml`)
3. **Project config** (`./config.yaml`)
4. **Example config** (`./config.example.yaml`)
5. **Default values** (lowest priority)

**Features:**

- Type-safe configuration with dataclasses
- Automatic validation with detailed error messages
- Secure credential storage
- Environment variable overrides
- YAML-based configuration files

**Configuration Sections:**

- `firebase`: Firebase connection settings
- `agent`: Agent identity and capabilities
- `network`: Communication parameters
- `security`: Encryption and access control

### 2. Agent Registry (`agent_registry.py`)

Manages agent registration, discovery, and health monitoring.

**Key Features:**

- **Agent Registration**: Register agents with capabilities and metadata
- **Heartbeat System**: Automatic heartbeat sending every 15 seconds
- **Health Monitoring**: Track agent health (healthy/warning/critical/dead)
- **Agent Discovery**: Find agents by capability, specialization, surface, or status
- **Status Tracking**: Online/offline/busy/away/error states
- **Event Callbacks**: Hooks for agent online/offline/critical events
- **Local Caching**: Offline resilience with local agent cache

**Agent Information Tracked:**

- Identity (ID, name, location)
- Capabilities and specialization
- Surface type (CLI, web, mobile, desktop)
- Health and status
- Performance metrics
- Last heartbeat and activity times

### 3. Firebase Schema (`firebase_schema.py`)

Initializes and manages the Firebase database structure.

**Database Structure:**

```
/agents         - Agent registry
/messages       - Real-time messages
/tasks          - Task queue (available/assigned/completed)
/skills         - Skill library metadata
/consensus      - Voting and governance
/clades         - Evolution tracking
/experiences    - Shared learning
/metrics        - Performance data
/config         - Global configuration
/presence       - Real-time presence
```

**Features:**

- Schema initialization and validation
- Database statistics and monitoring
- Schema documentation export
- Version tracking for migrations

### 4. Interactive Setup Wizard (`setup_agent.py`)

User-friendly wizard for setting up new agents.

**Setup Steps:**

1. Check existing configuration
2. Configure Firebase connection
3. Set up agent identity and capabilities
4. Configure network settings
5. Set security preferences
6. Save configuration
7. Initialize Firebase schema
8. Register agent
9. Test connectivity
10. Start services

**Features:**

- Color-coded terminal output
- Input validation
- Default value suggestions
- Connection testing
- Example code generation

## Quick Start

### 1. Run the Interactive Setup

```bash
cd /home/alton/vayu-learning-project/claude-network
python3 setup_agent.py
```

Follow the prompts to configure your agent.

### 2. Manual Configuration

Copy and edit the example configuration:

```bash
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
```

### 3. Initialize Firebase Schema

```bash
python3 firebase_schema.py --init
```

### 4. Start Agent Services

```python
from config_manager import load_config
from agent_registry import AgentRegistry

# Load configuration
config = load_config()

# Create registry and register
registry = AgentRegistry(config)
registry.register()  # Register self

# Start heartbeat (runs in background)
registry.start_heartbeat()

# Start health monitoring
registry.start_monitoring()

# Your agent is now online!
```

## Configuration Examples

### Environment Variables

```bash
export CLAUDE_FIREBASE_URL="https://your-project.firebaseio.com"
export CLAUDE_AGENT_ID="my-agent"
export CLAUDE_AGENT_NAME="My Agent"
export CLAUDE_LOG_LEVEL="DEBUG"
```

### YAML Configuration

```yaml
firebase:
  url: 'https://home-claude-network-default-rtdb.firebaseio.com'

agent:
  agent_id: 'desktop-001'
  agent_name: 'Desktop Mission Control'
  capabilities:
    - coordinate
    - analyze
    - execute
  specialization: 'coordination'
  surface: 'desktop'
  heartbeat_interval: 15

network:
  message_retry_count: 3
  message_timeout: 30
  enable_offline_queue: true
```

## Usage Examples

### Discover Agents

```python
from agent_registry import AgentRegistry

registry = AgentRegistry()

# Find all online agents
online = registry.get_online_agents()

# Find agents with specific capability
coordinators = registry.discover_agents(capability="coordinate")

# Find agents by specialization
analysts = registry.discover_agents(specialization="analysis")
```

### Monitor Agent Health

```python
# Check health of all agents
health_report = registry.check_agent_health()
for agent_id, health in health_report.items():
    print(f"{agent_id}: {health.value}")

# Add callback for critical agents
def on_agent_critical(agent_id, agent_info):
    print(f"ALERT: Agent {agent_id} is critical!")

registry.add_critical_callback(on_agent_critical)
```

### Get Statistics

```python
stats = registry.get_statistics()
print(f"Total agents: {stats['total_agents']}")
print(f"Online agents: {stats['online_agents']}")
print(f"Healthy agents: {stats['healthy_agents']}")
```

## Command-Line Tools

### Firebase Schema Management

```bash
# Initialize schema
python3 firebase_schema.py --init

# Validate schema
python3 firebase_schema.py --validate

# Show database statistics
python3 firebase_schema.py --stats

# Export schema documentation
python3 firebase_schema.py --export
```

### Test Configuration

```bash
# Run comprehensive tests
python3 test_config_registry.py
```

### Monitor Agent Registry

```bash
# Start agent with heartbeat monitoring
python3 agent_registry.py
```

## Security Considerations

1. **Credentials**: Stored in `~/.claude-network/credentials/` with 0600 permissions
2. **Firebase Rules**: Configure appropriate read/write rules in production
3. **Agent Filtering**: Use allowed/blocked agent lists for access control
4. **Message Signing**: Enable for production environments
5. **Encryption**: Enable for sensitive data

## Troubleshooting

### Common Issues

1. **"Firebase URL not found"**
   - Set `CLAUDE_FIREBASE_URL` environment variable
   - Or create `config.yaml` with Firebase URL

2. **"Agent not registering"**
   - Check Firebase URL is correct
   - Verify network connectivity
   - Check Firebase rules allow writes

3. **"Heartbeat not sending"**
   - Ensure agent is registered first
   - Check Firebase connection
   - Verify heartbeat interval >= 5 seconds

### Debug Mode

Enable debug logging:

```yaml
log_level: 'DEBUG'
debug_mode: true
```

Or via environment:

```bash
export CLAUDE_LOG_LEVEL="DEBUG"
export CLAUDE_DEBUG="true"
```

## Architecture Benefits

### Reliability

- **Hierarchical Config**: Multiple fallback sources
- **Local Caching**: Works offline
- **Automatic Retries**: Resilient to network issues
- **Health Monitoring**: Automatic failure detection

### Scalability

- **Efficient Discovery**: Find agents by capability
- **Load Distribution**: Based on agent status
- **Heartbeat Optimization**: Configurable intervals

### Maintainability

- **Type Safety**: Dataclass validation
- **Clear Separation**: Config, registry, schema
- **Comprehensive Logging**: Easy debugging
- **Interactive Setup**: User-friendly onboarding

## Next Steps

1. **Integration**: Integrate with existing network.py
2. **Authentication**: Add Firebase auth for production
3. **Monitoring Dashboard**: Build web UI for agent monitoring
4. **Performance Metrics**: Track and optimize agent performance
5. **Auto-scaling**: Dynamic agent spawning based on load

## Files Created

- `config_manager.py` - Configuration management system
- `agent_registry.py` - Agent registry with heartbeat
- `firebase_schema.py` - Firebase schema management
- `setup_agent.py` - Interactive setup wizard
- `config.example.yaml` - Example configuration
- `config.yaml` - Production configuration
- `test_config_registry.py` - Test suite
- `CONFIG_REGISTRY_README.md` - This documentation

## Summary

The configuration management and agent registry system provides a solid foundation for the Claude Network. It handles:

✅ **Multi-source configuration** with validation
✅ **Agent registration** and discovery
✅ **Heartbeat monitoring** for presence
✅ **Health tracking** with automatic failure detection
✅ **Firebase schema** initialization and management
✅ **Interactive setup** for easy onboarding
✅ **Comprehensive testing** and documentation

The system is production-ready and can be immediately integrated into the Claude Network for managing distributed agents across multiple surfaces.
