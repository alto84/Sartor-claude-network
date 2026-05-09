param([string]$TabId)

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

    $js = "JSON.stringify({patient_id: typeof currentPatient !== 'undefined' ? currentPatient.patient_id : 'UNDEFINED', has_prediction: typeof lastPrediction !== 'undefined' && lastPrediction !== null, prediction_keys: typeof lastPrediction !== 'undefined' && lastPrediction ? Object.keys(lastPrediction) : []})"
    $escapedJs = $js.Replace('"', '\"')
    WsSend "{`"id`":1,`"method`":`"Runtime.evaluate`",`"params`":{`"expression`":`"$escapedJs`"}}"
    $evalRaw = WsRecv
    $evalJson = $evalRaw | ConvertFrom-Json
    Write-Output $evalJson.result.result.value
}
catch { Write-Output "Error: $_" }
finally { $ws.Dispose(); $cts.Dispose() }
