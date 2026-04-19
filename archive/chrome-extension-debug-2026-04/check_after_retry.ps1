$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
if ($nh) {
    foreach ($p in $nh) { Write-Host "Native host: PID=$($p.ProcessId) Started=$($p.CreationDate)" }
} else {
    Write-Host "Native host: NOT running"
}

$pipeExists = Test-Path "\\.\pipe\claude-mcp-browser-bridge-alton"
Write-Host "Pipe exists: $pipeExists"

$mcp = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" }
if ($mcp) {
    foreach ($p in $mcp) { Write-Host "MCP: PID=$($p.ProcessId) Started=$($p.CreationDate)" }
} else {
    Write-Host "MCP: NOT running"
}

# Check log for new entries
$logPath = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
$lastMod = (Get-Item $logPath).LastWriteTime
Write-Host "Log last modified: $lastMod"
