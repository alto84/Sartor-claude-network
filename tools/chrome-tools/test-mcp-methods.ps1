# Test various method names against the native host to discover the protocol
$pipeName = "claude-mcp-browser-bridge-alton"

function Send-PipeMessage {
    param(
        [System.IO.Pipes.NamedPipeClientStream]$Pipe,
        [string]$JsonMessage
    )
    $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($JsonMessage)
    $lenBytes = [BitConverter]::GetBytes([uint32]$msgBytes.Length)
    $Pipe.Write($lenBytes, 0, 4)
    $Pipe.Write($msgBytes, 0, $msgBytes.Length)
    $Pipe.Flush()
}

function Read-PipeMessage {
    param(
        [System.IO.Pipes.NamedPipeClientStream]$Pipe,
        [int]$TimeoutMs = 5000
    )
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
        return "[timeout/error: $($_.Exception.InnerException.Message)]"
    } finally {
        $cts.Dispose()
    }
}

# Test various methods on separate connections
$methods = @(
    @{ method = "ping"; params = @{} },
    @{ method = "hello"; params = @{} },
    @{ method = "handshake"; params = @{} },
    @{ method = "connect"; params = @{} },
    @{ method = "tools/list"; params = @{} },
    @{ method = "list_tools"; params = @{} },
    @{ method = "execute"; params = @{ tool = "tabs_context_mcp" } },
    @{ method = "call_tool"; params = @{ name = "tabs_context_mcp"; arguments = @{} } },
    @{ method = "tools/call"; params = @{ name = "tabs_context_mcp"; arguments = @{} } },
    @{ method = "getVersion"; params = @{} },
    @{ method = "help"; params = @{} }
)

$id = 1
foreach ($m in $methods) {
    try {
        $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
        $pipe.Connect(3000)

        $msg = @{
            jsonrpc = "2.0"
            id = $id
            method = $m.method
            params = $m.params
        } | ConvertTo-Json -Depth 5 -Compress

        Send-PipeMessage -Pipe $pipe -JsonMessage $msg
        $resp = Read-PipeMessage -Pipe $pipe
        Write-Host "  $($m.method) => $resp"

        $pipe.Close()
        $pipe.Dispose()
    } catch {
        Write-Host "  $($m.method) => [connect error: $($_.Exception.Message)]"
    }
    $id++
}

# Also try sending raw JSON without jsonrpc wrapper
Write-Host ""
Write-Host "=== Non-JSONRPC formats ==="
try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(3000)
    $msg = '{"type":"ping"}'
    Send-PipeMessage -Pipe $pipe -JsonMessage $msg
    $resp = Read-PipeMessage -Pipe $pipe
    Write-Host "  {type:ping} => $resp"
    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "  {type:ping} => [error: $($_.Exception.Message)]"
}

try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(3000)
    $msg = '{"action":"list_methods"}'
    Send-PipeMessage -Pipe $pipe -JsonMessage $msg
    $resp = Read-PipeMessage -Pipe $pipe
    Write-Host "  {action:list_methods} => $resp"
    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "  {action:list_methods} => [error: $($_.Exception.Message)]"
}
