# Extract handleMcpClient and surrounding code
$cliPath = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js"
$content = Get-Content $cliPath -Raw

# Get more context after handleMcpClient definition
$idx = $content.IndexOf("handleMcpClient(A){")
if ($idx -ge 0) {
    $end = [Math]::Min($content.Length, $idx + 3000)
    Write-Host "=== handleMcpClient implementation ==="
    Write-Host $content.Substring($idx, $end - $idx)
    Write-Host ""
}

# Find where MCP tool calls are forwarded TO the extension
$idx2 = $content.IndexOf("tool_request")
if ($idx2 -ge 0) {
    $start = [Math]::Max(0, $idx2 - 500)
    $end = [Math]::Min($content.Length, $idx2 + 1000)
    Write-Host "=== tool_request context ==="
    Write-Host $content.Substring($start, $end - $start)
}

# Also find the response format
$idx3 = $content.IndexOf("Forwarding tool response")
if ($idx3 -ge 0) {
    $start = [Math]::Max(0, $idx3 - 200)
    $end = [Math]::Min($content.Length, $idx3 + 500)
    Write-Host ""
    Write-Host "=== tool_response forwarding ==="
    Write-Host $content.Substring($start, $end - $start)
}
