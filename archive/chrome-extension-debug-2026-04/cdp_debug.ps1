# Check DevToolsActivePort file
$devToolsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\DevToolsActivePort"
Write-Host "=== DevToolsActivePort ==="
if (Test-Path $devToolsFile) {
    Write-Host "EXISTS! Contents:"
    Get-Content $devToolsFile
} else {
    Write-Host "File NOT found"
}

# Check if port 9222 is in use by something else
Write-Host ""
Write-Host "=== Port 9222 usage ==="
$port9222 = Get-NetTCPConnection -LocalPort 9222 -ErrorAction SilentlyContinue
if ($port9222) {
    foreach ($p in $port9222) {
        $proc = Get-Process -Id $p.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "  State=$($p.State) PID=$($p.OwningProcess) Name=$($proc.Name)"
    }
} else {
    Write-Host "  Nothing on 9222"
}

# Check all listening ports for chrome
Write-Host ""
Write-Host "=== All Chrome listening ports ==="
$chromePids = (Get-Process chrome -ErrorAction SilentlyContinue).Id
$allListening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -in $chromePids }
if ($allListening) {
    foreach ($l in $allListening) {
        Write-Host "  Port $($l.LocalPort) on $($l.LocalAddress) (PID $($l.OwningProcess))"
    }
} else {
    Write-Host "  Chrome has NO listening ports"
}

# Check Chrome version
Write-Host ""
Write-Host "=== Chrome version ==="
$chromeExe = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if (Test-Path $chromeExe) {
    $ver = (Get-Item $chromeExe).VersionInfo.ProductVersion
    Write-Host "Chrome version: $ver"
}

# Check for chrome lock file
Write-Host ""
Write-Host "=== Lock files ==="
$lockFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\lockfile"
$singletonLock = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\SingletonLock"
if (Test-Path $lockFile) { Write-Host "lockfile EXISTS" } else { Write-Host "lockfile: no" }
if (Test-Path $singletonLock) { Write-Host "SingletonLock EXISTS" } else { Write-Host "SingletonLock: no" }

# Check Windows Firewall for Chrome
Write-Host ""
Write-Host "=== Firewall rules for Chrome ==="
$rules = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*Chrome*" -or $_.DisplayName -like "*chrome*" }
foreach ($r in $rules) {
    Write-Host "  $($r.DisplayName) | Action=$($r.Action) Enabled=$($r.Enabled) Direction=$($r.Direction)"
}
