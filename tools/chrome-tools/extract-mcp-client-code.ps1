# Extract the MCP client code from cli.js
$cliPath = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js"
$content = Get-Content $cliPath -Raw

# Find claude-in-chrome-mcp entry point
$idx = $content.IndexOf("claude-in-chrome-mcp")
if ($idx -ge 0) {
    $start = [Math]::Max(0, $idx - 1000)
    $end = [Math]::Min($content.Length, $idx + 3000)
    Write-Host "=== claude-in-chrome-mcp entry (offset $idx) ==="
    Write-Host $content.Substring($start, $end - $start)
    Write-Host ""
}

# Find "Browser extension is not connected"
$idx2 = $content.IndexOf("Browser extension is not connected")
if ($idx2 -ge 0) {
    $start = [Math]::Max(0, $idx2 - 2000)
    $end = [Math]::Min($content.Length, $idx2 + 1000)
    Write-Host "=== 'Browser extension is not connected' (offset $idx2) ==="
    Write-Host $content.Substring($start, $end - $start)
} else {
    Write-Host "'Browser extension is not connected' NOT found in cli.js"
    # Try partial match
    $idx3 = $content.IndexOf("not connected")
    if ($idx3 -ge 0) {
        $start = [Math]::Max(0, $idx3 - 1500)
        $end = [Math]::Min($content.Length, $idx3 + 500)
        Write-Host "=== 'not connected' (offset $idx3) ==="
        Write-Host $content.Substring($start, $end - $start)
    }
}
