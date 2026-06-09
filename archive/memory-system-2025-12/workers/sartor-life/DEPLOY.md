# Sartor Life MCP Gateway - Deployment Guide

## Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Node.js** 18 or later

## Quick Start

```bash
cd workers/sartor-life
npm install
```

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

## Step 2: Create KV Namespaces

Run the setup script:

**Windows (PowerShell):**
```powershell
.\scripts\setup-kv.ps1
```

**Linux/macOS:**
```bash
chmod +x scripts/setup-kv.sh
./scripts/setup-kv.sh
```

Or manually create each namespace:

```bash
wrangler kv:namespace create "VAULT_KV"
wrangler kv:namespace create "MEMORY_KV"
wrangler kv:namespace create "CHAT_KV"
wrangler kv:namespace create "RATE_LIMIT_KV"
```

## Step 3: Update wrangler.toml

Copy the namespace IDs from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "VAULT_KV"
id = "your-actual-vault-kv-id"
preview_id = "your-actual-vault-kv-preview-id"

# ... repeat for other namespaces
```

## Step 4: Generate and Set Secrets

Generate secure tokens:

```powershell
.\scripts\generate-tokens.ps1
```

Set the secrets:

```bash
wrangler secret put AUTH_TOKEN_ENZO
# Enter the generated token when prompted

wrangler secret put AUTH_TOKEN_ALESSIA
wrangler secret put AUTH_TOKEN_NADIA
wrangler secret put AUTH_TOKEN_ADMIN
```

## Step 5: Deploy

```bash
wrangler deploy
```

Your worker will be available at: `https://sartor-life.<your-subdomain>.workers.dev`

## Step 6: Configure Claude.ai MCP Connector

In Claude.ai, add a new MCP server with these settings:

```json
{
  "name": "sartor-life",
  "url": "https://sartor-life.<your-subdomain>.workers.dev/mcp",
  "transport": "http",
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN_HERE"
  }
}
```

## Testing

### Health Check

```bash
curl https://sartor-life.<your-subdomain>.workers.dev/health
```

### Info Endpoint

```bash
curl https://sartor-life.<your-subdomain>.workers.dev/info
```

### MCP Request

```bash
curl -X POST https://sartor-life.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Local Development

```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`.

## Environments

### Production

```bash
wrangler deploy --env production
```

### Staging

```bash
wrangler deploy --env staging
```

## Monitoring

View real-time logs:

```bash
wrangler tail
```

## Troubleshooting

### "KV namespace not found"

Make sure you've created the KV namespaces and updated `wrangler.toml` with the correct IDs.

### "Authentication failed"

Verify your bearer token is set correctly as a secret:

```bash
wrangler secret list
```

### Rate Limit Errors (429)

Default rate limit is 60 requests/minute. Adjust in `wrangler.toml`:

```toml
[vars]
MAX_REQUESTS_PER_MINUTE = "120"
```

## Security Notes

1. **Never commit tokens** to version control
2. **Rotate tokens** periodically
3. **Use different tokens** for each family member
4. **Monitor access** via Cloudflare dashboard
