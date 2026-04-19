Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "claude.exe" } | ForEach-Object {
    Write-Output "PID: $($_.ProcessId) CMD: $($_.CommandLine)"
}
