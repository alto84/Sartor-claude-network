param(
    [string]$TabId,
    [int]$ScrollPixels = 800,
    [string]$OutputPath
)

$wsUri = "ws://localhost:9223/devtools/page/$TabId"
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource

function Send-And-Receive {
    param([int]$Id, [string]$Method, [string]$Params = '{}')
    $cmd = "{`"id`":$Id,`"method`":`"$Method`",`"params`":$Params}"
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
    return $result | ConvertFrom-Json
}

try {
    $ws.ConnectAsync([Uri]$wsUri, $cts.Token).Wait()

    $js = "var ca = document.querySelector('.content-area'); if(ca) { ca.scrollTop += $ScrollPixels; 'scrolled to ' + ca.scrollTop; } else { 'no content-area found'; }"
    $evalResult = Send-And-Receive -Id 1 -Method "Runtime.evaluate" -Params "{`"expression`":`"$js`"}"
    Write-Output "Scroll result: $($evalResult.result.result.value)"

    Start-Sleep -Milliseconds 1500

    $ssResult = Send-And-Receive -Id 2 -Method "Page.captureScreenshot" -Params '{"format":"png","quality":85}'
    $base64 = $ssResult.result.data
    [System.IO.File]::WriteAllBytes($OutputPath, [System.Convert]::FromBase64String($base64))
    Write-Output "Screenshot saved to $OutputPath"
}
finally {
    $ws.Dispose()
    $cts.Dispose()
}
