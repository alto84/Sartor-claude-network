# Setting Up ngrok for Claude.ai Web Access

This guide will help you expose the MCP server to Claude.ai so you can control this computer from the web.

## Step 1: Get an ngrok Account

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. After signing in, go to: https://dashboard.ngrok.com/get-started/your-authtoken
4. Copy your authtoken

## Step 2: Configure ngrok

Run this command (replace YOUR_AUTHTOKEN with your actual token):

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

Or create/edit `C:\Users\alto8\AppData\Local\ngrok\ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTHTOKEN_HERE
```

## Step 3: Start the MCP Server

```bash
cd C:\Users\alto8\Sartor-claude-network\mcp-server
npm start
```

The server runs on http://localhost:3001

## Step 4: Expose with ngrok

In a new terminal:

```bash
ngrok http 3001
```

You'll see output like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3001
```

Copy the `https://...ngrok-free.app` URL.

## Step 5: Connect to Claude.ai

1. Go to https://claude.ai
2. Click your profile icon → Settings → Connectors
3. Click "Add custom connector"
4. Paste your ngrok URL + `/mcp` (e.g., `https://abc123.ngrok-free.app/mcp`)
5. Click "Connect"

## Available Tools in Claude.ai

Once connected, you can ask Claude.ai to:

- **Read/write files** on this computer
- **Run shell commands** (PowerShell, cmd)
- **SSH into gpuserver1** and run commands
- **Get system information**

## Security Notes

- ngrok URLs change each time you restart (unless you have a paid plan with reserved domains)
- The MCP server restricts access to certain directories only
- Dangerous commands (format, shutdown, etc.) are blocked
- Keep your ngrok session running while using Claude.ai

## Quick Start Script

Use the batch file to start both server and ngrok:

```bash
start-with-ngrok.bat
```

## Troubleshooting

- **"Authtoken not found"**: Run `ngrok config add-authtoken YOUR_TOKEN`
- **"Port already in use"**: Kill existing node processes or use a different port
- **Connection refused**: Make sure the MCP server is running first
