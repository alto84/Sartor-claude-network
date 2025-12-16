# Firebase Credential Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIREBASE PROJECT                             │
│                   (cloud.google.com)                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Firestore Database                          │   │
│  │                                                          │   │
│  │  Collections:                                            │   │
│  │  ├── agent_requests/    ← Agents write new tasks here   │   │
│  │  ├── agent_results/     ← Agents write results here     │   │
│  │  ├── agent_workers/     ← Health monitoring             │   │
│  │  └── swarm_state/       ← Shared coordination state     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Authentication: Service Account Key (JSON)                     │
│  ├── project_id: "claude-swarm-abc123"                          │
│  ├── client_email: "firebase-adminsdk-xyz@..."                  │
│  └── private_key: "-----BEGIN PRIVATE KEY-----..."              │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Read/Write
                              │ (authenticated)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        │                                           │
┌───────▼─────────────────────────────┐  ┌──────────▼────────────┐
│  COORDINATOR PROCESS                │  │  SPAWNED AGENT 1      │
│  (Node.js)                          │  │  (Claude Code)        │
│                                     │  │                       │
│  Startup:                           │  │  Environment:         │
│  1. Reads .env file                 │  │  ✓ FIREBASE_PROJECT_ID│
│  2. dotenv → process.env            │  │  ✓ FIREBASE_CLIENT_..│
│                                     │  │  ✓ FIREBASE_PRIVATE_..│
│  Environment Variables:             │  │  ✓ SWARM_REQUEST_ID   │
│  ✓ FIREBASE_PROJECT_ID              │  │  ✓ SWARM_PARENT_ID    │
│  ✓ FIREBASE_CLIENT_EMAIL            │  │  ✓ SWARM_AGENT_ROLE   │
│  ✓ FIREBASE_PRIVATE_KEY             │  │                       │
│  ✓ ANTHROPIC_API_KEY                │  │  Can:                 │
│  ✓ MAX_CONCURRENT_AGENTS            │  │  - Write to Firebase  │
│                                     │  │  - Spawn children     │
│  spawn('claude', {                  │  │  - Read results       │
│    env: {                           │  │                       │
│      ...process.env ─────────────────┼──┤  Inherits ALL        │
│    }                                │  │  coordinator env vars │
│  })                                 │  │                       │
└─────────────────────────────────────┘  └───────────────────────┘
        │                                           │
        │ Spawns more agents                        │ Can spawn
        ▼                                           ▼
┌─────────────────────────────────────┐  ┌──────────────────────┐
│  SPAWNED AGENT 2                    │  │  SPAWNED AGENT 3     │
│  (child of Agent 1)                 │  │  (child of Agent 1)  │
│                                     │  │                      │
│  Same environment vars              │  │  Same environment    │
│  Same Firebase access               │  │  Same Firebase access│
│  Can spawn more agents              │  │  Can spawn more...   │
└─────────────────────────────────────┘  └──────────────────────┘
```

## Credential Propagation in Detail

### Step 1: Initial Setup (One Time)

```bash
# Alton's machine: /home/alton/claude-swarm/.env
FIREBASE_PROJECT_ID=claude-swarm-abc123
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@claude-swarm-abc123.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### Step 2: Coordinator Startup

```javascript
// coordinator/index.js:12-15
import { config } from 'dotenv';
config();  // ← Reads .env, sets process.env.FIREBASE_*

// Now coordinator process has:
console.log(process.env.FIREBASE_PROJECT_ID);  // "claude-swarm-abc123"
console.log(process.env.FIREBASE_CLIENT_EMAIL); // "firebase-adminsdk-xyz@..."
console.log(process.env.FIREBASE_PRIVATE_KEY);  // "-----BEGIN PRIVATE KEY-----\n..."
```

### Step 3: Firebase Initialization

```javascript
// coordinator/index.js:36-42
const firebaseApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,        // ← From .env
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,    // ← From .env
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // ← From .env
  }),
});

const db = getFirestore(firebaseApp);
// ✓ Coordinator can now read/write Firestore
```

### Step 4: Agent Spawning (The Magic)

