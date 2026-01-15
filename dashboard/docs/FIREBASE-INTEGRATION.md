# Firebase Integration for Nestly Dashboard

## Overview

Nestly uses Firebase for real-time family data synchronization with a multi-tier memory architecture:

| Tier | Storage | Latency | Use Case |
|------|---------|---------|----------|
| **Hot** | Firebase RTDB | <100ms | Active sessions, real-time updates |
| **Warm** | Firestore | 100-500ms | Persistent data, queries |
| **Cold** | GitHub | 1-5s | Long-term archive, version control |

## Project Configuration

**Firebase Project:** Home Claude Network
- Project ID: `home-claude-network`
- Database URL: `https://home-claude-network-default-rtdb.firebaseio.com`
- App Name: `Nestly`

## File Structure

```
dashboard/
├── lib/
│   └── firebase.ts          # Core Firebase integration
├── hooks/
│   └── use-firebase.ts      # React hooks for Firebase
└── .env.local               # Environment configuration
```

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://project-id-default-rtdb.firebaseio.com
```

## Core Library (`lib/firebase.ts`)

### Initialization

```typescript
import { initializeFirebase, isFirebaseConfigured } from '@/lib/firebase';

// Check if configured
if (isFirebaseConfigured()) {
  // Firebase is ready
}
```

### RTDB Operations (Hot Tier)

```typescript
import { rtdbGet, rtdbSet, rtdbPush, rtdbUpdate, rtdbDelete, rtdbSubscribe } from '@/lib/firebase';

// Read
const data = await rtdbGet<MyType>('path/to/data');

// Write
await rtdbSet('path/to/data', { key: 'value' });

// Push to list
const newId = await rtdbPush('path/to/list', newItem);

// Update
await rtdbUpdate('path/to/data', { updatedField: 'newValue' });

// Delete
await rtdbDelete('path/to/data');

// Subscribe to real-time updates
const unsubscribe = rtdbSubscribe<MyType>('path', (data) => {
  console.log('Data changed:', data);
});
// Later: unsubscribe();
```

### Firestore Operations (Warm Tier)

```typescript
import {
  firestoreGetDoc,
  firestoreGetCollection,
  firestoreSetDoc,
  firestoreUpdateDoc,
  firestoreDeleteDoc
} from '@/lib/firebase';

// Get single document
const doc = await firestoreGetDoc<MyType>('collection', 'docId');

// Get collection with constraints
import { where, orderBy, limit } from '@/lib/firebase';
const docs = await firestoreGetCollection<MyType>('collection', [
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
  limit(10)
]);
```

## React Hooks (`hooks/use-firebase.ts`)

### useFirebaseStatus

Check Firebase connection status:

```typescript
const { isConfigured, isConnected, error } = useFirebaseStatus();

if (!isConfigured) {
  return <div>Firebase not configured</div>;
}
```

### useFamilyMembers

Manage family members with real-time updates:

```typescript
const { members, loading, error, updateStatus } = useFamilyMembers();

// Update member status
await updateStatus('member-id', 'home', 'Living Room');
```

### useFamilyTasks

Task management with computed values:

```typescript
const {
  tasks,
  pendingTasks,
  inProgressTasks,
  completedTasks,
  todayTasks,
  loading,
  createTask,
  completeTask,
  updateTask
} = useFamilyTasks();

// Create task
await createTask({
  title: 'Buy groceries',
  priority: 'medium',
  status: 'pending',
  assignee: 'alton'
});

// Complete task
await completeTask('task-id');
```

### useMemories

Knowledge base management:

```typescript
const {
  memories,
  semanticMemories,
  episodicMemories,
  proceduralMemories,
  importantMemories,
  loading,
  addMemory,
  searchByTags,
  getRecent,
  getImportant
} = useMemories();

// Add memory
await addMemory(
  'User prefers morning meetings',  // content
  'semantic',                        // type
  ['preference', 'schedule'],        // tags
  0.8,                               // importance (0-1)
  'Learned from calendar patterns'   // context
);

// Search by tags
const results = await searchByTags(['family', 'preference']);
```

### useRealtimeData

Generic real-time subscription hook:

```typescript
const { data, loading, error, refresh } = useRealtimeData<MyType>('path/to/data');
```

### usePresence

Track user presence:

```typescript
const { isOnline } = usePresence('user-id');
```

## Data Types

### Memory

```typescript
interface Memory {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  content: string;
  context?: string;
  tags: string[];
  importance: number; // 0-1
  timestamp: string;
  expiresAt?: string;
  source?: string;
  relatedIds?: string[];
  metadata?: Record<string, unknown>;
}
```

### FamilyMemberData

```typescript
interface FamilyMemberData {
  id: string;
  name: string;
  role: 'admin' | 'member' | 'child';
  email?: string;
  avatar?: string;
  location?: string;
  status?: 'home' | 'work' | 'school' | 'away';
  lastSeen?: string;
  preferences?: Record<string, unknown>;
}
```

### TaskData

```typescript
interface TaskData {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

## Existing Database Structure

The Firebase RTDB already contains these nodes:

```
home-claude-network/
├── agents/           # Agent configurations
├── agents-network/   # Agent network state
├── community/        # Community data
├── config/           # Configuration settings
├── experiences/      # Experience logs
├── knowledge/        # Memory/knowledge base
├── messages/         # Message history
├── mission/          # Mission statements
├── onboarding/       # Onboarding state
├── skills/           # Skill definitions
└── tasks/            # Task data
```

## Setup Wizard Integration

The Setup page (`/setup`) includes a Firebase configuration wizard that:
1. Detects existing environment configuration
2. Tests the Firebase connection
3. Validates credentials
4. Stores setup progress in localStorage

## Best Practices

### Memory Importance Levels

- **0.9-1.0**: Critical user directives, security rules
- **0.7-0.8**: Important preferences, learned patterns
- **0.5-0.6**: Regular events, session data
- **0.3-0.4**: Temporary context, working memory
- **0.0-0.2**: Ephemeral data, auto-expire

### Tiered Storage Strategy

```typescript
// High importance (≥0.7) → Both RTDB and Firestore
await createMemory({
  content: 'Critical information',
  importance: 0.9,
  // Automatically saved to both tiers
});

// Low importance (<0.7) → RTDB only (hot tier)
await createMemory({
  content: 'Temporary note',
  importance: 0.3,
  // Only saved to RTDB
});
```

### Error Handling

All Firebase operations return null or false on error and log to console:

```typescript
const result = await rtdbGet('path');
if (result === null) {
  // Handle error or missing data
}
```

## Troubleshooting

### Firebase Not Configured

Check that all `NEXT_PUBLIC_FIREBASE_*` environment variables are set in `.env.local`.

### Connection Failed

1. Verify Firebase project is active
2. Check RTDB rules allow access
3. Ensure `databaseURL` is correct

### Real-time Updates Not Working

1. Check `rtdbSubscribe` is called with correct path
2. Verify component is mounted
3. Ensure unsubscribe is called on cleanup

## Related Documentation

- [Firebase Console](https://console.firebase.google.com/project/home-claude-network)
- [RTDB Documentation](https://firebase.google.com/docs/database)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
