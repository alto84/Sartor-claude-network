# Check for API key in environment
if ($env:ANTHROPIC_API_KEY) {
    $masked = $env:ANTHROPIC_API_KEY.Substring(0, 10) + "..." + $env:ANTHROPIC_API_KEY.Substring($env:ANTHROPIC_API_KEY.Length - 4)
    Write-Host "ANTHROPIC_API_KEY is SET: $masked"
} else {
    Write-Host "ANTHROPIC_API_KEY is NOT SET"
}

if ($env:CLAUDE_CODE_USE_BEDROCK) {
    Write-Host "CLAUDE_CODE_USE_BEDROCK: $env:CLAUDE_CODE_USE_BEDROCK"
}

if ($env:CLAUDE_CODE_USE_VERTEX) {
    Write-Host "CLAUDE_CODE_USE_VERTEX: $env:CLAUDE_CODE_USE_VERTEX"
}

# Check for auth files
$authPaths = @(
    "$env:USERPROFILE\.claude\credentials.json",
    "$env:USERPROFILE\.claude\auth.json",
    "$env:APPDATA\Claude\auth.json",
    "$env:APPDATA\Claude Code\auth.json"
)
foreach ($p in $authPaths) {
    if (Test-Path $p) {
        Write-Host "Auth file found: $p"
    }
}
