$logFile = "C:\Users\alto8\AppData\Local\Claude\logs\chrome-native-host.log"
Write-Host "=== Log size ==="
if (Test-Path $logFile) {
    $info = Get-Item $logFile
    Write-Host "Size: $($info.Length) bytes, Modified: $($info.LastWriteTime)"
    Write-Host ""
    Write-Host "=== Log content ==="
    Get-Content $logFile
} else {
    Write-Host "Log file not found"
}

Write-Host ""
Write-Host "=== Native host stderr check ==="
# Check if native host is writing errors somewhere
$nh = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*chrome-native-host*" -and $_.Name -eq "node.exe" }
if ($nh) {
    Write-Host "Native host PID: $($nh.ProcessId)"
    Write-Host "Full cmd: $($nh.CommandLine)"
} else {
    Write-Host "No native host node.exe found"
}

# Check extension version
Write-Host ""
Write-Host "=== Extension manifest ==="
$manifest = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn"
if (Test-Path $manifest) {
    $versions = Get-ChildItem $manifest -Directory | Sort-Object Name -Descending
    foreach ($v in $versions) {
        Write-Host "  Version dir: $($v.Name)"
        $mf = Join-Path $v.FullName "manifest.json"
        if (Test-Path $mf) {
            $json = Get-Content $mf | ConvertFrom-Json
            Write-Host "  manifest.version: $($json.version)"
        }
    }
}

# Check Claude Code version
Write-Host ""
Write-Host "=== Claude Code version ==="
$pkgJson = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\package.json"
if (Test-Path $pkgJson) {
    $pkg = Get-Content $pkgJson | ConvertFrom-Json
    Write-Host "Claude Code: $($pkg.version)"
}
