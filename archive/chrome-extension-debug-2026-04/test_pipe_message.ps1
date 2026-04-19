# Try connecting and sending a basic MCP message to the pipe
$pipeName = "claude-mcp-browser-bridge-alton"
try {
    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(3000)
    Write-Host "Connected to pipe"

    # Read any pending data (non-blocking)
    $pipe.ReadMode = [System.IO.Pipes.PipeTransmissionMode]::Byte

    # Send a basic JSON-RPC initialize message
    $initMsg = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($initMsg)

    # Write length header (4 bytes, little-endian) then message
    $lenBytes = [BitConverter]::GetBytes([int32]$bytes.Length)
    $pipe.Write($lenBytes, 0, 4)
    $pipe.Write($bytes, 0, $bytes.Length)
    $pipe.Flush()
    Write-Host "Sent init message ($($bytes.Length) bytes)"

    # Try to read response with timeout
    $pipe.ReadTimeout = 5000
    $readBuf = New-Object byte[] 4
    $asyncResult = $pipe.BeginRead($readBuf, 0, 4, $null, $null)
    $completed = $asyncResult.AsyncWaitHandle.WaitOne(5000)
    if ($completed) {
        $bytesRead = $pipe.EndRead($asyncResult)
        if ($bytesRead -eq 4) {
            $respLen = [BitConverter]::ToInt32($readBuf, 0)
            Write-Host "Response length header: $respLen bytes"
            $respBuf = New-Object byte[] $respLen
            $totalRead = 0
            while ($totalRead -lt $respLen) {
                $read = $pipe.Read($respBuf, $totalRead, $respLen - $totalRead)
                $totalRead += $read
            }
            $response = [System.Text.Encoding]::UTF8.GetString($respBuf)
            Write-Host "Response: $response"
        } else {
            Write-Host "Read $bytesRead bytes (expected 4)"
        }
    } else {
        Write-Host "No response within 5 seconds - pipe might not be processing messages"
    }

    $pipe.Close()
    $pipe.Dispose()
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
