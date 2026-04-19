# Kill current MCP process
$mcp = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" }
foreach ($p in $mcp) {
    Write-Host "Killing MCP PID=$($p.ProcessId)"
    Stop-Process -Id $p.ProcessId -Force
}
Start-Sleep -Seconds 2

# Check if pipe still exists
Write-Host "Pipe exists: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"

# Check native host
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
Write-Host "Native hosts running: $(($nh | Measure-Object).Count)"
