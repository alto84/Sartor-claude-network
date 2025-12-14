# Firestore Integration Guide

## Overview

This project now includes Firestore as an alternative hot-tier storage backend to Firebase Realtime Database. Firestore is often auto-enabled on new Firebase projects and doesn't require manual database creation, making it a better choice for projects where Realtime Database is blocked.

## Why Firestore?

**Problem with Realtime Database:**

- Requires manual creation in Firebase Console
- User must explicitly enable it before it can be used
- Blocks the entire Firebase integration until database is created

**Advantages of Firestore:**

- Often automatically enabled on new Firebase projects
- No manual database creation required
- Same authentication and service account credentials
- Similar performance characteristics for hot-tier storage

## Files Created

### 1. `/src/mcp/firestore-store.ts`

A drop-in replacement for `firebase-store.ts` that uses Firestore instead of Realtime Database.

**Key features:**

- Implements the same interface as `FirebaseStore`
- Uses Firestore collections instead of Realtime Database paths
- Automatic fallback to file storage if Firestore unavailable
- Same Memory interface and MemoryType enum

### 2. `/src/mcp/firestore-multi-tier-store.ts`

A multi-tier store implementation using Firestore as the hot tier.

**Key features:**

- Hot tier: Firestore (<100ms)
- Warm tier: File storage (<500ms)
- Cold tier: GitHub (1-5s)
- Automatic tier selection based on importance scores
- Same interface as `MultiTierStore`

### 3. `/src/mcp/test-firestore.ts`

A test script to verify Firestore connectivity.

**Usage:**

```bash
npx ts-node src/mcp/test-firestore.ts
```

## Integration Options

### Option 1: Switch Existing Code to Firestore

Replace imports in your code:

```typescript
// OLD (Realtime Database)
import { FirebaseStore } from './firebase-store';
const store = new FirebaseStore();

// NEW (Firestore)
import { FirestoreStore } from './firestore-store';
const store = new FirestoreStore();
```

For multi-tier:

```typescript
// OLD (Realtime Database)
import { MultiTierStore } from './multi-tier-store';
const store = new MultiTierStore();

// NEW (Firestore)
import { FirestoreMultiTierStore } from './firestore-multi-tier-store';
const store = new FirestoreMultiTierStore();
```

### Option 2: Conditional Selection (Recommended)

Automatically choose the best available backend:

```typescript
import { FirebaseStore } from './firebase-store';
import { FirestoreStore } from './firestore-store';

// Try Firestore first, fall back to Realtime Database
const createStore = () => {
  // Test Firestore
  const firestoreStore = new FirestoreStore();
  if (firestoreStore.isUsingFirestore()) {
    console.log('Using Firestore for hot tier');
    return firestoreStore;
  }

  // Fall back to Realtime Database
  console.log('Firestore unavailable, trying Realtime Database');
  const firebaseStore = new FirebaseStore();
  if (firebaseStore.isUsingFirebase()) {
    console.log('Using Realtime Database for hot tier');
    return firebaseStore;
  }

  // Both failed, will use file storage
  console.log('Using file storage only');
  return firestoreStore; // Will use fallback
};

const store = createStore();
```

### Option 3: Environment Variable Control

Add environment variable to select backend:

```typescript
import { FirebaseStore } from './firebase-store';
import { FirestoreStore } from './firestore-store';

const BACKEND = process.env.FIREBASE_BACKEND || 'firestore'; // 'firestore' or 'realtime'

const store = BACKEND === 'firestore' ? new FirestoreStore() : new FirebaseStore();
```

## Configuration

Both Firestore and Realtime Database use the same configuration:

### Service Account Credentials

One of the following (in priority order):

1. **GOOGLE_APPLICATION_CREDENTIALS** environment variable:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
   ```

2. **config/service-account.json** file:

   ```bash
   cp your-service-account.json config/service-account.json
   ```

3. **FIREBASE_SERVICE_ACCOUNT_BASE64** environment variable:
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_BASE64="<base64-encoded-json>"
   ```

### Firestore vs Realtime Database

**Firestore:**

- No additional configuration needed
- Automatically uses Firestore if service account has access
- Check: Go to Firebase Console → Firestore Database

**Realtime Database:**

- Requires database URL configuration
- Set via `FIREBASE_DATABASE_URL` environment variable OR
- Configure in `config/firebase-config.json`:
  ```json
  {
    "realtimeDatabase": {
      "databaseURL": "https://your-project.firebaseio.com"
    }
  }
  ```

## Testing

