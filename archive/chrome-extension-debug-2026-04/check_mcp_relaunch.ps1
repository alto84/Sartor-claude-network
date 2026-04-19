Start-Sleep -Seconds 3
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*claude-in-chrome-mcp*' }
if ($procs) {
    foreach ($p in $procs) {
        Write-Host "MCP process found: PID=$($p.ProcessId), Started=$($p.CreationDate)"
    }
} else {
    Write-Host "MCP process NOT found - was not relaunched"
}
