# List all open tabs in the automation Chrome
. "$PSScriptRoot\cdp-common.ps1"

$tabs = Get-CDPTabs
if (-not $tabs) { exit 1 }

$i = 0
foreach ($t in $tabs) {
    $i++
    $title = if ($t.title.Length -gt 70) { $t.title.Substring(0, 70) + "..." } else { $t.title }
    Write-Host "[$i] $title"
    Write-Host "    URL: $($t.url)"
    Write-Host "    ID:  $($t.id)"
    Write-Host ""
}
Write-Host "Total: $i tab(s)"
