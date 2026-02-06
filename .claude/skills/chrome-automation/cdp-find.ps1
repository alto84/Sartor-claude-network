# Find elements by CSS selector, return text and bounding boxes
param(
    [Parameter(Mandatory=$false)][string]$TabId,
    [Parameter(Mandatory=$true)][string]$Selector,
    [Parameter(Mandatory=$false)][int]$Limit = 20
)

. "$PSScriptRoot\cdp-common.ps1"

if (-not $TabId) {
    $tabs = Get-CDPTabs
    if ($tabs) { $TabId = if ($tabs -is [array]) { $tabs[0].id } else { $tabs.id } }
    else { Write-Error "No tabs available"; exit 1 }
}

$jsExpr = @"
(function() {
    var els = document.querySelectorAll('$Selector');
    var results = [];
    var limit = Math.min(els.length, $Limit);
    for (var i = 0; i < limit; i++) {
        var el = els[i];
        var rect = el.getBoundingClientRect();
        results.push({
            index: i,
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 200),
            href: el.href || null,
            value: el.value || null,
            bounds: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
            visible: rect.width > 0 && rect.height > 0
        });
    }
    return JSON.stringify({ total: els.length, results: results });
})()
"@

$result = Invoke-CDPMethod -TabId $TabId -Method "Runtime.evaluate" -Params @{
    expression = $jsExpr
    returnByValue = $true
}

$data = $result.result.result.value | ConvertFrom-Json
Write-Host "Found $($data.total) elements matching '$Selector' (showing first $($data.results.Count)):"
Write-Host ""
foreach ($el in $data.results) {
    $text = if ($el.text.Length -gt 80) { $el.text.Substring(0, 80) + "..." } else { $el.text }
    $vis = if ($el.visible) { "" } else { " [hidden]" }
    Write-Host "  [$($el.index)] <$($el.tag)>$vis at ($($el.bounds.x),$($el.bounds.y) $($el.bounds.w)x$($el.bounds.h))"
    if ($text) { Write-Host "      Text: $text" }
    if ($el.href) { Write-Host "      Href: $($el.href)" }
    Write-Host ""
}
