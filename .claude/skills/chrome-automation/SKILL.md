# Chrome Browser Automation Skill

**Purpose:** Provide Chrome browser automation via Chrome DevTools Protocol (CDP) and/or the Claude-in-Chrome extension bridge.

## Overview

Two parallel approaches for Chrome automation:

### Approach 1: CDP Direct (Primary - Works on any machine)
Uses Chrome DevTools Protocol via WebSocket for direct browser control.
- Requires Chrome launched with `--remote-debugging-port`
- Full page interaction: navigate, screenshot, eval JS, click, type, find elements
- Works with any Chrome profile (temp profile recommended)

### Approach 2: Extension Bridge (Backup - Windows with Claude extension)
Uses the Claude-in-Chrome extension's named pipe bridge.
- Requires Chrome extension installed and native host running
- Protocol: 4-byte LE length prefix + JSON-RPC
- Method: `execute_tool` with `params.tool` and `params.args`

## CDP Quick Start

### Launch Automation Chrome (separate from user's browser)

```bash
# Windows
Start-Process "chrome.exe" -ArgumentList "--remote-debugging-port=9223", "--remote-allow-origins=*", "--user-data-dir=<temp-profile-path>", "--no-first-run"

# Linux
google-chrome --remote-debugging-port=9223 --remote-allow-origins=* --user-data-dir=/tmp/chrome-automation --no-first-run &
```

### List Tabs
```bash
curl -s http://localhost:9223/json | jq '.[].title'
```

### Navigate
```bash
# Get first tab's WebSocket URL
WS_URL=$(curl -s http://localhost:9223/json | jq -r '.[0].webSocketDebuggerUrl')
# Use CDP command via WebSocket
```

### Screenshot
```bash
# Via CDP: Page.captureScreenshot returns base64 PNG
```

## CDP Toolkit Scripts (PowerShell - Windows)

Located in `chrome-tools/` directory:

| Script | Purpose | Key Params |
|--------|---------|------------|
| `cdp-common.ps1` | Shared WebSocket CDP client | Dot-source in other scripts |
| `cdp-list-tabs.ps1` | List open tabs | None |
| `cdp-navigate.ps1` | Navigate to URL | `-Url`, `-TabId` |
| `cdp-eval.ps1` | Execute JavaScript | `-Expression`, `-TabId` |
| `cdp-screenshot.ps1` | Capture page | `-Output`, `-TabId` |
| `cdp-dom.ps1` | Get page text/HTML | `-Title`, `-Html` |
| `cdp-click.ps1` | Click element | `-Selector` or `-X -Y` |
| `cdp-type.ps1` | Type text | `-Text`, `-Selector` |
| `cdp-find.ps1` | Find elements | `-Selector`, `-Limit` |
| `cdp-new-tab.ps1` | Create new tab | `-Url` |

## Extension Bridge Protocol (Windows)

### Connection
```
Named pipe: \\.\pipe\claude-mcp-browser-bridge-<username>
Framing: 4-byte little-endian uint32 (message length) + UTF-8 JSON body
```

### Request Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "execute_tool",
  "params": {
    "tool": "tabs_context_mcp",
    "args": {"createIfEmpty": true}
  }
}
```

### Available Tools via Extension
- `tabs_context_mcp` - Get tab group context
- `tabs_create_mcp` - Create new tab
- `navigate` - Navigate tab to URL
- `computer` - Screenshot, click, type, scroll
- `read_page` - Get accessibility tree
- `find` - Find elements by description
- `get_page_text` - Extract page text
- `javascript_tool` - Execute JS in page
- `form_input` - Set form values

## Architecture Notes

- Chrome's default profile may block CDP port on some systems
- Use a temporary profile (`--user-data-dir`) for reliable CDP
- Both Chrome instances (main + automation) can run simultaneously
- CDP port 9223 recommended to avoid conflicts with other tools using 9222
- Extension bridge works alongside CDP - they are independent

## Multi-Monitor Screenshot Support

For capturing specific monitors or screen regions:

```powershell
# screenshot.ps1 -Monitor 0|1|2|all -Output path.png
# screenshot-region.ps1 -X 0 -Y 0 -Width 1920 -Height 1080
# click-at.ps1 -X 500 -Y 300
# type-text.ps1 -Text "hello"
# focus-chrome.ps1
```
