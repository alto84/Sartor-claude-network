Write-Output "=== Chrome Bridge Diagnostics ==="
Write-Output ""
Write-Output "1. Named pipe check:"
$pipePath = "\\.\pipe\claude-mcp-browser-bridge-alton"
if (Test-Path $pipePath) {
    Write-Output "  FOUND: $pipePath"
} else {
    Write-Output "  NOT FOUND: $pipePath"
}
Write-Output ""
Write-Output "2. Native host process:"
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native*" } | ForEach-Object { Write-Output "  PID: $($_.ProcessId) CMD: $($_.CommandLine)" }
Write-Output ""
Write-Output "3. Claude Code process:"
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*claude*" -and $_.CommandLine -notlike "*check_chrome*" } | ForEach-Object { Write-Output "  PID: $($_.ProcessId) Name: $($_.Name)" }
Write-Output ""
Write-Output "4. Log tail:"
$logPath = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logPath) {
    Get-Content $logPath -Tail 10
} else {
    Write-Output "  Log not found at $logPath"
}
