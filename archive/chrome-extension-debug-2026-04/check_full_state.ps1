# Check all relevant processes
Write-Host "=== Claude-related processes ==="
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude*" -and $_.Name -eq "node.exe" }
foreach ($p in $procs) {
    $flag = $p.CommandLine -replace '.*cli\.js\s*', ''
    Write-Host "  PID=$($p.ProcessId) | $flag | Started=$($p.CreationDate)"
}

Write-Host ""
Write-Host "=== Named pipe check ==="
$pipeExists = Test-Path "\\.\pipe\claude-mcp-browser-bridge-alton"
Write-Host "Pipe exists: $pipeExists"

Write-Host ""
Write-Host "=== Native host process ==="
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
if ($nh) { Write-Host "Running: PID=$($nh.ProcessId)" } else { Write-Host "NOT RUNNING" }

Write-Host ""
Write-Host "=== Chrome native host log (last 10 lines) ==="
$logPath = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logPath) {
    $lastMod = (Get-Item $logPath).LastWriteTime
    Write-Host "Last modified: $lastMod"
    Get-Content $logPath -Tail 10
}
