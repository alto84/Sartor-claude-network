# Find the zbA function and the socket connection logic
$cliPath = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js"
$content = Get-Content $cliPath -Raw

# Search for the MCP server that connects to the native host socket
# zbA creates the MCP server, let's find it
$idx = $content.IndexOf("function zbA(")
if ($idx -ge 0) {
    $start = $idx
    $end = [Math]::Min($content.Length, $idx + 5000)
    Write-Host "=== zbA function (offset $idx) ==="
    Write-Host $content.Substring($start, $end - $start)
} else {
    # Try alternative - it might be a class or variable
    Write-Host "zbA as function not found, searching broadly..."
    $idx = $content.IndexOf("zbA")
    if ($idx -ge 0) {
        # Find the definition - look backwards for var/let/const/function
        $searchStart = [Math]::Max(0, $idx - 100)
        $end = [Math]::Min($content.Length, $idx + 5000)
        Write-Host "=== zbA context (offset $idx) ==="
        Write-Host $content.Substring($searchStart, $end - $searchStart)
    }
}

# Also find "onToolCallDisconnected" to see how disconnection is detected
$idx2 = $content.IndexOf("onToolCallDisconnected")
$count = 0
$searchFrom = 0
while ($count -lt 5 -and $searchFrom -lt $content.Length) {
    $pos = $content.IndexOf("onToolCallDisconnected", $searchFrom)
    if ($pos -lt 0) { break }
    $start = [Math]::Max(0, $pos - 200)
    $end = [Math]::Min($content.Length, $pos + 200)
    Write-Host ""
    Write-Host "=== onToolCallDisconnected occurrence #$($count+1) (offset $pos) ==="
    Write-Host $content.Substring($start, $end - $start)
    $searchFrom = $pos + 22
    $count++
}
