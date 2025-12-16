# MCP Server for Sartor Claude Network

Production-grade Model Context Protocol (MCP) server implementation providing comprehensive tools for Claude agents to interact with the Sartor Claude Network infrastructure.

## Overview

This MCP server enables Claude agents to:
- **Interact with Firebase**: Read, write, query, and subscribe to real-time data
- **Access GitHub**: Read files, search code, view history, and navigate repositories
- **Onboard new agents**: Welcome messages, setup guides, and verification
- **Navigate the system**: Discover agents, skills, tasks, and system status

## Architecture

```
mcp/
├── server.py                  # Main MCP server with stdio transport
├── config.json               # Server configuration
├── MCP-SERVER-README.md      # This file
└── tools/                    # Tool implementations
    ├── __init__.py
    ├── firebase_tools.py     # Firebase operations
    ├── github_tools.py       # GitHub operations
    ├── onboarding_tools.py   # Onboarding assistance
    └── navigation_tools.py   # System navigation
```

## Features

### Firebase Tools (5 tools)
- `firebase.read` - Read data from Firebase Realtime Database
- `firebase.write` - Write/merge data to Firebase
- `firebase.delete` - Delete data from Firebase
- `firebase.query` - Complex queries with filters
- `firebase.subscribe` - Real-time subscriptions to data changes

### GitHub Tools (4 tools)
- `github.read_file` - Read files from repository
- `github.search` - Search code, issues, commits, and files
- `github.list_files` - List directory contents (recursive option)
- `github.get_history` - Get commit history for paths

### Onboarding Tools (4 tools)
- `onboarding.welcome` - Welcome message with setup info
- `onboarding.checklist` - Role-specific setup checklists
- `onboarding.setup_guide` - Detailed component setup guides
- `onboarding.verify_setup` - Verify agent configuration

### Navigation Tools (5 tools)
- `navigation.list_agents` - List all network agents
- `navigation.list_skills` - Discover available skills
- `navigation.list_tasks` - Browse tasks by status
- `navigation.get_status` - Overall system health
- `navigation.find_expert` - Find agents by capability

**Total: 18 production-ready MCP tools**

## Installation

### Prerequisites
- Python 3.10+
- Access to Firebase Realtime Database
- Access to GitHub repository (optional token for private repos)

### Setup

1. **Install dependencies**:
```bash
cd /home/alton/vayu-learning-project/claude-network
pip install -r requirements.txt
```

2. **Configure the server**:
Edit `mcp/config.json` to set your Firebase URL, GitHub repo, and other settings.

3. **Set environment variables** (optional):
```bash
# For GitHub private repos or higher rate limits
export GITHUB_TOKEN="your-github-token"

# For MACS message signing
export MACS_SHARED_SECRET="your-secret-key"
```

## Running the Server

### Standalone Mode
```bash
python mcp/server.py
```

### With Configuration File
```bash
python mcp/server.py --config /path/to/config.json
```

### Debug Mode
```bash
python mcp/server.py --debug
```

### As MCP Server (for Claude)
The server uses stdio transport and can be integrated with Claude Code or other MCP clients:

```json
{
  "mcpServers": {
    "sartor-network": {
      "command": "python",
      "args": ["/home/alton/vayu-learning-project/claude-network/mcp/server.py"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Usage Examples

### Firebase Operations

**Read data**:
```json
{
  "tool": "firebase.read",
  "arguments": {
    "path": "agents/desktop-mission-control"
  }
}
```

**Write data**:
```json
{
  "tool": "firebase.write",
  "arguments": {
    "path": "agents/new-agent",
    "data": {
      "name": "Worker Agent",
      "status": "online",
      "capabilities": ["execution", "analysis"]
    }
  }
}
```

**Query with filters**:
```json
{
  "tool": "firebase.query",
  "arguments": {
    "path": "tasks/available",
    "filters": [
      {
        "field": "priority",
        "operator": "==",
        "value": "high"
      }
    ],
    "limit": 10
  }
}
```

### GitHub Operations

**Read a file**:
```json
{
  "tool": "github.read_file",
  "arguments": {
    "path": "claude-network/MASTER-PLAN.md"
  }
}
```

**Search code**:
```json
{
  "tool": "github.search",
  "arguments": {
    "query": "MACSProtocol",
    "type": "code"
  }
}
```

### Onboarding Operations

**Welcome new agent**:
```json
{
  "tool": "onboarding.welcome",
  "arguments": {
    "agent_name": "Worker Alpha",
    "surface": "cli"
  }
}
```

### Navigation Operations

**List agents**:
```json
{
  "tool": "navigation.list_agents",
  "arguments": {
    "status": "online"
  }
}
```

**Get system status**:
```json
{
  "tool": "navigation.get_status",
  "arguments": {
    "include_metrics": true
  }
}
```

## Integration with Existing Code

The MCP server integrates with existing Claude Network components:
- `config_manager.py` - Configuration loading
- `macs.py` - MACS communication protocol
- `firebase_schema.py` - Firebase database schema
- `agent_registry.py` - Agent registration
- `task_manager.py` - Task management
- `skill_engine.py` - Skill execution

## Security

### Authentication
- Message signing via MACS protocol
- Optional GitHub token for private repos
- Environment variable-based secrets

### Rate Limiting
- Configurable requests per minute/hour
- Burst protection

### Input Validation
- JSON schema validation for all tools
- Path sanitization
- Size limits on requests/responses

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/alto84/Sartor-claude-network/issues
- Documentation: `/claude-network/CLAUDE.md`
- Master Plan: `/claude-network/MASTER-PLAN.md`

## Version History

- **1.0.0** (2025-11-03): Initial production release
  - 18 MCP tools across 4 categories
  - Stdio transport implementation
  - Comprehensive error handling
  - Integration with existing network components

---

**Built for the Sartor Claude Network** - A self-improving multi-agent community system.