# Firebase Setup Guide for Claude Swarm

## Overview

This guide walks you through setting up Firebase for the claude-swarm coordination system. Firebase enables:

- **Real-time agent communication** (no polling required)
- **Live status updates** across all agents
- **Push notifications** when new requests/results arrive
- **Persistent state** across machine restarts and network interruptions
- **Multi-machine coordination** (run agents on different computers)

The file-based coordinator works fine for local development, but Firebase unlocks the full distributed potential of claude-swarm.

## Architecture: How Agents Access Credentials

### The Challenge

Spawned agents need Firebase credentials to:
1. Write new agent requests (spawn children)
2. Read results from child agents
3. Update their own status
4. Access shared swarm state

### The Solution: Environment Variable Propagation

The coordinator passes credentials to spawned agents via environment variables:

```javascript
// coordinator/index.js lines 84-91
const claudeProcess = spawn('claude', ['-p', prompt, '--output-format', 'json'], {
  env: {
    ...process.env,                    // <-- Propagates all parent env vars
    SWARM_REQUEST_ID: requestId,
    SWARM_PARENT_ID: request.parentRequestId || '',
    SWARM_AGENT_ROLE: request.agentRole || 'general',
  },
});
```

When the coordinator starts, it reads credentials from `.env` file (line 15: `config()`). These become environment variables in the coordinator process. The `...process.env` spread operator passes them to all spawned agents.

**Result**: Every spawned agent automatically has access to `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` through environment variables.

## Prerequisites

- Google Cloud account (free tier works fine)
- Node.js 18+ installed
- `firebase-admin` npm package (already in package.json)

## Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Enter project name: `claude-swarm` (or your preference)
4. Disable Google Analytics (optional, not needed for this use case)
5. Click **Create project**

### 2. Enable Firestore Database

1. In your Firebase project, navigate to **Build > Firestore Database**
2. Click **Create database**
3. Select **Production mode** (we'll set custom rules next)
4. Choose a location (pick closest to you):
   - `us-central1` (Iowa) - good for North America
   - `europe-west1` (Belgium) - good for Europe
   - `asia-southeast1` (Singapore) - good for Asia
5. Click **Enable**

### 3. Configure Security Rules

1. In Firestore, go to the **Rules** tab
2. Replace the default rules with the content from `/home/alton/claude-swarm/firebase/firestore.rules`
3. Click **Publish**

You can copy the rules:

```bash
# From your claude-swarm directory
cat firebase/firestore.rules
```

These rules ensure:
- Only authenticated users can access data
- Proper status transitions (pending → acknowledged → executing → completed)
- No accidental deletions (TTL handles cleanup)

### 4. Create a Service Account

This is the critical step for agent access.

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Go to the **Service accounts** tab
4. Click **Generate new private key**
5. Click **Generate key** in the confirmation dialog
6. A JSON file will download (e.g., `claude-swarm-a1b2c3d4e5f6.json`)

**IMPORTANT**: Keep this file secure. It grants full access to your Firebase project.

### 5. Extract Credentials

Open the downloaded JSON file. You need three values:

```json
{
  "type": "service_account",
  "project_id": "claude-swarm-abc123",           // ← This
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  // ← This
  "client_email": "firebase-adminsdk-xyz@claude-swarm-abc123.iam.gserviceaccount.com",  // ← This
  ...
}
```

### 6. Configure Environment Variables

Create a `.env` file in your claude-swarm directory:

```bash
cd /home/alton/claude-swarm
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=claude-swarm-abc123
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@claude-swarm-abc123.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# GitHub Configuration (optional)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=claude-swarm

# Anthropic Configuration (usually already set globally)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# Coordinator Settings
MAX_CONCURRENT_AGENTS=10
AGENT_TIMEOUT_SECONDS=300
POLL_INTERVAL_MS=1000
```

**Important notes**:
- Keep the entire `FIREBASE_PRIVATE_KEY` value in quotes
- The `\n` characters in the private key are literal - don't replace them with actual newlines
- Don't commit `.env` to git (it's in `.gitignore`)

### 7. Set Up Firestore Indexes (Optional but Recommended)

For better query performance:

```bash
cd /home/alton/claude-swarm/firebase
firebase deploy --only firestore:indexes
```

