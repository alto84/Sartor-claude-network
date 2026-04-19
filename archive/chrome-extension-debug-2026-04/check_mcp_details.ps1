# Check the MCP process details
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude*" }
foreach ($p in $procs) {
    Write-Host "PID: $($p.ProcessId) | Name: $($p.Name)"
    Write-Host "  CMD: $($p.CommandLine)"
    Write-Host "  Parent PID: $($p.ParentProcessId)"
    $parent = Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -eq $p.ParentProcessId }
    if ($parent) {
        Write-Host "  Parent: $($parent.Name) ($($parent.ProcessId))"
    }
    Write-Host ""
}

# Check stderr/stdout redirects or log files
Write-Host "--- Checking for log files ---"
$logPaths = @(
    "$env:TEMP\claude-chrome*.log",
    "$env:APPDATA\Claude\logs\*",
    "$env:LOCALAPPDATA\Claude\logs\*",
    "$env:USERPROFILE\.claude\logs\*"
)
foreach ($p in $logPaths) {
    $files = Get-ChildItem -Path $p -ErrorAction SilentlyContinue
    if ($files) {
        foreach ($f in $files) {
            Write-Host "Found: $($f.FullName) ($('{0:N0}' -f $f.Length) bytes, $($f.LastWriteTime))"
        }
    }
}
