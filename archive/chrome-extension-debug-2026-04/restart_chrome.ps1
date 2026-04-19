# Restart Chrome with CDP debugging enabled
Write-Host "=== Stopping Chrome ==="
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$running = Get-Process chrome -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "Chrome still running, force killing..."
    Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host "Chrome stopped"

Write-Host ""
Write-Host "=== Starting Chrome with CDP ==="
$chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
Start-Process $chromePath -ArgumentList "--remote-debugging-port=9222", "--restore-last-session"
Write-Host "Chrome starting..."

# Wait for CDP to become available
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2
    try {
        $version = Invoke-RestMethod -Uri "http://localhost:9222/json/version" -TimeoutSec 3
        Write-Host "CDP READY after ${waited}s!"
        Write-Host "  Browser: $($version.Browser)"
        Write-Host "  Protocol: $($version.'Protocol-Version')"
        Write-Host "  V8: $($version.'V8-Version')"
        Write-Host "  WebSocket: $($version.webSocketDebuggerUrl)"

        # List tabs
        Write-Host ""
        Write-Host "=== Open Tabs ==="
        $tabs = Invoke-RestMethod -Uri "http://localhost:9222/json" -TimeoutSec 3
        $count = 0
        foreach ($tab in $tabs) {
            if ($tab.type -eq "page") {
                $count++
                $title = if ($tab.title.Length -gt 50) { $tab.title.Substring(0, 50) + "..." } else { $tab.title }
                Write-Host "  [$count] $title"
                Write-Host "      URL: $($tab.url)"
                Write-Host "      ID: $($tab.id)"
            }
        }
        Write-Host ""
        Write-Host "Total page tabs: $count"
        exit 0
    } catch {
        Write-Host "  Waiting... (${waited}s)"
    }
}
Write-Host "CDP did not become available after ${maxWait}s!"
exit 1