Or manually create in Firebase Console > Firestore > Indexes using the definitions in `firestore.indexes.json`.

### 8. Configure TTL Policies

Set up automatic cleanup of old data:

1. Go to **Firestore > Data** in Firebase Console
2. For each collection, set up TTL field:
   - Click collection name → **More (⋮)** → **Configure TTL**
   - Set TTL field according to schema:
     - `agent_requests`: field `ttl`, delete after 24 hours
     - `agent_results`: field `ttl`, delete after 24 hours
     - `agent_logs`: field `ttl`, delete after 7 days
     - `agent_workers`: field `ttl`, delete after 1 hour

Note: You'll need to add the `ttl` field to documents. The coordinator doesn't currently set this (potential improvement).

## Testing Your Setup

### Test 1: Coordinator Connection

```bash
cd /home/alton/claude-swarm
node coordinator/index.js
```

You should see:

```
═══════════════════════════════════════════════════════════
  Claude Swarm Coordinator
  Multi-Agent Coordination with Firebase + GitHub
═══════════════════════════════════════════════════════════
  Max concurrent agents: 10
  Agent timeout: 300s
  GitHub: your-username/claude-swarm
═══════════════════════════════════════════════════════════

🔍 Watching for agent requests...
📂 Watching local requests: .swarm/requests
```

If you see an error like "credential-internal-error", check:
- `FIREBASE_PRIVATE_KEY` is properly quoted in `.env`
- All three Firebase credentials are present
- No extra spaces or newlines in the values

### Test 2: Create a Request via Firebase

You can test Firebase directly by creating a document in the console:

1. Go to **Firestore > Data**
2. Click **+ Start collection**
3. Collection ID: `agent_requests`
4. Add first document:
   - Document ID: `test-001`
   - Fields:
     ```
     agentRole: "test-agent" (string)
     status: "pending" (string)
     task: {
       objective: "Echo hello world" (string)
       context: {} (map)
       requirements: ["Say hello"] (array)
     }
     createdAt: <current timestamp ISO string> (string)
     ```

The coordinator should pick this up within seconds and spawn an agent.

### Test 3: Agent-to-Firebase Communication

Create a test request locally:

```bash
cat > .swarm/requests/firebase-test.json << 'EOF'
{
  "agentRole": "firebase-tester",
  "task": {
    "objective": "Test Firebase access by spawning a child agent",
    "context": {},
    "requirements": [
      "Create a child request in Firebase",
      "Verify you can read Firebase collections"
    ]
  }
}
EOF
```

Watch the coordinator logs. The agent should be able to write to Firebase because it inherited the environment variables.

## How Spawned Agents Access Firebase

### From Within an Agent

When an agent is spawned, it has these environment variables available:

```bash
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL
echo $FIREBASE_PRIVATE_KEY
echo $SWARM_REQUEST_ID
echo $SWARM_PARENT_ID
echo $SWARM_AGENT_ROLE
```

### Using Firebase from an Agent (JavaScript)

If you need an agent to directly interact with Firebase (not just via file-based requests), you could create a utility:

```javascript
// .swarm/artifacts/firebase-client.js
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

// Example: Create a child request directly in Firebase
export async function spawnChildAgent(parentId, childRequest) {
  const requestId = `${parentId}-child-${Date.now()}`;

  await db.collection('agent_requests').doc(requestId).set({
    ...childRequest,
    requestId,
    parentRequestId: parentId,
    status: 'pending',
    source: 'agent-direct',
    createdAt: new Date().toISOString(),
  });

  return requestId;
}

// Example: Get results for a specific request
export async function getRequestResult(requestId) {
  const doc = await db.collection('agent_results').doc(requestId).get();
  return doc.exists ? doc.data() : null;
}
```

Then an agent could use this with:

```javascript
import { spawnChildAgent, getRequestResult } from './.swarm/artifacts/firebase-client.js';

// Spawn a child
const childId = await spawnChildAgent(process.env.SWARM_REQUEST_ID, {
  agentRole: 'specialist',
  task: {
    objective: 'Handle subtask',
    context: { data: 'from parent' },
    requirements: ['Be specific'],
  },
});

// Wait for result (would need polling or real-time listener)
const result = await getRequestResult(childId);
```

