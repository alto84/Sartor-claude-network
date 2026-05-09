param(
    [string]$TabId,
    [string]$Url,
    [string]$JsCode,
    [string]$OutputPath,
    [int]$LoadWaitMs = 5000,
    [int]$ClickWaitMs = 4000
)

$wsUri = "ws://localhost:9223/devtools/page/$TabId"
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource(60000)

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

    WsSend '{"id":0,"method":"Page.enable"}'
    WsRecv | Out-Null

    # Navigate with cache bypass
    WsSend "{`"id`":1,`"method`":`"Page.navigate`",`"params`":{`"url`":`"$Url`"}}"
    WsRecv | Out-Null
    Write-Output "Navigating to $Url"
    Start-Sleep -Milliseconds $LoadWaitMs

    # Execute JS
    $escapedJs = $JsCode.Replace('\', '\\').Replace('"', '\"')
    WsSend "{`"id`":2,`"method`":`"Runtime.evaluate`",`"params`":{`"expression`":`"$escapedJs`",`"awaitPromise`":true}}"
    $evalRaw = WsRecv
    $evalJson = $evalRaw | ConvertFrom-Json
    Write-Output "JS: $($evalJson.result.result.value)"

    Start-Sleep -Milliseconds $ClickWaitMs

    # Screenshot
    WsSend '{"id":3,"method":"Page.captureScreenshot","params":{"format":"png","quality":85}}'
    $ssRaw = WsRecv
    $ssJson = $ssRaw | ConvertFrom-Json
    if ($ssJson.result.data) {
        [System.IO.File]::WriteAllBytes($OutputPath, [System.Convert]::FromBase64String($ssJson.result.data))
        Write-Output "Screenshot saved"
    }
}
catch { Write-Output "Error: $_" }
finally { $ws.Dispose(); $cts.Dispose() }
