# Navigate a tab to a URL
param(
    [Parameter(Mandatory=$false)][string]$TabId,
    [Parameter(Mandatory=$true)][string]$Url
)

. "$PSScriptRoot\cdp-common.ps1"

# If no TabId, use the first tab or create one
if (-not $TabId) {
    $tabs = Get-CDPTabs
    if ($tabs) {
        $TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id }
    } else {
        # Create a new tab via PUT
        $newTab = Invoke-RestMethod -Uri "$($script:CDP_BASE)/json/new?$Url" -Method Put -TimeoutSec 5
        Write-Host "Created new tab: $($newTab.id)"
        Write-Host "Navigated to: $Url"
        exit 0
    }
}

$result = Invoke-CDPMethod -TabId $TabId -Method "Page.navigate" -Params @{ url = $Url } -TimeoutSec 15
if ($result.result) {
    Write-Host "Navigated tab $TabId to: $Url"
    if ($result.result.errorText) {
        Write-Host "  Error: $($result.result.errorText)"
    }
} else {
    Write-Host "Navigation failed: $($result | ConvertTo-Json -Depth 3)"
}
