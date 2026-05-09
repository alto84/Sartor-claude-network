# Simple pipe test - one connection, one call
param(
    [string]$Tool = "tabs_context_mcp",
    [string]$ArgsJson = '{"createIfEmpty":true}'
)

$pipeName = "claude-mcp-browser-bridge-alton"

$pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
$pipe.Connect(5000)

$msg = "{`"jsonrpc`":`"2.0`",`"id`":1,`"method`":`"execute_tool`",`"params`":{`"tool`":`"$Tool`",`"args`":$ArgsJson}}"

Write-Host "Sending: $msg"
$msgBytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
$lenBytes = [BitConverter]::GetBytes([uint32]$msgBytes.Length)
$pipe.Write($lenBytes, 0, 4)
$pipe.Write($msgBytes, 0, $msgBytes.Length)
$pipe.Flush()

# Read response
$cts = New-Object System.Threading.CancellationTokenSource(20000)
try {
    $lenBuf = New-Object byte[] 4
    $totalRead = 0
    while ($totalRead -lt 4) {
        $task = $pipe.ReadAsync($lenBuf, $totalRead, 4 - $totalRead, $cts.Token)
        $task.Wait()
        $bytes = $task.Result
        if ($bytes -eq 0) { Write-Host "Connection closed"; exit 1 }
        $totalRead += $bytes
    }
    $respLen = [BitConverter]::ToUInt32($lenBuf, 0)
    Write-Host "Response length: $respLen"

    $bodyBuf = New-Object byte[] $respLen
    $bodyRead = 0
    while ($bodyRead -lt $respLen) {
        $task = $pipe.ReadAsync($bodyBuf, $bodyRead, $respLen - $bodyRead, $cts.Token)
        $task.Wait()
        $bytes = $task.Result
        if ($bytes -eq 0) { Write-Host "Connection closed mid-body"; break }
        $bodyRead += $bytes
    }
    $resp = [System.Text.Encoding]::UTF8.GetString($bodyBuf, 0, $bodyRead)
    Write-Host "Response: $resp"
} catch {
    $inner = $_.Exception
    while ($inner.InnerException) { $inner = $inner.InnerException }
    Write-Host "Error: $($inner.Message)"
} finally {
    $cts.Dispose()
    $pipe.Close()
    $pipe.Dispose()
}
