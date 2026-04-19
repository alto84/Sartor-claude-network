# Setup: User's main Chrome (no CDP) + Automation Chrome (with CDP on 9223)
Write-Host "=== Setting up dual Chrome ==="

# Kill everything first
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Remove stale locks
Remove-Item "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\lockfile" -Force -ErrorAction SilentlyContinue

# Start user's main Chrome normally
Write-Host "Starting main Chrome..."
$chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
Start-Process $chromePath -ArgumentList "--restore-last-session"
Start-Sleep -Seconds 5

# Start automation Chrome with temp profile and CDP
Write-Host "Starting automation Chrome on port 9223..."
$tempProfile = "C:\Users\alto8\chrome-automation-profile"
if (-not (Test-Path $tempProfile)) {
    New-Item -Path $tempProfile -ItemType Directory -Force | Out-Null
}
Start-Process $chromePath -ArgumentList "--remote-debugging-port=9223", "--remote-allow-origins=*", "--user-data-dir=$tempProfile", "--no-first-run", "--window-size=1920,1080"

# Wait for CDP
$maxWait = 15
$waited = 0
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2
    try {
        $version = Invoke-RestMethod -Uri "http://localhost:9223/json/version" -TimeoutSec 2
        Write-Host ""
        Write-Host "CDP READY on port 9223!"
        Write-Host "  Browser: $($version.Browser)"

        $tabs = Invoke-RestMethod -Uri "http://localhost:9223/json" -TimeoutSec 2
        $pages = $tabs | Where-Object { $_.type -eq "page" }
        Write-Host "  Automation tabs: $($pages.Count)"
        foreach ($t in $pages) {
            Write-Host "    ID: $($t.id) | $($t.url)"
        }

        Write-Host ""
        Write-Host "SETUP COMPLETE!"
        Write-Host "  Main Chrome: running normally (your tabs/sessions)"
        Write-Host "  Automation Chrome: CDP on port 9223 (for programmatic control)"
        exit 0
    } catch {
        Write-Host "  Waiting for CDP... (${waited}s)"
    }
}
Write-Host "CDP failed to start!"
exit 1
