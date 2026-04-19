# Check the MCP process's network connections
Write-Host "=== MCP process (27964) TCP connections ==="
try {
    $conns = Get-NetTCPConnection -OwningProcess 27964 -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($c in $conns) {
            Write-Host "  $($c.LocalAddress):$($c.LocalPort) -> $($c.RemoteAddress):$($c.RemotePort) State=$($c.State)"
        }
    } else {
        Write-Host "  No TCP connections"
    }
} catch {
    Write-Host "  Error: $($_.Exception.Message)"
}

# Check pipe connections
Write-Host ""
Write-Host "=== Checking if MCP process has pipe handles ==="
# Use handle.exe if available, otherwise just check process info
$mcp = Get-Process -Id 27964 -ErrorAction SilentlyContinue
if ($mcp) {
    Write-Host "  HandleCount: $($mcp.HandleCount)"
    Write-Host "  Threads: $($mcp.Threads.Count)"
    Write-Host "  WorkingSet: $([math]::Round($mcp.WorkingSet64/1MB, 1)) MB"
    Write-Host "  StartTime: $($mcp.StartTime)"
} else {
    Write-Host "  Process 27964 not found!"
}

# Check if the native host's pipe is accepting connections
Write-Host ""
Write-Host "=== Quick pipe test ==="
try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", "claude-mcp-browser-bridge-alton", [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(2000)
    Write-Host "  Pipe connected OK"
    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "  Pipe connection failed: $($_.Exception.Message)"
}

# Check what socketPath the MCP server would compute
Write-Host ""
Write-Host "=== Expected socket paths ==="
# On Windows, the socket path pattern is "\\.\pipe\claude-mcp-browser-bridge-{username}"
$username = [System.Environment]::UserName
Write-Host "  \\.\pipe\claude-mcp-browser-bridge-$username"

# Also check if there's a Unix socket directory (shouldn't exist on Windows but just in case)
$xdgRuntime = $env:XDG_RUNTIME_DIR
$tmpDir = $env:TMPDIR
Write-Host "  XDG_RUNTIME_DIR: '$xdgRuntime'"
Write-Host "  TMPDIR: '$tmpDir'"
