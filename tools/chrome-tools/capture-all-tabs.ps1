param(
    [int]$StartTab = 0,
    [int]$EndTab = 13
)

. "$PSScriptRoot\cdp-common.ps1"

$tabs = Get-CDPTabs
$TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id }

$tabNames = @(
    "overview", "pre-infusion", "day1-monitor", "crs-monitor",
    "icans", "hlh-screen", "hematologic", "discharge",
    "clinical-visit", "population-risk", "mitigation-explorer",
    "signal-detection", "executive-summary", "clinical-safety-plan"
)

for ($i = $StartTab; $i -le $EndTab; $i++) {
    $btnIdx = $i + 4  # tabs start at button index 4
    $name = $tabNames[$i]

    # Click the tab
    $clickExpr = "document.querySelectorAll('button')[$btnIdx].click(); 'clicked $name'"
    $null = Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{
        expression = $clickExpr
        returnByValue = $true
    } -TimeoutSec 10

    Start-Sleep -Milliseconds 800

    # Take screenshot
    $outPath = "C:\Users\alto8\chrome-tools\tab-$name.png"
    $result = Invoke-CDPMethod -TabId $TabId -Method "Page.captureScreenshot" -Params @{
        format = "png"
    } -TimeoutSec 15

    if ($result.result -and $result.result.data) {
        $bytes = [Convert]::FromBase64String($result.result.data)
        [System.IO.File]::WriteAllBytes($outPath, $bytes)
        Write-Host "Tab $i ($name): saved $($bytes.Length) bytes"
    } else {
        Write-Host "Tab $i ($name): FAILED"
    }
}

Write-Host "Done. Captured tabs $StartTab to $EndTab."
