# CDP Common functions - dot-source this in other CDP scripts
# Usage: . "$PSScriptRoot\cdp-common.ps1"

$script:CDP_PORT = 9223
$script:CDP_BASE = "http://localhost:$($script:CDP_PORT)"

function Get-CDPTabs {
    try {
        $tabs = Invoke-RestMethod -Uri "$($script:CDP_BASE)/json" -TimeoutSec 5
        return $tabs | Where-Object { $_.type -eq "page" }
    } catch {
        Write-Error "CDP not available. Is automation Chrome running? Error: $($_.Exception.Message)"
        return $null
    }
}

function Get-CDPTab {
    param([string]$TabId)
    $tabs = Get-CDPTabs
    if (-not $tabs) { return $null }
    return $tabs | Where-Object { $_.id -eq $TabId } | Select-Object -First 1
}

function Send-CDPCommand {
    param(
        [string]$WebSocketUrl,
        [string]$Method,
        [hashtable]$Params = @{},
        [int]$TimeoutSec = 10
    )

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $ct = New-Object System.Threading.CancellationTokenSource($TimeoutSec * 1000)

    try {
        $ws.ConnectAsync([Uri]$WebSocketUrl, $ct.Token).Wait()

        $id = Get-Random -Minimum 1 -Maximum 999999
        $msg = @{ id = $id; method = $Method; params = $Params } | ConvertTo-Json -Depth 10 -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct.Token).Wait()

        # Read response - handle multi-frame messages
        $ms = New-Object System.IO.MemoryStream
        do {
            $recvBuf = New-Object byte[] 65536
            $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @(,$recvBuf)
            $result = $ws.ReceiveAsync($recvSegment, $ct.Token).GetAwaiter().GetResult()
            $ms.Write($recvBuf, 0, $result.Count)
        } while (-not $result.EndOfMessage)

        $responseStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
        $ms.SetLength(0)
        $response = $responseStr | ConvertFrom-Json

        # Sometimes we get events before our response. Keep reading until we get our response ID.
        while ($response.id -ne $id) {
            do {
                $recvBuf = New-Object byte[] 65536
                $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @(,$recvBuf)
                $result = $ws.ReceiveAsync($recvSegment, $ct.Token).GetAwaiter().GetResult()
                $ms.Write($recvBuf, 0, $result.Count)
            } while (-not $result.EndOfMessage)
            $responseStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
            $ms.SetLength(0)
            $response = $responseStr | ConvertFrom-Json
        }
        $ms.Dispose()

        return $response
    } finally {
        if ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
            try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "", [System.Threading.CancellationToken]::None).Wait() } catch {}
        }
        $ws.Dispose()
        $ct.Dispose()
    }
}

function Invoke-CDPMethod {
    param(
        [string]$TabId,
        [string]$Method,
        [hashtable]$Params = @{},
        [int]$TimeoutSec = 10
    )

    $tab = Get-CDPTab -TabId $TabId
    if (-not $tab) {
        Write-Error "Tab '$TabId' not found"
        return $null
    }

    return Send-CDPCommand -WebSocketUrl $tab.webSocketDebuggerUrl -Method $Method -Params $Params -TimeoutSec $TimeoutSec
}
