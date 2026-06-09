#!/bin/bash
# Setup script for Sartor Life Worker KV namespaces
# Run this before first deployment

echo "Creating KV namespaces for Sartor Life Worker..."

# Create KV namespaces
echo "Creating VAULT_KV namespace..."
wrangler kv:namespace create "VAULT_KV"

echo "Creating MEMORY_KV namespace..."
wrangler kv:namespace create "MEMORY_KV"

echo "Creating CHAT_KV namespace..."
wrangler kv:namespace create "CHAT_KV"

echo "Creating RATE_LIMIT_KV namespace..."
wrangler kv:namespace create "RATE_LIMIT_KV"

# Create preview namespaces for development
echo "Creating preview namespaces..."
wrangler kv:namespace create "VAULT_KV" --preview
wrangler kv:namespace create "MEMORY_KV" --preview
wrangler kv:namespace create "CHAT_KV" --preview
wrangler kv:namespace create "RATE_LIMIT_KV" --preview

echo ""
echo "=========================================="
echo "KV namespaces created!"
echo ""
echo "IMPORTANT: Copy the namespace IDs from above"
echo "and update wrangler.toml with the correct values."
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with the KV namespace IDs"
echo "2. Set up secrets:"
echo "   wrangler secret put AUTH_TOKEN_ENZO"
echo "   wrangler secret put AUTH_TOKEN_ALESSIA"
echo "   wrangler secret put AUTH_TOKEN_NADIA"
echo "   wrangler secret put AUTH_TOKEN_ADMIN"
echo ""
echo "3. Deploy:"
echo "   wrangler deploy"
echo "=========================================="
