# Firestore Quick Start

## TL;DR

Firestore is now available as a drop-in replacement for Firebase Realtime Database. It often works out-of-the-box on new Firebase projects without requiring manual database creation.

## Quick Test

```bash
npm run test:firestore
```

If you see "✓ All tests passed!", Firestore is working and you can use it immediately.

## Switch to Firestore (3 Steps)

### Step 1: Test Connectivity

```bash
npm run test:firestore
```

### Step 2: Update memory-server.ts

Replace this:

```typescript
import { MultiTierStore } from './multi-tier-store.js';
const multiTierStore = new MultiTierStore();
```

With this:

```typescript
import { FirestoreMultiTierStore } from './firestore-multi-tier-store.js';
const multiTierStore = new FirestoreMultiTierStore();
```

### Step 3: Restart MCP Server

```bash
npm run mcp        # for stdio (Claude Desktop)
npm run mcp:http   # for HTTP (agents)
```

## What You Get

- **Hot tier storage** working immediately (no manual database creation)
- **Same interface** - all existing code works unchanged
- **Automatic fallback** - uses file storage if Firestore unavailable
- **Better scalability** - Firestore scales better than Realtime Database
- **Advanced queries** - More flexible query capabilities

## Requirements

Same as before:

- Service account credentials configured (one of):
  - `GOOGLE_APPLICATION_CREDENTIALS` env var
  - `config/service-account.json` file
  - `FIREBASE_SERVICE_ACCOUNT_BASE64` env var

## No Additional Config Needed

Unlike Realtime Database which requires:

- ❌ Manual database creation in Firebase Console
- ❌ Database URL configuration

Firestore just needs:

- ✅ Service account credentials (already have this)
- ✅ Firestore enabled (often auto-enabled on new projects)

## Troubleshooting

### Test shows "Firestore not available"

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Firestore Database" in left sidebar
4. If you see "Create database" button, click it
5. Choose production mode
6. Select a region
7. Run `npm run test:firestore` again

### Still not working?

Check:

- Service account credentials are valid
- Service account has "Cloud Datastore User" role
- Internet connectivity to firestore.googleapis.com

## Full Documentation

See `/home/user/Sartor-claude-network/docs/FIRESTORE_INTEGRATION.md` for complete details on:

- Integration options
- Migration strategies
- Performance considerations
- API reference

## Files Created

- `/src/mcp/firestore-store.ts` - Firestore-backed memory store
- `/src/mcp/firestore-multi-tier-store.ts` - Multi-tier with Firestore hot tier
- `/src/mcp/test-firestore.ts` - Connectivity test script
- `/docs/FIRESTORE_INTEGRATION.md` - Complete integration guide

## Summary

Firestore is ready to use as a drop-in replacement for Realtime Database. Test it with `npm run test:firestore`, and if it works, you can switch immediately with minimal code changes.
