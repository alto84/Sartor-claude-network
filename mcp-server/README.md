# Sartor MCP Server

A Model Context Protocol (MCP) server that enables Claude.ai to remotely control a Windows system via ngrok.

## Features

- **Filesystem Access**: Read, write, list, and delete files in allowed directories
- **Shell Execution**: Run cmd.exe and PowerShell commands
- **SSH Connectivity**: Execute commands on gpuserver1 via SSH
- **HTTP Transport**: Designed to work with ngrok for remote access

## Prerequisites

- Node.js 18+
- npm or yarn
- ngrok (for remote access)
- SSH key configured for gpuserver1 (optional)

## Installation

```bash
cd C:\Users\alto8\Sartor-claude-network\mcp-server
npm install
```

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Server port (default: 3001)
PORT=3001

# SSH configuration for gpuserver1
SSH_HOST_GPUSERVER1=gpuserver1
SSH_PORT_GPUSERVER1=22
SSH_USER_GPUSERVER1=alto
SSH_KEY_GPUSERVER1=C:\Users\alto8\.ssh\id_rsa
```

### Allowed Directories

By default, the server allows access to these directories:
- `C:\Users\alto8`
- `C:\Users\alto8\Sartor-claude-network`
- `C:\Users\alto8\Documents`
- `C:\Users\alto8\Downloads`
- `C:\Projects`

Modify the `ALLOWED_DIRECTORIES` array in `src/index.ts` to change this.

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## Exposing via ngrok

1. Start the MCP server:
   ```bash
   npm start
   ```

2. In a separate terminal, start ngrok:
   ```bash
   ngrok http 3001
   ```

3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

4. Configure Claude.ai to use the MCP server at:
   ```
   https://abc123.ngrok.io/mcp
   ```

## Available Tools

### Filesystem Tools

| Tool | Description |
|------|-------------|
| `fs_read_file` | Read contents of a file |
| `fs_write_file` | Write content to a file |
| `fs_list_directory` | List directory contents (with optional recursion) |
| `fs_delete` | Delete a file or directory |
| `fs_mkdir` | Create a directory |

### Shell Tools

| Tool | Description |
|------|-------------|
| `shell_execute` | Execute a command (cmd.exe or PowerShell) |
| `shell_spawn` | Start a long-running background process |

### SSH Tools

| Tool | Description |
|------|-------------|
| `ssh_execute` | Execute a command on gpuserver1 |
| `ssh_check_connection` | Test SSH connectivity |

### System Tools

| Tool | Description |
|------|-------------|
| `system_info` | Get Windows system information |

## Security Considerations

1. **Path Restrictions**: Only allowed directories can be accessed
2. **Dangerous Commands**: Certain dangerous patterns are blocked (format, shutdown, etc.)
3. **Path Traversal Prevention**: Path normalization prevents `../` attacks
4. **ngrok Authentication**: Consider using ngrok's authentication features for production use

### Recommended ngrok Configuration

For better security, use ngrok with authentication:

```bash
# Basic auth
ngrok http 3001 --basic-auth="user:password"

# Or use ngrok's OAuth
ngrok http 3001 --oauth=google
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/mcp` | POST | MCP protocol endpoint |
| `/mcp` | GET | SSE stream for server messages |
| `/mcp` | DELETE | Close session |

## Connecting to Claude.ai

Once the server is running and exposed via ngrok:

1. Go to Claude.ai settings
2. Add a new MCP server
3. Enter the ngrok URL with `/mcp` endpoint
4. The server will appear with all available tools

## Troubleshooting

### SSH Connection Issues

1. Verify the SSH key exists:
   ```bash
   dir C:\Users\alto8\.ssh\id_rsa
   ```

2. Test SSH connectivity manually:
   ```bash
   ssh -i C:\Users\alto8\.ssh\id_rsa alto@gpuserver1
   ```

3. Ensure gpuserver1 is in your hosts file or resolvable

### Server Won't Start

1. Check if port 3001 is available:
   ```bash
   netstat -ano | findstr :3001
   ```

2. Kill any process using the port or change the PORT environment variable

### ngrok Issues

1. Ensure ngrok is authenticated:
   ```bash
   ngrok authtoken YOUR_TOKEN
   ```

2. Check ngrok dashboard for connection status

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## License

MIT
