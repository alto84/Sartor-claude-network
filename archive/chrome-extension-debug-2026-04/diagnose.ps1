# Full diagnostic
Write-Host "=== Native host ==="
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
if ($nh) { foreach ($p in $nh) { Write-Host "  PID=$($p.ProcessId) Started=$($p.CreationDate)" } } else { Write-Host "  NOT RUNNING" }

Write-Host ""
Write-Host "=== Named pipe ==="
Write-Host "  Exists: $(Test-Path '\\.\pipe\claude-mcp-browser-bridge-alton')"

Write-Host ""
Write-Host "=== MCP process ==="
$mcp = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" }
if ($mcp) { foreach ($p in $mcp) { Write-Host "  PID=$($p.ProcessId) Started=$($p.CreationDate)" } } else { Write-Host "  NOT RUNNING" }

Write-Host ""
Write-Host "=== Claude Code sessions ==="
$cc = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*cli.js*--chrome*" -and $_.CommandLine -notlike "*native-host*" -and $_.CommandLine -notlike "*mcp*" }
if ($cc) { foreach ($p in $cc) { Write-Host "  PID=$($p.ProcessId) Started=$($p.CreationDate)" } } else { Write-Host "  NONE" }

Write-Host ""
Write-Host "=== Log tail ==="
Get-Content "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log" -Tail 5
