# Generate secure tokens for Sartor Life family members
# Run this to generate bearer tokens, then set them as secrets

function Generate-SecureToken {
    param([int]$length = 48)
    $bytes = New-Object byte[] $length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

Write-Host "Generating secure tokens for Sartor family members..." -ForegroundColor Cyan
Write-Host ""

$tokens = @{
    "ENZO" = Generate-SecureToken
    "ALESSIA" = Generate-SecureToken
    "NADIA" = Generate-SecureToken
    "ADMIN" = Generate-SecureToken
}

Write-Host "Generated Tokens:" -ForegroundColor Green
Write-Host "================" -ForegroundColor Green
Write-Host ""

foreach ($member in $tokens.Keys) {
    Write-Host "AUTH_TOKEN_$member`: " -NoNewline -ForegroundColor Yellow
    Write-Host $tokens[$member]
}

Write-Host ""
Write-Host "To set these as Cloudflare Worker secrets, run:" -ForegroundColor Cyan
Write-Host ""

foreach ($member in $tokens.Keys) {
    Write-Host "echo '$($tokens[$member])' | wrangler secret put AUTH_TOKEN_$member"
}

Write-Host ""
Write-Host "IMPORTANT: Save these tokens securely!" -ForegroundColor Red
Write-Host "You'll need them to authenticate with the MCP gateway." -ForegroundColor Red

# Optionally save to a file (encrypted)
$savePath = Join-Path $PSScriptRoot ".tokens.json"
$tokens | ConvertTo-Json | Out-File $savePath -Encoding UTF8
Write-Host ""
Write-Host "Tokens saved to: $savePath" -ForegroundColor Yellow
Write-Host "(Delete this file after setting up secrets!)" -ForegroundColor Red
