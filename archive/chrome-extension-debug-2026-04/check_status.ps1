Write-Host "=== Pipe Status ==="
Write-Host "Pipe exists: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"

Write-Host ""
Write-Host "=== Native Host Processes ==="
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
if ($nh) {
    foreach ($p in $nh) {
        Write-Host "  PID=$($p.ProcessId) Started=$($p.CreationDate)"
    }
} else {
    Write-Host "  NONE running"
}

Write-Host ""
Write-Host "=== MCP Processes ==="
$mcp = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" }
if ($mcp) {
    foreach ($p in $mcp) {
        Write-Host "  PID=$($p.ProcessId) Started=$($p.CreationDate)"
    }
} else {
    Write-Host "  NONE running"
}

Write-Host ""
Write-Host "=== Recent Log ==="
if (Test-Path "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log") {
    Get-Content "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log" -Tail 10
} else {
    Write-Host "  Log file not found"
}
