# Firebase Integration for MCP Memory System

This directory contains Firebase integration code for the MCP memory system, supporting both Firestore and Realtime Database as hot-tier storage backends.

## Quick Start

### Check Which Backends Are Available

```bash
npm run test:firebase-backends
```

This will test both Firestore and Realtime Database and recommend which to use.

### Test Firestore Specifically

```bash
npm run test:firestore
```

## File Overview

### Core Implementations

#### `firebase-init.ts`

Firebase Admin SDK initialization with multi-source credential loading.

**Features:**

- Loads credentials from 3 sources (env var, config file, base64 env)
- Supports both Firestore and Realtime Database
- Safe to call multiple times (idempotent)
- Logs to stderr to maintain MCP protocol compliance

#### `firebase-store.ts`

Realtime Database-backed memory store.

**Use when:**

- You already have Realtime Database set up
- You need the lowest latency (20-50ms)
- You have complex nested data structures

**Requires:**

- Service account credentials
- `FIREBASE_DATABASE_URL` environment variable OR `config/firebase-config.json`
- Manual database creation in Firebase Console

#### `firestore-store.ts`

Firestore-backed memory store (NEW).

**Use when:**

- You're starting fresh (recommended)
- Realtime Database is not yet set up
- You want better scalability
- You need advanced query capabilities

**Requires:**

- Service account credentials only (no additional config!)
- Firestore enabled (often auto-enabled)

#### `multi-tier-store.ts`

Multi-tier store using Realtime Database as hot tier.

**Tiers:**

- Hot: Realtime Database (<100ms)
- Warm: File storage (<500ms)
- Cold: GitHub (1-5s, optional)

#### `firestore-multi-tier-store.ts`

Multi-tier store using Firestore as hot tier (NEW).

**Tiers:**

- Hot: Firestore (<100ms)
- Warm: File storage (<500ms)
- Cold: GitHub (1-5s, optional)

**Advantages:**

- No database URL configuration needed
- Works immediately on most Firebase projects
- Same interface as `multi-tier-store.ts`

#### `file-store.ts`

File-based memory store (fallback).

**Use when:**

- Firebase is not configured
- Testing locally without cloud dependencies
- Development without Firebase credentials

**Storage:**

- Location: `data/memories.json`
- Auto-creates directory if needed
- Synchronous operations

### Testing & Utilities

#### `test-firestore.ts`

Test Firestore connectivity and operations.

**Run:** `npm run test:firestore`

**Tests:**

1. Firestore initialization
2. Memory creation
3. Memory retrieval
4. Statistics gathering

#### `check-firebase-backends.ts`

Compare availability of both Firebase backends.

**Run:** `npm run test:firebase-backends`

**Outputs:**

- Availability status for each backend
- Latency measurements
- Error diagnostics
- Recommendation for which to use

### Integration

#### `memory-server.ts`

MCP server exposing memory operations as tools.

**Current:** Uses `MultiTierStore` (Realtime Database)

**To switch to Firestore:**

```typescript
// Replace this:
import { MultiTierStore } from './multi-tier-store.js';
const multiTierStore = new MultiTierStore();

// With this:
import { FirestoreMultiTierStore } from './firestore-multi-tier-store.js';
const multiTierStore = new FirestoreMultiTierStore();
```

#### `http-server.ts`

HTTP transport for MCP server (for agents).

**Port:** 3001 (default)
**Endpoint:** `http://localhost:3001/mcp`

## Configuration

### Service Account Credentials

**Required for both Firestore and Realtime Database.**

Choose one method:

1. **Environment Variable (Recommended):**

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
   ```

2. **Config File:**

   ```bash
   cp your-service-account.json config/service-account.json
   ```

3. **Base64 Environment Variable:**
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_BASE64="<base64-encoded-json>"
   ```

### Realtime Database (Additional Config)

**Required:** Database URL

**Option 1 - Environment Variable:**

```bash
export FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"
```

**Option 2 - Config File:**
Create `config/firebase-config.json`:

```json
{
  "realtimeDatabase": {
    "databaseURL": "https://your-project.firebaseio.com"
  }
}
```

### Firestore (No Additional Config!)

Firestore only needs service account credentials. No database URL or additional setup required.

## Usage Examples

### Basic Memory Operations

```typescript
import { FirestoreStore, MemoryType } from './firestore-store';

const store = new FirestoreStore();

// Create memory
const memory = await store.createMemory(
  'Important learning from user interaction',
  MemoryType.SEMANTIC,
  {
    importance_score: 0.9,
    tags: ['user-directive', 'critical'],
  }
);

// Retrieve memory
const retrieved = await store.getMemory(memory.id);

// Search memories
const results = await store.searchMemories(
  {
    type: [MemoryType.SEMANTIC],
    min_importance: 0.8,
  },
  10
);

// Get statistics
const stats = await store.getStats();
console.log(`Total memories: ${stats.total}`);
console.log(`Storage backend: ${stats.storage}`);
```

### Multi-Tier Operations

