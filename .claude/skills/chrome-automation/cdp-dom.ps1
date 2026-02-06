# Get page text content via CDP
param(
    [Parameter(Mandatory=$false)][string]$TabId,
    [Parameter(Mandatory=$false)][switch]$Html,
    [Parameter(Mandatory=$false)][switch]$Title
)

. "$PSScriptRoot\cdp-common.ps1"

if (-not $TabId) {
    $tabs = Get-CDPTabs
    if ($tabs) { $TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id } }
    else { Write-Error "No tabs available"; exit 1 }
}

if ($Title) {
    $result = Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{
        expression = "document.title"
        returnByValue = $true
    }
    Write-Output $result.result.result.value
} elseif ($Html) {
    $result = Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{
        expression = "document.documentElement.outerHTML"
        returnByValue = $true
    }
    Write-Output $result.result.result.value
} else {
    # Get readable text content
    $result = Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{
        expression = "document.body.innerText"
        returnByValue = $true
    }
    Write-Output $result.result.result.value
}
