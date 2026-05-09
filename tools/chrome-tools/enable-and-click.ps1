param(
    [string]$TabId,
    [string]$JsCode,
    [string]$OutputPath,
    [int]$WaitMs = 3000
)

$wsUri = "ws://localhost:9223/devtools/page/$TabId"
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource(30000)

function WsSend {
    param([string]$Msg)
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

    # Enable Page domain for dialog handling
    WsSend '{"id":0,"method":"Page.enable"}'
    $r = WsRecv
    Write-Output "Page.enable: done"

    # Execute JS
    $escapedJs = $JsCode.Replace('\', '\\').Replace('"', '\"')
    WsSend "{`"id`":1,`"method`":`"Runtime.evaluate`",`"params`":{`"expression`":`"$escapedJs`",`"awaitPromise`":true}}"
    $evalRaw = WsRecv
    # Check if we got a dialog event instead
    if ($evalRaw -match 'Page.javascriptDialogOpening') {
        Write-Output "Dialog detected - accepting"
        WsSend '{"id":2,"method":"Page.handleJavaScriptDialog","params":{"accept":true}}'
        $r = WsRecv
        # Now get the eval result
        $evalRaw = WsRecv
    }
    $evalJson = $evalRaw | ConvertFrom-Json
    Write-Output "JS result: $($evalJson.result.result.value)"

    Start-Sleep -Milliseconds $WaitMs

    # Screenshot
    WsSend '{"id":3,"method":"Page.captureScreenshot","params":{"format":"png","quality":85}}'
    $ssRaw = WsRecv
    $ssJson = $ssRaw | ConvertFrom-Json
    if ($ssJson.result.data) {
        [System.IO.File]::WriteAllBytes($OutputPath, [System.Convert]::FromBase64String($ssJson.result.data))
        Write-Output "Screenshot saved to $OutputPath"
    }
}
catch {
    Write-Output "Error: $_"
}
finally {
    $ws.Dispose()
    $cts.Dispose()
}
