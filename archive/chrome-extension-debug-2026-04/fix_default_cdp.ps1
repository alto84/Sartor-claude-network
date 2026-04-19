# Kill all Chrome instances
Write-Host "=== Killing ALL Chrome ==="
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Remove lock files
Remove-Item "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\lockfile" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\SingletonLock" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\DevToolsActivePort" -Force -ErrorAction SilentlyContinue

# Ensure no Chrome processes remain
Start-Sleep -Seconds 2
$remaining = Get-Process chrome -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Host "Force killing $($remaining.Count) remaining processes..."
    $remaining | Stop-Process -Force
    Start-Sleep -Seconds 2
}
Write-Host "All Chrome killed"

# Test 1: Default profile with extensions disabled
Write-Host ""
Write-Host "=== Test 1: Default profile, extensions DISABLED ==="
$chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
$args1 = @(
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--disable-extensions",
    "--restore-last-session",
    "--no-first-run"
)
Start-Process $chromePath -ArgumentList $args1
Write-Host "Started with extensions disabled..."

Start-Sleep -Seconds 8
try {
    $version = Invoke-RestMethod -Uri "http://localhost:9222/json/version" -TimeoutSec 3
    Write-Host "SUCCESS! CDP works with extensions disabled!"
    Write-Host "  Browser: $($version.Browser)"

    $tabs = Invoke-RestMethod -Uri "http://localhost:9222/json" -TimeoutSec 3
    $pages = $tabs | Where-Object { $_.type -eq "page" }
    Write-Host "  Tabs: $($pages.Count)"

    # Show first few tabs
    $i = 0
    foreach ($t in $pages) {
        $i++
        if ($i -le 5) {
            $title = if ($t.title.Length -gt 60) { $t.title.Substring(0, 60) + "..." } else { $t.title }
            Write-Host "    [$i] $title"
        }
    }
    if ($i -gt 5) { Write-Host "    ... and $($i-5) more" }

    Write-Host ""
    Write-Host "ROOT CAUSE: An extension was blocking CDP!"
    Write-Host "To use CDP with extensions, the conflicting extension must be identified."
    exit 0
} catch {
    Write-Host "FAILED - extensions are not the issue"

    # Kill and try test 2
    Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3

    Write-Host ""
    Write-Host "=== Test 2: Default profile with --headless=new ==="
    $args2 = @(
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--restore-last-session"
    )
    Start-Process $chromePath -ArgumentList $args2
    Start-Sleep -Seconds 10

    # Check DevToolsActivePort one more time
    $devToolsFile = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\DevToolsActivePort"
    if (Test-Path $devToolsFile) {
        Write-Host "DevToolsActivePort: $(Get-Content $devToolsFile)"
    }

    try {
        $version = Invoke-RestMethod -Uri "http://localhost:9222/json/version" -TimeoutSec 3
        Write-Host "SUCCESS on test 2!"
        exit 0
    } catch {
        Write-Host "Test 2 also failed"
        exit 1
    }
}
