# MCP Server Development Skill

A comprehensive skill for building Model Context Protocol (MCP) servers, extracted from real working implementations.

## Quick Start

1. **Read the main skill**: Start with `SKILL.md` for overview and core patterns
2. **Check examples**: Review `examples/real-tools.md` for complete working examples
3. **Use templates**: Copy `templates/basic-mcp-server.ts` to start your server
4. **Test your server**: Run `scripts/test-mcp-server.sh path/to/your/server.js`

## File Structure

```
mcp-server-development/
├── SKILL.md                          # Main skill documentation
├── README.md                         # This file
├── templates/
│   ├── basic-mcp-server.ts          # Minimal working MCP server
│   ├── tool-implementations.md      # Tool pattern examples
│   ├── package.json                 # Node.js package template
│   └── tsconfig.json                # TypeScript configuration
├── scripts/
│   └── test-mcp-server.sh           # Server testing script
├── reference/
│   ├── mcp-protocol-spec.md         # Protocol details from real servers
│   ├── common-patterns.md           # Recurring implementation patterns
│   └── debugging-guide.md           # Troubleshooting guide
└── examples/
    └── real-tools.md                # 5 complete tool implementations
```

## What's Included

### Core Patterns

- **Server initialization**: Setting up MCP server with stdio transport
- **Tool definition**: JSON schemas and handler patterns
- **Error handling**: Try-catch, validation, retries, circuit breakers
- **Plugin architecture**: Extensible server design
- **Caching**: Performance optimization patterns
- **Rate limiting**: API protection strategies
- **Logging**: Structured logging for debugging
- **Testing**: Unit and integration test patterns
- **Memory MCP Integration**: Multi-tier memory system exposure (NEW)
- **HTTP Transport**: Agent-to-agent communication via HTTP (NEW)
- **Bootstrap Mesh**: Multi-source memory access with fallback (NEW)

### Real Examples

All examples extracted from working servers:

1. **Literature Search** (research-mcp-server): Multi-source search with filtering
2. **Agent Launch** (claude-code-mcp-server): Process management and stdio
3. **Health Check** (research-mcp-server): Server status monitoring
4. **Echo Tool** (template): Simple connectivity test
5. **Calculate Tool** (template): Parameter validation demo

### Templates

- **basic-mcp-server.ts**: Complete runnable server (~250 lines)
- **package.json**: Ready-to-use package configuration
- **tsconfig.json**: TypeScript settings for MCP servers

### Testing

- **test-mcp-server.sh**: Automated testing script
  - Server startup validation
  - Tool listing check
  - Tool invocation test
  - Error handling verification
  - Stdio protocol integrity check

## Getting Started with a New MCP Server

### 1. Copy the Template

```bash
mkdir my-mcp-server
cd my-mcp-server
cp ~/.claude/skills/mcp-server-development/templates/package.json .
cp ~/.claude/skills/mcp-server-development/templates/tsconfig.json .
mkdir src
cp ~/.claude/skills/mcp-server-development/templates/basic-mcp-server.ts src/index.ts
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Customize Your Server

Edit `src/index.ts`:
- Change server name and version
- Add your tools to the tools array
- Implement tool handlers

### 4. Build and Test

```bash
npm run build
~/.claude/skills/mcp-server-development/scripts/test-mcp-server.sh dist/index.js
```

### 5. Test Interactively

```bash
npm run inspector
```

## Common Use Cases

### Building a Simple MCP Server

Start with `templates/basic-mcp-server.ts`. It includes:
- Two working tools (echo, calculate)
- Proper error handling
- Stdio transport setup
- Graceful shutdown

### Adding Tools

See `templates/tool-implementations.md` for patterns:
- Simple data retrieval
- Search with filters
- Process orchestration
- Multi-step analysis

### Implementing Plugins

Check `reference/common-patterns.md` for:
- Plugin architecture
- Plugin manager implementation
- Service layer patterns

### Debugging Issues

Refer to `reference/debugging-guide.md` for:
- Common error solutions
- Stdio protocol troubleshooting
- Performance profiling
- Memory leak detection

## Sources

This skill is based on actual working MCP servers:

1. **claude-code-mcp-server** (/home/alton/claude-code-mcp-server/)
   - Orchestrator pattern for managing multiple Claude Code agents
   - Process lifecycle management
   - Resource exposure pattern
   - SDK version: 1.0.4

2. **research-mcp-server** (/home/alton/research-mcp-server/)
   - Plugin-based architecture
   - Multi-source search aggregation
   - Caching and rate limiting
   - SDK version: 0.5.0

3. **MCP protocol utilities** (/home/alton/mcp_*.js)
   - Communication patterns
   - Agent coordination examples

4. **Sartor Memory MCP System** (/home/alton/Sartor-claude-network/src/mcp/)
   - Multi-tier memory storage (Firebase/File/GitHub)
   - HTTP transport for agent access
   - Bootstrap mesh with automatic fallback
   - Refinement trace and expert consensus tools
   - Session-based HTTP client
   - SDK version: Latest (2024-11-05 protocol)

## Evidence-Based Approach

This skill follows evidence-based development principles:

**What we know works**:
- Stdio transport with @modelcontextprotocol/sdk
- HTTP transport with StreamableHTTPServerTransport
- JSON-RPC 2.0 message format
- Tool and resource patterns shown
- Error handling approaches demonstrated
- Multi-tier memory storage with automatic fallback
- Session management for HTTP clients
- Bootstrap mesh pattern for multi-source access

**What we don't claim**:
- WebSocket transport - not tested
- SDK versions outside 0.5.0 - latest range - may differ
- Capabilities beyond tools/resources - not observed
- Performance characteristics without measurement
- Vector search or semantic embeddings - not implemented

**Limitations stated**:
- All patterns are TypeScript/Node.js
- Based on four server implementations
- May need adaptation for specific use cases
- Memory system requires Firebase/GitHub config for full multi-tier

## Validation Checklist

Before deploying your MCP server:

- [ ] Server starts without errors
- [ ] All logging uses console.error (never console.log)
- [ ] Tool schemas match implementations
- [ ] All async operations have error handling
- [ ] Input validation on all parameters
- [ ] Graceful shutdown implemented
- [ ] Health check tool included
- [ ] Tested with MCP Inspector
- [ ] Integration tests passing
- [ ] No memory leaks in long-running tests

## Related Skills

- **Evidence-Based Validation**: Use when making claims about capabilities
- Other skills TBD

## Getting Help

When stuck:

1. Check `reference/debugging-guide.md` for common issues
2. Review `examples/real-tools.md` for working implementations
3. Test with `scripts/test-mcp-server.sh` to isolate problems
4. Use MCP Inspector for interactive debugging
5. Consult `reference/mcp-protocol-spec.md` for protocol details

## Contributing

This skill is based on real implementations. To improve it:

1. Extract patterns from additional working MCP servers
2. Document new tool patterns discovered
3. Add troubleshooting solutions from actual issues
4. Update protocol spec based on SDK changes
5. Always maintain evidence-based approach

## Version History

- **1.1.0** (2025-12-11): Memory MCP Integration Update
  - Added comprehensive Memory MCP integration patterns
  - Documented HTTP transport for agent-to-agent communication
  - Added Bootstrap Mesh multi-source memory access pattern
  - Included refinement trace and expert consensus tools
  - Referenced Sartor memory system implementation
  - Updated with session management and fallback strategies

- **1.0.0** (2025-01-17): Initial skill creation
  - Extracted from claude-code-mcp-server and research-mcp-server
  - Includes 5 complete tool examples
  - Automated testing script
  - Comprehensive debugging guide