### 1. Test Firestore Connectivity

```bash
npx ts-node src/mcp/test-firestore.ts
```

This will:

- Initialize Firestore
- Create a test memory
- Read it back
- Display statistics
- Report success or failure

### 2. Test Multi-Tier Store

```typescript
import { FirestoreMultiTierStore } from './firestore-multi-tier-store';

const store = new FirestoreMultiTierStore();
const status = store.getBackendStatus();
console.log('Backend status:', status);
// { firestore: true, github: false, file: true }
```

### 3. Integration Test

```bash
# Create test memory
npm run mcp:http &
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "memory_create",
      "arguments": {
        "content": "Test Firestore memory",
        "type": "working"
      }
    }
  }'
```

## Migration from Realtime Database

If you already have data in Realtime Database and want to migrate to Firestore:

### Manual Migration

```typescript
import { FirebaseStore } from './firebase-store';
import { FirestoreStore } from './firestore-store';

async function migrate() {
  const rtdb = new FirebaseStore();
  const firestore = new FirestoreStore();

  // Get all memories from Realtime Database
  const memories = await rtdb.searchMemories({}, 1000);

  // Copy to Firestore
  for (const mem of memories) {
    await firestore.createMemory(mem.content, mem.type, {
      importance_score: mem.importance_score,
      tags: mem.tags,
    });
  }

  console.log(`Migrated ${memories.length} memories`);
}
```

### Dual-Write Strategy

Keep both backends in sync temporarily:

```typescript
class DualStore {
  private rtdb = new FirebaseStore();
  private firestore = new FirestoreStore();

  async createMemory(content, type, options) {
    // Write to both
    const [mem1, mem2] = await Promise.all([
      this.rtdb.createMemory(content, type, options),
      this.firestore.createMemory(content, type, options),
    ]);
    return mem1;
  }

  // Implement other methods similarly
}
```

## Troubleshooting

### Firestore Not Available

**Symptoms:**

```
[FirestoreStore] Firestore unavailable, falling back to file storage
```

**Solutions:**

1. Check Firebase Console → Firestore Database
2. Enable Firestore if not already enabled
3. Verify service account has Firestore permissions
4. Check service account credentials are valid

### Permission Denied

**Symptoms:**

```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Solutions:**

1. Verify service account has "Cloud Datastore User" role
2. Check Firestore security rules (should allow service account access)
3. Regenerate service account key if needed

### Network Issues

**Symptoms:**

```
Error: DEADLINE_EXCEEDED or UNAVAILABLE
```

**Solutions:**

1. Check internet connectivity
2. Verify firewall allows connections to firestore.googleapis.com
3. Check if behind a proxy (may need proxy configuration)

## Performance Considerations

### Firestore vs Realtime Database

| Metric             | Realtime Database | Firestore |
| ------------------ | ----------------- | --------- |
| Read latency       | 20-50ms           | 30-60ms   |
| Write latency      | 30-60ms           | 40-80ms   |
| Query flexibility  | Limited           | Advanced  |
| Scalability        | Good              | Excellent |
| Offline support    | Yes               | Yes       |
| Cost (small scale) | Similar           | Similar   |

### Optimization Tips

1. **Batch operations** - Use batch writes for multiple memories
2. **Indexing** - Create Firestore indexes for common queries
3. **Limit results** - Always use reasonable limits on searches
4. **Cache locally** - Use file tier as cache for hot data

## Next Steps

1. **Test Firestore connectivity**: Run `npx ts-node src/mcp/test-firestore.ts`
2. **Update memory-server.ts**: Switch to Firestore-based stores
3. **Test MCP server**: Verify memory tools work with Firestore
4. **Monitor usage**: Check Firebase Console for storage metrics
5. **Consider migration**: If using Realtime Database, plan migration

## API Compatibility

Both `FirestoreStore` and `FirebaseStore` implement the same interface:

```typescript
interface MemoryStore {
  createMemory(content: string, type: MemoryType, options): Promise<Memory>;
  getMemory(id: string): Promise<Memory | undefined>;
  searchMemories(filters, limit: number): Promise<Memory[]>;
  getStats(): Promise<Stats>;
  isUsingFirestore(): boolean; // or isUsingFirebase()
}
```

This means you can swap between implementations without changing calling code.

## Summary

Firestore provides a reliable alternative to Realtime Database that often works out-of-the-box on new Firebase projects. The implementations are API-compatible, making it easy to switch between backends or use both simultaneously. For new projects, Firestore is recommended due to better scalability and query capabilities.
