# Simulate an MCP client connection to the native host pipe
# Uses async reads to avoid the ReadTimeout issue on named pipes

$pipeName = "claude-mcp-browser-bridge-alton"
Write-Host "=== MCP Handshake Test ==="
Write-Host "Connecting to pipe: $pipeName"

try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(5000)
    Write-Host "Connected! IsConnected=$($pipe.IsConnected)"

    # Send an MCP initialize request (JSON-RPC with 4-byte LE length prefix)
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

    Write-Host "Sending init message ($($msgBytes.Length) bytes): $initMsg"
    $pipe.Write($lenBytes, 0, 4)
    $pipe.Write($msgBytes, 0, $msgBytes.Length)
    $pipe.Flush()
    Write-Host "Sent! IsConnected=$($pipe.IsConnected)"

    # Use async read with a manual timeout via CancellationToken
    Write-Host "Reading response (async, 10s timeout)..."

    $cts = New-Object System.Threading.CancellationTokenSource(10000)
    $respLenBuf = New-Object byte[] 4

    try {
        # Read the 4-byte length prefix
        $totalRead = 0
        while ($totalRead -lt 4) {
            $readTask = $pipe.ReadAsync($respLenBuf, $totalRead, 4 - $totalRead, $cts.Token)
            $readTask.Wait()
            $bytesRead = $readTask.Result
            if ($bytesRead -eq 0) {
                Write-Host "Server closed connection after reading $totalRead bytes of length prefix"
                break
            }
            $totalRead += $bytesRead
        }

        if ($totalRead -eq 4) {
            $respLen = [BitConverter]::ToUInt32($respLenBuf, 0)
            Write-Host "Response length prefix: $respLen bytes"

            if ($respLen -gt 0 -and $respLen -lt 1000000) {
                # Read the JSON body
                $respBuf = New-Object byte[] $respLen
                $bodyRead = 0
                while ($bodyRead -lt $respLen) {
                    $readTask = $pipe.ReadAsync($respBuf, $bodyRead, $respLen - $bodyRead, $cts.Token)
                    $readTask.Wait()
                    $bytesRead = $readTask.Result
                    if ($bytesRead -eq 0) {
                        Write-Host "Server closed connection after reading $bodyRead/$respLen bytes of body"
                        break
                    }
                    $bodyRead += $bytesRead
                }
                $respStr = [System.Text.Encoding]::UTF8.GetString($respBuf, 0, $bodyRead)
                Write-Host "Response: $respStr"
            } else {
                Write-Host "Invalid response length: $respLen"
                # Maybe the server uses a different framing? Try reading raw bytes
                Write-Host "Trying raw read of first bytes..."
                $rawBuf = New-Object byte[] 1024
                # Copy the 4 bytes we already have
                [Array]::Copy($respLenBuf, 0, $rawBuf, 0, 4)
                $readTask = $pipe.ReadAsync($rawBuf, 4, 1020, $cts.Token)
                $readTask.Wait()
                $extraBytes = $readTask.Result
                $totalRaw = 4 + $extraBytes
                $rawStr = [System.Text.Encoding]::UTF8.GetString($rawBuf, 0, $totalRaw)
                Write-Host "Raw ($totalRaw bytes): $rawStr"
            }
        }
    } catch [System.OperationCanceledException] {
        Write-Host "Read timed out after 10 seconds (no response from server)"
    } catch [System.AggregateException] {
        $inner = $_.Exception.InnerException
        if ($inner -is [System.OperationCanceledException] -or $inner -is [System.Threading.Tasks.TaskCanceledException]) {
            Write-Host "Read timed out after 10 seconds (no response from server)"
        } else {
            Write-Host "Read error: $($inner.GetType().Name): $($inner.Message)"
        }
    } catch {
        Write-Host "Read error: $($_.Exception.GetType().Name): $($_.Exception.Message)"
    } finally {
        $cts.Dispose()
    }

    Write-Host "Still connected: $($pipe.IsConnected)"
    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.GetType().Name): $($_.Exception.Message)"
}

# Also try the STDIO-style approach (newline-delimited JSON, no length prefix)
Write-Host ""
Write-Host "=== Test 2: STDIO-style (newline-delimited JSON) ==="
try {
    $pipe2 = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe2.Connect(5000)
    Write-Host "Connected!"

    $initMsg2 = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"0.1"}}}'
    $msgWithNewline = $initMsg2 + "`n"
    $msgBytes2 = [System.Text.Encoding]::UTF8.GetBytes($msgWithNewline)

    Write-Host "Sending STDIO-style ($($msgBytes2.Length) bytes)..."
    $pipe2.Write($msgBytes2, 0, $msgBytes2.Length)
    $pipe2.Flush()
    Write-Host "Sent! IsConnected=$($pipe2.IsConnected)"

    # Read response
    $cts2 = New-Object System.Threading.CancellationTokenSource(10000)
    $readBuf = New-Object byte[] 4096
    try {
        $readTask = $pipe2.ReadAsync($readBuf, 0, 4096, $cts2.Token)
        $readTask.Wait()
        $bytesRead = $readTask.Result
        if ($bytesRead -gt 0) {
            $respStr = [System.Text.Encoding]::UTF8.GetString($readBuf, 0, $bytesRead)
            Write-Host "Response ($bytesRead bytes): $respStr"
        } else {
            Write-Host "Server closed connection (0 bytes)"
        }
    } catch [System.AggregateException] {
        $inner = $_.Exception.InnerException
        if ($inner -is [System.OperationCanceledException] -or $inner -is [System.Threading.Tasks.TaskCanceledException]) {
            Write-Host "Read timed out (no response)"
        } else {
            Write-Host "Error: $($inner.Message)"
        }
    } finally {
        $cts2.Dispose()
    }

    Write-Host "Still connected: $($pipe2.IsConnected)"
    $pipe2.Close()
    $pipe2.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.GetType().Name): $($_.Exception.Message)"
}
