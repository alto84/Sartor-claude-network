param(
    [string]$TabId,
    [string]$OutputPath
)

$wsUri = "ws://localhost:9223/devtools/page/$TabId"
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource(10000)

try {
    $ws.ConnectAsync([Uri]$wsUri, $cts.Token).Wait()

    # First dismiss any dialogs
    $dismissCmd = '{"id":0,"method":"Page.handleJavaScriptDialog","params":{"accept":true}}'
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($dismissCmd)
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
        $buffer = New-Object byte[] 1048576
        $seg = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
        $recv = $ws.ReceiveAsync($seg, $cts.Token).Result
    } catch {}

    Start-Sleep -Milliseconds 500

    # Screenshot
    $cmd = '{"id":1,"method":"Page.captureScreenshot","params":{"format":"png","quality":85}}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($cmd)
    $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
    $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

    $buffer = New-Object byte[] 10485760
    $result = ""
    do {
        $seg = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
        $recv = $ws.ReceiveAsync($seg, $cts.Token).Result
        $result += [System.Text.Encoding]::UTF8.GetString($buffer, 0, $recv.Count)
    } while (-not $recv.EndOfMessage)

    $json = $result | ConvertFrom-Json
    if ($json.result.data) {
        [System.IO.File]::WriteAllBytes($OutputPath, [System.Convert]::FromBase64String($json.result.data))
        Write-Output "Screenshot saved to $OutputPath"
    } else {
        Write-Output "No screenshot data: $result"
    }
}
catch {
    Write-Output "Error: $_"
}
finally {
    $ws.Dispose()
    $cts.Dispose()
}
