# Kill Chrome and restart with all CDP flags
Write-Host "Stopping Chrome..."
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Check for enterprise policies that might block debugging
Write-Host "=== Checking Chrome policies ==="
$polKey = "HKLM:\SOFTWARE\Policies\Google\Chrome"
if (Test-Path $polKey) {
    Write-Host "Chrome policies found:"
    Get-ItemProperty $polKey | Format-List
} else {
    Write-Host "No Chrome policies in HKLM"
}
$polKeyUser = "HKCU:\SOFTWARE\Policies\Google\Chrome"
if (Test-Path $polKeyUser) {
    Write-Host "User Chrome policies found:"
    Get-ItemProperty $polKeyUser | Format-List
} else {
    Write-Host "No Chrome policies in HKCU"
}

Write-Host ""
Write-Host "=== Starting Chrome with full CDP flags ==="
$chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
$args = @(
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--restore-last-session"
)
Start-Process $chromePath -ArgumentList $args
Write-Host "Chrome starting with: $($args -join ' ')"

# Wait with extended timeout
$maxWait = 20
$waited = 0
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2

    # Check if port is listening first
    $portCheck = Get-NetTCPConnection -LocalPort 9222 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Host "  Port 9222 is LISTENING (${waited}s)"
    }

    try {
        $version = Invoke-RestMethod -Uri "http://localhost:9222/json/version" -TimeoutSec 3
        Write-Host ""
        Write-Host "CDP READY after ${waited}s!"
        Write-Host "  Browser: $($version.Browser)"

        $tabs = Invoke-RestMethod -Uri "http://localhost:9222/json" -TimeoutSec 3
        $pages = $tabs | Where-Object { $_.type -eq "page" }
        Write-Host "  Tabs: $($pages.Count)"
        exit 0
    } catch {
        if (-not $portCheck) {
            Write-Host "  Waiting... (${waited}s) - port not yet listening"
        } else {
            Write-Host "  Waiting... (${waited}s) - port listening but HTTP not ready: $($_.Exception.Message)"
        }
    }
}

Write-Host ""
Write-Host "=== Final diagnostic ==="
$chromes = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "chrome.exe" -and $_.CommandLine -notlike "*--type=*" }
foreach ($p in $chromes) {
    Write-Host "Main chrome CMD: $($p.CommandLine)"
}
$port = Get-NetTCPConnection -LocalPort 9222 -ErrorAction SilentlyContinue
Write-Host "Port 9222: $(if ($port) { 'LISTENING' } else { 'NOT listening' })"

# Check Chrome's DevToolsActivePort file
$devToolsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\DevToolsActivePort"
if (Test-Path $devToolsFile) {
    Write-Host "DevToolsActivePort file:"
    Get-Content $devToolsFile
} else {
    Write-Host "No DevToolsActivePort file found"
}

exit 1
