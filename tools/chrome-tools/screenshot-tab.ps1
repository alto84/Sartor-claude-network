param(
    [string]$TabId,
    [string]$OutputPath = "C:\Users\alto8\chrome-tools\screenshot.png"
)

$wsUri = "ws://localhost:9223/devtools/page/$TabId"
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource

try {
    $ws.ConnectAsync([Uri]$wsUri, $cts.Token).Wait()

    # Send screenshot command
    $cmd = '{"id":1,"method":"Page.captureScreenshot","params":{"format":"png","quality":85}}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($cmd)
    $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
    $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

    # Receive response
    $buffer = New-Object byte[] 10485760
    $result = ""
    do {
        $seg = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
        $recv = $ws.ReceiveAsync($seg, $cts.Token).Result
        $result += [System.Text.Encoding]::UTF8.GetString($buffer, 0, $recv.Count)
    } while (-not $recv.EndOfMessage)

    $json = $result | ConvertFrom-Json
    $base64 = $json.result.data
    [System.IO.File]::WriteAllBytes($OutputPath, [System.Convert]::FromBase64String($base64))
    Write-Output "Screenshot saved to $OutputPath"
}
finally {
    $ws.Dispose()
    $cts.Dispose()
}
