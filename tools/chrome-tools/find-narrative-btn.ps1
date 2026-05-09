param([string]$TabId)

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
    $js = @"
(function() {
    var btns = document.querySelectorAll('button');
    var narrative = [];
    for (var i = 0; i < btns.length; i++) {
        if (btns[i].textContent.toLowerCase().indexOf('narrative') !== -1) {
            narrative.push({idx: i, id: btns[i].id, cls: btns[i].className, text: btns[i].textContent.trim()});
        }
    }
    return JSON.stringify(narrative);
})()
"@
    $escapedJs = $js.Replace('"', '\"').Replace("`n", "\n").Replace("`r", "")
    $evalResult = Send-And-Receive -Id 1 -Method "Runtime.evaluate" -Params "{`"expression`":`"$escapedJs`"}"
    Write-Output $evalResult.result.result.value
}
finally {
    $ws.Dispose()
    $cts.Dispose()
}
