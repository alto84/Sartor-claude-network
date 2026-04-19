# Find ALL Claude Code node processes
Write-Host "=== All Claude Code processes ==="
$allClaude = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*claude*" }
foreach ($p in $allClaude) {
    $flag = $p.CommandLine -replace '.*cli\.js\s*', ''
    Write-Host "  PID=$($p.ProcessId) | $flag | Started=$($p.CreationDate)"
}

# Kill old sessions (not the current one)
# Current session should be the newest --chrome session
$chromeSessions = $allClaude | Where-Object { $_.CommandLine -like "*--chrome*" -and $_.CommandLine -notlike "*native-host*" -and $_.CommandLine -notlike "*mcp*" } | Sort-Object CreationDate -Descending

Write-Host ""
Write-Host "=== Chrome sessions (newest first) ==="
foreach ($s in $chromeSessions) {
    Write-Host "  PID=$($s.ProcessId) Started=$($s.CreationDate)"
}

if ($chromeSessions.Count -gt 1) {
    # Kill all but the newest
    $toKill = $chromeSessions | Select-Object -Skip 1
    foreach ($old in $toKill) {
        Write-Host "Killing old session PID=$($old.ProcessId)"
        Stop-Process -Id $old.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

# Kill stale MCP processes that don't belong to the current session
$currentPID = ($chromeSessions | Select-Object -First 1).ProcessId
Write-Host ""
Write-Host "Current session PID: $currentPID"

$mcps = $allClaude | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" }
foreach ($m in $mcps) {
    if ($m.ParentProcessId -ne $currentPID) {
        Write-Host "Killing orphaned MCP PID=$($m.ProcessId) (parent=$($m.ParentProcessId))"
        Stop-Process -Id $m.ProcessId -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Keeping current MCP PID=$($m.ProcessId)"
    }
}

# Kill all native hosts to force fresh start
$nhs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
foreach ($n in $nhs) {
    Write-Host "Killing native host PID=$($n.ProcessId)"
    Stop-Process -Id $n.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "=== After cleanup ==="
$remaining = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*claude*" }
foreach ($p in $remaining) {
    $flag = $p.CommandLine -replace '.*cli\.js\s*', ''
    Write-Host "  PID=$($p.ProcessId) | $flag"
}
Write-Host "Pipe: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"
