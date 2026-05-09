# Temporarily rename the Claude Desktop native messaging host registry key
# so Chrome's extension connects to Claude Code's host instead

$desktopKeyPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_browser_extension"
$backupKeyPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_browser_extension_DISABLED"

if (Test-Path $desktopKeyPath) {
    # Read current value
    $val = (Get-ItemProperty $desktopKeyPath).'(default)'
    Write-Output "Current Desktop host: $val"

    # Rename key to disable it
    Rename-Item -Path $desktopKeyPath -NewName "com.anthropic.claude_browser_extension_DISABLED" -ErrorAction SilentlyContinue
    if (Test-Path $backupKeyPath) {
        Write-Output "DISABLED Desktop native host (renamed key)"
    } else {
        Write-Output "ERROR: Could not rename key"
    }
} else {
    Write-Output "Desktop key not found (may already be disabled)"
}

# Verify Claude Code key still exists
$codeKeyPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.anthropic.claude_code_browser_extension"
if (Test-Path $codeKeyPath) {
    $codeVal = (Get-ItemProperty $codeKeyPath).'(default)'
    Write-Output "Claude Code host still active: $codeVal"
} else {
    Write-Output "ERROR: Claude Code host key missing!"
}