```javascript
// coordinator/index.js:84-91
const claudeProcess = spawn('claude', ['-p', prompt, '--output-format', 'json'], {
  env: {
    ...process.env,              // ← CRITICAL: Spreads ALL env vars
    SWARM_REQUEST_ID: requestId,
    SWARM_PARENT_ID: request.parentRequestId || '',
    SWARM_AGENT_ROLE: request.agentRole || 'general',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});
```

**What `...process.env` does:**

```javascript
// Before spreading:
const coordinatorEnv = {
  FIREBASE_PROJECT_ID: "claude-swarm-abc123",
  FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-xyz@...",
  FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----...",
  ANTHROPIC_API_KEY: "sk-ant-...",
  PATH: "/usr/bin:/bin:...",
  HOME: "/home/alton",
  // ... 50+ other system env vars
};

// After spreading with custom vars:
const spawnedAgentEnv = {
  ...coordinatorEnv,            // All Firebase creds included!
  SWARM_REQUEST_ID: "req-123",
  SWARM_PARENT_ID: "req-000",
  SWARM_AGENT_ROLE: "researcher",
};

// Spawned agent's process.env has EVERYTHING
```

### Step 5: Agent Uses Credentials

```javascript
// Inside spawned agent (if it needed to use Firebase directly)
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Agent can initialize Firebase the same way:
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,        // ✓ Available!
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,    // ✓ Available!
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // ✓ Available!
  }),
});

const db = getFirestore(app);
// ✓ Agent can now read/write Firestore
```

## Why This Works

### JavaScript Object Spreading

```javascript
const parent = { a: 1, b: 2, c: 3 };
const child = {
  ...parent,     // Copies all properties from parent
  d: 4,          // Adds new property
};

console.log(child);
// { a: 1, b: 2, c: 3, d: 4 }
```

### Environment Variable Inheritance

```javascript
// Parent process
process.env.SECRET = "my-secret";

// Spawn child
const child = spawn('node', ['child.js'], {
  env: {
    ...process.env,  // Child gets SECRET
    CHILD_ID: '123',
  }
});

// child.js can now access:
console.log(process.env.SECRET);   // "my-secret"
console.log(process.env.CHILD_ID); // "123"
```

## Security Implications

### What's Exposed

```
┌─────────────────────────────────────────────────┐
│ Process Environment Variables                    │
│ (visible to spawned process and its children)   │
├─────────────────────────────────────────────────┤
│ ✓ FIREBASE_PROJECT_ID                           │
│ ✓ FIREBASE_CLIENT_EMAIL                         │
│ ✓ FIREBASE_PRIVATE_KEY      ← Full admin access │
│ ✓ ANTHROPIC_API_KEY          ← Can make API calls│
│ ✓ GITHUB_TOKEN              ← Can modify repos  │
│ ✓ All system env vars                           │
└─────────────────────────────────────────────────┘
```

### Visibility

```bash
# Anyone with shell access can see env vars:
ps aux | grep node
# Shows command, but NOT env vars (safe)

# However, from within the process:
cat /proc/[PID]/environ
# Shows ALL env vars (requires same user or root)

# From agent code:
console.log(process.env);
# Full access to all credentials
```

### Risk Assessment

**Low Risk Scenarios** (current implementation is fine):
- Single user (Alton) on personal machine
- Trusted code only
- Local development
- Learning/experimentation

**Medium Risk Scenarios** (consider file-based credentials):
- Shared development machine
- Multiple users running coordinators
- Untrusted agent code

**High Risk Scenarios** (use secret management service):
- Production deployment
- Multi-tenant environment
- Compliance requirements
- Public-facing services

## Alternative Approaches

### Option A: Shared Credential File

```javascript
// coordinator/index.js
import { writeFileSync } from 'fs';
import { join } from 'path';

// Write credentials to shared location
const credsPath = join(process.env.HOME, '.claude-swarm', 'firebase.json');
writeFileSync(credsPath, JSON.stringify({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
}), { mode: 0o600 }); // Read/write for owner only

// Agent spawning (no Firebase env vars passed)
const claudeProcess = spawn('claude', ['-p', prompt], {
  env: {
    FIREBASE_CREDS_PATH: credsPath,  // Just pass path
    SWARM_REQUEST_ID: requestId,
    // ...
  }
});
```

