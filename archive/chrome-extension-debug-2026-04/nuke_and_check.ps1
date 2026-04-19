# Kill ALL native host processes
Write-Host "=== Killing all native hosts ==="
$nhs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
foreach ($n in $nhs) {
    Write-Host "  Killing PID=$($n.ProcessId) ($($n.Name))"
    Stop-Process -Id $n.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1

# Check pipe is gone
Write-Host ""
Write-Host "Pipe after kill: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"

# Clear the log so we get a fresh start
$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logFile) {
    "" | Set-Content $logFile
    Write-Host "Log cleared"
}

# Check what's left
Write-Host ""
Write-Host "=== Remaining processes ==="
$remaining = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*claude*" }
foreach ($p in $remaining) {
    $short = $p.CommandLine -replace '.*cli\.js\s*', ''
    Write-Host "  PID=$($p.ProcessId) | $short"
}
