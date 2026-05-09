# Test actual MCP tool calls through the native host bridge
$pipeName = "claude-mcp-browser-bridge-alton"

function Send-PipeMessage {
    param([System.IO.Pipes.NamedPipeClientStream]$Pipe, [string]$JsonMessage)
    $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($JsonMessage)
    $lenBytes = [BitConverter]::GetBytes([uint32]$msgBytes.Length)
    $Pipe.Write($lenBytes, 0, 4)
    $Pipe.Write($msgBytes, 0, $msgBytes.Length)
    $Pipe.Flush()
}

function Read-PipeMessage {
    param([System.IO.Pipes.NamedPipeClientStream]$Pipe, [int]$TimeoutMs = 10000)
    $cts = New-Object System.Threading.CancellationTokenSource($TimeoutMs)
    try {
        $lenBuf = New-Object byte[] 4
        $totalRead = 0
        while ($totalRead -lt 4) {
            $task = $Pipe.ReadAsync($lenBuf, $totalRead, 4 - $totalRead, $cts.Token)
            $task.Wait()
            $bytes = $task.Result
            if ($bytes -eq 0) { return "[connection closed]" }
            $totalRead += $bytes
        }
        $respLen = [BitConverter]::ToUInt32($lenBuf, 0)
        if ($respLen -eq 0 -or $respLen -gt 1000000) { return "[invalid length: $respLen]" }
        $bodyBuf = New-Object byte[] $respLen
        $bodyRead = 0
        while ($bodyRead -lt $respLen) {
            $task = $Pipe.ReadAsync($bodyBuf, $bodyRead, $respLen - $bodyRead, $cts.Token)
            $task.Wait()
            $bytes = $task.Result
            if ($bytes -eq 0) { return "[connection closed mid-body at $bodyRead/$respLen]" }
            $bodyRead += $bytes
        }
        return [System.Text.Encoding]::UTF8.GetString($bodyBuf, 0, $bodyRead)
    } catch {
        $inner = $_.Exception
        while ($inner.InnerException) { $inner = $inner.InnerException }
        return "[error: $($inner.GetType().Name): $($inner.Message)]"
    } finally {
        $cts.Dispose()
    }
}

Write-Host "=== Testing actual MCP tool calls ==="

# The MCP client sends messages with method+params, native host forwards to extension
# Let's try the actual tool methods the extension exposes

$tests = @(
    @{ method = "tabs_context_mcp"; params = @{ createIfEmpty = $true } },
    @{ method = "read_page"; params = @{ tabId = 1 } },
    @{ method = "get_page_text"; params = @{ tabId = 1 } }
)

foreach ($test in $tests) {
    Write-Host ""
    Write-Host "--- Method: $($test.method) ---"
    try {
        $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
        $pipe.Connect(5000)

        $msg = @{
            jsonrpc = "2.0"
            id = 1
            method = $test.method
            params = $test.params
        } | ConvertTo-Json -Depth 5 -Compress

        Write-Host "Sending: $msg"
        Send-PipeMessage -Pipe $pipe -JsonMessage $msg

        # The native host will forward this to Chrome extension as a tool_request
        # Chrome extension processes it and sends back a tool_response
        # Native host strips type and forwards to us
        $resp = Read-PipeMessage -Pipe $pipe -TimeoutMs 15000
        Write-Host "Response: $resp"

        $pipe.Close()
        $pipe.Dispose()
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}

# Also try keeping the connection open and sending multiple requests
Write-Host ""
Write-Host "=== Persistent connection test ==="
try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(5000)
    Write-Host "Connected"

    # Send tabs_context_mcp
    $msg1 = '{"jsonrpc":"2.0","id":1,"method":"tabs_context_mcp","params":{"createIfEmpty":true}}'
    Write-Host "Sending request 1..."
    Send-PipeMessage -Pipe $pipe -JsonMessage $msg1
    $resp1 = Read-PipeMessage -Pipe $pipe -TimeoutMs 15000
    Write-Host "Response 1: $resp1"

    if ($pipe.IsConnected) {
        Write-Host "Still connected after first request"
        # Try a second request
        $msg2 = '{"jsonrpc":"2.0","id":2,"method":"tabs_context_mcp","params":{}}'
        Write-Host "Sending request 2..."
        Send-PipeMessage -Pipe $pipe -JsonMessage $msg2
        $resp2 = Read-PipeMessage -Pipe $pipe -TimeoutMs 15000
        Write-Host "Response 2: $resp2"
    }

    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
