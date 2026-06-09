# Setup script for Sartor Life Worker KV namespaces (PowerShell)
# Run this before first deployment

Write-Host "Creating KV namespaces for Sartor Life Worker..." -ForegroundColor Cyan

# Create KV namespaces
Write-Host "`nCreating VAULT_KV namespace..." -ForegroundColor Yellow
wrangler kv:namespace create "VAULT_KV"

Write-Host "`nCreating MEMORY_KV namespace..." -ForegroundColor Yellow
wrangler kv:namespace create "MEMORY_KV"

Write-Host "`nCreating CHAT_KV namespace..." -ForegroundColor Yellow
wrangler kv:namespace create "CHAT_KV"

Write-Host "`nCreating RATE_LIMIT_KV namespace..." -ForegroundColor Yellow
wrangler kv:namespace create "RATE_LIMIT_KV"

# Create preview namespaces for development
Write-Host "`nCreating preview namespaces..." -ForegroundColor Yellow
wrangler kv:namespace create "VAULT_KV" --preview
wrangler kv:namespace create "MEMORY_KV" --preview
wrangler kv:namespace create "CHAT_KV" --preview
wrangler kv:namespace create "RATE_LIMIT_KV" --preview

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "KV namespaces created!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Copy the namespace IDs from above"
Write-Host "and update wrangler.toml with the correct values."
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update wrangler.toml with the KV namespace IDs"
Write-Host "2. Set up secrets:"
Write-Host "   wrangler secret put AUTH_TOKEN_ENZO"
Write-Host "   wrangler secret put AUTH_TOKEN_ALESSIA"
Write-Host "   wrangler secret put AUTH_TOKEN_NADIA"
Write-Host "   wrangler secret put AUTH_TOKEN_ADMIN"
Write-Host ""
Write-Host "3. Deploy:"
Write-Host "   wrangler deploy"
Write-Host "==========================================" -ForegroundColor Green
