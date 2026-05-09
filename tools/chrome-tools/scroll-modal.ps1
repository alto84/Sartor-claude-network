param(
    [string]$TabId,
    [int]$ScrollPixels = 600,
    [string]$OutputPath
)

$wsUri = "ws://localhost:9223/devtools/page/$TabId"
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource(15000)

function WsSend { param([string]$Msg)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Msg)
    $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
    $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
}
function WsRecv {
    $buffer = New-Object byte[] 10485760
    $result = ""
    do {
        $seg = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
        $recv = $ws.ReceiveAsync($seg, $cts.Token).Result
        $result += [System.Text.Encoding]::UTF8.GetString($buffer, 0, $recv.Count)
    } while (-not $recv.EndOfMessage)
    return $result
}

try {
    $ws.ConnectAsync([Uri]$wsUri, $cts.Token).Wait()
    $js = "var m = document.querySelector('.narrative-modal'); if(m) { m.scrollTop += $ScrollPixels; 'scrolled to ' + m.scrollTop; } else { var o = document.querySelector('.narrative-overlay'); if(o) { o.scrollTop += $ScrollPixels; 'overlay scrolled'; } else 'no modal'; }"
    $escapedJs = $js.Replace('"', '\"')
    WsSend "{`"id`":1,`"method`":`"Runtime.evaluate`",`"params`":{`"expression`":`"$escapedJs`"}}"
    $r = WsRecv
    $rj = $r | ConvertFrom-Json
    Write-Output "Scroll: $($rj.result.result.value)"
    Start-Sleep -Milliseconds 1000
    WsSend '{"id":2,"method":"Page.captureScreenshot","params":{"format":"png","quality":85}}'
    $ss = WsRecv
    $ssj = $ss | ConvertFrom-Json
    [System.IO.File]::WriteAllBytes($OutputPath, [System.Convert]::FromBase64String($ssj.result.data))
    Write-Output "Screenshot saved"
}
catch { Write-Output "Error: $_" }
finally { $ws.Dispose(); $cts.Dispose() }
