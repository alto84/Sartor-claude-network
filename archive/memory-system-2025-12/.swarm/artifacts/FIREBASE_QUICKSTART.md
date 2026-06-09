# Firebase Quick Start (TL;DR)

For detailed instructions, see `FIREBASE_SETUP_GUIDE.md`.

## 5-Minute Setup

### 1. Create Firebase Project
- Go to https://console.firebase.google.com/
- Click "Add project" → name it → disable Analytics → Create

### 2. Enable Firestore
- Build > Firestore Database → Create database
- Production mode → Choose location (us-central1) → Enable

### 3. Get Service Account Key
- Project Settings (⚙️) → Service accounts
- Generate new private key → Download JSON file

### 4. Configure Environment
```bash
cd /home/alton/claude-swarm
cp .env.example .env
# Edit .env with values from downloaded JSON:
#   FIREBASE_PROJECT_ID=your-project-id
#   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
#   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 5. Deploy Security Rules
```bash
# Copy from firebase/firestore.rules to Firebase Console
# Firestore → Rules tab → Paste → Publish
```

### 6. Test
```bash
node coordinator/index.js
# Should see: "🔍 Watching for agent requests..."
```

## How It Works

**Credential Flow:**
```
.env file
    ↓
Coordinator reads on startup (dotenv)
    ↓
Becomes process.env variables
    ↓
Spread to spawned agents via spawn() options
    ↓
Every agent has FIREBASE_* env vars
```

**Agent spawning code (coordinator/index.js:84-91):**
```javascript
spawn('claude', [...], {
  env: {
    ...process.env,  // ← This line propagates all Firebase credentials
    SWARM_REQUEST_ID: requestId,
    // ...
  }
})
```

## Key Points

- **Single source of truth**: The coordinator's `.env` file
- **Zero agent config**: Agents inherit credentials automatically
- **No file sharing needed**: Everything via environment variables
- **Works across machines**: As long as they share the same Firebase project

## Testing Credentials

```bash
# From coordinator
echo $FIREBASE_PROJECT_ID

# From spawned agent (after coordinator spawns it)
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
```

Both should print your project ID.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "credential-internal-error" | Check FIREBASE_PRIVATE_KEY has quotes and literal \n |
| Coordinator doesn't start | Verify all 3 Firebase env vars are set |
| Agents can't write to Firebase | Check env vars were propagated (echo $FIREBASE_PROJECT_ID in agent) |
| Permission denied | Deploy firestore.rules |

## What You Get

- Real-time request/result updates (no polling)
- Cross-machine agent coordination
- Persistent state (survives coordinator restarts)
- Firestore console for debugging (live data view)
- Free tier handles 100+ agents/day

## Next Steps

1. Read full guide: `FIREBASE_SETUP_GUIDE.md`
2. Set up TTL policies (auto-cleanup)
3. Optional: Configure GitHub integration
4. Optional: Build web dashboard

---

**See also:**
- `/home/alton/claude-swarm/firebase/schema.md` - Data structure
- `/home/alton/claude-swarm/firebase/firestore.rules` - Security rules
- `/home/alton/claude-swarm/.env.example` - Template