However, the file-based approach (`.swarm/requests/`) is simpler and works without agents needing to import Firebase libraries.

## Credential Storage Options Compared

### Option 1: Environment Variables Only (Current Implementation)

**How it works**:
- Coordinator reads `.env` file on startup
- Passes all env vars to spawned agents via `spawn()` options
- Agents inherit credentials automatically

**Pros**:
- Simple implementation
- No file I/O overhead for agents
- Credentials never written to disk by agents
- Works across different working directories

**Cons**:
- Environment variables visible in process list (`ps aux`)
- Limited to single machine (coordinator must spawn all agents)
- Credentials stored in plaintext `.env` file

**Security**: Medium. Anyone with shell access can see env vars, but no worse than typical API keys.

### Option 2: Shared Credential File

**How it works**:
```bash
# Coordinator writes credentials to shared location
mkdir -p ~/.claude-swarm
cat > ~/.claude-swarm/firebase-credentials.json << 'EOF'
{
  "projectId": "...",
  "clientEmail": "...",
  "privateKey": "..."
}
EOF
chmod 600 ~/.claude-swarm/firebase-credentials.json

# Agents read from known path
const creds = JSON.parse(readFileSync(
  join(process.env.HOME, '.claude-swarm', 'firebase-credentials.json')
));
```

**Pros**:
- Credentials not visible in process list
- Can be shared across multiple coordinator instances
- Easier to rotate (update one file)

**Cons**:
- Requires all agents to have filesystem access to same path
- Another file to manage
- Still plaintext on disk

### Option 3: Secret Management Service

**How it works**:
- Store credentials in Google Secret Manager, AWS Secrets Manager, or HashiCorp Vault
- Coordinator fetches on startup
- Agents fetch as needed (with caching)

**Pros**:
- Credentials never on disk in plaintext
- Audit trail of access
- Automatic rotation support
- Works across machines/cloud environments

**Cons**:
- Added complexity
- Requires network calls
- Another service to configure
- Overkill for single-user local development

### Option 4: Service Account Impersonation

**How it works**:
- Create multiple service accounts (one per agent role)
- Coordinator uses master account to generate short-lived tokens
- Agents get scoped tokens (e.g., read-only for workers)

**Pros**:
- Fine-grained permissions
- Short-lived credentials
- Follows principle of least privilege

**Cons**:
- Complex setup
- Requires GCP IAM configuration
- Overkill for current use case

### Recommendation for Claude Swarm

**Use Option 1 (current implementation)** for:
- Local development
- Single machine
- Single user
- Learning/experimentation

**Upgrade to Option 2** when:
- Running coordinators on multiple machines
- Team environment
- Credentials need to be rotated frequently

**Upgrade to Option 3** when:
- Running in production
- Multi-tenant environment
- Compliance requirements (SOC2, HIPAA, etc.)
- Cloud deployment (not local)

## Troubleshooting

### "credential-internal-error"

**Problem**: Firebase can't parse the service account credentials.

**Solutions**:
1. Check `FIREBASE_PRIVATE_KEY` has both the opening and closing `"` quotes
2. Verify the `\n` characters are literal (not actual newlines)
3. Ensure no trailing spaces in the `.env` file
4. Try regenerating the service account key

### "Permission denied" when creating documents

**Problem**: Service account doesn't have Firestore permissions.

**Solutions**:
1. Verify you deployed the `firestore.rules`
2. Check the rules allow authenticated access
3. Confirm the service account is from the correct project

### Coordinator doesn't see Firebase requests

**Problem**: You created a document in Firestore but coordinator didn't spawn an agent.

**Solutions**:
1. Check coordinator logs for errors
2. Verify the document status is exactly `"pending"` (case-sensitive)
3. Check the document has all required fields: `agentRole`, `task`, `status`
4. Confirm the snapshot listener is registered (should see "🔍 Watching for agent requests...")

### Agents can't access Firebase

**Problem**: Spawned agent crashes when trying to use Firebase.

**Solutions**:
1. Check agent has environment variables: `echo $FIREBASE_PROJECT_ID`
2. Verify coordinator is passing env vars (check `spawn()` options in code)
3. Test with a simple script:
   ```bash
   # In spawned agent context
   node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
   ```

