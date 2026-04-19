# Check all extension versions on disk
Write-Host "=== Extension versions on disk ==="
$extDir = "C:\Users\alto8\AppData\Local\Google\Chrome\User Data\Default\Extensions\fcoeoabgfenejglbffodgkkbkcdhcgfn"
if (Test-Path $extDir) {
    Get-ChildItem $extDir -Directory | ForEach-Object {
        Write-Host "  Version: $($_.Name)"
        $mf = Join-Path $_.FullName "manifest.json"
        if (Test-Path $mf) {
            $json = Get-Content $mf | ConvertFrom-Json
            Write-Host "    manifest.version: $($json.version)"
            Write-Host "    name: $($json.name)"
            # Check for native messaging
            if ($json.permissions) {
                Write-Host "    permissions: $($json.permissions -join ', ')"
            }
        }
        # Check background script
        $bgDir = Join-Path $_.FullName "background"
        if (Test-Path $bgDir) {
            Write-Host "    background files:"
            Get-ChildItem $bgDir | ForEach-Object { Write-Host "      $($_.Name) ($($_.Length) bytes)" }
        }
    }
}

# Check native messaging host manifest
Write-Host ""
Write-Host "=== Native messaging host manifest ==="
$nmhManifest = "C:\Users\alto8\AppData\Roaming\Claude Code\ChromeNativeHost\com.anthropic.claude_code_browser_extension.json"
if (Test-Path $nmhManifest) {
    Get-Content $nmhManifest
}

# Check the bat file
Write-Host ""
Write-Host "=== Native host bat file ==="
$bat = "C:\Users\alto8\.claude\chrome\chrome-native-host.bat"
if (Test-Path $bat) {
    Get-Content $bat
    Write-Host "  Modified: $((Get-Item $bat).LastWriteTime)"
}

# Try to find where the new native host might be logging
Write-Host ""
Write-Host "=== Recent log files anywhere in Claude dirs ==="
$searchDirs = @(
    "C:\Users\alto8\AppData\Local\Claude",
    "C:\Users\alto8\AppData\Roaming\Claude Code",
    "C:\Users\alto8\.claude"
)
foreach ($dir in $searchDirs) {
    if (Test-Path $dir) {
        Get-ChildItem $dir -Recurse -Filter "*.log" -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-1) } |
            ForEach-Object {
                Write-Host "  $($_.FullName) - Size=$($_.Length) Modified=$($_.LastWriteTime)"
            }
    }
}
