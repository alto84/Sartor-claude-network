$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude*" -and $_.Name -eq "node.exe" }
foreach ($p in $procs) {
    Write-Host "PID: $($p.ProcessId)"
    Write-Host "CMD: $($p.CommandLine)"
    Write-Host ""
}
