# Check MCP/native host status
Write-Host "=== Named Pipe ==="
$pipeExists = Test-Path "\\.\pipe\claude-mcp-browser-bridge-alton"
Write-Host "  Pipe exists: $pipeExists"

Write-Host ""
Write-Host "=== Native Host Processes ==="
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
if ($procs) {
    foreach ($p in $procs) {
        Write-Host "  PID=$($p.ProcessId) Name=$($p.Name) Created=$($p.CreationDate)"
        $cmdShort = $p.CommandLine
        if ($cmdShort -and $cmdShort.Length -gt 150) { $cmdShort = $cmdShort.Substring(0, 150) + "..." }
        Write-Host "  Cmd: $cmdShort"
    }
} else {
    Write-Host "  NONE RUNNING"
}

Write-Host ""
Write-Host "=== MCP Processes ==="
$mcpProcs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*mcp*chrome*" -or $_.CommandLine -like "*chrome*mcp*" }
if ($mcpProcs) {
    foreach ($p in $mcpProcs) {
        Write-Host "  PID=$($p.ProcessId) Name=$($p.Name) Created=$($p.CreationDate)"
    }
} else {
    Write-Host "  NONE FOUND"
}

Write-Host ""
Write-Host "=== Chrome Processes ==="
$chromes = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "chrome.exe" }
Write-Host "  Chrome processes: $($chromes.Count)"
$mainChrome = $chromes | Where-Object { $_.CommandLine -notlike "*--type=*" }
foreach ($c in $mainChrome) {
    $cmdShort = $c.CommandLine
    if ($cmdShort -and $cmdShort.Length -gt 200) { $cmdShort = $cmdShort.Substring(0, 200) + "..." }
    Write-Host "  Main: PID=$($c.ProcessId) Created=$($c.CreationDate)"
    Write-Host "    $cmdShort"
}

Write-Host ""
Write-Host "=== Log File ==="
$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logFile) {
    $info = Get-Item $logFile
    Write-Host "  Size: $($info.Length) bytes, Modified: $($info.LastWriteTime)"
    if ($info.Length -gt 5) {
        Write-Host "  Last 10 lines:"
        Get-Content $logFile -Tail 10
    }
} else {
    Write-Host "  NOT FOUND"
}
