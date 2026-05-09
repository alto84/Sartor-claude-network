Start-Sleep -Seconds 2
$tabs = (Invoke-WebRequest -Uri 'http://localhost:9223/json' -UseBasicParsing).Content | ConvertFrom-Json
foreach ($tab in $tabs) {
    if ($tab.type -eq 'page') {
        Write-Output "$($tab.id) | $($tab.title) | $($tab.url)"
    }
}
