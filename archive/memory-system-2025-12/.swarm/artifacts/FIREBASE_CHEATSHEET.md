# Firebase Cheatsheet (One-Page Reference)

## Essential Commands

```bash
# Start coordinator with Firebase
cd /home/alton/claude-swarm
node coordinator/index.js

# Test credentials
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PROJECT_ID)"

# Create test request
cat > .swarm/requests/test.json << 'EOF'
{"agentRole":"test","task":{"objective":"Say hello"}}
EOF

# Monitor Firebase (via gcloud CLI)
gcloud firestore data list agent_requests --project=your-project-id
```

## Required Environment Variables

```bash
# .env file (3 required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional but recommended
ANTHROPIC_API_KEY=sk-ant-xxx
MAX_CONCURRENT_AGENTS=10
AGENT_TIMEOUT_SECONDS=300
```

## Credential Flow (One Diagram)

```
.env → dotenv → process.env → ...process.env → spawned agents
```

## Firebase Collections

| Collection | Purpose | Who Writes |
|------------|---------|------------|
| agent_requests | Task queue | Agents, Coordinator |
| agent_results | Outputs | Coordinator |
| agent_workers | Health monitoring | Coordinator |
| agent_logs | Audit trail | All |
| swarm_state | Shared state | All |

## Status Flow

```
pending → acknowledged → executing → completed/failed
```

## Common Issues

| Error | Fix |
|-------|-----|
| credential-internal-error | Check FIREBASE_PRIVATE_KEY quotes |
| Permission denied | Deploy firestore.rules |
| Agent can't access | Verify env var propagation |
| Requests not picked up | Check status='pending' |

## Quick Links

- Firebase Console: https://console.firebase.google.com/
- Firestore Data: https://console.firebase.google.com/project/[PROJECT_ID]/firestore
- Service Accounts: https://console.firebase.google.com/project/[PROJECT_ID]/settings/serviceaccounts

## Code Snippets

### Initialize Firebase in Agent

```javascript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);
```

### Spawn Child (File-Based)

```javascript
import { writeFileSync } from 'fs';

writeFileSync('.swarm/requests/child.json', JSON.stringify({
  agentRole: 'worker',
  parentRequestId: process.env.SWARM_REQUEST_ID,
  task: {
    objective: 'Do subtask',
    context: {},
    requirements: [],
  },
}));
```

### Spawn Child (Direct Firebase)

```javascript
const childId = `${process.env.SWARM_REQUEST_ID}-child-${Date.now()}`;

await db.collection('agent_requests').doc(childId).set({
  requestId: childId,
  parentRequestId: process.env.SWARM_REQUEST_ID,
  agentRole: 'worker',
  status: 'pending',
  task: {
    objective: 'Do subtask',
    context: {},
    requirements: [],
  },
  createdAt: new Date().toISOString(),
});
```

### Get Child Result

```javascript
const result = await db.collection('agent_results').doc(childId).get();
if (result.exists) {
  console.log(result.data());
}
```

### Watch for Results (Real-time)

```javascript
const unsubscribe = db.collection('agent_results')
  .where('requestId', '==', childId)
  .onSnapshot(snapshot => {
    snapshot.forEach(doc => {
      console.log('Result:', doc.data());
    });
  });

// Clean up when done
unsubscribe();
```

## Security Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /agent_requests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.status == 'pending';
      allow update: if request.auth != null;
    }
    match /agent_results/{resultId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## Cost Reference

| Usage Level | Agents/Day | Reads | Writes | Cost |
|-------------|-----------|-------|--------|------|
| Development | 10 | 50 | 50 | $0 |
| Light | 100 | 500 | 500 | $0 |
| Heavy | 1000 | 5K | 5K | $0 |
| Production | 4000 | 20K | 20K | $0 |
| High-scale | 10K | 50K | 50K | ~$5/mo |

Free tier: 50K reads, 20K writes, 20K deletes, 1GB storage per day.

## Environment Variables Available in Agents

```bash
# Firebase credentials (inherited from coordinator)
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

# Agent context (set by coordinator)
SWARM_REQUEST_ID          # This agent's ID
SWARM_PARENT_ID           # Parent agent's ID (or empty)
SWARM_AGENT_ROLE          # Agent role name

# API keys (inherited)
ANTHROPIC_API_KEY
GITHUB_TOKEN

# System vars (inherited)
HOME, PATH, USER, etc.
```

## Verification Steps

```bash
# 1. Credentials loaded
node -e "require('dotenv').config(); console.log(!!process.env.FIREBASE_PROJECT_ID)"
# Should print: true

# 2. Coordinator can connect
node coordinator/index.js
# Should see: 🔍 Watching for agent requests...

# 3. Create test request
echo '{"agentRole":"test","task":{"objective":"test"}}' > .swarm/requests/test.json

# 4. Check Firebase Console
# Navigate to Firestore → agent_requests → should see test request

# 5. Check result appears
ls .swarm/results/
# Should have a JSON file after agent completes
```

## Troubleshooting Flowchart

```
Coordinator won't start?
├─ Check .env exists: ls -la .env
├─ Check .env has 3 Firebase vars: grep FIREBASE .env
├─ Check quotes on FIREBASE_PRIVATE_KEY
└─ Check Node.js version: node --version (need 18+)

Agent can't access Firebase?
├─ Check env vars in agent: echo $FIREBASE_PROJECT_ID
├─ Check coordinator spawning: grep "...process.env" coordinator/index.js
└─ Test direct: node -e "console.log(process.env.FIREBASE_PROJECT_ID)"

Requests not being picked up?
├─ Check Firestore console for pending requests
├─ Check status field is exactly "pending"
├─ Check coordinator is running
└─ Check firestore.rules allow reads
```

## Performance Tips

1. **Use snapshot listeners** instead of polling
2. **Batch operations** for multiple requests
3. **Cache frequently accessed data** locally
4. **Use TTL** to auto-cleanup old documents
5. **Index common queries** (firestore.indexes.json)

## Documentation Map

```
FIREBASE_INDEX.md              ← Start here (overview)
├── FIREBASE_QUICKSTART.md     ← 5-minute setup
├── FIREBASE_SETUP_GUIDE.md    ← Complete reference (19KB)
├── CREDENTIAL_FLOW_DIAGRAM.md ← How credentials work
└── FIREBASE_CHEATSHEET.md     ← This file (quick reference)
```

## URLs to Bookmark

- **Firebase Console**: https://console.firebase.google.com/
- **Firestore Docs**: https://firebase.google.com/docs/firestore
- **Service Accounts**: https://console.cloud.google.com/iam-admin/serviceaccounts
- **Pricing**: https://firebase.google.com/pricing
- **Status Dashboard**: https://status.firebase.google.com/

## Emergency Commands

```bash
# Kill all spawned agents
pkill -f "claude -p"

# Clear all requests
rm .swarm/requests/*.json

# Restart coordinator
pkill -f coordinator/index.js && node coordinator/index.js

# Check Firebase quota
gcloud firestore operations list --project=your-project-id

# Rotate credentials
# 1. Generate new key in Firebase Console
# 2. Update .env
# 3. Restart coordinator
# 4. Delete old key
```

---

**Print this page for desk reference.**

Location: `/home/alton/claude-swarm/.swarm/artifacts/FIREBASE_CHEATSHEET.md`
