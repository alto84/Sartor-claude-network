param(
    [string]$TabId,
    [int]$TabIndex,
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

    # Reload page
    $reloadResult = Send-And-Receive -Id 1 -Method "Page.reload" -Params '{"ignoreCache":true}'
    Write-Output "Page reloading..."
    Start-Sleep -Milliseconds 4000

    # Click tab
    $js = "var btns = document.querySelectorAll('.task-btn'); if(btns[$TabIndex]) { btns[$TabIndex].scrollIntoView({inline:'center'}); btns[$TabIndex].click(); btns[$TabIndex].textContent.trim(); } else { 'Tab index $TabIndex not found, total: ' + btns.length; }"
    $evalResult = Send-And-Receive -Id 2 -Method "Runtime.evaluate" -Params "{`"expression`":`"$js`"}"
    Write-Output "Tab result: $($evalResult.result.result.value)"

    Start-Sleep -Milliseconds 3000

    # Scroll to top
    $scrollJs = "var ca = document.querySelector('.content-area'); if(ca) { ca.scrollTop = 0; 'ok'; } else 'no-ca'"
    Send-And-Receive -Id 3 -Method "Runtime.evaluate" -Params "{`"expression`":`"$scrollJs`"}" | Out-Null

    Start-Sleep -Milliseconds 1000

    # Screenshot
    $ssResult = Send-And-Receive -Id 4 -Method "Page.captureScreenshot" -Params '{"format":"png","quality":85}'
    $base64 = $ssResult.result.data
    [System.IO.File]::WriteAllBytes($OutputPath, [System.Convert]::FromBase64String($base64))
    Write-Output "Screenshot saved to $OutputPath"
}
finally {
    $ws.Dispose()
    $cts.Dispose()
}
