# Nuclear approach: clean restart with all debug flags
Write-Host "=== Killing all Chrome ==="
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Remove stale lock file
$lockFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\lockfile"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "Removed lockfile"
}

# Remove stale DevToolsActivePort
$devToolsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\DevToolsActivePort"
if (Test-Path $devToolsFile) {
    Remove-Item $devToolsFile -Force -ErrorAction SilentlyContinue
    Write-Host "Removed old DevToolsActivePort"
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=== Starting Chrome with full debug flags ==="
$chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
# Try multiple approaches
$args = @(
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--restore-last-session",
    "--no-first-run",
    "--enable-features=RemoteDebugging"
)
Start-Process $chromePath -ArgumentList $args
Write-Host "Started with: $($args -join ' ')"

$maxWait = 20
$waited = 0
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2

    # Check DevToolsActivePort file
    if (Test-Path $devToolsFile) {
        $content = Get-Content $devToolsFile
        Write-Host "  DevToolsActivePort found at ${waited}s: $content"
    }

    # Check port
    $portCheck = Get-NetTCPConnection -LocalPort 9222 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Host "  Port 9222 LISTENING!"
    }

    # Check any Chrome listening ports
    $chromePids = (Get-Process chrome -ErrorAction SilentlyContinue).Id
    $chromeListening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -in $chromePids }
    if ($chromeListening) {
        foreach ($cl in $chromeListening) {
            Write-Host "  Chrome listening on port $($cl.LocalPort)"
        }
    }

    try {
        $version = Invoke-RestMethod -Uri "http://localhost:9222/json/version" -TimeoutSec 2
        Write-Host ""
        Write-Host "CDP READY! Browser: $($version.Browser)"
        $tabs = Invoke-RestMethod -Uri "http://localhost:9222/json" -TimeoutSec 2
        Write-Host "Tabs: $(($tabs | Where-Object { $_.type -eq 'page' }).Count)"
        exit 0
    } catch {
        Write-Host "  ${waited}s - not ready"
    }
}

# If CDP failed, try a fresh profile as a test
Write-Host ""
Write-Host "=== CDP FAILED on default profile. Trying temp profile... ==="
$tempProfile = "C:\Users\alto8\AppData\Local\Temp\chrome-debug-profile"
if (-not (Test-Path $tempProfile)) { New-Item -Path $tempProfile -ItemType Directory | Out-Null }

$testArgs = @(
    "--remote-debugging-port=9223",
    "--remote-allow-origins=*",
    "--user-data-dir=$tempProfile",
    "--no-first-run"
)
Start-Process $chromePath -ArgumentList $testArgs
Write-Host "Started test instance on port 9223..."
Start-Sleep -Seconds 5

try {
    $version = Invoke-RestMethod -Uri "http://localhost:9223/json/version" -TimeoutSec 3
    Write-Host "TEMP PROFILE CDP WORKS! Browser: $($version.Browser)"
    Write-Host "This means the issue is with the default profile."
    # Kill the temp instance
    # Don't kill - let user decide
    exit 0
} catch {
    Write-Host "Temp profile CDP also failed: $($_.Exception.Message)"
    exit 1
}
