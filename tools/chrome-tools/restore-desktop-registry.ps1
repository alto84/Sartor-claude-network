# Restore the Claude Desktop native messaging host registry key
$backupKeyPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_browser_extension_DISABLED"
$originalName = "com.anthropic.claude_browser_extension"

if (Test-Path $backupKeyPath) {
    Rename-Item -Path $backupKeyPath -NewName $originalName -ErrorAction SilentlyContinue
    Write-Output "Restored Desktop native host registry key"
} else {
    Write-Output "Backup key not found (may already be restored)"
}
