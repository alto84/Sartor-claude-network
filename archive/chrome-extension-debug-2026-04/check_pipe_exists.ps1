# Check if the named pipe exists
$pipeName = "claude-mcp-browser-bridge-alton"
$pipeExists = Test-Path "\\.\pipe\$pipeName"
Write-Host "Pipe '$pipeName' exists: $pipeExists"

# List all claude-related pipes
Write-Host ""
Write-Host "All claude/anthropic pipes:"
[System.IO.Directory]::GetFiles("\\.\pipe\") | Where-Object { $_ -match "claude|anthropic|mcp" } | ForEach-Object { Write-Host "  $_" }

# Check if MCP process stderr has any output
Write-Host ""
Write-Host "Native host process check:"
$nhProc = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
if ($nhProc) {
    Write-Host "  Native host PID: $($nhProc.ProcessId), started: $($nhProc.CreationDate)"
} else {
    Write-Host "  Native host NOT RUNNING"
}

$mcpProc = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude-in-chrome-mcp*" }
if ($mcpProc) {
    Write-Host "  MCP process PID: $($mcpProc.ProcessId), started: $($mcpProc.CreationDate)"
} else {
    Write-Host "  MCP process NOT RUNNING"
}
