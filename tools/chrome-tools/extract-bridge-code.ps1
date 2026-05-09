# Extract the chrome native host bridge code from the minified cli.js
$cliPath = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js"

# Read the whole file
$content = Get-Content $cliPath -Raw

# Find "Unknown method" and extract surrounding context
$idx = $content.IndexOf("Unknown method")
if ($idx -ge 0) {
    $start = [Math]::Max(0, $idx - 2000)
    $end = [Math]::Min($content.Length, $idx + 1000)
    Write-Host "=== Around 'Unknown method' (offset $idx) ==="
    Write-Host $content.Substring($start, $end - $start)
    Write-Host ""
}

# Find handleMcpClient
$idx2 = $content.IndexOf("handleMcpClient")
if ($idx2 -ge 0) {
    $start = [Math]::Max(0, $idx2 - 500)
    $end = [Math]::Min($content.Length, $idx2 + 2000)
    Write-Host "=== Around 'handleMcpClient' (offset $idx2) ==="
    Write-Host $content.Substring($start, $end - $start)
    Write-Host ""
}

# Find the pipe server creation
$idx3 = $content.IndexOf("claude-mcp-browser-bridge")
if ($idx3 -ge 0) {
    $start = [Math]::Max(0, $idx3 - 1000)
    $end = [Math]::Min($content.Length, $idx3 + 2000)
    Write-Host "=== Around pipe name (offset $idx3) ==="
    Write-Host $content.Substring($start, $end - $start)
    Write-Host ""
}
