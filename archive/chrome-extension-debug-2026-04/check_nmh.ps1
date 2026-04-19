$keys = @(
    "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_browser_extension",
    "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_code_browser_extension"
)
foreach ($key in $keys) {
    $val = (Get-ItemProperty -Path $key -ErrorAction SilentlyContinue).'(default)'
    Write-Host "Registry: $key"
    Write-Host "  Value: $val"
    if ($val -and (Test-Path $val)) {
        Write-Host "  File EXISTS"
        Get-Content $val | Write-Host
    } else {
        Write-Host "  File MISSING or path empty"
    }
    Write-Host ""
}
