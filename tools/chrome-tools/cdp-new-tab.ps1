# Create a new tab in the automation Chrome
param(
    [Parameter(Mandatory=$false)][string]$Url = "about:blank"
)

. "$PSScriptRoot\cdp-common.ps1"

try {
    $newTab = Invoke-RestMethod -Uri "$($script:CDP_BASE)/json/new?$Url" -TimeoutSec 5
    Write-Host "New tab created!"
    Write-Host "  ID: $($newTab.id)"
    Write-Host "  URL: $($newTab.url)"
    Write-Host "  Title: $($newTab.title)"
} catch {
    Write-Error "Failed to create tab: $($_.Exception.Message)"
}
