# Check node processes (Claude Code CLI runs as node)
Write-Output "=== Node.js processes (Claude Code CLI) ==="
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" } | ForEach-Object {
    Write-Output "PID: $($_.ProcessId) CMD: $($_.CommandLine.Substring(0, [Math]::Min(200, $_.CommandLine.Length)))"
}

Write-Output ""
Write-Output "=== MCP config ==="
$mcp1 = "C:\Users\alto8\.claude\mcp-config.json"
$mcp2 = "C:\Users\alto8\.claude\claude_code_config.json"
if (Test-Path $mcp1) { Write-Output "Found: $mcp1"; Get-Content $mcp1 }
if (Test-Path $mcp2) { Write-Output "Found: $mcp2"; Get-Content $mcp2 }

Write-Output ""
Write-Output "=== Chrome extension storage ==="
$extDir = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\fcoeoabgfenejglbffodgkkbkcdhcgfn"
if (Test-Path $extDir) {
    Write-Output "Extension data dir exists"
    Get-ChildItem $extDir | ForEach-Object { Write-Output "  $($_.Name) ($($_.Length) bytes)" }
} else {
    Write-Output "Extension data dir NOT found at: $extDir"
    # Try to find it
    $found = Get-ChildItem "C:\Users\alto8\AppData\Local\Google\Chrome\User Data" -Recurse -Filter "fcoeoabgfenejglbffodgkkbkcdhcgfn" -Directory -ErrorAction SilentlyContinue | Select-Object -First 3
    if ($found) { $found | ForEach-Object { Write-Output "  Found at: $($_.FullName)" } }
    else { Write-Output "  Extension ID not found anywhere in Chrome profile" }
}

Write-Output ""
Write-Output "=== Auth tokens / OAuth state ==="
$authDir = "C:\Users\alto8\AppData\Local\Claude"
if (Test-Path $authDir) {
    Get-ChildItem $authDir -File | ForEach-Object { Write-Output "  $($_.Name) ($($_.Length) bytes, modified $($_.LastWriteTime))" }
}
