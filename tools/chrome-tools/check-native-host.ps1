# Check if the native host bat file can actually run
$batPath = "C:\Users\alto8\.claude\chrome\chrome-native-host.bat"
Write-Output "Bat exists: $(Test-Path $batPath)"

# Check the node path referenced in the bat
$nodePath = "C:\Program Files\nodejs\node.exe"
$cliPath = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js"
Write-Output "Node exists: $(Test-Path $nodePath)"
Write-Output "CLI exists: $(Test-Path $cliPath)"

# Check Claude Code version
$ver = & $nodePath $cliPath --version 2>&1
Write-Output "Claude Code version: $ver"

# Check if the extension is communicating - look for native host log
$logPath = "C:\Users\alto8\.claude\chrome"
if (Test-Path $logPath) {
    Get-ChildItem $logPath | ForEach-Object { Write-Output "  $($_.Name) ($($_.Length) bytes, $($_.LastWriteTime))" }
}

# Check extension manifest for native messaging permission
$manifestPath = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn\1.0.47_0\manifest.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    Write-Output "Extension permissions: $($manifest.permissions -join ', ')"
    if ($manifest.permissions -contains 'nativeMessaging') {
        Write-Output "nativeMessaging permission: YES"
    } else {
        Write-Output "nativeMessaging permission: NOT FOUND"
    }
} else {
    Write-Output "Manifest not found at $manifestPath"
}
