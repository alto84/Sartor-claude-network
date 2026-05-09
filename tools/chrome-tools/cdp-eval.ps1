# Execute JavaScript in a tab and return the result
param(
    [Parameter(Mandatory=$false)][string]$TabId,
    [Parameter(Mandatory=$true)][string]$Expression
)

. "$PSScriptRoot\cdp-common.ps1"

if (-not $TabId) {
    $tabs = Get-CDPTabs
    if ($tabs) { $TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id } }
    else { Write-Error "No tabs available"; exit 1 }
}

$result = Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{
    expression = $Expression
    returnByValue = $true
    awaitPromise = $true
} -TimeoutSec 15

if ($result.result -and $result.result.result) {
    $r = $result.result.result
    if ($r.type -eq "string") {
        Write-Output $r.value
    } elseif ($r.type -eq "object" -or $r.type -eq "array") {
        Write-Output ($r.value | ConvertTo-Json -Depth 5)
    } elseif ($r.value -ne $null) {
        Write-Output $r.value
    } elseif ($r.description) {
        Write-Output $r.description
    } else {
        Write-Output ($r | ConvertTo-Json -Depth 3)
    }
    if ($result.result.exceptionDetails) {
        Write-Error "Exception: $($result.result.exceptionDetails.text)"
    }
} else {
    Write-Output ($result | ConvertTo-Json -Depth 5)
}
