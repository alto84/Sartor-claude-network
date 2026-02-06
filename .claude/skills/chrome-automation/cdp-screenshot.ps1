# Take a screenshot of a tab via CDP
param(
    [Parameter(Mandatory=$false)][string]$TabId,
    [Parameter(Mandatory=$false)][string]$Output = "C:\Users\alto8\chrome-tools\cdp_screenshot.png",
    [Parameter(Mandatory=$false)][string]$Format = "png",
    [Parameter(Mandatory=$false)][int]$Quality = 80
)

. "$PSScriptRoot\cdp-common.ps1"

if (-not $TabId) {
    $tabs = Get-CDPTabs
    if ($tabs) { $TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id } }
    else { Write-Error "No tabs available"; exit 1 }
}

$params = @{ format = $Format }
if ($Format -eq "jpeg") { $params.quality = $Quality }

$result = Invoke-CDPMethod -TabId $TabId -Method "Page.captureScreenshot" -Params $params -TimeoutSec 15

if ($result.result -and $result.result.data) {
    $bytes = [Convert]::FromBase64String($result.result.data)
    [System.IO.File]::WriteAllBytes($Output, $bytes)
    Write-Host "Screenshot saved to: $Output ($($bytes.Length) bytes)"
} else {
    Write-Error "Screenshot failed: $($result | ConvertTo-Json -Depth 3)"
}