### "Quota exceeded" errors

**Problem**: Firestore free tier limits reached.

**Limits**:
- 50K document reads/day
- 20K document writes/day
- 20K document deletes/day
- 1GB storage

**Solutions**:
1. Enable TTL to auto-delete old data
2. Reduce polling frequency
3. Upgrade to Firebase Blaze plan (pay-as-you-go)
4. Use local coordinator for development

## Performance Considerations

### Read/Write Optimization

Each agent request triggers:
- 1 write (create request)
- 1 update (acknowledged)
- 1 update (executing)
- 1 update (completed/failed)
- 1 write (create result)
- **Total: 5 writes per agent**

For 100 agents: 500 writes (well under free tier 20K/day).

### Real-time Listener Costs

The coordinator uses:
- 1 snapshot listener for `agent_requests` (pending)
- Listener costs: 1 document read per document in result set, per change

Free tier easily handles 100s of agents/day.

### Scaling to 1000+ Agents

If you need to scale beyond free tier:

1. **Batch operations**: Group multiple requests
2. **Partitioned collections**: Shard by date/role
3. **Caching layer**: Redis for frequently accessed data
4. **Read replicas**: For heavy read workloads
5. **Upgrade to Blaze**: ~$0.18 per 100K reads

## Multi-Machine Setup

To run agents across multiple computers:

### Machine 1 (Coordinator)

```bash
cd /home/alton/claude-swarm
# Has .env with Firebase credentials
node coordinator/index.js
```

### Machine 2 (Agent Spawner)

```bash
# Install claude-swarm
git clone https://github.com/your-username/claude-swarm.git
cd claude-swarm
npm install

# Copy the same .env file
scp user@machine1:/home/alton/claude-swarm/.env .env

# Start another coordinator (optional) or just create requests
cat > .swarm/requests/remote-agent.json << 'EOF'
{
  "agentRole": "remote-worker",
  "task": {
    "objective": "Task running on Machine 2",
    "requirements": ["Access local files on Machine 2"]
  }
}
EOF

# This request will be uploaded to Firebase
# Machine 1's coordinator can pick it up
# Or run local coordinator on Machine 2 to handle locally
```

Both coordinators watch the same Firebase database. They coordinate via the `status` field to avoid duplicate work.

## Next Steps

Once Firebase is working:

1. **Monitor the Firestore Console**: Watch requests/results flow in real-time
2. **Set up GitHub integration**: Track long-running swarms in GitHub Issues
3. **Build agent libraries**: Create reusable Firebase utilities in `.swarm/artifacts/`
4. **Experiment with real-time updates**: Use snapshot listeners for instant parent-child communication
5. **Create a web dashboard**: Build a simple UI to visualize swarm activity

## Security Best Practices

1. **Never commit `.env` to git**: Already in `.gitignore`, but double-check
2. **Rotate service accounts periodically**: Generate new key every 90 days
3. **Use separate projects**: One for development, one for production
4. **Monitor Firestore rules**: Review rules regularly for overly permissive access
5. **Enable audit logging**: Track who accessed what in GCP
6. **Restrict service account**: Only grant Firestore permissions, not entire project

## Cost Estimate

**Free tier**: Handles 100+ agents/day comfortably

**Light usage** (10 agents/day):
- Reads: ~50/day
- Writes: ~50/day
- Storage: <100MB
- **Cost: $0/month**

**Heavy usage** (100 agents/day):
- Reads: ~500/day
- Writes: ~500/day
- Storage: <1GB
- **Cost: $0/month** (under free tier)

**Production** (1000 agents/day):
- Reads: ~5000/day
- Writes: ~5000/day
- Storage: ~5GB
- **Cost: ~$1-2/month**

## Conclusion

Firebase transforms claude-swarm from a local polling system into a real-time distributed coordination platform. The environment variable approach makes credentials seamlessly available to all spawned agents while keeping the implementation simple.

Key takeaway: **The coordinator's `.env` file is the single source of truth**. All agents inherit credentials automatically through environment variable propagation.

Now go build something incredible with your agent swarm.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-15
**Compatibility**: claude-swarm v1.0.0+
**Author**: ARCHITECT agent
**For**: Alton (and future maintainers)
