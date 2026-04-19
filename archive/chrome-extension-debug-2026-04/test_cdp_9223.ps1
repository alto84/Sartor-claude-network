try {
    $version = Invoke-RestMethod -Uri "http://localhost:9223/json/version" -TimeoutSec 3
    Write-Host "CDP WORKING!"
    Write-Host "  Browser: $($version.Browser)"
    Write-Host "  Protocol: $($version.'Protocol-Version')"
    Write-Host "  WebSocket: $($version.webSocketDebuggerUrl)"

    Write-Host ""
    $tabs = Invoke-RestMethod -Uri "http://localhost:9223/json" -TimeoutSec 3
    $pages = $tabs | Where-Object { $_.type -eq "page" }
    Write-Host "Tabs ($($pages.Count)):"
    foreach ($t in $pages) {
        Write-Host "  ID: $($t.id)"
        Write-Host "  Title: $($t.title)"
        Write-Host "  URL: $($t.url)"
        Write-Host "  WS: $($t.webSocketDebuggerUrl)"
        Write-Host ""
    }
} catch {
    Write-Host "CDP failed: $($_.Exception.Message)"
}
