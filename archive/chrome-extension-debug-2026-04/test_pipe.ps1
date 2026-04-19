# Try to connect to the named pipe and see what happens
Write-Host "=== Testing pipe connection ==="

$pipeName = "claude-mcp-browser-bridge-alton"
if (-not (Test-Path "\\.\pipe\$pipeName")) {
    Write-Host "Pipe does not exist!"
    exit
}

Write-Host "Pipe exists, attempting connection..."
try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(5000)
    Write-Host "Connected to pipe!"
    Write-Host "  IsConnected: $($pipe.IsConnected)"

    # Wait briefly then check if still connected
    Start-Sleep -Milliseconds 500
    Write-Host "  Still connected after 500ms: $($pipe.IsConnected)"

    # Try sending a minimal JSON-RPC init message (like MCP would)
    $initMsg = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
    $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($initMsg)

    # Write length prefix (4 bytes LE) then message
    $lenBytes = [BitConverter]::GetBytes([uint32]$msgBytes.Length)
    $pipe.Write($lenBytes, 0, 4)
    $pipe.Write($msgBytes, 0, $msgBytes.Length)
    $pipe.Flush()
    Write-Host "  Sent init message ($($msgBytes.Length) bytes)"

    # Try to read response
    Start-Sleep -Milliseconds 2000
    Write-Host "  Still connected after send: $($pipe.IsConnected)"

    $pipe.Close()
    $pipe.Dispose()
    Write-Host "Closed"
} catch {
    Write-Host "Error: $($_.Exception.GetType().Name): $($_.Exception.Message)"
}

# Check log after our test
Write-Host ""
Write-Host "=== Log after test ==="
$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logFile) {
    $info = Get-Item $logFile
    Write-Host "Log size: $($info.Length) bytes, Modified: $($info.LastWriteTime)"
    if ($info.Length -gt 5) {
        Get-Content $logFile -Tail 10
    }
}
