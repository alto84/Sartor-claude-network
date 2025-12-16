# Firebase Documentation Index

This directory contains comprehensive documentation for setting up and using Firebase with claude-swarm.

## Quick Navigation

### For Alton (First Time Setup)

Start here:
1. **[FIREBASE_QUICKSTART.md](FIREBASE_QUICKSTART.md)** - 5-minute setup guide
2. **[FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md)** - Complete reference (19KB, 629 lines)
3. **[CREDENTIAL_FLOW_DIAGRAM.md](CREDENTIAL_FLOW_DIAGRAM.md)** - How credentials work

### For Future Maintainers

Understanding the system:
1. **[CREDENTIAL_FLOW_DIAGRAM.md](CREDENTIAL_FLOW_DIAGRAM.md)** - Architecture deep-dive
2. **[FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md)** - Complete reference
3. **[../firebase/schema.md](../../../firebase/schema.md)** - Database structure

## Document Summaries

### FIREBASE_QUICKSTART.md
**Purpose**: Get Firebase running in 5 minutes
**Length**: ~100 lines
**When to use**:
- First time setting up
- Quick reference for setup steps
- Troubleshooting common issues

**Key sections**:
- 5-minute setup checklist
- Credential flow diagram (simplified)
- Troubleshooting table
- What you get with Firebase

### FIREBASE_SETUP_GUIDE.md
**Purpose**: Comprehensive reference for all Firebase features
**Length**: ~630 lines, 19KB
**When to use**:
- Detailed setup instructions
- Understanding architecture decisions
- Security considerations
- Multi-machine deployment
- Cost estimation
- Advanced features

**Key sections**:
1. Architecture: How agents access credentials
2. Step-by-step setup (8 steps)
3. Credential storage options (4 approaches compared)
4. Troubleshooting guide
5. Performance considerations
6. Multi-machine setup
7. Security best practices
8. Cost estimates

### CREDENTIAL_FLOW_DIAGRAM.md
**Purpose**: Visual explanation of how credentials propagate
**Length**: ~400 lines
**When to use**:
- Understanding how spawned agents get Firebase access
- Debugging credential issues
- Evaluating security implications
- Choosing alternative credential approaches

**Key sections**:
1. Architecture overview (ASCII diagram)
2. Credential propagation in detail (5 steps)
3. Why the spread operator works
4. Security implications
5. Alternative approaches (3 options)
6. Testing the credential flow

## Related Files in Main Repository

### Configuration Files
- **[/home/alton/claude-swarm/.env.example](../../../.env.example)**
  - Template for environment variables
  - Shows all required Firebase credentials
  - Copy to `.env` and fill in values

### Firebase Directory
- **[/home/alton/claude-swarm/firebase/schema.md](../../../firebase/schema.md)**
  - Firestore collection structure
  - Document interfaces (TypeScript)
  - Status transitions
  - Common queries

- **[/home/alton/claude-swarm/firebase/firestore.rules](../../../firebase/firestore.rules)**
  - Security rules for Firestore
  - Must be deployed to Firebase Console
  - Controls read/write permissions
  - Enforces status transitions

- **[/home/alton/claude-swarm/firebase/firestore.indexes.json](../../../firebase/firestore.indexes.json)**
  - Database indexes for query performance
  - Optional but recommended
  - Deploy with Firebase CLI

### Coordinator Implementation
- **[/home/alton/claude-swarm/coordinator/index.js](../../../coordinator/index.js)**
  - Main coordinator with Firebase support
  - Lines 36-42: Firebase initialization
  - Lines 84-91: Agent spawning with env var propagation
  - Lines 265-274: Real-time snapshot listener

## Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Read FIREBASE_QUICKSTART.md                              │
│    └─> Get oriented, understand what's needed               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Create Firebase Project                                  │
│    └─> console.firebase.google.com                          │
│    └─> Enable Firestore                                     │
│    └─> Download service account JSON                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Configure .env file                                      │
│    └─> cp .env.example .env                                 │
│    └─> Fill in FIREBASE_* values                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Deploy Security Rules                                    │
│    └─> Copy firebase/firestore.rules to console             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Test Coordinator                                         │
│    └─> node coordinator/index.js                            │
│    └─> Should see "🔍 Watching for agent requests..."       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Create Test Request                                      │
│    └─> Write JSON to .swarm/requests/                       │
│    └─> Watch coordinator spawn agent                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Verify Firebase Activity                                 │
│    └─> Check Firestore console for documents                │
│    └─> See agent_requests and agent_results collections     │
└──────────────────────┴──────────────────────────────────────┘
```

## Key Concepts

### Environment Variable Propagation

The core mechanism for credential sharing:

```javascript
spawn('claude', [...], {
  env: {
    ...process.env,  // ← Copies ALL env vars to child
    CUSTOM_VAR: value,
  }
})
```

Every spawned agent automatically receives:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ANTHROPIC_API_KEY`
- All other coordinator environment variables

### File-Based vs. Direct Firebase Access

**File-based** (current default):
```
Agent → .swarm/requests/child.json → Coordinator → Firebase
```

