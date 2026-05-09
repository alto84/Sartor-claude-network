# Full test of the Chrome extension via named pipe - navigate, screenshot, read page
$pipeName = "claude-mcp-browser-bridge-alton"

function Send-PipeMessage {
    param([System.IO.Pipes.NamedPipeClientStream]$Pipe, [string]$JsonMessage)
    $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($JsonMessage)
    $lenBytes = [BitConverter]::GetBytes([uint32]$msgBytes.Length)
    $Pipe.Write($lenBytes, 0, 4)
    $Pipe.Write($msgBytes, 0, $msgBytes.Length)
    $Pipe.Flush()
}

function Read-PipeMessage {
    param([System.IO.Pipes.NamedPipeClientStream]$Pipe, [int]$TimeoutMs = 20000)
    $cts = New-Object System.Threading.CancellationTokenSource($TimeoutMs)
    try {
        $lenBuf = New-Object byte[] 4
        $totalRead = 0
        while ($totalRead -lt 4) {
            $task = $Pipe.ReadAsync($lenBuf, $totalRead, 4 - $totalRead, $cts.Token)
            $task.Wait()
            $bytes = $task.Result
            if ($bytes -eq 0) { return $null }
            $totalRead += $bytes
        }
        $respLen = [BitConverter]::ToUInt32($lenBuf, 0)
        if ($respLen -eq 0 -or $respLen -gt 5000000) { return $null }
        $bodyBuf = New-Object byte[] $respLen
        $bodyRead = 0
        while ($bodyRead -lt $respLen) {
            $task = $Pipe.ReadAsync($bodyBuf, $bodyRead, $respLen - $bodyRead, $cts.Token)
            $task.Wait()
            $bytes = $task.Result
            if ($bytes -eq 0) { return $null }
            $bodyRead += $bytes
        }
        return [System.Text.Encoding]::UTF8.GetString($bodyBuf, 0, $bodyRead)
    } catch {
        return $null
    } finally {
        $cts.Dispose()
    }
}

function Invoke-ChromeTool {
    param([string]$Tool, [hashtable]$Args, [int]$TimeoutMs = 20000)

    $pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", $pipeName, [System.IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(5000)

    $msg = @{
        jsonrpc = "2.0"
        id = Get-Random -Minimum 1 -Maximum 999999
        method = "execute_tool"
        params = @{
            tool = $Tool
            args = $Args
        }
    } | ConvertTo-Json -Depth 10 -Compress

    Send-PipeMessage -Pipe $pipe -JsonMessage $msg
    $resp = Read-PipeMessage -Pipe $pipe -TimeoutMs $TimeoutMs
    $pipe.Close()
    $pipe.Dispose()
    return $resp
}

# Step 1: Get tab context
Write-Host "=== Step 1: Get tab context ==="
$tabCtx = Invoke-ChromeTool -Tool "tabs_context_mcp" -Args @{ createIfEmpty = $true }
Write-Host "Tab context: $tabCtx"

# Parse to get tab info
$tabData = $tabCtx | ConvertFrom-Json
$tabGroupId = $null
$tabId = $null
if ($tabData.result -and $tabData.result.content) {
    foreach ($item in $tabData.result.content) {
        if ($item.text -like "*availableTabs*") {
            $parsed = $item.text | ConvertFrom-Json
            $tabGroupId = $parsed.tabGroupId
            if ($parsed.availableTabs -and $parsed.availableTabs.Count -gt 0) {
                $tabId = $parsed.availableTabs[0].tabId
            }
        }
    }
}
Write-Host "  TabGroupId: $tabGroupId, TabId: $tabId"

if (-not $tabId) {
    Write-Host "No tab found, creating one..."
    $createResp = Invoke-ChromeTool -Tool "tabs_create_mcp" -Args @{}
    Write-Host "Create result: $createResp"
    # Re-fetch context
    $tabCtx = Invoke-ChromeTool -Tool "tabs_context_mcp" -Args @{}
    $tabData = $tabCtx | ConvertFrom-Json
    foreach ($item in $tabData.result.content) {
        if ($item.text -like "*availableTabs*") {
            $parsed = $item.text | ConvertFrom-Json
            $tabGroupId = $parsed.tabGroupId
            $tabId = $parsed.availableTabs[0].tabId
        }
    }
    Write-Host "  After create - TabGroupId: $tabGroupId, TabId: $tabId"
}

# Step 2: Navigate to a page
Write-Host ""
Write-Host "=== Step 2: Navigate ==="
$navResp = Invoke-ChromeTool -Tool "navigate" -Args @{ url = "https://news.ycombinator.com"; tabId = $tabId } -TimeoutMs 30000
Write-Host "Nav result: $navResp"

# Wait for page load
Start-Sleep -Seconds 3

# Step 3: Take screenshot
Write-Host ""
Write-Host "=== Step 3: Screenshot ==="
$ssResp = Invoke-ChromeTool -Tool "computer" -Args @{ action = "screenshot"; tabId = $tabId } -TimeoutMs 30000
if ($ssResp) {
    $ssData = $ssResp | ConvertFrom-Json
    if ($ssData.result -and $ssData.result.content) {
        foreach ($item in $ssData.result.content) {
            if ($item.type -eq "image") {
                Write-Host "  Got image! Source type: $($item.source.type), media_type: $($item.source.media_type)"
                # Save the base64 image
                $base64 = $item.source.data
                $imageBytes = [Convert]::FromBase64String($base64)
                $outPath = "C:\Users\alto8\chrome-tools\ext-screenshot.png"
                [System.IO.File]::WriteAllBytes($outPath, $imageBytes)
                Write-Host "  Saved to: $outPath ($($imageBytes.Length) bytes)"
            } elseif ($item.type -eq "text") {
                $shortText = $item.text
                if ($shortText.Length -gt 200) { $shortText = $shortText.Substring(0, 200) + "..." }
                Write-Host "  Text: $shortText"
            }
        }
    } else {
        $shortResp = $ssResp
        if ($shortResp.Length -gt 300) { $shortResp = $shortResp.Substring(0, 300) + "..." }
        Write-Host "  Response: $shortResp"
    }
} else {
    Write-Host "  No response"
}

# Step 4: Get page text
Write-Host ""
Write-Host "=== Step 4: Get page text ==="
$textResp = Invoke-ChromeTool -Tool "get_page_text" -Args @{ tabId = $tabId }
if ($textResp) {
    $textData = $textResp | ConvertFrom-Json
    if ($textData.result -and $textData.result.content) {
        foreach ($item in $textData.result.content) {
            if ($item.type -eq "text") {
                $shortText = $item.text
                if ($shortText.Length -gt 500) { $shortText = $shortText.Substring(0, 500) + "..." }
                Write-Host $shortText
            }
        }
    }
}
