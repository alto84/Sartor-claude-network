# Click at coordinates or on a CSS selector in a tab
param(
    [Parameter(Mandatory=$false)][string]$TabId,
    [Parameter(Mandatory=$false)][int]$X = -1,
    [Parameter(Mandatory=$false)][int]$Y = -1,
    [Parameter(Mandatory=$false)][string]$Selector
)

. "$PSScriptRoot\cdp-common.ps1"

if (-not $TabId) {
    $tabs = Get-CDPTabs
    if ($tabs) { $TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id } }
    else { Write-Error "No tabs available"; exit 1 }
}

if ($Selector) {
    # Find element by selector and get its center coordinates
    $jsExpr = @"
(function() {
    var el = document.querySelector('$Selector');
    if (!el) return JSON.stringify({error: 'Element not found: $Selector'});
    var rect = el.getBoundingClientRect();
    return JSON.stringify({
        x: rect.left + rect.width/2,
        y: rect.top + rect.height/2,
        tag: el.tagName,
        text: (el.textContent || '').substring(0, 100)
    });
})()
"@
    $findResult = Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{
        expression = $jsExpr
        returnByValue = $true
    }
    $info = $findResult.result.result.value | ConvertFrom-Json
    if ($info.error) {
        Write-Error $info.error
        exit 1
    }
    $X = [int]$info.x
    $Y = [int]$info.y
    Write-Host "Found <$($info.tag)> at ($X, $Y): $($info.text)"
}

if ($X -lt 0 -or $Y -lt 0) {
    Write-Error "Must specify -X/-Y coordinates or -Selector"
    exit 1
}

# Dispatch mouse events
$mouseParams = @{ type = "mousePressed"; x = $X; y = $Y; button = "left"; clickCount = 1 }
Invoke-CDPMethod -TabId $TabId -Method "Input.dispatchMouseEvent" -Params $mouseParams | Out-Null

$mouseParams.type = "mouseReleased"
Invoke-CDPMethod -TabId $TabId -Method "Input.dispatchMouseEvent" -Params $mouseParams | Out-Null

Write-Host "Clicked at ($X, $Y)"