```typescript
import { FirestoreMultiTierStore } from './firestore-multi-tier-store';

const store = new FirestoreMultiTierStore();

// Check which backends are available
const status = store.getBackendStatus();
console.log('Backends:', status);
// { firestore: true, github: false, file: true }

// Create high-importance memory (auto-archived to GitHub if enabled)
const memory = await store.createMemory('Critical system directive', MemoryType.SEMANTIC, {
  importance_score: 0.95, // Will auto-archive to GitHub if score >= 0.8
  tags: ['directive', 'high-priority'],
});

// Manual archive to GitHub
await store.archiveToGitHub(memory.id);
```

### Conditional Backend Selection

```typescript
import { FirestoreMultiTierStore } from './firestore-multi-tier-store';
import { MultiTierStore } from './multi-tier-store';

// Try Firestore first, fall back to Realtime Database
const firestoreStore = new FirestoreMultiTierStore();
const rtdbStore = new MultiTierStore();

const store = firestoreStore.getBackendStatus().firestore ? firestoreStore : rtdbStore;

console.log(`Using: ${store.constructor.name}`);
```

## Performance Comparison

| Backend      | Read Latency | Write Latency | Query Complexity | Scalability |
| ------------ | ------------ | ------------- | ---------------- | ----------- |
| Firestore    | 30-60ms      | 40-80ms       | Advanced         | Excellent   |
| Realtime DB  | 20-50ms      | 30-60ms       | Basic            | Good        |
| File Storage | <5ms         | <10ms         | Limited          | Poor        |

## Troubleshooting

### "Firestore unavailable, falling back to file storage"

**Cause:** Firestore not enabled or credentials invalid

**Fix:**

1. Go to Firebase Console → Firestore Database
2. Click "Create database" if not already created
3. Verify service account has "Cloud Datastore User" role

### "Firebase unavailable, falling back to file storage"

**Cause:** Realtime Database not created or URL not configured

**Fix:**

1. Go to Firebase Console → Realtime Database
2. Click "Create database"
3. Set `FIREBASE_DATABASE_URL` environment variable

### "PERMISSION_DENIED: Missing or insufficient permissions"

**Cause:** Service account lacks required roles

**Fix:**

1. Go to Google Cloud Console → IAM & Admin
2. Find your service account
3. Add role: "Cloud Datastore User" (for Firestore)
4. Add role: "Firebase Realtime Database Admin" (for RTDB)

### "Error loading credentials"

**Cause:** Service account file not found or invalid JSON

**Fix:**

1. Verify file path in `GOOGLE_APPLICATION_CREDENTIALS`
2. Check file exists and is readable
3. Validate JSON syntax: `cat config/service-account.json | jq`

## Best Practices

1. **Start with Firestore** for new projects (easier setup)
2. **Use multi-tier stores** for production (hot/warm/cold tiers)
3. **Set appropriate importance scores**:
   - 0.9+ : Critical directives, user preferences
   - 0.7-0.8 : Important patterns, successful procedures
   - 0.5-0.7 : Regular interactions, contextual information
   - <0.5 : Temporary working memory
4. **Archive high-importance memories** to GitHub (auto at >= 0.8)
5. **Monitor storage usage** via Firebase Console
6. **Use file storage** for development/testing

## Migration Guide

### From File Storage to Firestore

```typescript
import { FileStore } from './file-store';
import { FirestoreStore } from './firestore-store';

async function migrate() {
  const fileStore = new FileStore();
  const firestoreStore = new FirestoreStore();

  // Get all memories
  const memories = fileStore.searchMemories({}, 10000);

  // Copy to Firestore
  for (const mem of memories) {
    await firestoreStore.createMemory(mem.content, mem.type, {
      importance_score: mem.importance_score,
      tags: mem.tags,
    });
  }

  console.log(`Migrated ${memories.length} memories`);
}
```

### From Realtime Database to Firestore

Use the same migration pattern, but with async operations:

```typescript
async function migrate() {
  const rtdbStore = new FirebaseStore();
  const firestoreStore = new FirestoreStore();

  const memories = await rtdbStore.searchMemories({}, 10000);

  for (const mem of memories) {
    await firestoreStore.createMemory(mem.content, mem.type, {
      importance_score: mem.importance_score,
      tags: mem.tags,
    });
  }

  console.log(`Migrated ${memories.length} memories`);
}
```

## Further Reading

- **Quick Start:** `/FIRESTORE_QUICKSTART.md`
- **Integration Guide:** `/docs/FIRESTORE_INTEGRATION.md`
- **Implementation Report:** `/FIRESTORE_IMPLEMENTATION_REPORT.md`
- **Firebase Documentation:** https://firebase.google.com/docs
- **Firestore Documentation:** https://firebase.google.com/docs/firestore
- **MCP Protocol:** https://modelcontextprotocol.io

## Support

For issues or questions:

1. Check Firebase Console for backend status
2. Run `npm run test:firebase-backends` for diagnostics
3. Review logs in stderr (MCP protocol compliance)
4. Check service account permissions in Google Cloud Console
