# Simulate an MCP client connection to the native host pipe
# This tests the exact same connection that Claude Code's MCP process does
$pipeName = "claude-mcp-browser-bridge-alton"

Write-Host "=== MCP Handshake Test ==="
Write-Host "Connecting to pipe: $pipeName"

try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(5000)
    Write-Host "Connected!"

    # The MCP protocol: 4-byte LE length prefix + JSON
    # Send an MCP initialize request
    $initMsg = @{
        jsonrpc = "2.0"
        id = 1
        method = "initialize"
        params = @{
            protocolVersion = "2024-11-05"
            capabilities = @{}
            clientInfo = @{
                name = "test-mcp-client"
                version = "0.1"
            }
        }
    } | ConvertTo-Json -Depth 5 -Compress

    $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($initMsg)
    $lenBytes = [BitConverter]::GetBytes([uint32]$msgBytes.Length)

    Write-Host "Sending init message ($($msgBytes.Length) bytes)..."
    $pipe.Write($lenBytes, 0, 4)
    $pipe.Write($msgBytes, 0, $msgBytes.Length)
    $pipe.Flush()
    Write-Host "Sent!"

    # Try to read response (4-byte length prefix + JSON)
    Write-Host "Reading response..."
    $readTimeout = 5000
    $pipe.ReadTimeout = $readTimeout

    try {
        $respLenBuf = New-Object byte[] 4
        $bytesRead = $pipe.Read($respLenBuf, 0, 4)
        if ($bytesRead -eq 4) {
            $respLen = [BitConverter]::ToUInt32($respLenBuf, 0)
            Write-Host "Response length: $respLen bytes"

            $respBuf = New-Object byte[] $respLen
            $totalRead = 0
            while ($totalRead -lt $respLen) {
                $read = $pipe.Read($respBuf, $totalRead, $respLen - $totalRead)
                if ($read -eq 0) { break }
                $totalRead += $read
            }
            $respStr = [System.Text.Encoding]::UTF8.GetString($respBuf, 0, $totalRead)
            Write-Host "Response: $respStr"
        } elseif ($bytesRead -eq 0) {
            Write-Host "Server closed connection (0 bytes read)"
        } else {
            Write-Host "Partial read: $bytesRead bytes"
        }
    } catch {
        Write-Host "Read error: $($_.Exception.Message)"
        Write-Host "  (This might mean the server closed the connection)"
    }

    # Check if still connected
    Write-Host "Still connected: $($pipe.IsConnected)"
    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.GetType().Name): $($_.Exception.Message)"
}

# Check log after test
Write-Host ""
Write-Host "=== Log after test ==="
$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logFile) {
    $info = Get-Item $logFile
    Write-Host "Size: $($info.Length) bytes"
    if ($info.Length -gt 5) {
        Get-Content $logFile -Tail 5
    }
}
