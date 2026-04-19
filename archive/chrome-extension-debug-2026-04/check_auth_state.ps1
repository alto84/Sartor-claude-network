# Search for any auth/token files related to Claude Code
$paths = @(
    "$env:USERPROFILE\.claude",
    "$env:APPDATA\Claude",
    "$env:APPDATA\Claude Code",
    "$env:LOCALAPPDATA\Claude",
    "$env:LOCALAPPDATA\Claude Code"
)

foreach ($base in $paths) {
    if (Test-Path $base) {
        $files = Get-ChildItem $base -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "auth|token|cred|oauth|session|config" }
        foreach ($f in $files) {
            Write-Host "$($f.FullName) ($($f.Length) bytes, $($f.LastWriteTime))"
        }
    }
}

# Also check for .claude config files
$dotClaude = "$env:USERPROFILE\.claude"
if (Test-Path $dotClaude) {
    Write-Host ""
    Write-Host "=== Files in .claude root ==="
    Get-ChildItem $dotClaude -File -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  $($_.Name) ($($_.Length) bytes, $($_.LastWriteTime))"
    }
}
