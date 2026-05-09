# Take screenshot via extension bridge and save to file
param(
    [int]$TabId,
    [string]$Output = "C:\Users\alto8\chrome-tools\screenshot-latest.jpg"
)

$pipeName = "claude-mcp-browser-bridge-alton"

$pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
$pipe.Connect(5000)

$msg = "{`"jsonrpc`":`"2.0`",`"id`":1,`"method`":`"execute_tool`",`"params`":{`"tool`":`"computer`",`"args`":{`"action`":`"screenshot`",`"tabId`":$TabId}}}"

$msgBytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
$lenBytes = [BitConverter]::GetBytes([uint32]$msgBytes.Length)
$pipe.Write($lenBytes, 0, 4)
$pipe.Write($msgBytes, 0, $msgBytes.Length)
$pipe.Flush()

# Read response
$cts = New-Object System.Threading.CancellationTokenSource(30000)
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

    $bodyBuf = New-Object byte[] $respLen
    $bodyRead = 0
    while ($bodyRead -lt $respLen) {
        $task = $pipe.ReadAsync($bodyBuf, $bodyRead, $respLen - $bodyRead, $cts.Token)
        $task.Wait()
        $bytes = $task.Result
        if ($bytes -eq 0) { break }
        $bodyRead += $bytes
    }
    $resp = [System.Text.Encoding]::UTF8.GetString($bodyBuf, 0, $bodyRead)

    # Extract base64 image data
    if ($resp -match '"data":"([A-Za-z0-9+/=]+)"') {
        $base64 = $Matches[1]
        $imageBytes = [Convert]::FromBase64String($base64)
        [System.IO.File]::WriteAllBytes($Output, $imageBytes)
        Write-Host "Saved: $Output ($($imageBytes.Length) bytes)"
    } else {
        Write-Host "No image data in response"
        if ($resp.Length -lt 500) { Write-Host $resp }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    $cts.Dispose()
    $pipe.Close()
    $pipe.Dispose()
}