```javascript
// Inside spawned agent
import { readFileSync } from 'fs';

const creds = JSON.parse(readFileSync(process.env.FIREBASE_CREDS_PATH, 'utf-8'));
const app = initializeApp({ credential: cert(creds) });
```

**Pros:**
- Credentials not in env vars (slightly more secure)
- Single file to manage

**Cons:**
- Another file to manage
- Still plaintext on disk
- File path must be accessible to all agents

### Option B: Agent Can Use File-Based Requests (Current Recommendation)

```javascript
// Agent doesn't need Firebase at all!
// To spawn child, just write a file:

import { writeFileSync } from 'fs';
import { join } from 'path';

const childRequest = {
  agentRole: 'specialist',
  parentRequestId: process.env.SWARM_REQUEST_ID,
  task: {
    objective: 'Handle subtask',
    context: { data: 'from parent' },
    requirements: ['Be thorough'],
  },
};

writeFileSync(
  join('.swarm', 'requests', `child-${Date.now()}.json`),
  JSON.stringify(childRequest, null, 2)
);

// Coordinator's LocalRequestWatcher picks this up
// Uploads to Firebase
// Spawns the child agent
// No Firebase credentials needed in agent!
```

**Pros:**
- Agents don't need Firebase access
- Simpler agent code
- More secure (least privilege)
- Works even if Firebase is down

**Cons:**
- Indirect (file → coordinator → Firebase)
- Agent can't query Firebase directly
- Can't get real-time updates

## Recommendation

**For claude-swarm v1.0:**

Use the current implementation (environment variable propagation) because:

1. **Simplicity**: One `.env` file, zero agent configuration
2. **Flexibility**: Agents CAN access Firebase if needed, but don't have to
3. **Security**: Adequate for single-user local development
4. **Scalability**: Easy to upgrade later if needed

**Future improvements:**

- Add file-based credential option (v1.1)
- Support secret management services (v2.0)
- Implement token-based auth with automatic rotation (v3.0)

## Testing the Credential Flow

### Test 1: Coordinator Has Credentials

```bash
cd /home/alton/claude-swarm
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PROJECT_ID)"
# Should print: claude-swarm-abc123
```

### Test 2: Coordinator Can Initialize Firebase

```bash
node coordinator/index.js
# Should see: "🔍 Watching for agent requests..."
# Not: "credential-internal-error"
```

### Test 3: Agent Receives Credentials

```javascript
// Create test agent that prints env vars
cat > .swarm/requests/test-creds.json << 'EOF'
{
  "agentRole": "credential-tester",
  "task": {
    "objective": "Print Firebase credentials",
    "requirements": ["Echo FIREBASE_PROJECT_ID"]
  }
}
EOF

# Watch coordinator logs
# Agent should be able to see FIREBASE_PROJECT_ID
```

### Test 4: Agent Can Write to Firebase

```javascript
// Create agent that writes to Firebase
cat > .swarm/requests/test-write.json << 'EOF'
{
  "agentRole": "firebase-writer",
  "task": {
    "objective": "Write a test document to Firestore",
    "requirements": [
      "Initialize Firebase with env vars",
      "Write to agent_logs collection",
      "Confirm write succeeded"
    ]
  }
}
EOF

# Check Firebase Console > Firestore > agent_logs
# Should see new document from agent
```

## Conclusion

The credential flow is elegantly simple:

1. **.env file** → human-readable config
2. **dotenv** → loads into coordinator's process.env
3. **Spread operator** → copies to all spawned agents
4. **Agents inherit** → automatic access, zero config

This design prioritizes developer experience and simplicity. Security is proportional to the threat model (local development = low threat = simple approach appropriate).

As the system scales, the architecture supports seamless migration to more secure credential management without changing the core spawning logic.

---

**Document Version**: 1.0
**Created**: 2025-12-15
**Related Files**:
- `/home/alton/claude-swarm/coordinator/index.js` (implementation)
- `/home/alton/claude-swarm/.env.example` (template)
- `FIREBASE_SETUP_GUIDE.md` (setup instructions)