**Direct Firebase** (agents can do this if needed):
```
Agent → Firebase SDK → Firestore (using inherited credentials)
```

Both work. File-based is simpler and more secure (coordinator mediates all Firebase access).

### Status Lifecycle

```
pending → acknowledged → executing → completed
                                  └→ failed
```

Coordinator watches for `pending`, spawns agents, updates status through lifecycle.

## Troubleshooting Guide

| Symptom | Check | Document |
|---------|-------|----------|
| Coordinator won't start | .env file has all 3 Firebase vars | FIREBASE_QUICKSTART.md |
| "credential-internal-error" | FIREBASE_PRIVATE_KEY quoted correctly | FIREBASE_SETUP_GUIDE.md |
| Agents can't access Firebase | Env var propagation working | CREDENTIAL_FLOW_DIAGRAM.md |
| Permission denied errors | Firestore rules deployed | FIREBASE_QUICKSTART.md |
| Requests not being picked up | Check Firestore console for documents | FIREBASE_SETUP_GUIDE.md |
| Cost concerns | Review free tier limits | FIREBASE_SETUP_GUIDE.md |

## Common Tasks

### Rotate Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Update `.env` with new credentials
4. Restart coordinator
5. Delete old key from Firebase

### Add New Machine to Swarm

1. Install claude-swarm on new machine
2. Copy `.env` file from coordinator machine
3. Start coordinator (or just create requests)
4. Both machines now share same Firebase backend

### Monitor Swarm Activity

1. Firebase Console → Firestore → Data
2. Watch `agent_requests` collection (live updates)
3. Watch `agent_results` collection (completed work)
4. Check `agent_logs` for debugging

### Backup Firebase Data

```bash
# Export all collections
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)

# Restore from backup
gcloud firestore import gs://your-bucket/backups/20251215
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `.env` has mode 600 (read/write owner only)
- [ ] Service account has minimal permissions (Firestore only)
- [ ] Firestore rules deployed (not default permissive rules)
- [ ] TTL policies configured (auto-cleanup old data)
- [ ] Audit logging enabled (optional, for compliance)
- [ ] Service account key rotated every 90 days

## Performance Benchmarks

**Free Tier Capacity** (daily):
- 50K reads
- 20K writes
- 20K deletes
- 1GB storage

**Typical Agent Request** (writes):
- 1 create (pending)
- 3 updates (acknowledged, executing, completed)
- 1 result write
- **Total: 5 writes**

**Swarm Capacity**:
- 100 agents/day: 500 writes (well under limit)
- 1000 agents/day: 5000 writes (still under limit)
- 4000 agents/day: 20K writes (at free tier limit)

**Recommendation**: Free tier is plenty for development and most production use cases.

## FAQ

**Q: Can I use Firebase without changing agent code?**
A: Yes. Agents can continue using file-based requests (.swarm/requests/). The coordinator handles Firebase uploads.

**Q: What if Firebase is down?**
A: Local file-based requests still work. Coordinator queues them and uploads when Firebase recovers.

**Q: Can I run multiple coordinators?**
A: Yes. Multiple coordinators can watch the same Firebase project. They coordinate via status field to avoid duplicate work.

**Q: Is my API key secure?**
A: For local development, yes. Environment variables are process-private. For production, consider secret management services.

**Q: Do I need Firebase?**
A: No. The file-based coordinator (`local-only.js`) works fine for local development. Firebase adds real-time updates and multi-machine support.

**Q: What's the latency?**
A: Firestore operations: 50-200ms. Negligible compared to Claude API latency (30-120+ seconds).

## Next Steps After Setup

1. **Build agent libraries**: Create reusable Firebase utilities in `.swarm/artifacts/`
2. **Set up monitoring**: Build dashboard to visualize swarm activity
3. **GitHub integration**: Track long-running swarms in issues
4. **Optimize polling**: Use snapshot listeners instead of polling
5. **Add retries**: Handle transient Firebase errors
6. **Implement quotas**: Prevent runaway agent spawning
7. **Add metrics**: Track cost, performance, success rates

## Document Maintenance

### Updating These Docs

When the implementation changes:

1. Update `CREDENTIAL_FLOW_DIAGRAM.md` if spawning logic changes
2. Update `FIREBASE_SETUP_GUIDE.md` if setup steps change
3. Update `FIREBASE_QUICKSTART.md` if troubleshooting tips needed
4. Update this index if new documents added

### Version History

- **v1.0** (2025-12-15): Initial documentation by ARCHITECT agent
  - Created comprehensive setup guide
  - Added credential flow diagrams
  - Documented security considerations

## Credits

**Documentation Created By**: ARCHITECT agent
**Date**: 2025-12-15
**For**: Alton (and future maintainers)
**System**: claude-swarm v1.0.0

**Philosophy**: "Write clean docs like leaving instructions for someone who will wake up smarter than you."

---

**Remember**: These docs are for humans waking up to an existing system. Prioritize clarity over cleverness, examples over abstractions, and actionable steps over architectural pontification.

Start with FIREBASE_QUICKSTART.md. You'll be running in 5 minutes.
