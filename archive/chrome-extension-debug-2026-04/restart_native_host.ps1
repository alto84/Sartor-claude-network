# Kill ALL native host processes
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
foreach ($p in $procs) {
    Write-Host "Killing PID $($p.ProcessId): $($p.Name)"
    Stop-Process -Id $p.ProcessId -Force
}
Write-Host ""

# Also kill old MCP processes from previous session
$oldMcp = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" -and $_.ProcessId -eq 25852 }
if ($oldMcp) {
    Write-Host "Killing old MCP process PID 25852"
    Stop-Process -Id 25852 -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Waiting 2 seconds..."
Start-Sleep -Seconds 2

# Check state
Write-Host ""
Write-Host "=== After cleanup ==="
$remaining = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
if ($remaining) {
    Write-Host "Native host still running!"
} else {
    Write-Host "Native host stopped"
}

$pipeExists = Test-Path "\\.\pipe\claude-mcp-browser-bridge-alton"
Write-Host "Pipe exists: $pipeExists"
