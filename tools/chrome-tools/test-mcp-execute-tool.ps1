# Test the correct MCP protocol: method="execute_tool", params.tool="<tool_name>"
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
    param([System.IO.Pipes.NamedPipeClientStream]$Pipe, [int]$TimeoutMs = 15000)
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
            if ($bytes -eq 0) { return "[connection closed mid-body]" }
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

Write-Host "=== Testing execute_tool protocol ==="

# Test 1: tabs_context_mcp
Write-Host ""
Write-Host "--- Test 1: tabs_context_mcp ---"
try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(5000)

    # Correct format: method="execute_tool", params.tool="tabs_context_mcp", params.args={}
    $msg = @{
        jsonrpc = "2.0"
        id = 1
        method = "execute_tool"
        params = @{
            tool = "tabs_context_mcp"
            args = @{
                createIfEmpty = $true
            }
        }
    } | ConvertTo-Json -Depth 5 -Compress

    Write-Host "Sending: $msg"
    Send-PipeMessage -Pipe $pipe -JsonMessage $msg
    $resp = Read-PipeMessage -Pipe $pipe
    Write-Host "Response: $resp"
    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

# Test 2: screenshot
Write-Host ""
Write-Host "--- Test 2: screenshot ---"
try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(5000)

    $msg = @{
        jsonrpc = "2.0"
        id = 2
        method = "execute_tool"
        params = @{
            tool = "computer"
            args = @{
                action = "screenshot"
            }
        }
    } | ConvertTo-Json -Depth 5 -Compress

    Write-Host "Sending: $msg"
    Send-PipeMessage -Pipe $pipe -JsonMessage $msg
    $resp = Read-PipeMessage -Pipe $pipe -TimeoutMs 20000
    # Truncate response if it's a screenshot (base64 data)
    if ($resp.Length -gt 500) {
        Write-Host "Response (first 500 chars): $($resp.Substring(0, 500))..."
        Write-Host "Total response length: $($resp.Length)"
    } else {
        Write-Host "Response: $resp"
    }
    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
