# Search for any auth/token files related to Claude Code
Write-Output "=== Searching for auth tokens ==="
$paths = @(
    "C:\Users\alto8\AppData\Local\Claude",
    "C:\Users\alto8\AppData\Roaming\Claude",
    "C:\Users\alto8\AppData\Local\AnthropicClaude",
    "C:\Users\alto8\AppData\Roaming\AnthropicClaude",
    "C:\Users\alto8\.claude"
)
foreach ($p in $paths) {
    if (Test-Path $p) {
        Write-Output "`n--- $p ---"
        Get-ChildItem $p -File -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Output "  $($_.Name) ($($_.Length) bytes, $($_.LastWriteTime))"
        }
    }
}

Write-Output "`n=== Check for credentialsDir in Claude Code source ==="
$cliJs = "C:\Users\alto8\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js"
if (Test-Path $cliJs) {
    # Search for oauth/auth/token patterns in the bundled code
    $content = Get-Content $cliJs -Raw
    $matches = [regex]::Matches($content, 'chrome[_-]?(?:auth|oauth|token|credential)[^"''`\s]{0,50}', 'IgnoreCase')
    Write-Output "  Found $($matches.Count) chrome auth references"
    $matches | Select-Object -First 10 | ForEach-Object { Write-Output "    $($_.Value)" }
}

Write-Output "`n=== Electron app auth state ==="
$electronAuth = "C:\Users\alto8\AppData\Roaming\Claude\Local State"
if (Test-Path $electronAuth) {
    $json = Get-Content $electronAuth -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($json) { Write-Output "  Local State exists" }
}

# Check if there's a session key or cookie
$cookiesDb = "C:\Users\alto8\AppData\Roaming\Claude\Cookies"
if (Test-Path $cookiesDb) { Write-Output "  Cookies DB exists ($((Get-Item $cookiesDb).Length) bytes)" }
