Write-Host "=== Native host log ==="
$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
if (Test-Path $logFile) {
    $info = Get-Item $logFile
    Write-Host "Size: $($info.Length) bytes, Modified: $($info.LastWriteTime)"
    if ($info.Length -gt 10) {
        Get-Content $logFile -Tail 20
    } else {
        Write-Host "(empty or near-empty)"
    }
} else {
    Write-Host "Not found"
}

Write-Host ""
Write-Host "=== All Claude processes ==="
$all = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*claude*" }
foreach ($p in $all) {
    $short = $p.CommandLine -replace '.*cli\.js\s*', ''
    Write-Host "  PID=$($p.ProcessId) Parent=$($p.ParentProcessId) Started=$($p.CreationDate) | $short"
}

Write-Host ""
Write-Host "=== Extension now in Chrome prefs? ==="
$prefsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Preferences"
if (Test-Path $prefsFile) {
    $prefs = Get-Content $prefsFile -Raw | ConvertFrom-Json
    $extId = "fcoeoabgfenejglbffodgkkbkcdhcgfn"
    if ($prefs.extensions -and $prefs.extensions.settings -and $prefs.extensions.settings.$extId) {
        $ext = $prefs.extensions.settings.$extId
        Write-Host "FOUND! state=$($ext.state) location=$($ext.location)"
    } else {
        Write-Host "Still NOT in preferences"
    }
}
