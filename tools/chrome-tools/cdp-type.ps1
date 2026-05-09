# Type text into the focused element in a tab
param(
    [Parameter(Mandatory=$false)][string]$TabId,
    [Parameter(Mandatory=$true)][string]$Text,
    [Parameter(Mandatory=$false)][string]$Selector
)

. "$PSScriptRoot\cdp-common.ps1"

if (-not $TabId) {
    $tabs = Get-CDPTabs
    if ($tabs) { $TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id } }
    else { Write-Error "No tabs available"; exit 1 }
}

# If selector given, focus it first
if ($Selector) {
    $focusJs = "document.querySelector('$Selector')?.focus()"
    Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{ expression = $focusJs } | Out-Null
    Start-Sleep -Milliseconds 200
}

# Type each character
Invoke-CDPMethod -TabId $TabId -Method "Input.insertText" -Params @{ text = $Text } | Out-Null
Write-Host "Typed: $Text"
