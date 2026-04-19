Write-Host "=== All Claude node processes ==="
$all = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*claude*" }
foreach ($p in $all) {
    $short = $p.CommandLine -replace '.*cli\.js\s*', ''
    Write-Host "  PID=$($p.ProcessId) Parent=$($p.ParentProcessId) Started=$($p.CreationDate)"
    Write-Host "    Flags: $short"
}

Write-Host ""
Write-Host "=== Native host processes (detailed) ==="
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" }
foreach ($p in $nh) {
    Write-Host "  PID=$($p.ProcessId) Parent=$($p.ParentProcessId) Name=$($p.Name) Started=$($p.CreationDate)"
    Write-Host "    Cmd: $($p.CommandLine.Substring(0, [Math]::Min(200, $p.CommandLine.Length)))"
}

Write-Host ""
Write-Host "=== Log files ==="
$logDir = "C:\Users\alto8\AppData\Local\Claude\logs"
if (Test-Path $logDir) {
    Get-ChildItem $logDir -Filter "*chrome*" | ForEach-Object {
        Write-Host "  $($_.Name) - Size=$($_.Length) Modified=$($_.LastWriteTime)"
    }
}

Write-Host ""
Write-Host "=== Full log content ==="
$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logFile) {
    Get-Content $logFile
}
